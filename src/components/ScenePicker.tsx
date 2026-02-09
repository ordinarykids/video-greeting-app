"use client";

import { useState } from "react";
import { Loader2, ImageIcon, RefreshCw, AlertCircle } from "lucide-react";
import { SCENE_PRESETS } from "@/lib/presets";

interface ScenePickerProps {
  selectedTag: string | null;
  selectedImageUrl: string | null;
  onSelect: (tag: string, imageUrl: string) => void;
}

export default function ScenePicker({
  selectedTag,
  selectedImageUrl,
  onSelect,
}: ScenePickerProps) {
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, string>
  >({});
  const [loadingTags, setLoadingTags] = useState<Set<string>>(new Set());
  const [errorTags, setErrorTags] = useState<Set<string>>(new Set());

  const generateImage = async (tag: string, prompt: string, retries = 2) => {
    setLoadingTags((prev) => new Set(prev).add(tag));
    setErrorTags((prev) => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspect: "landscape_4_3" }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }

        const { url } = await res.json();
        setGeneratedImages((prev) => ({ ...prev, [tag]: url }));
        setLoadingTags((prev) => {
          const next = new Set(prev);
          next.delete(tag);
          return next;
        });
        onSelect(tag, url);
        return; // success
      } catch (error) {
        console.error(`Scene image attempt ${attempt + 1} failed:`, error);
        if (attempt < retries) {
          // Wait before retrying (1s, then 2s)
          await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
        }
      }
    }

    // All retries exhausted
    setErrorTags((prev) => new Set(prev).add(tag));
    setLoadingTags((prev) => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
  };

  const handleClick = (tag: string, prompt: string) => {
    const existingUrl = generatedImages[tag];
    if (existingUrl) {
      onSelect(tag, existingUrl);
    } else {
      generateImage(tag, prompt);
    }
  };

  const handleRegenerate = (
    e: React.MouseEvent,
    tag: string,
    prompt: string,
  ) => {
    e.stopPropagation();
    generateImage(tag, prompt);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {SCENE_PRESETS.map((scene) => {
        const imageUrl = generatedImages[scene.tag];
        const isLoading = loadingTags.has(scene.tag);
        const isError = errorTags.has(scene.tag);
        const isSelected = selectedTag === scene.tag;

        return (
          <button
            key={scene.tag}
            type="button"
            onClick={() => handleClick(scene.tag, scene.prompt)}
            disabled={isLoading}
            className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
              isSelected
                ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                : isError
                  ? "border-red-300 hover:border-red-400"
                  : "border-gray-200 hover:border-gray-400"
            }`}
          >
            {imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt={scene.label}
                  className="w-full h-full object-cover"
                />
                {/* Regenerate button */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleRegenerate(e, scene.tag, scene.prompt)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRegenerate(e as unknown as React.MouseEvent, scene.tag, scene.prompt);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-gray-700" />
                </div>
              </>
            ) : isLoading ? (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="text-xs text-gray-400">Generating...</span>
              </div>
            ) : isError ? (
              <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <span className="text-xs text-red-500">Failed - tap to retry</span>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                <ImageIcon className="h-8 w-8 text-gray-300" />
                <span className="text-xs text-gray-400">Click to generate</span>
              </div>
            )}

            {/* Label overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <span className="text-white text-sm font-medium">
                {scene.label}
              </span>
            </div>

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-2 left-2 h-6 w-6 bg-gray-900 rounded-full flex items-center justify-center">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
