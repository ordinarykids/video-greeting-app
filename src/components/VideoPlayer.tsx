"use client";

import { useState, useRef, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Download } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  /** Additional video URLs for multi-shot playback (played in sequence) */
  shotVideoUrls?: string[];
  poster?: string;
}

export default function VideoPlayer({
  videoUrl,
  shotVideoUrls,
  poster,
}: VideoPlayerProps) {
  // Detect if videoUrl is a merged video (different from any individual shot URL).
  // If merged, play as a single source. If not merged (fallback), use sequential playback.
  const isMergedVideo =
    !!videoUrl &&
    !!shotVideoUrls &&
    shotVideoUrls.length > 1 &&
    !shotVideoUrls.includes(videoUrl);

  const playlist = isMergedVideo
    ? [videoUrl]
    : shotVideoUrls && shotVideoUrls.length > 1
      ? shotVideoUrls
      : [videoUrl];
  const isMultiShot = playlist.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentSrc = playlist[currentIndex];

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const pct =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      // For multi-shot, compute overall progress across all shots
      if (isMultiShot) {
        const perShot = 100 / playlist.length;
        setProgress(currentIndex * perShot + (pct / 100) * perShot);
      } else {
        setProgress(pct);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);

    if (isMultiShot) {
      // Determine which shot this seek value lands in
      const perShot = 100 / playlist.length;
      const shotIdx = Math.min(
        Math.floor(val / perShot),
        playlist.length - 1,
      );
      const shotProgress = ((val - shotIdx * perShot) / perShot) * 100;

      if (shotIdx !== currentIndex) {
        setCurrentIndex(shotIdx);
        // The video src will change, so we'll seek in onLoadedMetadata
      }

      if (videoRef.current.duration) {
        videoRef.current.currentTime =
          (shotProgress / 100) * videoRef.current.duration;
      }
      setProgress(val);
    } else {
      const time = (val / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(val);
    }
  };

  const handleEnded = useCallback(() => {
    if (isMultiShot && currentIndex < playlist.length - 1) {
      // Advance to next shot
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [isMultiShot, currentIndex, playlist.length]);

  const handleLoadedData = () => {
    // Auto-play the next shot when it loads (if we were already playing)
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleDownload = async () => {
    try {
      // For merged video or single shot, download the main videoUrl
      const downloadUrl = isMergedVideo ? videoUrl : currentSrc;
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        isMultiShot && !isMergedVideo
          ? `video-greeting-shot-${currentIndex + 1}.mp4`
          : "video-greeting.mp4";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading video:", error);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-black group">
      <video
        ref={videoRef}
        src={currentSrc}
        poster={poster}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedData={handleLoadedData}
        onClick={togglePlay}
      />

      {/* Shot indicator for multi-shot */}
      {isMultiShot && (
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          Shot {currentIndex + 1} / {playlist.length}
        </div>
      )}

      {/* Play button overlay */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
        >
          <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="h-8 w-8 text-gray-900 ml-1" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Progress bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1 mb-3 appearance-none bg-white/30 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
