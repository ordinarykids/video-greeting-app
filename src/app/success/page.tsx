"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CheckCircle, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import VideoPlayer from "@/components/VideoPlayer";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<
    "loading" | "processing" | "completed" | "failed"
  >("loading");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [shotVideoUrls, setShotVideoUrls] = useState<string[]>([]);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const generationStartedRef = useRef(false);

  const sessionId = searchParams.get("session_id");
  const directVideoId = searchParams.get("video_id");

  useEffect(() => {
    if (!sessionId && !directVideoId) {
      router.push("/");
      return;
    }

    // Poll video status by video ID (used for both credit-based and Stripe flows)
    const pollVideoStatus = async (vid: string): Promise<boolean> => {
      const videoResponse = await fetch(`/api/videos/${vid}`);
      if (!videoResponse.ok) {
        const body = await videoResponse.json().catch(() => null);
        throw new Error(body?.error || "Failed to check video status");
      }

      const videoData = await videoResponse.json();

      if (videoData.status === "COMPLETED" && videoData.videoUrl) {
        setStatus("completed");
        setVideoUrl(videoData.videoUrl);
        if (videoData.shotVideoUrls && videoData.shotVideoUrls.length > 0) {
          setShotVideoUrls(videoData.shotVideoUrls);
        }
        return true; // Stop polling
      } else if (videoData.status === "FAILED") {
        setStatus("failed");
        setErrorMessage(videoData.error || "Video generation failed.");
        return true; // Stop polling
      } else if (videoData.status === "MERGING") {
        setStatus("processing");
        setProgressText("Merging shots into final video...");
        return false; // Continue polling
      } else {
        setStatus("processing");
        if (videoData.progress) {
          setProgressText(videoData.progress);
        }
        return false; // Continue polling
      }
    };

    // Start polling for video status
    const pollStatus = async () => {
      try {
        // Credit-based flow: we already have the video ID and generation was started
        if (directVideoId) {
          setVideoId(directVideoId);
          return await pollVideoStatus(directVideoId);
        }

        // Stripe flow: check payment status first, then poll video
        const paymentResponse = await fetch(
          `/api/payment-status?session_id=${sessionId}`,
        );
        if (!paymentResponse.ok) {
          const body = await paymentResponse.json().catch(() => null);
          throw new Error(body?.error || "Failed to check payment status");
        }

        const paymentData = await paymentResponse.json();

        if (paymentData.status === "COMPLETED" && paymentData.videoId) {
          setVideoId(paymentData.videoId);

          const videoResponse = await fetch(
            `/api/videos/${paymentData.videoId}`,
          );
          if (!videoResponse.ok) {
            const body = await videoResponse.json().catch(() => null);
            throw new Error(body?.error || "Failed to check video status");
          }

          const videoData = await videoResponse.json();

          if (videoData.status === "COMPLETED" && videoData.videoUrl) {
            setStatus("completed");
            setVideoUrl(videoData.videoUrl);
            if (videoData.shotVideoUrls && videoData.shotVideoUrls.length > 0) {
              setShotVideoUrls(videoData.shotVideoUrls);
            }
            return true;
          } else if (videoData.status === "FAILED") {
            setStatus("failed");
            setErrorMessage(videoData.error || "Video generation failed.");
            return true;
          } else {
            // If video is still pending and we haven't kicked off generation, do it now.
            if (
              videoData.status === "PENDING" &&
              !generationStartedRef.current
            ) {
              generationStartedRef.current = true;
              await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId: paymentData.videoId }),
              }).catch(() => null);
            }
            setStatus("processing");
            if (videoData.progress) {
              setProgressText(videoData.progress);
            }
            return false;
          }
        } else {
          setStatus("processing");
          return false;
        }
      } catch (error) {
        console.error("Error checking status:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong.",
        );
        return false;
      }
    };

    // Initial check
    pollStatus();

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      const shouldStop = await pollStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId, directVideoId, router]);

  const handleStartGeneration = async () => {
    if (!videoId) return;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to start generation");
      }

      generationStartedRef.current = true;
      setStatus("processing");
    } catch (error) {
      console.error("Error starting generation:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start generation.",
      );
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-gray-900" />
          <p className="text-gray-600">{directVideoId ? "Starting generation..." : "Confirming your payment..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Card variant="elevated" className="p-8 text-center">
          {status === "processing" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Creating Your Video
              </h1>
              <p className="mb-6 text-gray-600">
                Our AI is generating your personalized video greeting. This
                usually takes 1-2 minutes.
              </p>
              <div className="rounded-lg bg-gray-100 p-4">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progressText || "Processing..."}
                </div>
              </div>
              {!!videoId && (
                <Button onClick={handleStartGeneration} className="mt-6">
                  Start Generation
                </Button>
              )}
              {!!errorMessage && (
                <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
              )}
            </>
          )}

          {status === "completed" && videoUrl && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Your Video is Ready!
              </h1>
              <p className="mb-6 text-gray-600">
                Your personalized video greeting has been created successfully.
              </p>

              <div className="mb-6">
                <VideoPlayer
                  videoUrl={videoUrl}
                  shotVideoUrls={
                    shotVideoUrls.length > 0 ? shotVideoUrls : undefined
                  }
                />
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push(`/video/${videoId}`)}
                  className="w-full"
                >
                  View & Share
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Generation Failed
              </h1>
              <p className="mb-6 text-gray-600">
                We encountered an error while creating your video. Your credit
                has been preserved.
              </p>
              <div className="space-y-3">
                <Button onClick={handleStartGeneration} className="w-full">
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/create")}
                  className="w-full"
                >
                  Start Over
                </Button>
              </div>
            </>
          )}
        </Card>

        {session?.user && (
          <p className="mt-4 text-center text-gray-500">
            Credits remaining: {session.user.credits}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
