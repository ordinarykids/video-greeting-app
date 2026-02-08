// ---------------------------------------------------------------------------
// Scene & Character presets for the video creation flow
// ---------------------------------------------------------------------------

export interface ScenePreset {
  tag: string;
  label: string;
  prompt: string;
  occasion: string;
}

export interface CharacterPreset {
  tag: string;
  label: string;
  prompt: string;
}

// ---------------------------------------------------------------------------
// Scenes – each maps to a background/setting for the video
// ---------------------------------------------------------------------------

export const SCENE_PRESETS: ScenePreset[] = [
  {
    tag: "birthday-party",
    label: "Birthday Party",
    prompt:
      "A festive birthday party scene with colorful balloons, streamers, and a decorated table with a birthday cake with lit candles. Warm ambient lighting, confetti on the table, blurred bokeh background. Photorealistic, high quality.",
    occasion: "birthday",
  },
  {
    tag: "graduation-stage",
    label: "Graduation Stage",
    prompt:
      "An elegant graduation ceremony stage with a wooden podium, draped curtains in dark blue, and rows of seats in the background. Warm golden stage lighting, academic banners. Photorealistic, high quality.",
    occasion: "congratulations",
  },
  {
    tag: "thank-you-garden",
    label: "Garden of Thanks",
    prompt:
      "A beautiful sunlit garden with blooming flowers, a wooden bench, and soft natural light streaming through trees. Lush green foliage, warm golden hour lighting, peaceful and inviting atmosphere. Photorealistic, high quality.",
    occasion: "thankyou",
  },
  {
    tag: "holiday-living-room",
    label: "Holiday Living Room",
    prompt:
      "A cozy holiday living room with a decorated fireplace, warm string lights, wrapped gifts, and a comfortable armchair. Soft warm interior lighting, festive decorations. Photorealistic, high quality.",
    occasion: "custom",
  },
  {
    tag: "office-celebration",
    label: "Office Celebration",
    prompt:
      "A modern office space decorated for a celebration with balloons, a congratulations banner, and a small party setup on a conference table. Bright natural light from large windows, contemporary interior. Photorealistic, high quality.",
    occasion: "congratulations",
  },
  {
    tag: "abstract-studio",
    label: "Clean Studio",
    prompt:
      "A clean, modern photography studio with a soft gradient background transitioning from light gray to white. Professional studio lighting with soft diffusion, minimal and elegant. Photorealistic, high quality.",
    occasion: "custom",
  },
];

// ---------------------------------------------------------------------------
// Characters – each represents a person/avatar style
// ---------------------------------------------------------------------------

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    tag: "friendly-woman",
    label: "Friendly Woman",
    prompt:
      "Portrait of a friendly smiling woman in her 30s with warm brown hair, wearing a casual light blue top. Soft natural lighting, neutral background, looking directly at camera with a genuine warm smile. Photorealistic, high quality headshot.",
  },
  {
    tag: "business-man",
    label: "Business Man",
    prompt:
      "Portrait of a confident professional man in his 40s with short dark hair, wearing a navy blue blazer over a white shirt. Soft studio lighting, neutral background, looking directly at camera with a friendly approachable expression. Photorealistic, high quality headshot.",
  },
  {
    tag: "cheerful-young-woman",
    label: "Cheerful Young Woman",
    prompt:
      "Portrait of a cheerful young woman in her 20s with curly dark hair and a bright smile, wearing a warm yellow sweater. Soft natural lighting, neutral background, looking directly at camera with an enthusiastic joyful expression. Photorealistic, high quality headshot.",
  },
  {
    tag: "elegant-elder",
    label: "Elegant Elder",
    prompt:
      "Portrait of a distinguished older gentleman in his 60s with silver gray hair and kind eyes, wearing a soft green cardigan. Soft warm lighting, neutral background, looking directly at camera with a gentle wise smile. Photorealistic, high quality headshot.",
  },
  {
    tag: "creative-artist",
    label: "Creative Artist",
    prompt:
      "Portrait of a creative young person with short colorful streaked hair and artistic earrings, wearing a black turtleneck. Soft studio lighting, neutral background, looking directly at camera with an expressive confident smile. Photorealistic, high quality headshot.",
  },
  {
    tag: "warm-grandmother",
    label: "Warm Grandmother",
    prompt:
      "Portrait of a warm grandmotherly woman in her 70s with soft white hair and kind wrinkled smile, wearing a cozy cream cardigan with a pearl necklace. Soft warm lighting, neutral background, looking directly at camera with a loving gentle expression. Photorealistic, high quality headshot.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getScenePreset(tag: string): ScenePreset | undefined {
  return SCENE_PRESETS.find((s) => s.tag === tag);
}

export function getCharacterPreset(tag: string): CharacterPreset | undefined {
  return CHARACTER_PRESETS.find((c) => c.tag === tag);
}
