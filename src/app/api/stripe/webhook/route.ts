import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const existing = await prisma.payment.findUnique({
        where: { stripeSessionId: session.id },
        select: { id: true, status: true, userId: true },
      });

      if (!existing) {
        console.warn(`Webhook received for unknown session ${session.id}`);
        return NextResponse.json({ received: true });
      }

      // Atomic idempotency: only transition once, even under concurrent polling/webhooks.
      const updated = await prisma.payment.updateMany({
        where: {
          stripeSessionId: session.id,
          NOT: { status: "COMPLETED" },
        },
        data: {
          status: "COMPLETED",
          stripePaymentId: session.payment_intent as string,
        },
      });

      if (updated.count === 1) {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { credits: { increment: 1 } },
        });
      }

      console.log(`Payment completed for user ${existing.userId}`);
    } catch (error) {
      console.error("Error processing payment:", error);
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
