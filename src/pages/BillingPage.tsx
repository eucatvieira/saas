import { useState, useEffect } from 'react'
import { Check, Zap, Star, Crown, AlertCircle } from 'lucide-react'
import { useClinic } from '../hooks/useClinic'

const CAKTO_URLS: Record<string, string> = {
  basic: import.meta.env.VITE_CAKTO_URL_BASIC ?? '',
  pro:   import.meta.env.VITE_CAKTO_URL_PRO   ?? '',
  elite: import.meta.env.VITE_CAKTO_URL_ELITE ?? '',
}

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'R$ 129',
    period: '/mês',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    features: [
      'Agendamento automático via WhatsApp',
      'Lembretes de confirmação 24h antes',
      'Painel de gestão',
      '1 profissional',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 229',
    period: '/mês',
    icon: Star,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    highlight: true,
    features: [
      'Tudo do Basic',
      'Reativação automática de inativos',
      'FAQ personalizado',
      'Múltiplos profissionais',
      'Relatórios de desempenho',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 'R$ 399',
    period: '/mês',
    icon: Crown,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    features: [
      'Tudo do Pro',
      'Integração Google Calendar',
      'Múltiplas unidades',
      'Suporte prioritário',
      'Onboarding personalizado',
    ],
  },
]

export function BillingPage() {
  const { clinic, refetch } = useClinic()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      setMessage({ type: 'success', text: 'Assinatura ativada com sucesso! Bem-vindo(a)!' })
      refetch()
      window.history.replaceState({}, '', '/planos')
    }
  }, [])

  function subscribe(planId: string) {
    if (!clinic) return
    const baseUrl = CAKTO_URLS[planId]
    if (!baseUrl) {
      setMessage({ type: 'error', text: 'Link de checkout não configurado. Entre em contato com o suporte.' })
      return
    }
    // Passa o clinicId como utm_content — o Cakto devolve esse valor no webhook
    // para que o backend saiba qual clínica ativou o plano
    const url = new URL(baseUrl)
    url.searchParams.set('utm_content', clinic.id)
    window.location.href = url.toString()
  }

  const currentPlan = clinic?.plan ?? 'trial'
  const isActive = clinic?.plan_status === 'active'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Plano atual:{' '}
          <span className="font-semibold capitalize text-violet-700">{currentPlan}</span>
          {clinic?.plan_status === 'trial'    && ' · Trial de 14 dias'}
          {clinic?.plan_status === 'active'   && ' · Ativo'}
          {clinic?.plan_status === 'inactive' && ' · Inativo'}
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {PLANS.map(plan => {
          const Icon = plan.icon
          const isCurrent = currentPlan === plan.id && isActive
          return (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
              plan.highlight ? 'border-violet-400 shadow-lg shadow-violet-100' : 'border-gray-200'
            }`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-violet-600 text-white text-xs font-bold rounded-full">
                  MAIS POPULAR
                </div>
              )}

              <div className={`w-10 h-10 rounded-xl ${plan.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${plan.color}`} />
              </div>

              <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
              <div className="flex items-baseline gap-1 mt-1 mb-5">
                <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="py-2 text-center text-sm font-medium text-violet-700 bg-violet-50 rounded-lg border border-violet-200">
                  Plano atual ✓
                </div>
              ) : (
                <button
                  onClick={() => subscribe(plan.id)}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-700 text-white'
                  }`}
                >
                  Assinar {plan.name}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {isActive && currentPlan !== 'trial' && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-900">Gerenciar assinatura</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Para cancelar ou alterar seu plano, entre em contato via WhatsApp ou e-mail.
          </p>
        </div>
      )}
    </div>
  )
}
