import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, mkdir, readFile, unlink, rmdir, chmod } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const execFileAsync = promisify(execFile);

/**
 * Concatenate multiple MP4 video URLs into a single MP4.
 * Uses a real ffmpeg binary (ffmpeg-static) with the concat demuxer
 * (stream copy, no re-encoding). Works in Node.js serverless environments.
 * Returns the concatenated video as a Uint8Array.
 */
export async function concatenateVideos(
  videoUrls: string[],
): Promise<Uint8Array> {
  if (videoUrls.length === 0) {
    throw new Error("No video URLs provided");
  }
  if (videoUrls.length === 1) {
    const response = await fetch(videoUrls[0]);
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  // Resolve the ffmpeg binary path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffmpegPath: string = require("ffmpeg-static");

  // Ensure the binary is executable (needed in some serverless environments)
  try {
    await chmod(ffmpegPath, 0o755);
  } catch {
    // May fail on read-only filesystems — binary is usually already executable
  }

  // Create a temp directory for our work
  const workDir = join(tmpdir(), `concat-${randomUUID()}`);
  await mkdir(workDir, { recursive: true });

  try {
    // Download all shot videos in parallel
    const downloadPromises = videoUrls.map(async (url, i) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download shot ${i}: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const filePath = join(workDir, `shot${i}.mp4`);
      await writeFile(filePath, Buffer.from(arrayBuffer));
      return filePath;
    });

    const filePaths = await Promise.all(downloadPromises);

    // Create concat list file
    const concatList = filePaths
      .map((fp) => `file '${fp}'`)
      .join("\n");
    const listPath = join(workDir, "list.txt");
    await writeFile(listPath, concatList, "utf-8");

    // Output path
    const outputPath = join(workDir, "output.mp4");

    // Run ffmpeg concat with stream copy (no re-encoding) — fast remux only
    await execFileAsync(ffmpegPath, [
      "-f", "concat",
      "-safe", "0",
      "-i", listPath,
      "-c", "copy",
      "-movflags", "+faststart",
      "-y",
      outputPath,
    ], {
      timeout: 30000, // 30 second timeout
    });

    // Read the output file
    const outputBuffer = await readFile(outputPath);
    return new Uint8Array(outputBuffer);
  } finally {
    // Clean up temp files
    try {
      const files = videoUrls.map((_, i) => join(workDir, `shot${i}.mp4`));
      files.push(join(workDir, "list.txt"), join(workDir, "output.mp4"));
      await Promise.allSettled(files.map((f) => unlink(f)));
      await rmdir(workDir);
    } catch {
      // Ignore cleanup errors
    }
  }
}
