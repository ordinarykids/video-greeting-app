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
      { status: 500 }
    );
  }
}
