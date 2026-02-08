import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getScenePreset } from "@/lib/presets";
import { DEFAULT_VIDEO_MODEL_ID } from "@/lib/fal";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sceneTag, sceneImageUrl, characterTag, avatarUrl, message } = body;

    // Derive occasion from scene preset
    const scenePreset = sceneTag ? getScenePreset(sceneTag) : undefined;
    const occasion = scenePreset?.occasion || "custom";

    const video = await prisma.video.create({
      data: {
        userId: session.user.id,
        occasion,
        avatarUrl: avatarUrl || "",
        message: message || "",
        falModelId: DEFAULT_VIDEO_MODEL_ID,
        sceneTag: sceneTag || null,
        sceneImageUrl: sceneImageUrl || null,
        characterTag: characterTag || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ videoId: video.id });
  } catch (error) {
    console.error("Error creating video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
