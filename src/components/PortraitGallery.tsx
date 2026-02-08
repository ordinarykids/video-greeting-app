"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import Button from "./ui/Button";

interface Portrait {
  id: string;
  label: string;
  description: string;
  imageUrl: string | null;
  loading: boolean;
}

const INITIAL_PORTRAITS: Portrait[] = [
  {
    id: "birthday-celebration",
    label: "Birthday",
    description: "Festive birthday celebration portrait",
    imageUrl: null,
    loading: false,
  },
  {
    id: "congratulations-graduate",
    label: "Graduate",
    description: "Proud graduation moment",
    imageUrl: null,
    loading: false,
  },
  {
    id: "thankyou-flowers",
    label: "Thank You",
    description: "Grateful with a bouquet of flowers",
    imageUrl: null,
    loading: false,
  },
  {
    id: "party-host",
    label: "Celebration",
    description: "Elegant party toast",
    imageUrl: null,
    loading: false,
  },
  {
    id: "surprise-reaction",
    label: "Surprise",
    description: "Genuine surprise and delight",
    imageUrl: null,
    loading: false,
  },
  {
    id: "warm-greeting",
    label: "Hello",
    description: "Warm and friendly greeting",
    imageUrl: null,
    loading: false,
  },
];

export default function PortraitGallery() {
  const [portraits, setPortraits] = useState<Portrait[]>(INITIAL_PORTRAITS);
  const [generatingAll, setGeneratingAll] = useState(false);

  const generatePortrait = async (portraitId: string) => {
    setPortraits((prev) =>
      prev.map((p) =>
        p.id === portraitId ? { ...p, loading: true } : p,
      ),
    );

    try {
      const response = await fetch("/api/portraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: portraitId }),
      });

      if (!response.ok) throw new Error("Failed to generate");

      const data = await response.json();

      setPortraits((prev) =>
        prev.map((p) =>
          p.id === portraitId
            ? { ...p, imageUrl: data.imageUrl, loading: false }
            : p,
        ),
      );
    } catch {
      setPortraits((prev) =>
        prev.map((p) =>
          p.id === portraitId ? { ...p, loading: false } : p,
        ),
      );
    }
  };

  const generateAll = async () => {
    setGeneratingAll(true);
    const promises = portraits
      .filter((p) => !p.imageUrl)
      .map((p) => generatePortrait(p.id));
    await Promise.allSettled(promises);
    setGeneratingAll(false);
  };

  const hasAnyImages = portraits.some((p) => p.imageUrl);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            AI-Generated Portraits
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto mb-6">
            See what our AI can create. Each portrait is generated in real-time
            using FLUX 2 Pro, the latest image generation model.
          </p>
          {!hasAnyImages && (
            <Button onClick={generateAll} loading={generatingAll}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate All Portraits
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {portraits.map((portrait) => (
            <div
              key={portrait.id}
              className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
            >
              <div className="aspect-[3/4] bg-gray-100 relative">
                {portrait.imageUrl ? (
                  <img
                    src={portrait.imageUrl}
                    alt={portrait.label}
                    className="w-full h-full object-cover"
                  />
                ) : portrait.loading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Generating...</span>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Sparkles className="h-8 w-8" />
                    <button
                      onClick={() => generatePortrait(portrait.id)}
                      className="text-sm text-gray-900 underline hover:text-black"
                    >
                      Generate
                    </button>
                  </div>
                )}

                {portrait.imageUrl && (
                  <button
                    onClick={() => generatePortrait(portrait.id)}
                    className="absolute top-3 right-3 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <RefreshCw className={`h-4 w-4 text-gray-700 ${portrait.loading ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{portrait.label}</h3>
                <p className="text-sm text-gray-500">{portrait.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by FLUX 2 Pro on fal.ai
        </p>
      </div>
    </section>
  );
}
