import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateImage } from "@/lib/fal";
import { z } from "zod";

const imageSchema = z.object({
  prompt: z.string().min(1).max(2000),
  aspect: z
    .enum([
      "square_hd",
      "square",
      "portrait_4_3",
      "portrait_16_9",
      "landscape_4_3",
      "landscape_16_9",
    ])
    .default("landscape_4_3"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = imageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 },
      );
    }

    const { prompt, aspect } = validation.data;

    const result = await generateImage(prompt, { image_size: aspect });

    if (!result.images || result.images.length === 0) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: result.images[0].url });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 },
    );
  }
}
