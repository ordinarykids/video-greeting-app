import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/**
 * Concatenate multiple MP4 video URLs into a single MP4.
 * Uses ffmpeg.wasm with the concat demuxer (stream copy, no re-encoding).
 * Returns the concatenated video as a Uint8Array.
 */
export async function concatenateVideos(
  videoUrls: string[],
): Promise<Uint8Array> {
  if (videoUrls.length === 0) {
    throw new Error("No video URLs provided");
  }
  if (videoUrls.length === 1) {
    // Single video — just fetch and return as-is
    const data = await fetchFile(videoUrls[0]);
    return data;
  }

  const ffmpeg = new FFmpeg();

  try {
    // Load the ffmpeg.wasm core with toBlobURL for cross-origin support
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.9/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });

    // Download each video and write to the virtual filesystem
    for (let i = 0; i < videoUrls.length; i++) {
      const data = await fetchFile(videoUrls[i]);
      await ffmpeg.writeFile(`shot${i}.mp4`, data);
    }

    // Create concat list file
    const concatList = videoUrls
      .map((_, i) => `file 'shot${i}.mp4'`)
      .join("\n");
    await ffmpeg.writeFile(
      "list.txt",
      new TextEncoder().encode(concatList),
    );

    // Run concat with stream copy (no re-encoding) — fast remux only
    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "list.txt",
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      "output.mp4",
    ]);

    // Read the output
    const output = await ffmpeg.readFile("output.mp4");

    if (output instanceof Uint8Array) {
      return output;
    }

    // readFile can return string for text files; convert just in case
    return new TextEncoder().encode(output as string);
  } finally {
    ffmpeg.terminate();
  }
}
