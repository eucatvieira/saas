import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY

export const stripeEnabled = !!key

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stripe: any = key ? new Stripe(key) : null

export const PLANS: Record<string, { priceId: string; name: string }> = {
  basic: { priceId: process.env.STRIPE_PRICE_BASIC ?? '', name: 'Basic' },
  pro:   { priceId: process.env.STRIPE_PRICE_PRO   ?? '', name: 'Pro'   },
  elite: { priceId: process.env.STRIPE_PRICE_ELITE ?? '', name: 'Elite' },
}
