// ---------------------------------------------------------------------------
// Shot breakdown – splits a message into multiple shots with camera directions
// ---------------------------------------------------------------------------

export interface Shot {
  index: number;
  text: string;
  camera: string;
  duration: string;
  estimatedSeconds: number;
}

/**
 * Camera angle cycle. Each shot gets a different angle to create visual variety.
 * Exported so the ShotEditor can offer these as options.
 */
export const CAMERA_OPTIONS: string[] = [
  "Medium close-up shot, eye-level, the person centered in frame looking directly at camera",
  "Close-up shot, slightly low angle, focusing on the person's face and expressions",
  "Medium shot from chest up, slight side angle, soft depth of field on the background",
  "Wide medium shot, eye-level, showing more of the scene with the person centered",
];

/**
 * Short labels for the camera options (used in the UI).
 */
export const CAMERA_LABELS: string[] = [
  "Medium close-up",
  "Close-up, low angle",
  "Medium shot, side angle",
  "Wide medium shot",
];

/**
 * Speaking rate constants.
 * Average speaking rate is ~150 words/minute = ~2.5 words/second.
 * We target 6–8 seconds of speech per shot (~20 words max).
 */
const WORDS_PER_SECOND = 2.5;
const MAX_SECONDS_PER_SHOT = 8;
const MAX_WORDS_PER_SHOT = Math.floor(WORDS_PER_SECOND * MAX_SECONDS_PER_SHOT); // 20
const MIN_SHOT_DURATION = 3; // minimum seconds for any shot

/** Count words in a string. */
function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/** Estimate speaking duration in seconds for a given text. */
export function estimateDuration(text: string): number {
  const words = wordCount(text);
  const seconds = Math.max(MIN_SHOT_DURATION, Math.ceil(words / WORDS_PER_SECOND));
  return seconds;
}

/**
 * Rebuild a shot object with correct index, duration estimate, and camera.
 * Useful after edits.
 */
export function rebuildShot(text: string, index: number, camera?: string): Shot {
  const est = estimateDuration(text);
  return {
    index,
    text,
    camera: camera || CAMERA_OPTIONS[index % CAMERA_OPTIONS.length],
    duration: `${est}s`,
    estimatedSeconds: est,
  };
}

/**
 * Split a message into shots, each estimated to be 6–8 seconds of speech.
 *
 * Strategy:
 * 1. Split the message into sentences.
 * 2. Greedily group sentences into shots, keeping each shot under ~20 words.
 * 3. If a single sentence exceeds 20 words, it becomes its own shot.
 * 4. Each shot gets a cycling camera angle and estimated duration.
 */
export function splitIntoShots(message: string): Shot[] {
  const trimmed = message.trim();
  if (!trimmed) return [];

  // Split into sentences on .!? boundaries
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // If no sentence boundaries found, treat the whole message as one block
  // and try to split on commas or clause boundaries instead
  if (sentences.length <= 1) {
    const words = trimmed.split(/\s+/);
    if (words.length <= MAX_WORDS_PER_SHOT) {
      return [rebuildShot(trimmed, 0)];
    }

    // Split long single-sentence text on commas or natural pauses
    const clauses = trimmed
      .split(/(?<=,)\s+|(?<=;)\s+|(?<=—)\s*|(?<=\.\.\.)\s*/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (clauses.length > 1) {
      return groupIntoShots(clauses);
    }

    // Last resort: split by word count
    return splitByWordCount(words);
  }

  return groupIntoShots(sentences);
}

/**
 * Group text segments (sentences/clauses) into shots of ~20 words each.
 */
function groupIntoShots(segments: string[]): Shot[] {
  const shots: Shot[] = [];
  let currentWords: string[] = [];
  let currentTexts: string[] = [];

  for (const segment of segments) {
    const segWords = wordCount(segment);
    const currentCount = currentWords.length;

    // If adding this segment would exceed the limit and we already have content
    if (currentCount > 0 && currentCount + segWords > MAX_WORDS_PER_SHOT) {
      // Flush current shot
      const text = currentTexts.join(" ");
      shots.push(rebuildShot(text, shots.length));
      currentWords = [];
      currentTexts = [];
    }

    currentTexts.push(segment);
    currentWords.push(...segment.split(/\s+/).filter((w) => w.length > 0));
  }

  // Flush remaining
  if (currentTexts.length > 0) {
    const text = currentTexts.join(" ");
    shots.push(rebuildShot(text, shots.length));
  }

  return shots;
}

/**
 * Split an array of words into shots of ~MAX_WORDS_PER_SHOT words each.
 * Used as a last resort when no sentence/clause boundaries are found.
 */
function splitByWordCount(words: string[]): Shot[] {
  const shots: Shot[] = [];

  for (let i = 0; i < words.length; i += MAX_WORDS_PER_SHOT) {
    const chunk = words.slice(i, i + MAX_WORDS_PER_SHOT);
    const text = chunk.join(" ");
    shots.push(rebuildShot(text, shots.length));
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
