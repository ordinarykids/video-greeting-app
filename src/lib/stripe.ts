import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

export const PRICE_AMOUNT = 500; // $5 in cents
export const PRICE_CURRENCY = "usd";
