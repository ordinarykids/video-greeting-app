"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ScenePicker from "@/components/ScenePicker";
import CharacterPicker from "@/components/CharacterPicker";
import MessageEditor from "@/components/MessageEditor";
import PaymentButton from "@/components/PaymentButton";
import { getScenePreset, getCharacterPreset } from "@/lib/presets";

type Step = 1 | 2 | 3 | 4;

interface VideoData {
  sceneTag: string | null;
  sceneImageUrl: string | null;
  characterTag: string | null;
  avatarUrl: string | null;
  message: string;
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoData>({
    sceneTag: null,
    sceneImageUrl: null,
    characterTag: null,
    avatarUrl: null,
    message: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  const canProceed = () => {
    switch (step) {
      case 1:
        return videoData.sceneTag !== null && videoData.sceneImageUrl !== null;
      case 2:
        return videoData.characterTag !== null && videoData.avatarUrl !== null;
      case 3:
        return videoData.message.length > 0 && videoData.message.length <= 500;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step === 3 && !videoId) {
      // Create video record before proceeding to review/payment
      setIsCreating(true);
      try {
        const response = await fetch("/api/videos/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneTag: videoData.sceneTag,
            sceneImageUrl: videoData.sceneImageUrl,
            characterTag: videoData.characterTag,
            avatarUrl: videoData.avatarUrl,
            message: videoData.message,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create video");
        }

        const { videoId: newVideoId } = await response.json();
        setVideoId(newVideoId);
        setStep(4);
      } catch (error) {
        console.error("Error creating video:", error);
        alert("Failed to save video data. Please try again.");
      } finally {
        setIsCreating(false);
      }
    } else if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const getOccasionLabel = () => {
    if (!videoData.sceneTag) return "Custom";
    const preset = getScenePreset(videoData.sceneTag);
    return preset?.label || videoData.sceneTag;
  };

  const getCharacterLabel = () => {
    if (!videoData.characterTag) return "Custom";
    if (videoData.characterTag === "custom-upload") return "Your Upload";
    const preset = getCharacterPreset(videoData.characterTag);
    return preset?.label || videoData.characterTag;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
      </div>
    );
  }

  const userCredits = session?.user?.credits ?? 0;

  const steps = [
    { number: 1, label: "Scene" },
    { number: 2, label: "Character" },
    { number: 3, label: "Message" },
    { number: 4, label: userCredits > 0 ? "Generate" : "Pay & Generate" },
  ];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                    step >= s.number
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? <Check className="h-5 w-5" /> : s.number}
                </div>
                <span
                  className={`ml-2 hidden sm:block ${
                    step >= s.number ? "text-gray-900 font-medium" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {index < steps.length - 1 && (
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
          {/* Step 1: Scene */}
          {step === 1 && (
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

          {/* Step 2: Character */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose a Character
              </h2>
              <p className="text-gray-600 mb-6">
                Pick a character for your video or upload your own photo.
              </p>
              <CharacterPicker
                selectedTag={videoData.characterTag}
                selectedImageUrl={videoData.avatarUrl}
                onSelect={(tag, imageUrl) =>
                  setVideoData({
                    ...videoData,
                    characterTag: tag,
                    avatarUrl: imageUrl,
                  })
                }
              />
            </div>
          )}

          {/* Step 3: Message */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Write the Message
              </h2>
              <p className="text-gray-600 mb-6">
                Write what the character will say in the video (max 500
                characters).
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
            </div>
          )}

          {/* Step 4: Review & Pay / Generate */}
          {step === 4 && (
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
                {/* Scene preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-24 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {videoData.sceneImageUrl && (
                      <img
                        src={videoData.sceneImageUrl}
                        alt="Scene"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Scene</span>
                    <p className="font-medium text-gray-900">
                      {getOccasionLabel()}
                    </p>
                  </div>
                </div>

                {/* Character preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="h-16 w-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
                    {videoData.avatarUrl && (
                      <img
                        src={videoData.avatarUrl}
                        alt="Character"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Character</span>
                    <p className="font-medium text-gray-900">
                      {getCharacterLabel()}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500 block mb-2">
                    Message
                  </span>
                  <p className="text-gray-900">
                    &quot;{videoData.message}&quot;
                  </p>
                </div>

                {/* Cost */}
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
          {step < 4 && (
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
                {step === 3 ? "Review" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
            </div>
          )}
        </Card>

        {/* Credits info */}
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
