import { useState } from 'react'
import { Building2, Clock, Scissors, Users, Smartphone, CalendarDays } from 'lucide-react'
import { useClinic } from '../hooks/useClinic'
import { useServices } from '../hooks/useServices'
import { useProfessionals } from '../hooks/useProfessionals'
import { ClinicTab } from '../components/settings/ClinicTab'
import { HoursTab } from '../components/settings/HoursTab'
import { ServicesTab } from '../components/settings/ServicesTab'
import { ProfessionalsTab } from '../components/settings/ProfessionalsTab'
import { WhatsAppTab } from '../components/settings/WhatsAppTab'
import { CalendarTab } from '../components/settings/CalendarTab'

const TABS = [
  { id: 'clinic', label: 'Clínica', icon: Building2 },
  { id: 'hours', label: 'Horários', icon: Clock },
  { id: 'services', label: 'Serviços', icon: Scissors },
  { id: 'professionals', label: 'Profissionais', icon: Users },
  { id: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
]

export function SettingsPage() {
  const [tab, setTab] = useState('clinic')
  const { clinic, loading, refetch: refetchClinic } = useClinic()
  const { services, refetch: refetchServices } = useServices(clinic?.id)
  const { professionals, refetch: refetchProfessionals } = useProfessionals(clinic?.id)

  if (loading) return <div className="p-8 text-gray-400 text-sm">Carregando...</div>
  if (!clinic) return <div className="p-8 text-gray-400 text-sm">Clínica não encontrada.</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {tab === 'clinic' && <ClinicTab clinic={clinic} onSaved={refetchClinic} />}
        {tab === 'hours' && <HoursTab clinic={clinic} onSaved={refetchClinic} />}
        {tab === 'services' && <ServicesTab clinicId={clinic.id} services={services} onSaved={refetchServices} />}
        {tab === 'professionals' && <ProfessionalsTab clinicId={clinic.id} professionals={professionals} onSaved={refetchProfessionals} />}
        {tab === 'whatsapp' && <WhatsAppTab clinic={clinic} onSaved={refetchClinic} />}
        {tab === 'calendar' && <CalendarTab clinic={clinic} onSaved={refetchClinic} />}
      </div>
    </div>
  )
}
