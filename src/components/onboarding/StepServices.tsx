import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { OnboardingData, ServiceDraft } from '../../pages/OnboardingPage'

interface Props {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

const EMPTY: ServiceDraft = { name: '', duration_minutes: 60, price: 0, description: '' }

export function StepServices({ data, update }: Props) {
  const [form, setForm] = useState<ServiceDraft>(EMPTY)
  const [formError, setFormError] = useState('')

  function addService() {
    if (!form.name.trim()) { setFormError('Informe o nome do serviço.'); return }
    if (form.duration_minutes < 15) { setFormError('Duração mínima: 15 minutos.'); return }
    setFormError('')
    update({ services: [...data.services, { ...form }] })
    setForm(EMPTY)
  }

  function removeService(i: number) {
    update({ services: data.services.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Serviços oferecidos</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        Adicione os serviços da sua clínica. Pode pular e adicionar depois nas configurações.
      </p>

      {/* Existing services */}
      {data.services.length > 0 && (
        <div className="space-y-2 mb-5">
          {data.services.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500">{s.duration_minutes} min · R$ {s.price.toFixed(2)}</p>
              </div>
              <button onClick={() => removeService(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">Adicionar serviço</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Nome do serviço (ex: Depilação de pernas)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duração (min)</label>
            <input
              type="number"
              min={15}
              step={15}
              value={form.duration_minutes}
              onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Preço (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="col-span-2">
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {formError && <p className="text-xs text-red-500">{formError}</p>}

        <button
          onClick={addService}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar serviço
        </button>
      </div>
    </div>
  )
}
