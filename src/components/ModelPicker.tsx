"use client";

import { Video, Zap, Sparkles, Image as ImageIcon } from "lucide-react";

interface ModelPickerProps {
  selected: string | null;
  onSelect: (modelId: string) => void;
  hasImage: boolean;
}

const models = [
  {
    id: "fal-ai/veo2",
    label: "Veo 2",
    subtitle: "Text to Video",
    description: "Generate from a text prompt only. No reference image needed.",
    icon: Video,
    badge: "Text Only",
    imageMode: "none" as const,
    color: "bg-blue-100 text-blue-600 border-blue-200",
    selectedColor: "bg-blue-500 text-white border-blue-500",
    badgeColor: "bg-blue-200 text-blue-700",
    selectedBadgeColor: "bg-blue-400 text-white",
  },
  {
    id: "fal-ai/veo3.1/fast/image-to-video",
    label: "Veo 3.1 Fast",
    subtitle: "Image to Video",
    description: "Fast generation from a single reference image + prompt.",
    icon: Zap,
    badge: "Fast",
    imageMode: "single" as const,
    color: "bg-amber-100 text-amber-600 border-amber-200",
    selectedColor: "bg-amber-500 text-white border-amber-500",
    badgeColor: "bg-amber-200 text-amber-700",
    selectedBadgeColor: "bg-amber-400 text-white",
  },
  {
    id: "fal-ai/veo3.1/reference-to-video",
    label: "Veo 3.1 Ref",
    subtitle: "Reference to Video",
    description:
      "Best quality. Up to 3 reference images, 1080p, with generated audio.",
    icon: Sparkles,
    badge: "Best Quality",
    imageMode: "multi" as const,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    selectedColor: "bg-gray-900 text-white border-gray-900",
    badgeColor: "bg-gray-200 text-gray-700",
    selectedBadgeColor: "bg-gray-600 text-white",
  },
];

export default function ModelPicker({
  selected,
  onSelect,
  hasImage,
}: ModelPickerProps) {
  return (
    <div className="space-y-3">
      {models.map((model) => {
        const Icon = model.icon;
        const isSelected = selected === model.id;
        const needsImage =
          model.imageMode !== "none" && !hasImage;

        return (
          <button
            key={model.id}
            onClick={() => onSelect(model.id)}
            disabled={needsImage}
            className={`w-full p-5 rounded-xl border-2 transition-all text-left flex items-start gap-4 ${
              isSelected
                ? model.selectedColor
                : needsImage
                  ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                  : model.color
            } ${!needsImage && !isSelected ? "hover:scale-[1.02]" : ""}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              <Icon className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-base">{model.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    isSelected ? model.selectedBadgeColor : model.badgeColor
                  }`}
                >
                  {model.badge}
                </span>
              </div>
              <p
                className={`text-sm ${
                  isSelected
                    ? "text-white/80"
                    : needsImage
                      ? "text-gray-400"
                      : "opacity-70"
                }`}
              >
                {model.description}
              </p>
              {needsImage && (
                <p className="text-xs mt-1 flex items-center gap-1 text-gray-400">
                  <ImageIcon className="h-3 w-3" />
                  Requires an uploaded avatar image
                </p>
              )}
            </div>
            {isSelected && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
