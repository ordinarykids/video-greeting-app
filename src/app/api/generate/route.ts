import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateVideo } from "@/lib/fal";
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
        falJobId: true,
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

    const occasion = (video.occasion || "custom").toString();
    const message = (video.message || "").toString();
    const avatarUrl = (video.avatarUrl || "").toString();

    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Missing avatarUrl for this video" },
        { status: 400 },
      );
    }

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

    // Build the prompt for Veo
    const prompt = buildVideoPrompt(occasion, message);

    // Call Fal.ai to generate video
    const { requestId } = await generateVideo(prompt, avatarUrl);

    // Update video record with job ID
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "PROCESSING",
        falJobId: requestId,
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

function buildVideoPrompt(occasion: string, message: string): string {
  const occasionPrefixes: Record<string, string> = {
    birthday:
      "A warm and celebratory birthday video greeting where the person says:",
    congratulations:
      "An enthusiastic congratulatory video message where the person says:",
    thankyou: "A heartfelt thank you video message where the person says:",
    custom: "A personalized video message where the person says:",
  };

  const prefix = occasionPrefixes[occasion] || occasionPrefixes.custom;

  return `${prefix} "${message}". The person should appear friendly, warm, and genuine, looking directly at the camera with appropriate emotional expression matching the occasion. High quality, well-lit, professional looking video.`;
}
