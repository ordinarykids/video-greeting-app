import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, PRICE_AMOUNT, PRICE_CURRENCY } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { videoId } = body;

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PRICE_CURRENCY,
            product_data: {
              name: "Video Greeting Generation",
              description: "AI-generated personalized video greeting",
            },
            unit_amount: PRICE_AMOUNT,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXTAUTH_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/create`,
      customer_email: session.user.email,
      metadata: {
        userId: session.user.id,
        videoId: videoId || "",
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        stripeSessionId: checkoutSession.id,
        amount: PRICE_AMOUNT,
        status: "PENDING",
        videoId: videoId || null,
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
