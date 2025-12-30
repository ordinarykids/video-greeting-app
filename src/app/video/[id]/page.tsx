import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import VideoShareClient from "./VideoShareClient";

interface VideoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VideoPageProps) {
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    select: { occasion: true, message: true },
  });

  if (!video) {
    return { title: "Video Not Found" };
  }

  return {
    title: `${video.occasion.charAt(0).toUpperCase() + video.occasion.slice(1)} Video Greeting | VideoGreet`,
    description: video.message.substring(0, 160),
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id },
    select: {
      id: true,
      occasion: true,
      message: true,
      status: true,
      videoUrl: true,
      createdAt: true,
      user: {
        select: { name: true },
      },
    },
  });

  if (!video || video.status !== "COMPLETED" || !video.videoUrl) {
    notFound();
  }

  return (
    <VideoShareClient
      video={{
        id: video.id,
        occasion: video.occasion,
        message: video.message,
        videoUrl: video.videoUrl,
        createdAt: video.createdAt.toISOString(),
        creatorName: video.user.name || "Someone",
      }}
    />
  );
}
