"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import OccasionPicker from "@/components/OccasionPicker";
import AvatarSelector from "@/components/AvatarSelector";
import MessageEditor from "@/components/MessageEditor";
import PaymentButton from "@/components/PaymentButton";

type Step = 1 | 2 | 3 | 4;

interface VideoData {
  occasion: string | null;
  avatarUrl: string | null;
  message: string;
}

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoData>({
    occasion: null,
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
        return videoData.occasion !== null;
      case 2:
        return videoData.avatarUrl !== null;
      case 3:
        return videoData.message.length > 0 && videoData.message.length <= 500;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (step === 3 && !videoId) {
      // Create video record before proceeding to payment
      setIsCreating(true);
      try {
        const response = await fetch("/api/videos/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(videoData),
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const steps = [
    { number: 1, label: "Occasion" },
    { number: 2, label: "Avatar" },
    { number: 3, label: "Message" },
    { number: 4, label: "Pay & Generate" },
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
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? <Check className="h-5 w-5" /> : s.number}
                </div>
                <span
                  className={`ml-2 hidden sm:block ${
                    step >= s.number ? "text-violet-600 font-medium" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                      step > s.number ? "bg-violet-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card variant="elevated" className="p-8">
          {/* Step 1: Occasion */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What&apos;s the occasion?
              </h2>
              <p className="text-gray-600 mb-6">
                Choose the type of greeting you want to create.
              </p>
              <OccasionPicker
                selected={videoData.occasion}
                onSelect={(occasion) =>
                  setVideoData({ ...videoData, occasion })
                }
              />
            </div>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose an avatar
              </h2>
              <p className="text-gray-600 mb-6">
                Select a preset avatar or upload your own photo.
              </p>
              <AvatarSelector
                selected={videoData.avatarUrl}
                onSelect={(avatarUrl) =>
                  setVideoData({ ...videoData, avatarUrl })
                }
              />
            </div>
          )}

          {/* Step 3: Message */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Write your message
              </h2>
              <p className="text-gray-600 mb-6">
                This will be spoken in your video greeting (max 500 characters).
              </p>
              <MessageEditor
                message={videoData.message}
                onChange={(message) =>
                  setVideoData({ ...videoData, message })
                }
                occasion={videoData.occasion}
              />
            </div>
          )}

          {/* Step 4: Preview & Pay */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Review & Pay
              </h2>
              <p className="text-gray-600 mb-6">
                Confirm your video details and complete payment.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Occasion</span>
                  <span className="font-medium capitalize">{videoData.occasion}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Avatar</span>
                  <div className="h-10 w-10 rounded-lg bg-gray-200 overflow-hidden">
                    {videoData.avatarUrl?.includes("/avatars/") ? (
                      <div className="h-full w-full flex items-center justify-center text-2xl">
                        {videoData.avatarUrl.includes("male1") && "👨"}
                        {videoData.avatarUrl.includes("female1") && "👩"}
                        {videoData.avatarUrl.includes("cartoon") && "🎭"}
                        {videoData.avatarUrl.includes("robot") && "🤖"}
                        {videoData.avatarUrl.includes("fantasy") && "🧙"}
                        {videoData.avatarUrl.includes("presenter") && "📺"}
                      </div>
                    ) : (
                      <img
                        src={videoData.avatarUrl || ""}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 block mb-2">Message</span>
                  <p className="text-gray-900">{videoData.message}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-violet-50 rounded-lg">
                  <span className="text-violet-600 font-medium">Total</span>
                  <span className="text-2xl font-bold text-violet-600">$5.00</span>
                </div>
              </div>

              <PaymentButton videoId={videoId || undefined} />
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
            You have {session.user.credits} credit{session.user.credits !== 1 ? "s" : ""} available
          </p>
        )}
      </div>
    </div>
  );
}
