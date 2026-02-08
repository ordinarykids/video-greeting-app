"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, UserCircle, RefreshCw } from "lucide-react";
import { CHARACTER_PRESETS } from "@/lib/presets";

interface CharacterPickerProps {
  selectedTag: string | null;
  selectedImageUrl: string | null;
  onSelect: (tag: string, imageUrl: string) => void;
}

export default function CharacterPicker({
  selectedTag,
  selectedImageUrl,
  onSelect,
}: CharacterPickerProps) {
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, string>
  >({});
  const [loadingTags, setLoadingTags] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateImage = async (tag: string, prompt: string) => {
    setLoadingTags((prev) => new Set(prev).add(tag));
    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspect: "portrait_4_3" }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const { url } = await res.json();
      setGeneratedImages((prev) => ({ ...prev, [tag]: url }));
      onSelect(tag, url);
    } catch (error) {
      console.error("Error generating character image:", error);
    } finally {
      setLoadingTags((prev) => {
        const next = new Set(prev);
        next.delete(tag);
        return next;
      });
    }
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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { url } = await res.json();
      onSelect("custom-upload", url);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Upload your own card */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-dashed transition-all ${
            selectedTag === "custom-upload"
              ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          {selectedTag === "custom-upload" && selectedImageUrl ? (
            <img
              src={selectedImageUrl}
              alt="Your upload"
              className="w-full h-full object-cover"
            />
          ) : isUploading ? (
            <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="text-xs text-gray-400">Uploading...</span>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
              <Upload className="h-8 w-8 text-gray-300" />
              <span className="text-sm font-medium text-gray-500">
                Upload Your Own
              </span>
              <span className="text-xs text-gray-400">JPG, PNG</span>
            </div>
          )}

          {selectedTag === "custom-upload" && (
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />

        {/* Preset characters */}
        {CHARACTER_PRESETS.map((char) => {
          const imageUrl = generatedImages[char.tag];
          const isLoading = loadingTags.has(char.tag);
          const isSelected = selectedTag === char.tag;

          return (
            <button
              key={char.tag}
              type="button"
              onClick={() => handleClick(char.tag, char.prompt)}
              disabled={isLoading}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                isSelected
                  ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={char.label}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) =>
                      handleRegenerate(e, char.tag, char.prompt)
                    }
                    className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-white transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                </>
              ) : isLoading ? (
                <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="text-xs text-gray-400">Generating...</span>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                  <UserCircle className="h-8 w-8 text-gray-300" />
                  <span className="text-xs text-gray-400">
                    Click to generate
                  </span>
                </div>
              )}

              {/* Label overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <span className="text-white text-sm font-medium">
                  {char.label}
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
    </div>
  );
}
