import type { OnboardingData, BusinessHours } from '../../pages/OnboardingPage'

interface Props {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DAYS = Object.keys(DAY_LABELS)

export function StepHours({ data, update }: Props) {
  function setDay(day: string, field: keyof BusinessHours[string], value: string | boolean) {
    update({
      businessHours: {
        ...data.businessHours,
        [day]: { ...data.businessHours[day], [field]: value },
      },
    })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Horários de funcionamento</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">O bot só vai oferecer horários dentro desses intervalos.</p>

      <div className="space-y-3">
        {DAYS.map(day => {
          const h = data.businessHours[day]
          return (
            <div key={day} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${h.enabled ? 'border-violet-200 bg-violet-50/40' : 'border-gray-100 bg-gray-50'}`}>
              <label className="flex items-center gap-2 cursor-pointer min-w-[140px]">
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
                  <input
                    type="time"
                    value={h.open}
                    onChange={e => setDay(day, 'open', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="text-gray-400 text-sm">até</span>
                  <input
                    type="time"
                    value={h.close}
                    onChange={e => setDay(day, 'close', e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 flex-1">Fechado</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
