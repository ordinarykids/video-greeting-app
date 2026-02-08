import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateVideo } from "@/lib/fal";
import { uploadImageFromUrl } from "@/lib/blob";
import { getScenePreset, getCharacterPreset } from "@/lib/presets";
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
        characterTag: true,
        falJobId: true,
        falModelId: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Idempotency: if a job is already running / finished, don't start a new one.
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

    // Build the prompt using scene + character + message
    const prompt = buildVideoPrompt(
      video.sceneTag,
      video.characterTag,
      video.occasion,
      message,
    );

    // Collect reference image URLs
    const imageUrls: string[] = [];

    // Add scene image if available
    if (video.sceneImageUrl && video.sceneImageUrl.startsWith("http")) {
      imageUrls.push(video.sceneImageUrl);
    }

    // Add character/avatar image if available
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

    if (avatarUrl.startsWith("http")) {
      imageUrls.push(avatarUrl);
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: "At least one reference image is required" },
        { status: 400 },
      );
    }

    // Call Fal.ai to generate video
    const chosenModel = video.falModelId || undefined;
    const { requestId, modelId } = await generateVideo(prompt, imageUrls, chosenModel);

    // Update video record with job ID and resolved model
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "PROCESSING",
        falJobId: requestId,
        falModelId: modelId,
      },
    });

    // Deduct credit from user
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: { decrement: 1 },
      },
    });

    return NextResponse.json({
      jobId: requestId,
      status: "PROCESSING",
    });
  } catch (error) {
    console.error("Error generating video:", error);
    return NextResponse.json(
      { error: "Failed to generate video" },
      { status: 500 },
    );
  }
}

function buildVideoPrompt(
  sceneTag: string | null,
  characterTag: string | null,
  occasion: string,
  message: string,
): string {
  // Look up scene description from preset
  const scenePreset = sceneTag ? getScenePreset(sceneTag) : null;
  const sceneDesc = scenePreset
    ? scenePreset.label.toLowerCase()
    : "a clean, well-lit setting";

  // Look up character description from preset
  const characterPreset = characterTag ? getCharacterPreset(characterTag) : null;
  const characterDesc = characterPreset
    ? characterPreset.label.toLowerCase()
    : "the person";

  // Occasion-specific tone
  const toneMap: Record<string, string> = {
    birthday: "warm, celebratory, and joyful",
    congratulations: "enthusiastic and proud",
    thankyou: "heartfelt and sincere",
    custom: "friendly and genuine",
  };
  const tone = toneMap[occasion] || toneMap.custom;

  return `A ${characterDesc} in ${sceneDesc}, looking directly at the camera with a ${tone} expression, speaking the following message: "${message}". The person should appear natural and expressive. High quality, cinematic lighting, professional-looking video.`;
}
