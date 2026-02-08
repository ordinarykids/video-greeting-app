import { NextResponse } from "next/server";
import { generateImage } from "@/lib/fal";

// Fun portrait prompts for the site gallery
const PORTRAIT_PROMPTS = [
  {
    id: "birthday-celebration",
    prompt:
      "A joyful person wearing a birthday party hat, surrounded by colorful confetti and balloons, warm smile, studio lighting, clean white background, portrait photography, 4k",
  },
  {
    id: "congratulations-graduate",
    prompt:
      "A proud graduate in cap and gown throwing their graduation cap in the air, big smile, bright natural light, clean minimal background, portrait photography, 4k",
  },
  {
    id: "thankyou-flowers",
    prompt:
      "A grateful person holding a beautiful bouquet of fresh flowers, soft warm smile, golden hour lighting, soft bokeh background, portrait photography, 4k",
  },
  {
    id: "party-host",
    prompt:
      "A charismatic party host in festive attire raising a champagne glass in a toast, warm inviting expression, elegant soft lighting, clean background, portrait photography, 4k",
  },
  {
    id: "surprise-reaction",
    prompt:
      "A person with a genuinely surprised and delighted expression, hands on cheeks, eyes wide with joy, bright studio lighting, white background, portrait photography, 4k",
  },
  {
    id: "warm-greeting",
    prompt:
      "A friendly person waving hello with a warm genuine smile, casual smart attire, soft natural lighting, clean white studio background, portrait photography, 4k",
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promptId } = body;

    const portraitPrompt = PORTRAIT_PROMPTS.find((p) => p.id === promptId);
    if (!portraitPrompt) {
      return NextResponse.json(
        { error: "Invalid portrait prompt ID" },
        { status: 400 },
      );
    }

    const result = await generateImage(portraitPrompt.prompt, {
      image_size: "portrait_4_3",
    });

    return NextResponse.json({
      imageUrl: result.images[0]?.url,
      seed: result.seed,
      promptId: portraitPrompt.id,
    });
  } catch (error) {
    console.error("Portrait generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate portrait" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    prompts: PORTRAIT_PROMPTS.map((p) => ({ id: p.id, prompt: p.prompt })),
  });
}
