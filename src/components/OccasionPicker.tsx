"use client";

import { Cake, Trophy, Heart, MessageSquare } from "lucide-react";

interface OccasionPickerProps {
  selected: string | null;
  onSelect: (occasion: string) => void;
}

const occasions = [
  {
    id: "birthday",
    label: "Birthday",
    icon: Cake,
    color: "bg-pink-100 text-pink-600 border-pink-200",
    selectedColor: "bg-pink-500 text-white border-pink-500",
  },
  {
    id: "congratulations",
    label: "Congratulations",
    icon: Trophy,
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
    selectedColor: "bg-yellow-500 text-white border-yellow-500",
  },
  {
    id: "thankyou",
    label: "Thank You",
    icon: Heart,
    color: "bg-red-100 text-red-600 border-red-200",
    selectedColor: "bg-red-500 text-white border-red-500",
  },
  {
    id: "custom",
    label: "Custom",
    icon: MessageSquare,
    color: "bg-violet-100 text-violet-600 border-violet-200",
    selectedColor: "bg-violet-500 text-white border-violet-500",
  },
];

export default function OccasionPicker({
  selected,
  onSelect,
}: OccasionPickerProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {occasions.map((occasion) => {
        const Icon = occasion.icon;
        const isSelected = selected === occasion.id;

        return (
          <button
            key={occasion.id}
            onClick={() => onSelect(occasion.id)}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
              isSelected ? occasion.selectedColor : occasion.color
            } hover:scale-105`}
          >
            <Icon className="h-8 w-8" />
            <span className="font-medium">{occasion.label}</span>
          </button>
        );
      })}
    </div>
  );
}
