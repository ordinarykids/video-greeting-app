"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Sparkles } from "lucide-react";
import Button from "./ui/Button";

interface PaymentButtonProps {
  videoId?: string;
  disabled?: boolean;
  credits?: number;
}

export default function PaymentButton({
  videoId,
  disabled = false,
  credits = 0,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const hasCredits = credits > 0;

  const handleUseCredit = async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "Failed to start generation");
      }

      // Redirect to success page with video_id instead of session_id
      router.push(`/success?video_id=${videoId}`);
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (hasCredits) {
    return (
      <Button
        size="lg"
        onClick={handleUseCredit}
        loading={loading}
        disabled={disabled}
        className="w-full"
      >
        <Sparkles className="h-5 w-5 mr-2" />
        Use 1 Credit to Generate Video
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={handlePayment}
      loading={loading}
      disabled={disabled}
      className="w-full"
    >
      <CreditCard className="h-5 w-5 mr-2" />
      Pay $5 to Generate Video
    </Button>
  );
}
