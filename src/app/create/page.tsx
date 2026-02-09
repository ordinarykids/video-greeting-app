"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Camera,
  Zap,
  Film,
  Clapperboard,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ScenePicker from "@/components/ScenePicker";
import MessageEditor from "@/components/MessageEditor";
import PaymentButton from "@/components/PaymentButton";
import ShotEditor from "@/components/ShotEditor";
import { getScenePreset } from "@/lib/presets";
import { splitIntoShots, type Shot } from "@/lib/shots";

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type ModelChoice = "quick" | "cinematic";

interface VideoData {
  avatarUrl: string | null;
  modelChoice: ModelChoice | null;
  sceneTag: string | null;
  sceneImageUrl: string | null;
  message: string;
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoData>({
    avatarUrl: null,
    modelChoice: null,
    sceneTag: null,
    sceneImageUrl: null,
    message: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Recompute shots when message changes
  useEffect(() => {
    if (videoData.message) {
      setShots(splitIntoShots(videoData.message));
    } else {
      setShots([]);
    }
  }, [videoData.message]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return videoData.avatarUrl !== null;
      case 2:
        return videoData.modelChoice !== null;
      case 3:
        if (videoData.modelChoice === "quick") return true;
        return videoData.sceneTag !== null && videoData.sceneImageUrl !== null;
      case 4:
        return videoData.message.length > 0 && videoData.message.length <= 500;
      case 5:
        return shots.length > 0 && shots.every((s) => s.text.trim().length > 0);
      default:
        return true;
    }
  };

  const handleNext = async () => {
    // Skip scene step for quick mode
    if (step === 2 && videoData.modelChoice === "quick") {
      setStep(4 as Step);
      return;
    }

    // After shots review (step 5), create the video record before going to pay
    if (step === 5 && !videoId) {
      setIsCreating(true);
      try {
        const occasion = videoData.sceneTag
          ? getScenePreset(videoData.sceneTag)?.occasion || "custom"
          : "custom";

        const response = await fetch("/api/videos/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            avatarUrl: videoData.avatarUrl,
            modelChoice: videoData.modelChoice,
            sceneTag: videoData.sceneTag,
            sceneImageUrl: videoData.sceneImageUrl,
            message: videoData.message,
            occasion,
            shots: shots,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to create video");
        }

        setVideoId(data.videoId);
        setStep(6);
      } catch (error) {
        console.error("Error creating video:", error);
        const msg =
          error instanceof Error ? error.message : "Unknown error";
        alert(`Failed to save video data: ${msg}`);
      } finally {
        setIsCreating(false);
      }
    } else if (step < 6) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    // From shots step, go back to message
    if (step === 5) {
      setStep(4);
      return;
    }
    // From message step in quick mode, go back to mode
    if (step === 4 && videoData.modelChoice === "quick") {
      setStep(2);
      return;
    }
    // From review step, go back to shots
    if (step === 6) {
      setStep(5);
      return;
    }
    if (step > 1) {
      setStep((step - 1) as Step);
    }
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

      const data = await res.json();
      setVideoData({ ...videoData, avatarUrl: data.avatarUrl });
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  const userCredits = session?.user?.credits ?? 0;

  // Total estimated video duration
  const totalDuration = shots.reduce((sum, s) => sum + s.estimatedSeconds, 0);

  const stepLabels = (() => {
    if (videoData.modelChoice === "quick") {
      return [
        { number: 1, label: "Photo" },
        { number: 2, label: "Mode" },
        { number: 4, label: "Message" },
        { number: 5, label: "Shots" },
        { number: 6, label: userCredits > 0 ? "Generate" : "Pay" },
      ];
    }
    return [
      { number: 1, label: "Photo" },
      { number: 2, label: "Mode" },
      { number: 3, label: "Scene" },
      { number: 4, label: "Message" },
      { number: 5, label: "Shots" },
      { number: 6, label: userCredits > 0 ? "Generate" : "Pay" },
    ];
  })();

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {stepLabels.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                    step >= s.number
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 hidden sm:block ${
                    step >= s.number
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {index < stepLabels.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-1 mx-2 rounded ${
                      step > s.number ? "bg-gray-900" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card variant="elevated" className="p-8">
          {/* Step 1: Upload Photo */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upload Your Photo
              </h2>
              <p className="text-gray-600 mb-6">
                Take a selfie or upload a photo. This will be the face in your
                video.
              </p>

              <div className="flex flex-col items-center gap-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`relative w-64 h-64 rounded-2xl overflow-hidden border-2 border-dashed transition-all ${
                    videoData.avatarUrl
                      ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {videoData.avatarUrl ? (
                    <>
                      <img
                        src={videoData.avatarUrl}
                        alt="Your photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 hover:opacity-100 font-medium text-sm">
                          Change Photo
                        </span>
                      </div>
                    </>
                  ) : isUploading ? (
                    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">
                        Uploading...
                      </span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-3 hover:bg-gray-100 transition-colors">
                      <Camera className="h-12 w-12 text-gray-300" />
                      <span className="text-sm font-medium text-gray-500">
                        Tap to Upload
                      </span>
                      <span className="text-xs text-gray-400">
                        JPG, PNG, or WebP
                      </span>
                    </div>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleUpload}
                  className="hidden"
                  capture="user"
                />

                {videoData.avatarUrl && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Photo uploaded
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Pick Mode */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Video Style
              </h2>
              <p className="text-gray-600 mb-6">
                Pick how you want your video to look.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setVideoData({
                      ...videoData,
                      modelChoice: "quick",
                      sceneTag: null,
                      sceneImageUrl: null,
                    })
                  }
                  className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                    videoData.modelChoice === "quick"
                      ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Quick</h3>
                      <span className="text-xs text-gray-500">
                        Veo 3.1 Fast
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Fast video from your photo with multi-shot support. Great
                    for quick turnaround.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      Multi-shot
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      Fast
                    </span>
                  </div>
                  {videoData.modelChoice === "quick" && (
                    <div className="absolute top-3 right-3 h-6 w-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setVideoData({ ...videoData, modelChoice: "cinematic" })
                  }
                  className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                    videoData.modelChoice === "cinematic"
                      ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2 bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
                      <Film className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Cinematic</h3>
                      <span className="text-xs text-gray-500">
                        Veo 3.1 Reference
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Multi-shot video with scene backgrounds, varied camera
                    angles, and HD audio. Best quality.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      1080p + Audio
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      Multi-shot
                    </span>
                  </div>
                  {videoData.modelChoice === "cinematic" && (
                    <div className="absolute top-3 right-3 h-6 w-6 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Scene (Cinematic only) */}
          {step === 3 && videoData.modelChoice === "cinematic" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose a Scene
              </h2>
              <p className="text-gray-600 mb-6">
                Pick a background for your video. Click a card to generate the
                scene image with AI.
              </p>
              <ScenePicker
                selectedTag={videoData.sceneTag}
                selectedImageUrl={videoData.sceneImageUrl}
                onSelect={(tag, imageUrl) =>
                  setVideoData({
                    ...videoData,
                    sceneTag: tag,
                    sceneImageUrl: imageUrl,
                  })
                }
              />
            </div>
          )}

          {/* Step 4: Message */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Write the Script
              </h2>
              <p className="text-gray-600 mb-6">
                Write what you want to say in the video (max 500 characters).
                Your script will be broken into shots on the next step.
              </p>
              <MessageEditor
                message={videoData.message}
                onChange={(message) =>
                  setVideoData({ ...videoData, message })
                }
                occasion={
                  videoData.sceneTag
                    ? getScenePreset(videoData.sceneTag)?.occasion || "custom"
                    : "custom"
                }
              />

              {shots.length > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  <Clapperboard className="h-4 w-4" />
                  <span>
                    Will produce {shots.length} shot{shots.length !== 1 ? "s" : ""}
                    {" "}({totalDuration}s estimated)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Shot Editor */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Edit Shots
              </h2>
              <p className="text-gray-600 mb-6">
                Your script has been split into {shots.length} shot{shots.length !== 1 ? "s" : ""}, each
                targeting 6-8 seconds. Edit the text, change camera angles,
                reorder, add, or remove shots.
              </p>

              <ShotEditor shots={shots} onChange={setShots} />

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  All shots will be generated in parallel, then merged into a
                  single video.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Review & Pay / Generate */}
          {step === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {userCredits > 0 ? "Review & Generate" : "Review & Pay"}
              </h2>
              <p className="text-gray-600 mb-6">
                {userCredits > 0
                  ? "Confirm your video details and use a credit to generate."
                  : "Confirm your video details and complete payment."}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-14 w-14 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {videoData.avatarUrl && (
                      <img
                        src={videoData.avatarUrl}
                        alt="Your photo"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Photo</span>
                    <p className="font-medium text-gray-900">Your Upload</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Style</span>
                  <div className="flex items-center gap-2">
                    {videoData.modelChoice === "quick" ? (
                      <Zap className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Film className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="font-medium text-gray-900 capitalize">
                      {videoData.modelChoice}
                    </span>
                  </div>
                </div>

                {videoData.modelChoice === "cinematic" &&
                  videoData.sceneImageUrl && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="h-12 w-20 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                        <img
                          src={videoData.sceneImageUrl}
                          alt="Scene"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Scene</span>
                        <p className="font-medium text-gray-900">
                          {videoData.sceneTag
                            ? getScenePreset(videoData.sceneTag)?.label ||
                              videoData.sceneTag
                            : "Custom"}
                        </p>
                      </div>
                    </div>
                  )}

                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 block mb-2">
                    Script
                  </span>
                  <p className="text-gray-900">
                    &quot;{videoData.message}&quot;
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">Shots</span>
                  <div className="flex items-center gap-2">
                    <Clapperboard className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {shots.length} shot{shots.length !== 1 ? "s" : ""}
                      <span className="font-normal text-gray-500 ml-1">
                        (~{totalDuration}s)
                      </span>
                    </span>
                  </div>
                </div>

                {userCredits > 0 ? (
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Cost</span>
                    <span className="text-lg font-bold text-green-700">
                      1 Credit{" "}
                      <span className="text-sm font-normal text-green-600">
                        ({userCredits} available)
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                    <span className="text-gray-900 font-medium">Total</span>
                    <span className="text-2xl font-bold text-gray-900">
                      $5.00
                    </span>
                  </div>
                )}
              </div>

              <PaymentButton
                videoId={videoId || undefined}
                credits={userCredits}
              />
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 6 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                loading={isCreating}
              >
                {step === 5 ? "Confirm & Continue" : step === 4 ? "Review Shots" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shots
              </Button>
            </div>
          )}
        </Card>

        {session?.user && (
          <p className="text-center text-gray-500 mt-4">
            You have {session.user.credits} credit
            {session.user.credits !== 1 ? "s" : ""} available
          </p>
        )}
      </div>
    </div>
  );
}
