// Cakto checkout links — criados no painel Cakto e colados no .env
// O clinicId é passado via parâmetro UTM no link de checkout
export const PLANS: Record<string, { url: string; name: string }> = {
  basic: { url: process.env.CAKTO_URL_BASIC ?? '', name: 'Basic' },
  pro:   { url: process.env.CAKTO_URL_PRO   ?? '', name: 'Pro'   },
  elite: { url: process.env.CAKTO_URL_ELITE ?? '', name: 'Elite' },
}

// Verifica token secreto enviado pelo Cakto no header ou body
export function verifyCaktoToken(token: string | undefined): boolean {
  const secret = process.env.CAKTO_WEBHOOK_SECRET
  if (!secret) return true  // sem secret configurado, aceita tudo (útil em dev)
  return token === secret
}

// Tipos de eventos que o Cakto envia via webhook
// Verificar nomes exatos em: Cakto Dashboard → Integrações → Webhooks → Documentação
export const CAKTO_EVENTS = {
  PURCHASE_APPROVED: 'compra_aprovada',
  RENEWAL_APPROVED:  'renovacao_aprovada',
  SUBSCRIPTION_CANCELLED: 'assinatura_cancelada',
  PAYMENT_FAILED: 'pagamento_recusado',
} as const
