"use client";

import { useState, useRef } from "react";
import { Upload, Check } from "lucide-react";
import Button from "./ui/Button";

interface AvatarSelectorProps {
  selected: string | null;
  onSelect: (avatarUrl: string) => void;
}

const presetAvatars = [
  { id: "male1", url: "/avatars/male1.jpg", label: "Professional Male" },
  { id: "female1", url: "/avatars/female1.jpg", label: "Professional Female" },
  { id: "cartoon", url: "/avatars/cartoon.jpg", label: "Cartoon Character" },
  { id: "robot", url: "/avatars/robot.jpg", label: "Friendly Robot" },
  { id: "fantasy", url: "/avatars/fantasy.jpg", label: "Fantasy Character" },
  { id: "presenter", url: "/avatars/presenter.jpg", label: "News Presenter" },
];

export default function AvatarSelector({
  selected,
  onSelect,
}: AvatarSelectorProps) {
  const [uploading, setUploading] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const { avatarUrl } = await response.json();
      setCustomAvatar(avatarUrl);
      onSelect(avatarUrl);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {presetAvatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onSelect(avatar.url)}
            className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
              selected === avatar.url
                ? "border-gray-900 scale-105"
                : "border-transparent hover:border-gray-300"
            }`}
          >
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">
              {avatar.id === "male1" && "👨"}
              {avatar.id === "female1" && "👩"}
              {avatar.id === "cartoon" && "🎭"}
              {avatar.id === "robot" && "🤖"}
              {avatar.id === "fantasy" && "🧙"}
              {avatar.id === "presenter" && "📺"}
            </div>
            {selected === avatar.url && (
              <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-gray-900 bg-white rounded-full p-1" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-500 text-sm">or upload your own</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex items-center justify-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />
        {customAvatar ? (
          <div className="flex items-center gap-4">
            <div
              className={`relative h-24 w-24 rounded-xl overflow-hidden border-4 ${
                selected === customAvatar
                  ? "border-gray-900"
                  : "border-gray-200"
              }`}
            >
              <img
                src={customAvatar}
                alt="Custom avatar"
                className="w-full h-full object-cover"
              />
              {selected === customAvatar && (
                <div className="absolute inset-0 bg-gray-900/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-gray-900 bg-white rounded-full p-1" />
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Change Photo
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Photo
          </Button>
        )}
      </div>
    </div>
  );
}
