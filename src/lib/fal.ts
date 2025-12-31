import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

const FAL_MODEL_T2V = "fal-ai/veo2";
const FAL_MODEL_I2V = "fal-ai/veo3.1/fast/image-to-video";

export function getFalVideoModelId(imageUrl?: string): string {
  return imageUrl ? FAL_MODEL_I2V : FAL_MODEL_T2V;
}

export interface VideoGenerationResult {
  video: {
    url: string;
  };
}

export async function generateVideo(
  prompt: string,
  imageUrl?: string,
): Promise<{ requestId: string; modelId: string }> {
  const modelId = getFalVideoModelId(imageUrl);

  // Keep payload minimal and match Fal's typed inputs.
  if (modelId === FAL_MODEL_T2V) {
    const result = await fal.queue.submit(FAL_MODEL_T2V, {
      input: {
        prompt,
        aspect_ratio: "16:9" as const,
        duration: "5s" as const,
      },
    });
    return { requestId: result.request_id, modelId };
  }

  const result = await fal.queue.submit(FAL_MODEL_I2V, {
    input: {
      prompt,
      image_url: imageUrl!,
      aspect_ratio: "16:9" as const,
      duration: "8s" as const,
    },
  });

  return { requestId: result.request_id, modelId };
}

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

export { fal };
