import { Router, type Request, type Response } from 'express'
import { verifyCaktoToken, CAKTO_EVENTS } from '../lib/cakto'
import { supabase } from '../lib/supabase'

const router = Router()

// POST /cakto/webhook
// Cakto envia eventos de pagamento para esta rota.
// Configure no painel Cakto: Integrações → Webhooks → URL: https://SEU-BACKEND/cakto/webhook
router.post('/webhook', async (req: Request, res: Response) => {
  // Verificação do token — Cakto envia no header 'x-cakto-token' ou no body como 'token'
  const token = (req.headers['x-cakto-token'] ?? req.body?.token) as string | undefined
  if (!verifyCaktoToken(token)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Responde imediatamente para evitar retentativa do Cakto
  res.json({ ok: true })

  try {
    await handleCaktoEvent(req.body)
  } catch (e: any) {
    console.error('[cakto webhook] error:', e?.message)
  }
})

// ─── Handler de eventos ────────────────────────────────────────────────────────
// ATENÇÃO: valide o payload real no Cakto Dashboard → Integrações → Webhooks → Testar
// e ajuste os campos abaixo conforme o que chegar (ex: event.tipo vs event.event)

async function handleCaktoEvent(body: any): Promise<void> {
  // O Cakto pode chamar o campo de evento de 'tipo' ou 'event' — ajuste se necessário
  const eventType: string = body.tipo ?? body.event ?? ''

  // O clinicId é enviado como utm_content no link de checkout:
  // https://pay.cakto.com.br/SEU_LINK?utm_content=CLINIC_ID
  // O Cakto devolve esse valor no webhook dentro de 'utms' ou 'tracking_parameters'
  const clinicId: string =
    body.utms?.utm_content ??
    body.tracking_parameters?.utm_content ??
    body.custom_field ??
    ''

  // ID da assinatura no Cakto — pode estar em 'assinatura.codigo' ou 'subscription_id'
  const subscriptionId: string =
    body.assinatura?.codigo ??
    body.subscription_id ??
    body.codigo_compra ??
    ''

  // Nome do produto — usado para identificar qual plano foi contratado
  const productName: string = (
    body.produto?.nome ??
    body.product?.name ??
    ''
  ).toLowerCase()

  // Mapeia nome do produto para o plano do sistema
  let plan = ''
  if (productName.includes('basic'))       plan = 'basic'
  else if (productName.includes('pro'))    plan = 'pro'
  else if (productName.includes('elite'))  plan = 'elite'

  console.log(`[cakto] event=${eventType} clinicId=${clinicId} plan=${plan}`)

  switch (eventType) {
    case CAKTO_EVENTS.PURCHASE_APPROVED:
    case CAKTO_EVENTS.RENEWAL_APPROVED: {
      if (!clinicId || !plan) {
        console.warn('[cakto] purchase_approved sem clinicId ou plan — verifique o payload')
        break
      }
      await supabase.from('clinics').update({
        plan,
        plan_status: 'active',
        payment_subscription_id: subscriptionId || null,
      }).eq('id', clinicId)
      console.log(`[cakto] clinic ${clinicId} → plano ${plan} ativado`)
      break
    }

    case CAKTO_EVENTS.SUBSCRIPTION_CANCELLED: {
      if (!clinicId) break
      await supabase.from('clinics').update({
        plan: 'trial',
        plan_status: 'inactive',
        payment_subscription_id: null,
      }).eq('id', clinicId)
      console.log(`[cakto] clinic ${clinicId} → assinatura cancelada`)
      break
    }

    case CAKTO_EVENTS.PAYMENT_FAILED: {
      if (!clinicId) break
      await supabase.from('clinics').update({ plan_status: 'inactive' }).eq('id', clinicId)
      console.warn(`[cakto] clinic ${clinicId} → pagamento recusado`)
      break
    }

    default:
      console.log(`[cakto] evento não tratado: ${eventType}`)
  }
}

export default router
