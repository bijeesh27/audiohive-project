import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
if (!process.env.STRIPE_SECRET_KEY) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
}
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder");

