import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import type { OnboardingData, ProfessionalDraft } from '../../pages/OnboardingPage'

interface Props {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

const EMPTY: ProfessionalDraft = { name: '', specialties: [] }

export function StepProfessionals({ data, update }: Props) {
  const [form, setForm] = useState<ProfessionalDraft>(EMPTY)
  const [specialty, setSpecialty] = useState('')
  const [formError, setFormError] = useState('')

  function addSpecialty() {
    const s = specialty.trim()
    if (!s || form.specialties.includes(s)) return
    setForm(f => ({ ...f, specialties: [...f.specialties, s] }))
    setSpecialty('')
  }

  function removeSpecialty(s: string) {
    setForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }))
  }

  function addProfessional() {
    if (!form.name.trim()) { setFormError('Informe o nome do profissional.'); return }
    setFormError('')
    update({ professionals: [...data.professionals, { ...form }] })
    setForm(EMPTY)
    setSpecialty('')
  }

  function removeProfessional(i: number) {
    update({ professionals: data.professionals.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Profissionais</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        Adicione quem atende na clínica. Pode pular e configurar depois.
      </p>

      {data.professionals.length > 0 && (
        <div className="space-y-2 mb-5">
          {data.professionals.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                {p.specialties.length > 0 && (
                  <p className="text-xs text-gray-500">{p.specialties.join(', ')}</p>
                )}
              </div>
              <button onClick={() => removeProfessional(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Adicionar profissional</p>

        <input
          type="text"
          placeholder="Nome completo (ex: Ana Silva)"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <div>
          <label className="block text-xs text-gray-500 mb-1">Especialidades (opcional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Depilação a laser"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={addSpecialty}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
            >
              +
            </button>
          </div>
          {form.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {form.specialties.map(s => (
                <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                  {s}
                  <button onClick={() => removeSpecialty(s)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <button
          onClick={addProfessional}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar profissional
        </button>
      </div>
    </div>
  )
}
