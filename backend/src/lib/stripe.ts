import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const PLANS: Record<string, { priceId: string; name: string }> = {
  basic: { priceId: process.env.STRIPE_PRICE_BASIC ?? '', name: 'Basic' },
  pro:   { priceId: process.env.STRIPE_PRICE_PRO   ?? '', name: 'Pro'   },
  elite: { priceId: process.env.STRIPE_PRICE_ELITE ?? '', name: 'Elite' },
}
