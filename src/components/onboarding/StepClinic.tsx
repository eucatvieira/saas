import type { OnboardingData } from '../../pages/OnboardingPage'

interface Props {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

export function StepClinic({ data, update }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Sua clínica</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">Informações básicas que aparecem para seus clientes.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da clínica <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.clinicName}
            onChange={e => update({ clinicName: e.target.value })}
            placeholder="Ex: Studio Bella Estética"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp da clínica <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={data.clinicPhone}
            onChange={e => update({ clinicPhone: e.target.value })}
            placeholder="(11) 99999-9999"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Número que será usado como secretária virtual.</p>
        </div>
      </div>
    </div>
  )
}
