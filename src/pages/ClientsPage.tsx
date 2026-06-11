import { useState, useMemo } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, Search, Send, AlertCircle } from 'lucide-react'
import { useClinic } from '../hooks/useClinic'
import { useClients, type Client } from '../hooks/useClients'
import { supabase } from '../lib/supabase'
import { Skeleton } from '../components/ui/Skeleton'

function InactiveTag({ lastAt }: { lastAt: string | null }) {
  if (!lastAt) return <span className="text-xs text-gray-400">Nunca agendou</span>
  const days = differenceInDays(new Date(), parseISO(lastAt))
  if (days >= 45) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
        <AlertCircle className="w-3 h-3" />
        {days}d inativo
      </span>
    )
  }
  return (
    <span className="text-xs text-gray-500">
      Último: {format(parseISO(lastAt), 'dd/MM/yyyy', { locale: ptBR })}
    </span>
  )
}

export function ClientsPage() {
  const { clinic } = useClinic()
  const { clients, loading, refetch } = useClients(clinic?.id)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'inactive'>('all')
  const [reactivating, setReactivating] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = clients
    if (filter === 'inactive') {
      list = list.filter(c => {
        if (!c.last_appointment_at) return true
        return differenceInDays(new Date(), parseISO(c.last_appointment_at)) >= 45
      })
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name?.toLowerCase().includes(q) || c.whatsapp.includes(q)
      )
    }
    return list
  }, [clients, filter, search])

  const inactiveCount = useMemo(() =>
    clients.filter(c => {
      if (!c.last_appointment_at) return true
      return differenceInDays(new Date(), parseISO(c.last_appointment_at)) >= 45
    }).length,
    [clients]
  )

  async function sendReactivation(client: Client) {
    setReactivating(client.id)
    await supabase
      .from('clients')
      .update({ reactivation_sent_at: new Date().toISOString() })
      .eq('id', client.id)
    setReactivating(null)
    refetch()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clients.length} clientes · {inactiveCount} inativos há mais de 45 dias
          </p>
        </div>
      </div>

      {/* Busca e filtros */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            filter === 'inactive' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Inativos ({inactiveCount})
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">WhatsApp</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Consultas</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Situação</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Reativação</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3">
                      <Skeleton className="h-4 w-28 mb-1.5" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-6" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-5 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-3"></td>
                  </tr>
                ))
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhum cliente encontrado</p>
                  </td>
                </tr>
              )}
              {filtered.map(client => {
                const isInactive = !client.last_appointment_at ||
                  differenceInDays(new Date(), parseISO(client.last_appointment_at)) >= 45
                const reactivationSent = client.reactivation_sent_at
                  ? differenceInDays(new Date(), parseISO(client.reactivation_sent_at)) < 90
                  : false

                return (
                  <tr key={client.id} className={`hover:bg-gray-50 transition-colors ${isInactive ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{client.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">
                        desde {format(parseISO(client.created_at), 'MMM/yyyy', { locale: ptBR })}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-600 hover:underline"
                      >
                        {client.whatsapp}
                      </a>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-gray-900">{client.total_appointments}</span>
                    </td>
                    <td className="px-5 py-3">
                      <InactiveTag lastAt={client.last_appointment_at} />
                    </td>
                    <td className="px-5 py-3">
                      {client.reactivation_sent_at ? (
                        <span className="text-xs text-gray-400">
                          Enviada em {format(parseISO(client.reactivation_sent_at), 'dd/MM/yyyy')}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isInactive && !reactivationSent && (
                        <button
                          onClick={() => sendReactivation(client)}
                          disabled={reactivating === client.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          {reactivating === client.id ? 'Enviando...' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
