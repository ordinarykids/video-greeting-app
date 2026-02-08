import { put, del } from "@vercel/blob";

export async function uploadToBlob(
  file: File | Blob,
  filename: string,
  folder: "avatars" | "videos",
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
  videoId: string,
): Promise<string> {
  const response = await fetch(videoUrl);
  const videoBlob = await response.blob();

  return uploadToBlob(videoBlob, `${videoId}.mp4`, "videos");
}

export async function uploadVideoBuffer(
  buffer: Uint8Array,
  videoId: string,
): Promise<string> {
  // Copy into a fresh ArrayBuffer to avoid SharedArrayBuffer TS issues
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(buffer);
  const blob = new Blob([ab], { type: "video/mp4" });
  return uploadToBlob(blob, `${videoId}-merged.mp4`, "videos");
}

export async function uploadImageFromUrl(
  imageUrl: string,
  filename: string,
): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const imageBlob = await response.blob();
  return uploadToBlob(imageBlob, filename, "avatars");
}
