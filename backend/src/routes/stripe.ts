import { Router, type Request, type Response } from 'express'
import express from 'express'
import { stripe, PLANS } from '../lib/stripe'
import { supabase } from '../lib/supabase'

const router = Router()
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'

// ─── Create checkout session ──────────────────────────────────────────────────
router.post('/checkout', async (req: Request, res: Response) => {
  const { clinicId, plan } = req.body as { clinicId: string; plan: string }

  const planInfo = PLANS[plan]
  if (!planInfo?.priceId) {
    res.status(400).json({ error: 'Invalid plan' })
    return
  }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('name, phone, stripe_customer_id')
    .eq('id', clinicId)
    .single()

  if (!clinic) { res.status(404).json({ error: 'Clinic not found' }); return }

  let customerId = (clinic as any).stripe_customer_id as string | null

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: (clinic as any).name,
      phone: (clinic as any).phone,
      metadata: { clinicId },
    })
    customerId = customer.id
    await supabase.from('clinics').update({ stripe_customer_id: customerId }).eq('id', clinicId)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planInfo.priceId, quantity: 1 }],
    success_url: `${FRONTEND}/configuracoes?tab=billing&success=1`,
    cancel_url:  `${FRONTEND}/configuracoes?tab=billing&cancelled=1`,
    metadata: { clinicId, plan },
    subscription_data: { metadata: { clinicId, plan } },
    locale: 'pt-BR',
  })

  res.json({ url: session.url })
})

// ─── Cancel subscription ──────────────────────────────────────────────────────
router.post('/cancel', async (req: Request, res: Response) => {
  const { clinicId } = req.body as { clinicId: string }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('stripe_subscription_id')
    .eq('id', clinicId)
    .single()

  if (!(clinic as any)?.stripe_subscription_id) {
    res.status(400).json({ error: 'No active subscription' })
    return
  }

  await stripe.subscriptions.cancel((clinic as any).stripe_subscription_id)
  res.json({ ok: true })
})

// ─── Stripe webhook ───────────────────────────────────────────────────────────
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

    let event: any
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret)
    } catch (e: any) {
      console.error('[stripe webhook] signature failed:', e?.message)
      res.status(400).send('Webhook signature verification failed')
      return
    }

    await handleStripeEvent(event).catch(e =>
      console.error('[stripe event]', e?.message)
    )
    res.json({ received: true })
  }
)

async function handleStripeEvent(event: any): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const clinicId: string = session.metadata?.clinicId
      const plan: string = session.metadata?.plan
      const subId: string = session.subscription
      if (!clinicId || !plan) break
      await supabase.from('clinics').update({
        plan, plan_status: 'active', stripe_subscription_id: subId,
      }).eq('id', clinicId)
      console.log(`[stripe] clinic ${clinicId} subscribed to ${plan}`)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      const { data: clinic } = await supabase
        .from('clinics').select('id').eq('stripe_subscription_id', invoice.subscription).single()
      if (clinic) await supabase.from('clinics').update({ plan_status: 'active' }).eq('id', (clinic as any).id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const { data: clinic } = await supabase
        .from('clinics').select('id').eq('stripe_subscription_id', invoice.subscription).single()
      if (clinic) {
        await supabase.from('clinics').update({ plan_status: 'inactive' }).eq('id', (clinic as any).id)
        console.warn(`[stripe] payment failed for clinic ${(clinic as any).id}`)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const { data: clinic } = await supabase
        .from('clinics').select('id').eq('stripe_subscription_id', sub.id).single()
      if (clinic) {
        await supabase.from('clinics').update({
          plan: 'trial', plan_status: 'inactive', stripe_subscription_id: null,
        }).eq('id', (clinic as any).id)
        console.log(`[stripe] subscription cancelled for clinic ${(clinic as any).id}`)
      }
      break
    }
  }
}

export default router
