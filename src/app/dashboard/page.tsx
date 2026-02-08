"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Video, Plus, ExternalLink, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface VideoItem {
  id: string;
  occasion: string;
  message: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  videoUrl: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/videos");
        if (response.ok) {
          const data = await response.json();
          setVideos(data.videos);
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchVideos();
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  const getStatusIcon = (videoStatus: string) => {
    switch (videoStatus) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "PROCESSING":
        return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
      case "FAILED":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (videoStatus: string) => {
    switch (videoStatus) {
      case "COMPLETED":
        return "Ready";
      case "PROCESSING":
        return "Processing";
      case "FAILED":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Videos</h1>
            <p className="text-gray-600 mt-1">
              Manage and share your video greetings
            </p>
          </div>
          <Button onClick={() => router.push("/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Video
          </Button>
        </div>

        {videos.length === 0 ? (
          <Card variant="bordered" className="p-12 text-center">
            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No videos yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first AI-generated video greeting!
            </p>
            <Button onClick={() => router.push("/create")}>
              Create Your First Video
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card
                key={video.id}
                variant="bordered"
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  {video.status === "COMPLETED" && video.videoUrl ? (
                    <video
                      src={video.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Video className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {video.occasion}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {getStatusIcon(video.status)}
                      <span className="text-sm text-gray-500">
                        {getStatusLabel(video.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {video.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {formatDate(video.createdAt)}
                    </span>
                    {video.status === "COMPLETED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/video/${video.id}`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Credits info */}
        {session?.user && (
          <div className="mt-8 text-center">
            <Card variant="bordered" className="inline-block px-6 py-3">
              <span className="text-gray-600">Available Credits: </span>
              <span className="font-bold text-gray-900">{session.user.credits}</span>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
