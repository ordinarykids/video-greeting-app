"use client";

import { useState } from "react";
import { Copy, Check, Download, Mail, Twitter, Facebook } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoShareClientProps {
  video: {
    id: string;
    occasion: string;
    message: string;
    videoUrl: string;
    shotVideoUrls?: string[];
    createdAt: string;
    creatorName: string;
  };
}

export default function VideoShareClient({ video }: VideoShareClientProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(video.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.occasion}-greeting.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading video:", error);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`${video.creatorName} sent you a ${video.occasion} video!`);
    const body = encodeURIComponent(
      `Check out this video greeting I made for you!\n\n${shareUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(
      `Check out this AI-generated ${video.occasion} video! ${shareUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
  };

  const occasionEmoji: Record<string, string> = {
    birthday: "🎂",
    congratulations: "🎉",
    thankyou: "💝",
    custom: "💬",
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <Card variant="elevated" className="overflow-hidden">
          {/* Video Player */}
          <VideoPlayer
            videoUrl={video.videoUrl}
            shotVideoUrls={video.shotVideoUrls}
          />

          {/* Video Info */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl">{occasionEmoji[video.occasion] || "💬"}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                  {video.occasion} Greeting
                </h1>
                <p className="text-gray-500 text-sm">
                  From {video.creatorName}
                </p>
              </div>
            </div>

            {video.message && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700 italic">&quot;{video.message}&quot;</p>
              </div>
            )}

            {/* Share Section */}
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Share this video
              </h2>

              {/* Copy Link */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  onClick={handleEmailShare}
                  className="justify-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTwitterShare}
                  className="justify-center"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFacebookShare}
                  className="justify-center"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Create Your Own CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Want to create your own AI video greeting?
          </p>
          <Button onClick={() => (window.location.href = "/")}>
            Create Your Own - $5
          </Button>
        </div>
      </div>
    </div>
  );
}
