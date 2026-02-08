import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  checkVideoStatus,
  getFalVideoModelId,
  getVideoResult,
} from "@/lib/fal";
import { uploadVideoFromUrl } from "@/lib/blob";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        videoUrl: true,
        occasion: true,
        message: true,
        avatarUrl: true,
        falJobId: true,
        falModelId: true,
        createdAt: true,
        userId: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // If video is processing, check Fal.ai status
    if (video.status === "PROCESSING" && video.falJobId) {
      try {
        // Use the stored model ID, falling back to legacy auto-detection
        const modelId =
          video.falModelId ||
          getFalVideoModelId(
            video.avatarUrl?.startsWith("http") ? video.avatarUrl : undefined,
          );
        const falStatus = await checkVideoStatus(video.falJobId, modelId);

        if (falStatus.status === "COMPLETED") {
          // Get the result
          const result = await getVideoResult(video.falJobId, modelId);

          // Upload video to Vercel Blob for permanent storage
          const permanentUrl = await uploadVideoFromUrl(
            result.video.url,
            video.id,
          );

          // Update video record
          const updatedVideo = await prisma.video.update({
            where: { id },
            data: {
              status: "COMPLETED",
              videoUrl: permanentUrl,
            },
          });

          return NextResponse.json({
            id: updatedVideo.id,
            status: updatedVideo.status,
            videoUrl: updatedVideo.videoUrl,
            shareUrl: `${process.env.NEXTAUTH_URL}/video/${updatedVideo.id}`,
          });
        } else if ((falStatus.status as string) === "FAILED") {
          await prisma.video.update({
            where: { id },
            data: { status: "FAILED" },
          });

          return NextResponse.json({
            id: video.id,
            status: "FAILED",
            error: "Video generation failed",
          });
        }
      } catch (error) {
        console.error("Error checking Fal.ai status:", error);
      }
    }

    return NextResponse.json({
      id: video.id,
      status: video.status,
      videoUrl: video.videoUrl,
      shareUrl: video.videoUrl
        ? `${process.env.NEXTAUTH_URL}/video/${video.id}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 },
    );
  }
}

// Create a new video record (before payment)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { occasion, avatarUrl, message } = body;

    const video = await prisma.video.create({
      data: {
        userId: session.user.id,
        occasion: occasion || "custom",
        avatarUrl: avatarUrl || "",
        message: message || "",
        status: "PENDING",
      },
    });

    return NextResponse.json({ videoId: video.id });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 },
    );
  }
}
