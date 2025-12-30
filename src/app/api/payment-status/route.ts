import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id" },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: sessionId },
      select: {
        status: true,
        videoId: true,
        userId: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Ensure user owns this payment
    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If webhook hasn't updated yet, verify directly with Stripe so the UI doesn't spin forever.
    // This is safe because we keep it idempotent (only transition to COMPLETED once).
    if (payment.status !== "COMPLETED") {
      try {
        const stripeSession =
          await stripe.checkout.sessions.retrieve(sessionId);
        const stripePaymentStatus = stripeSession.payment_status as
          | Stripe.Checkout.Session.PaymentStatus
          | null
          | undefined;
        const stripeStatus = stripeSession.status as
          | Stripe.Checkout.Session.Status
          | null
          | undefined;

        const isPaid =
          stripePaymentStatus === "paid" ||
          stripePaymentStatus === "no_payment_required" ||
          stripeStatus === "complete";

        if (isPaid) {
          // Atomic transition to prevent double-credit if webhook + polling race.
          const updated = await prisma.payment.updateMany({
            where: {
              stripeSessionId: sessionId,
              NOT: { status: "COMPLETED" },
            },
            data: {
              status: "COMPLETED",
              stripePaymentId: (stripeSession.payment_intent as string) || null,
            },
          });

          if (updated.count === 1) {
            await prisma.user.update({
              where: { id: payment.userId },
              data: { credits: { increment: 1 } },
            });
          }

          return NextResponse.json({
            status: "COMPLETED",
            videoId: payment.videoId,
          });
        }
      } catch (error) {
        // Stripe might be unreachable/misconfigured; fall back to DB status.
        console.warn("Stripe verification failed in payment-status:", error);
      }
    }

    return NextResponse.json({
      status: payment.status,
      videoId: payment.videoId,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 },
    );
  }
}
