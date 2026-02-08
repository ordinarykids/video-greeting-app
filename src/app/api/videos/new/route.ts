import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      avatarUrl,
      modelChoice,
      sceneTag,
      sceneImageUrl,
      message,
      occasion,
      shots,
    } = body;

    // Resolve Fal model based on mode
    const falModelId =
      modelChoice === "quick"
        ? "fal-ai/veo3.1/fast/image-to-video"
        : "fal-ai/veo3.1/reference-to-video";

    const video = await prisma.video.create({
      data: {
        userId: session.user.id,
        occasion: occasion || "custom",
        avatarUrl: avatarUrl || "",
        message: message || "",
        falModelId,
        modelChoice: modelChoice || null,
        sceneTag: sceneTag || null,
        sceneImageUrl: sceneImageUrl || null,
        shots: shots || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ videoId: video.id });
  } catch (error) {
    console.error("Error creating video:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create video";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
