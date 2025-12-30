import { put, del } from "@vercel/blob";

export async function uploadToBlob(
  file: File | Blob,
  filename: string,
  folder: "avatars" | "videos"
): Promise<string> {
  const blob = await put(`${folder}/${filename}`, file, {
    access: "public",
  });

  return blob.url;
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

export async function uploadVideoFromUrl(
  videoUrl: string,
  videoId: string
): Promise<string> {
  const response = await fetch(videoUrl);
  const videoBlob = await response.blob();

  return uploadToBlob(videoBlob, `${videoId}.mp4`, "videos");
}
