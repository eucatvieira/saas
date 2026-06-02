import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Clinic } from '../../hooks/useClinic'

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda-feira', tuesday: 'Terça-feira', wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira', friday: 'Sexta-feira', saturday: 'Sábado', sunday: 'Domingo',
}
const DAYS = Object.keys(DAY_LABELS)

type Hours = Record<string, { open: string; close: string; enabled: boolean }>

export function HoursTab({ clinic, onSaved }: { clinic: Clinic; onSaved: () => void }) {
  const [hours, setHours] = useState<Hours>(clinic.business_hours as Hours)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function setDay(day: string, field: string, value: string | boolean) {
    setHours(h => ({ ...h, [day]: { ...h[day], [field]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('clinics').update({ business_hours: hours }).eq('id', clinic.id)
    setSaving(false)
    setSaved(true)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Horários de funcionamento</h2>
      <p className="text-sm text-gray-500 mb-6">O bot só vai oferecer horários dentro desses intervalos.</p>

      <div className="space-y-2 mb-6">
        {DAYS.map(day => {
          const h = hours[day] ?? { open: '08:00', close: '18:00', enabled: false }
          return (
            <div key={day} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${h.enabled ? 'border-violet-200 bg-violet-50/40' : 'border-gray-100 bg-gray-50'}`}>
              <label className="flex items-center gap-2 cursor-pointer min-w-[152px]">
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={e => setDay(day, 'enabled', e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className={`text-sm font-medium ${h.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                  {DAY_LABELS[day]}
                </span>
              </label>
              {h.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={h.open}
                    onChange={e => setDay(day, 'open', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  <span className="text-gray-400 text-sm">até</span>
                  <input type="time" value={h.close}
                    onChange={e => setDay(day, 'close', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              ) : (
                <span className="text-sm text-gray-400 flex-1">Fechado</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
          {saving ? 'Salvando...' : 'Salvar horários'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
      </div>
    </div>
  )
}
