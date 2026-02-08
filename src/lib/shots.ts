// ---------------------------------------------------------------------------
// Shot breakdown – splits a message into multiple shots with camera directions
// ---------------------------------------------------------------------------

export interface Shot {
  index: number;
  text: string;
  camera: string;
  duration: string;
}

/**
 * Camera angle cycle. Each shot gets a different angle to create visual variety.
 * Designed to feel like a professional video with varied framing.
 */
const CAMERA_CYCLE: string[] = [
  "Medium close-up shot, eye-level, the person centered in frame looking directly at camera",
  "Close-up shot, slightly low angle, focusing on the person's face and expressions",
  "Medium shot from chest up, slight side angle, soft depth of field on the background",
  "Wide medium shot, eye-level, showing more of the scene with the person centered",
];

/**
 * Split a message into shots. Each shot is a sentence group with a camera direction.
 *
 * Rules:
 * - Messages under 80 chars → 1 shot
 * - Messages 80-200 chars → 2 shots
 * - Messages 200-350 chars → 3 shots
 * - Messages 350+ chars → 4 shots (max)
 *
 * Splits on sentence boundaries (., !, ?) then groups into chunks.
 */
export function splitIntoShots(message: string): Shot[] {
  const trimmed = message.trim();

  if (trimmed.length < 80) {
    return [
      {
        index: 0,
        text: trimmed,
        camera: CAMERA_CYCLE[0],
        duration: "8s",
      },
    ];
  }

  // Split into sentences
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentences.length <= 1) {
    return [
      {
        index: 0,
        text: trimmed,
        camera: CAMERA_CYCLE[0],
        duration: "8s",
      },
    ];
  }

  // Determine target number of shots based on total length
  let targetShots: number;
  if (trimmed.length < 200) {
    targetShots = 2;
  } else if (trimmed.length < 350) {
    targetShots = 3;
  } else {
    targetShots = 4;
  }

  // Cap to available sentences
  targetShots = Math.min(targetShots, sentences.length);

  // Distribute sentences across shots as evenly as possible
  const shots: Shot[] = [];
  const sentencesPerShot = Math.ceil(sentences.length / targetShots);

  for (let i = 0; i < targetShots; i++) {
    const start = i * sentencesPerShot;
    const end = Math.min(start + sentencesPerShot, sentences.length);
    const chunk = sentences.slice(start, end);

    if (chunk.length === 0) break;

    shots.push({
      index: i,
      text: chunk.join(" "),
      camera: CAMERA_CYCLE[i % CAMERA_CYCLE.length],
      duration: "8s",
    });
  }

  return shots;
}

/**
 * Build a video prompt for a specific shot, incorporating scene, character,
 * camera direction, and the dialogue for that shot.
 */
export function buildShotPrompt(
  shot: Shot,
  sceneDescription: string,
  characterDescription: string,
  tone: string,
): string {
  return `${shot.camera}. ${characterDescription} in ${sceneDescription}, with a ${tone} expression, speaking: "${shot.text}". The person should appear natural and expressive, lip-syncing the words. High quality, cinematic lighting, professional-looking video.`;
}
