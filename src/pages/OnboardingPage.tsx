import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Building2, Clock, Scissors, Users, Smartphone, Check } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { StepClinic } from '../components/onboarding/StepClinic'
import { StepHours } from '../components/onboarding/StepHours'
import { StepServices } from '../components/onboarding/StepServices'
import { StepProfessionals } from '../components/onboarding/StepProfessionals'
import { StepWhatsApp } from '../components/onboarding/StepWhatsApp'

const STEPS = [
  { label: 'Clínica', icon: Building2 },
  { label: 'Horários', icon: Clock },
  { label: 'Serviços', icon: Scissors },
  { label: 'Profissionais', icon: Users },
  { label: 'WhatsApp', icon: Smartphone },
]

export interface OnboardingData {
  clinicId: string | null
  clinicName: string
  clinicPhone: string
  businessHours: BusinessHours
  services: ServiceDraft[]
  professionals: ProfessionalDraft[]
}

export interface BusinessHours {
  [day: string]: { open: string; close: string; enabled: boolean }
}

export interface ServiceDraft {
  name: string
  duration_minutes: number
  price: number
  description: string
}

export interface ProfessionalDraft {
  name: string
  specialties: string[]
}

const DEFAULT_HOURS: BusinessHours = {
  monday:    { open: '08:00', close: '18:00', enabled: true },
  tuesday:   { open: '08:00', close: '18:00', enabled: true },
  wednesday: { open: '08:00', close: '18:00', enabled: true },
  thursday:  { open: '08:00', close: '18:00', enabled: true },
  friday:    { open: '08:00', close: '18:00', enabled: true },
  saturday:  { open: '08:00', close: '13:00', enabled: false },
  sunday:    { open: '08:00', close: '12:00', enabled: false },
}

export function OnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [data, setData] = useState<OnboardingData>({
    clinicId: null,
    clinicName: '',
    clinicPhone: '',
    businessHours: DEFAULT_HOURS,
    services: [],
    professionals: [],
  })

  function update(partial: Partial<OnboardingData>) {
    setData(prev => ({ ...prev, ...partial }))
  }

  async function handleNext() {
    setError('')
    setSaving(true)
    try {
      if (step === 0) await saveClinic()
      else if (step === 1) await saveHours()
      else if (step === 2) await saveServices()
      else if (step === 3) await saveProfessionals()
      else if (step === 4) await finishOnboarding()
      if (step < STEPS.length - 1) setStep(s => s + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function saveClinic() {
    if (!data.clinicName.trim()) throw new Error('Informe o nome da clínica.')
    if (!data.clinicPhone.trim()) throw new Error('Informe o telefone da clínica.')

    if (data.clinicId) {
      const { error } = await supabase
        .from('clinics')
        .update({ name: data.clinicName, phone: data.clinicPhone })
        .eq('id', data.clinicId)
      if (error) throw new Error(error.message)
    } else {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .insert({ user_id: user!.id, name: data.clinicName, phone: data.clinicPhone, business_hours: DEFAULT_HOURS })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      update({ clinicId: clinic.id })
    }
  }

  async function saveHours() {
    const { error } = await supabase
      .from('clinics')
      .update({ business_hours: data.businessHours })
      .eq('id', data.clinicId!)
    if (error) throw new Error(error.message)
  }

  async function saveServices() {
    if (data.services.length === 0) return
    const rows = data.services.map(s => ({ ...s, clinic_id: data.clinicId! }))
    const { error } = await supabase.from('services').insert(rows)
    if (error) throw new Error(error.message)
  }

  async function saveProfessionals() {
    if (data.professionals.length === 0) return
    const rows = data.professionals.map(p => ({ ...p, clinic_id: data.clinicId! }))
    const { error } = await supabase.from('professionals').insert(rows)
    if (error) throw new Error(error.message)
  }

  async function finishOnboarding() {
    const { error } = await supabase
      .from('clinics')
      .update({ onboarding_completed: true })
      .eq('id', data.clinicId!)
    if (error) throw new Error(error.message)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-2">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-gray-900">SecretárIA</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const done = i < step
            const active = i === step
            return (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    done ? 'bg-violet-600' : active ? 'bg-violet-600' : 'bg-gray-200'
                  }`}>
                    {done
                      ? <Check className="w-5 h-5 text-white" />
                      : <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
                    }
                  </div>
                  <span className={`text-xs mt-1 font-medium ${active ? 'text-violet-700' : done ? 'text-violet-500' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          {step === 0 && <StepClinic data={data} update={update} />}
          {step === 1 && <StepHours data={data} update={update} />}
          {step === 2 && <StepServices data={data} update={update} />}
          {step === 3 && <StepProfessionals data={data} update={update} />}
          {step === 4 && <StepWhatsApp data={data} update={update} />}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => { setError(''); setStep(s => s - 1) }}
              disabled={step === 0}
              className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-0 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving
                ? 'Salvando...'
                : step === STEPS.length - 1
                ? 'Concluir configuração'
                : 'Próximo →'
              }
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Passo {step + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  )
}
