import { fal } from "@fal-ai/client";

fal.config({
  credentials: process.env.FAL_KEY,
});

export interface VideoGenerationResult {
  video: {
    url: string;
  };
}

export async function generateVideo(
  prompt: string,
  _imageUrl?: string,
): Promise<{ requestId: string }> {
  // Note: veo2 is a text-to-video model and may not support image_url directly
  // The avatar/image would need to be described in the prompt instead
  const result = await fal.queue.submit("fal-ai/veo3.1/fast/image-to-video", {
    input: {
      prompt,
      duration: "8s",
      resolution: "720p",
      generate_audio: true,
      auto_fix: true,
      aspect_ratio: "16:9" as const,
      image_url: "https://storage.googleapis.com/falserverless/example_inputs/veo31_i2v_input.jpg
    },
  });

  return { requestId: result.request_id };
}

export async function checkVideoStatus(requestId: string) {
  const status = await fal.queue.status("fal-ai/veo2", {
    requestId,
    logs: true,
  });

  return status;
}

export async function getVideoResult(
  requestId: string,
): Promise<VideoGenerationResult> {
  const result = await fal.queue.result("fal-ai/veo2", {
    requestId,
  });

  return result.data as VideoGenerationResult;
}

export { fal };
