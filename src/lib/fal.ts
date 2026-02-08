import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

// ---------------------------------------------------------------------------
// Model catalog – add new Fal models here and they'll appear in the picker
// ---------------------------------------------------------------------------

export interface VideoModel {
  id: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Short description */
  description: string;
  /** What kind of image input does the model accept? */
  imageMode: "none" | "single" | "multi";
  /** Default aspect ratio */
  defaultAspect: string;
  /** Default duration */
  defaultDuration: string;
  /** Default resolution (if supported) */
  defaultResolution?: string;
  /** Whether the model supports audio generation */
  supportsAudio?: boolean;
  /** Badge shown in the picker (e.g. "Fast", "HD") */
  badge?: string;
}

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "fal-ai/veo2",
    label: "Veo 2 – Text to Video",
    description: "Generate a video from a text prompt only. No reference image needed.",
    imageMode: "none",
    defaultAspect: "16:9",
    defaultDuration: "5s",
    badge: "Text Only",
  },
  {
    id: "fal-ai/veo3.1/fast/image-to-video",
    label: "Veo 3.1 Fast – Image to Video",
    description: "Fast generation from a single reference image + prompt.",
    imageMode: "single",
    defaultAspect: "16:9",
    defaultDuration: "8s",
    badge: "Fast",
  },
  {
    id: "fal-ai/veo3.1/reference-to-video",
    label: "Veo 3.1 – Reference to Video",
    description:
      "Highest quality. Uses up to 3 reference images, 1080p output, with generated audio.",
    imageMode: "multi",
    defaultAspect: "16:9",
    defaultDuration: "8s",
    defaultResolution: "1080p",
    supportsAudio: true,
    badge: "Best Quality",
  },
];

/** Look up a model definition by its ID */
export function getVideoModel(modelId: string): VideoModel | undefined {
  return VIDEO_MODELS.find((m) => m.id === modelId);
}

/**
 * Backwards-compatible helper – returns a model ID based on whether an image
 * URL is present. Used by legacy code paths that don't have a stored modelId.
 */
export function getFalVideoModelId(imageUrl?: string): string {
  return imageUrl ? "fal-ai/veo3.1/fast/image-to-video" : "fal-ai/veo2";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoGenerationResult {
  video: {
    url: string;
  };
}

// ---------------------------------------------------------------------------
// Core generation
// ---------------------------------------------------------------------------

export async function generateVideo(
  prompt: string,
  imageUrl?: string,
  modelId?: string,
): Promise<{ requestId: string; modelId: string }> {
  // Resolve which model to use
  const resolvedModelId =
    modelId || getFalVideoModelId(imageUrl);
  const model = getVideoModel(resolvedModelId);

  if (!model) {
    throw new Error(`Unknown video model: ${resolvedModelId}`);
  }

  // Text-to-Video (no image)
  if (model.imageMode === "none") {
    const result = await fal.queue.submit(resolvedModelId, {
      input: {
        prompt,
        aspect_ratio: model.defaultAspect as "16:9",
        duration: model.defaultDuration as "5s",
      },
    });
    return { requestId: result.request_id, modelId: resolvedModelId };
  }

  // Single-image-to-Video
  if (model.imageMode === "single") {
    const result = await fal.queue.submit(resolvedModelId, {
      input: {
        prompt,
        image_url: imageUrl!,
        aspect_ratio: model.defaultAspect as "16:9",
        duration: model.defaultDuration as "8s",
      },
    });
    return { requestId: result.request_id, modelId: resolvedModelId };
  }

  // Multi-image reference-to-video (veo3.1/reference-to-video)
  if (model.imageMode === "multi") {
    // Accept single image URL and wrap in array, or pass array directly
    const imageUrls = imageUrl ? [imageUrl] : [];

    const input: Record<string, unknown> = {
      prompt,
      aspect_ratio: model.defaultAspect,
      duration: model.defaultDuration,
      image_urls: imageUrls,
    };

    if (model.defaultResolution) {
      input.resolution = model.defaultResolution;
    }
    if (model.supportsAudio) {
      input.generate_audio = true;
    }

    const result = await fal.queue.submit(resolvedModelId, { input });
    return { requestId: result.request_id, modelId: resolvedModelId };
  }

  throw new Error(`Unsupported image mode for model: ${resolvedModelId}`);
}

// ---------------------------------------------------------------------------
// Queue helpers
// ---------------------------------------------------------------------------

export async function checkVideoStatus(requestId: string, modelId: string) {
  const status = await fal.queue.status(modelId, {
    requestId,
    logs: true,
  });

  return status;
}

export async function getVideoResult(
  requestId: string,
  modelId: string,
): Promise<VideoGenerationResult> {
  const result = await fal.queue.result(modelId, {
    requestId,
  });

  return result.data as VideoGenerationResult;
}

// ---------------------------------------------------------------------------
// FLUX 2 Image Generation
// ---------------------------------------------------------------------------

export interface ImageGenerationResult {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  seed: number;
}

/**
 * Generate an image using FLUX 2 Pro model.
 * Returns the result synchronously (sync_mode).
 */
export async function generateImage(
  prompt: string,
  options: {
    image_size?: "square_hd" | "square" | "portrait_4_3" | "portrait_16_9" | "landscape_4_3" | "landscape_16_9";
    seed?: number;
  } = {},
): Promise<ImageGenerationResult> {
  const result = await fal.subscribe("fal-ai/flux-2-pro", {
    input: {
      prompt,
      image_size: options.image_size || "portrait_4_3",
      output_format: "jpeg" as const,
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
    },
  });

  return result.data as ImageGenerationResult;
}

export { fal };
