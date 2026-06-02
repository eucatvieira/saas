import { useState, useMemo } from 'react'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks,
  isToday, parseISO,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react'
import { useClinic } from '../hooks/useClinic'
import { useAppointments, type Appointment } from '../hooks/useAppointments'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'confirmed', label: 'Confirmados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'no_show', label: 'No-show' },
  { value: 'completed', label: 'Concluídos' },
]

function AppointmentModal({ appointment, onClose, onStatusChange }: {
  appointment: Appointment
  onClose: () => void
  onStatusChange: () => void
}) {
  const [saving, setSaving] = useState(false)

  async function changeStatus(status: Appointment['status']) {
    setSaving(true)
    await supabase.from('appointments').update({ status }).eq('id', appointment.id)
    setSaving(false)
    onStatusChange()
    onClose()
  }

  const d = parseISO(appointment.scheduled_at)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Detalhes do agendamento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3 mb-6">
          <Row label="Cliente" value={appointment.client?.name ?? appointment.client?.whatsapp} />
          <Row label="WhatsApp" value={appointment.client?.whatsapp} />
          <Row label="Serviço" value={appointment.service?.name} />
          <Row label="Profissional" value={appointment.professional?.name} />
          <Row label="Data" value={format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR })} />
          <Row label="Horário" value={format(d, 'HH:mm')} />
          <Row label="Duração" value={`${appointment.service?.duration_minutes} min`} />
          <Row label="Valor" value={`R$ ${appointment.service?.price?.toFixed(2)}`} />
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Status</span>
            <Badge status={appointment.status} />
          </div>
          {appointment.notes && <Row label="Observações" value={appointment.notes} />}
        </div>

        <div className="flex flex-wrap gap-2">
          {appointment.status !== 'confirmed' && (
            <button onClick={() => changeStatus('confirmed')} disabled={saving}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
              Confirmar
            </button>
          )}
          {appointment.status !== 'completed' && (
            <button onClick={() => changeStatus('completed')} disabled={saving}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
              Concluir
            </button>
          )}
          {appointment.status !== 'no_show' && (
            <button onClick={() => changeStatus('no_show')} disabled={saving}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors">
              No-show
            </button>
          )}
          {appointment.status !== 'cancelled' && (
            <button onClick={() => changeStatus('cancelled')} disabled={saving}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors">
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  )
}

export function AppointmentsPage() {
  const { clinic } = useClinic()
  const { appointments, loading, refetch } = useAppointments(clinic?.id)
  const [weekBase, setWeekBase] = useState(new Date())
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<Appointment | null>(null)

  const weekStart = startOfWeek(weekBase, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filtered = useMemo(() =>
    appointments.filter(a => statusFilter === 'all' || a.status === statusFilter),
    [appointments, statusFilter]
  )

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    weekDays.forEach(d => { map[format(d, 'yyyy-MM-dd')] = [] })
    filtered.forEach(a => {
      const key = format(parseISO(a.scheduled_at), 'yyyy-MM-dd')
      if (map[key]) map[key].push(a)
    })
    return map
  }, [filtered, weekDays])

  return (
    <div className="p-8">
      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onStatusChange={refetch}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} agendamentos</p>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-violet-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Navegação semanal */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <button onClick={() => setWeekBase(w => subWeeks(w, 1))}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekDays[0], "d 'de' MMM", { locale: ptBR })} —{' '}
            {format(weekDays[6], "d 'de' MMM 'de' yyyy", { locale: ptBR })}
          </span>
          <button onClick={() => setWeekBase(w => addWeeks(w, 1))}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Grid de dias */}
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {weekDays.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayAppts = byDay[key] ?? []
            const today = isToday(day)
            return (
              <div key={key} className={`min-h-32 p-2 ${today ? 'bg-violet-50' : ''}`}>
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-400 uppercase">
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p className={`text-sm font-semibold ${today ? 'text-violet-700' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayAppts.slice(0, 3).map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="w-full text-left px-1.5 py-1 rounded text-xs bg-violet-600 text-white hover:bg-violet-700 transition-colors truncate"
                    >
                      {format(parseISO(a.scheduled_at), 'HH:mm')} {a.client?.name ?? a.client?.whatsapp}
                    </button>
                  ))}
                  {dayAppts.length > 3 && (
                    <p className="text-xs text-gray-400 text-center">+{dayAppts.length - 3}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista completa */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Lista completa</h2>
        </div>

        {loading && <p className="p-5 text-sm text-gray-400">Carregando...</p>}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 text-gray-400">
            <CalendarDays className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Nenhum agendamento encontrado</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {filtered.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-20 flex-shrink-0">
                <p className="text-xs text-gray-400">
                  {format(parseISO(a.scheduled_at), 'dd/MM/yyyy')}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(parseISO(a.scheduled_at), 'HH:mm')}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {a.client?.name ?? a.client?.whatsapp}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {a.service?.name} · {a.professional?.name}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <Badge status={a.status} />
                <p className="text-xs text-gray-400 mt-1">R$ {a.service?.price?.toFixed(2)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
