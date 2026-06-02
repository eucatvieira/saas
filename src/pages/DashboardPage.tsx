import { useMemo } from 'react'
import { format, isToday, startOfDay, endOfDay, subDays, startOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, Users, TrendingDown, DollarSign, Clock, AlertCircle } from 'lucide-react'
import { useClinic } from '../hooks/useClinic'
import { useAppointments } from '../hooks/useAppointments'
import { Badge } from '../components/ui/Badge'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export function DashboardPage() {
  const { clinic } = useClinic()
  const { appointments, loading } = useAppointments(clinic?.id)

  const now = new Date()

  const metrics = useMemo(() => {
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const monthStart = startOfMonth(now)
    const last30 = subDays(now, 30)

    const todayAppts = appointments.filter(a => {
      const d = new Date(a.scheduled_at)
      return d >= todayStart && d <= todayEnd
    })

    const monthAppts = appointments.filter(a => new Date(a.scheduled_at) >= monthStart)

    const last30Appts = appointments.filter(a => new Date(a.scheduled_at) >= last30)
    const noShowRate = last30Appts.length > 0
      ? Math.round((last30Appts.filter(a => a.status === 'no_show').length / last30Appts.length) * 100)
      : 0

    const monthRevenue = monthAppts
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + (a.service?.price ?? 0), 0)

    const activeClients = new Set(
      appointments
        .filter(a => new Date(a.scheduled_at) >= last30)
        .map(a => a.client_id)
    ).size

    return { todayAppts, noShowRate, monthRevenue, activeClients }
  }, [appointments])

  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) >= now && a.status !== 'cancelled')
    .slice(0, 6)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {clinic ? `Olá, ${clinic.name}` : 'Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CalendarDays}
          label="Agendamentos hoje"
          value={metrics.todayAppts.length}
          sub={`${metrics.todayAppts.filter(a => a.status === 'confirmed').length} confirmados`}
          color="bg-violet-100 text-violet-600"
        />
        <StatCard
          icon={DollarSign}
          label="Receita do mês"
          value={`R$ ${metrics.monthRevenue.toFixed(2)}`}
          sub="Apenas concluídos"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={Users}
          label="Clientes ativos"
          value={metrics.activeClients}
          sub="Últimos 30 dias"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={TrendingDown}
          label="Taxa de no-show"
          value={`${metrics.noShowRate}%`}
          sub="Últimos 30 dias"
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamentos de hoje */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Hoje</h2>
            <span className="text-xs text-gray-400">{metrics.todayAppts.length} agendamentos</span>
          </div>

          {loading && <p className="text-sm text-gray-400">Carregando...</p>}

          {!loading && metrics.todayAppts.length === 0 && (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CalendarDays className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum agendamento hoje</p>
            </div>
          )}

          <div className="space-y-2">
            {metrics.todayAppts.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 w-12 text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(a.scheduled_at), 'HH:mm')}
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
                <Badge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Próximos agendamentos */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Próximos</h2>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>

          {!loading && upcoming.length === 0 && (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum agendamento futuro</p>
            </div>
          )}

          <div className="space-y-2">
            {upcoming.map(a => {
              const d = new Date(a.scheduled_at)
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0 w-16 text-center">
                    <p className="text-xs text-gray-400">
                      {isToday(d) ? 'Hoje' : format(d, 'dd/MM', { locale: ptBR })}
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{format(d, 'HH:mm')}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.client?.name ?? a.client?.whatsapp}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{a.service?.name}</p>
                  </div>
                  <Badge status={a.status} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
