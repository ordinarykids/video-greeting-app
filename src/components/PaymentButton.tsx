"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import Button from "./ui/Button";

interface PaymentButtonProps {
  videoId?: string;
  disabled?: boolean;
}

export default function PaymentButton({
  videoId,
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

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
