import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateVideo } from "@/lib/fal";
import { uploadImageFromUrl } from "@/lib/blob";
import { getScenePreset } from "@/lib/presets";
import { buildShotPrompt, type Shot } from "@/lib/shots";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const generateSchema = z.object({
  videoId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = generateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { videoId } = validation.data;

    // Verify video belongs to user and user has credits
    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        occasion: true,
        message: true,
        avatarUrl: true,
        sceneTag: true,
        sceneImageUrl: true,
        modelChoice: true,
        shots: true,
        falJobId: true,
        falModelId: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Idempotency: if already running / finished, don't start new jobs
    if (video.status === "PROCESSING" && video.falJobId) {
      return NextResponse.json({
        jobId: video.falJobId,
        status: "PROCESSING",
      });
    }

    if (video.status === "COMPLETED") {
      return NextResponse.json({ status: "COMPLETED" });
    }

    if (video.status === "FAILED") {
      return NextResponse.json({ status: "FAILED" });
    }

    const message = (video.message || "").toString();

    if (!message || message.length > 500) {
      return NextResponse.json(
        { error: "Missing or invalid message for this video" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user || user.credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // Ensure avatar URL is absolute / publicly accessible
    let avatarUrl = (video.avatarUrl || "").toString();
    if (avatarUrl.startsWith("/")) {
      const baseUrl = process.env.NEXTAUTH_URL;
      if (baseUrl) {
        try {
          const absoluteUrl = new URL(avatarUrl, baseUrl).toString();
          const uploadedUrl = await uploadImageFromUrl(
            absoluteUrl,
            `${videoId}-avatar`,
          );
          avatarUrl = uploadedUrl;
          await prisma.video.update({
            where: { id: videoId },
            data: { avatarUrl: uploadedUrl },
          });
        } catch (error) {
          console.warn("Failed to upload avatar to blob:", error);
        }
      }
    }

    if (!avatarUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "A valid avatar image is required" },
        { status: 400 },
      );
    }

    // -----------------------------------------------------------------------
    // Multi-shot parallel generation (both modes)
    // -----------------------------------------------------------------------
    const savedShots = (video.shots as Shot[] | null) || [];
    if (savedShots.length === 0) {
      return NextResponse.json(
        { error: "No shots defined for this video" },
        { status: 400 },
      );
    }

    // Resolve Fal model based on mode
    const isQuick = video.modelChoice === "quick";
    const falModel = isQuick
      ? "fal-ai/veo3.1/fast/image-to-video"
      : "fal-ai/veo3.1/reference-to-video";

    // Build reference image array
    // Quick: avatar only (single-image model)
    // Cinematic: avatar + scene image (multi-image model)
    const imageUrls: string[] = [avatarUrl];
    if (
      !isQuick &&
      video.sceneImageUrl &&
      video.sceneImageUrl.startsWith("http")
    ) {
      imageUrls.push(video.sceneImageUrl);
    }

    // Look up scene description for prompt
    const scenePreset = video.sceneTag ? getScenePreset(video.sceneTag) : null;
    const sceneDesc = scenePreset
      ? scenePreset.label.toLowerCase()
      : "a clean, well-lit setting";

    // Occasion-specific tone
    const toneMap: Record<string, string> = {
      birthday: "warm, celebratory, and joyful",
      congratulations: "enthusiastic and proud",
      thankyou: "heartfelt and sincere",
      custom: "friendly and genuine",
    };
    const tone = toneMap[video.occasion] || toneMap.custom;

    // Submit all shots in parallel
    const shotResults = await Promise.all(
      savedShots.map(async (shot) => {
        const prompt = buildShotPrompt(shot, sceneDesc, "the person", tone);
        const { requestId, modelId } = await generateVideo(
          prompt,
          imageUrls,
          falModel,
          { resolution: "1080p" },
        );
        return {
          ...shot,
          falJobId: requestId,
          falModelId: modelId,
          status: "PROCESSING" as const,
          videoUrl: null as string | null,
        };
      }),
    );

    // Use the first shot's job ID as the primary falJobId for backwards compat
    const primaryJobId = shotResults[0].falJobId;

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "PROCESSING",
        falJobId: primaryJobId,
        falModelId: falModel,
        shots: shotResults as unknown as Prisma.InputJsonValue,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 1 } },
    });

    return NextResponse.json({
      jobId: primaryJobId,
      status: "PROCESSING",
      shotCount: shotResults.length,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 },
    );
  }
}
