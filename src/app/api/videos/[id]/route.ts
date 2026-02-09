import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  checkVideoStatus,
  getFalVideoModelId,
  getVideoResult,
} from "@/lib/fal";
import { uploadVideoFromUrl } from "@/lib/blob";

interface ShotRecord {
  index: number;
  text: string;
  camera: string;
  duration: string;
  falJobId?: string;
  falModelId?: string;
  status?: string;
  videoUrl?: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        videoUrl: true,
        occasion: true,
        message: true,
        avatarUrl: true,
        falJobId: true,
        falModelId: true,
        modelChoice: true,
        shots: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // If video is currently being merged, check if it's stuck
    if (video.status === "MERGING") {
      const mergeAge = Date.now() - new Date(video.updatedAt).getTime();
      const MERGE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

      if (mergeAge > MERGE_TIMEOUT_MS) {
        // Merge is stuck — fall back to first shot URL
        const shotRecords = (video.shots as ShotRecord[] | null) || [];
        const shotVideoUrls = shotRecords
          .sort((a, b) => a.index - b.index)
          .map((s) => s.videoUrl)
          .filter(Boolean) as string[];
        const primaryUrl = shotVideoUrls[0] || null;

        await prisma.video.update({
          where: { id },
          data: {
            status: "COMPLETED",
            videoUrl: primaryUrl,
          },
        });

        return NextResponse.json({
          id: video.id,
          status: "COMPLETED",
          videoUrl: primaryUrl,
          shotVideoUrls,
          shareUrl: `${process.env.NEXTAUTH_URL}/video/${video.id}`,
        });
      }

      return NextResponse.json({
        id: video.id,
        status: "MERGING",
        progress: "Merging shots into final video...",
        videoUrl: null,
      });
    }

    // If video is processing, check Fal.ai status
    if (video.status === "PROCESSING" && video.falJobId) {
      try {
        // ---------------------------------------------------------------
        // Multi-shot mode: check all shots (both quick and cinematic)
        // ---------------------------------------------------------------
        const shotRecords = (video.shots as ShotRecord[] | null) || [];
        const isMultiShot = shotRecords.length > 0 &&
          shotRecords.some((s) => !!s.falJobId);

        if (isMultiShot) {
          let allComplete = true;
          let anyFailed = false;
          let updated = false;

          for (const shot of shotRecords) {
            if (!shot.falJobId || !shot.falModelId) continue;
            if (shot.status === "COMPLETED" && shot.videoUrl) continue;
            if (shot.status === "FAILED") {
              anyFailed = true;
              allComplete = false;
              continue;
            }

            const falStatus = await checkVideoStatus(
              shot.falJobId,
              shot.falModelId,
            );

            if (falStatus.status === "COMPLETED") {
              const result = await getVideoResult(
                shot.falJobId,
                shot.falModelId,
              );
              // Upload each shot video to blob
              const permanentUrl = await uploadVideoFromUrl(
                result.video.url,
                `${video.id}-shot-${shot.index}`,
              );
              shot.status = "COMPLETED";
              shot.videoUrl = permanentUrl;
              updated = true;
            } else if ((falStatus.status as string) === "FAILED") {
              shot.status = "FAILED";
              anyFailed = true;
              allComplete = false;
              updated = true;
            } else {
              allComplete = false;
            }
          }

          if (anyFailed) {
            await prisma.video.update({
              where: { id },
              data: {
                status: "FAILED",
                shots: shotRecords as unknown as Prisma.InputJsonValue,
              },
            });
            return NextResponse.json({
              id: video.id,
              status: "FAILED",
              error: "One or more shots failed to generate",
            });
          }

          if (allComplete) {
            // All shots done — collect video URLs in order
            const shotVideoUrls = shotRecords
              .sort((a, b) => a.index - b.index)
              .map((s) => s.videoUrl)
              .filter(Boolean) as string[];

            // Single-shot videos don't need merging
            if (shotVideoUrls.length <= 1) {
              const primaryUrl = shotVideoUrls[0] || null;
              await prisma.video.update({
                where: { id },
                data: {
                  status: "COMPLETED",
                  videoUrl: primaryUrl,
                  shots: shotRecords as unknown as Prisma.InputJsonValue,
                },
              });
              return NextResponse.json({
                id: video.id,
                status: "COMPLETED",
                videoUrl: primaryUrl,
                shotVideoUrls,
                shareUrl: `${process.env.NEXTAUTH_URL}/video/${video.id}`,
              });
            }

            // Multi-shot: transition to MERGING (prevents duplicate merges)
            await prisma.video.update({
              where: { id },
              data: {
                status: "MERGING",
                shots: shotRecords as unknown as Prisma.InputJsonValue,
              },
            });

            try {
              const { concatenateVideos } = await import("@/lib/concat");
              const { uploadVideoBuffer } = await import("@/lib/blob");

              const mergedBuffer = await concatenateVideos(shotVideoUrls);
              const mergedUrl = await uploadVideoBuffer(mergedBuffer, video.id);

              await prisma.video.update({
                where: { id },
                data: {
                  status: "COMPLETED",
                  videoUrl: mergedUrl,
                  shots: shotRecords as unknown as Prisma.InputJsonValue,
                },
              });

              return NextResponse.json({
                id: video.id,
                status: "COMPLETED",
                videoUrl: mergedUrl,
                shotVideoUrls,
                shareUrl: `${process.env.NEXTAUTH_URL}/video/${video.id}`,
              });
            } catch (mergeError) {
              console.error(
                "Video concatenation failed, falling back:",
                mergeError,
              );

              // Fallback: mark COMPLETED with first shot URL
              // Client can still play shots sequentially
              const primaryUrl = shotVideoUrls[0] || null;
              await prisma.video.update({
                where: { id },
                data: {
                  status: "COMPLETED",
                  videoUrl: primaryUrl,
                  shots: shotRecords as unknown as Prisma.InputJsonValue,
                },
              });

              return NextResponse.json({
                id: video.id,
                status: "COMPLETED",
                videoUrl: primaryUrl,
                shotVideoUrls,
                shareUrl: `${process.env.NEXTAUTH_URL}/video/${video.id}`,
              });
            }
          }

          // Some shots still processing — persist any updates
          if (updated) {
            await prisma.video.update({
              where: { id },
              data: { shots: shotRecords as unknown as Prisma.InputJsonValue },
            });
          }

          // Report progress
          const completedCount = shotRecords.filter(
            (s) => s.status === "COMPLETED",
          ).length;

          return NextResponse.json({
            id: video.id,
            status: "PROCESSING",
            progress: `${completedCount}/${shotRecords.length} shots complete`,
            videoUrl: null,
          });
        }

        // ---------------------------------------------------------------
        // Quick / legacy single-shot mode
        // ---------------------------------------------------------------
        const modelId =
          video.falModelId ||
          getFalVideoModelId(
            video.avatarUrl?.startsWith("http") ? video.avatarUrl : undefined,
          );
        const falStatus = await checkVideoStatus(video.falJobId, modelId);

        if (falStatus.status === "COMPLETED") {
          const result = await getVideoResult(video.falJobId, modelId);

          const permanentUrl = await uploadVideoFromUrl(
            result.video.url,
            video.id,
          );

          const updatedVideo = await prisma.video.update({
            where: { id },
            data: {
              status: "COMPLETED",
              videoUrl: permanentUrl,
            },
          });

          return NextResponse.json({
            id: updatedVideo.id,
            status: updatedVideo.status,
            videoUrl: updatedVideo.videoUrl,
            shareUrl: `${process.env.NEXTAUTH_URL}/video/${updatedVideo.id}`,
          });
        } else if ((falStatus.status as string) === "FAILED") {
          await prisma.video.update({
            where: { id },
            data: { status: "FAILED" },
          });

          return NextResponse.json({
            id: video.id,
            status: "FAILED",
            error: "Video generation failed",
          });
        }
      } catch (error) {
        console.error("Error checking Fal.ai status:", error);
      }
    }

    return NextResponse.json({
      id: video.id,
      status: video.status,
      videoUrl: video.videoUrl,
      shareUrl: video.videoUrl
        ? `${process.env.NEXTAUTH_URL}/video/${video.id}`
        : null,
    });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 },
    );
  }
}
