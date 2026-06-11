import { useState } from 'react'
import { clsx } from 'clsx'
import { Search, Bot, User, AlertCircle, RefreshCw, Send, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type ConvStatus = 'bot' | 'handover' | 'idle'

interface Conversation {
  id: string
  clientName: string
  whatsapp: string
  lastMessage: string
  lastAt: Date
  status: ConvStatus
  unread: number
  messages: Message[]
}

interface Message {
  id: string
  from: 'client' | 'bot' | 'human' | 'system'
  text: string
  at: Date
}

const MOCK: Conversation[] = [
  {
    id: '1',
    clientName: 'Ana Paula Ferreira',
    whatsapp: '(11) 99234-5678',
    lastMessage: 'Oi, queria remarcar para sexta se possível',
    lastAt: new Date(Date.now() - 4 * 60 * 1000),
    status: 'handover',
    unread: 2,
    messages: [
      { id: 'm1', from: 'client', text: 'Oi! Tudo bem?', at: new Date(Date.now() - 18 * 60 * 1000) },
      { id: 'm2', from: 'bot', text: 'Olá, Ana Paula! 😊 Sou a Avora, assistente virtual da Clínica Bella. Como posso te ajudar hoje?', at: new Date(Date.now() - 17 * 60 * 1000) },
      { id: 'm3', from: 'client', text: 'Eu tenho um agendamento amanhã de manhã, mas surgiu um compromisso. Consigo remarcar?', at: new Date(Date.now() - 15 * 60 * 1000) },
      { id: 'm4', from: 'bot', text: 'Claro! Vou verificar as disponibilidades para você. Qual seria o melhor dia da semana?', at: new Date(Date.now() - 14 * 60 * 1000) },
      { id: 'm5', from: 'client', text: 'Oi, queria remarcar para sexta se possível', at: new Date(Date.now() - 4 * 60 * 1000) },
      { id: 'm6', from: 'system', text: 'Avora pausou o atendimento — aguardando confirmação humana', at: new Date(Date.now() - 3 * 60 * 1000) },
    ],
  },
  {
    id: '2',
    clientName: 'Maria Silva',
    whatsapp: '(11) 98765-4321',
    lastMessage: 'Prefiro às 14h com a Dra. Carla',
    lastAt: new Date(Date.now() - 22 * 60 * 1000),
    status: 'bot',
    unread: 0,
    messages: [
      { id: 'm1', from: 'client', text: 'Quero agendar uma limpeza de pele', at: new Date(Date.now() - 35 * 60 * 1000) },
      { id: 'm2', from: 'bot', text: 'Ótima escolha! Temos horários disponíveis esta semana. Qual profissional você prefere: Dra. Carla ou Dra. Beatriz?', at: new Date(Date.now() - 34 * 60 * 1000) },
      { id: 'm3', from: 'client', text: 'Prefiro às 14h com a Dra. Carla', at: new Date(Date.now() - 22 * 60 * 1000) },
      { id: 'm4', from: 'bot', text: '✅ Perfeito! Vou verificar a disponibilidade da Dra. Carla às 14h...', at: new Date(Date.now() - 21 * 60 * 1000) },
    ],
  },
  {
    id: '3',
    clientName: 'Juliana Costa',
    whatsapp: '(21) 97654-3210',
    lastMessage: 'Sim, confirmo minha presença!',
    lastAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'idle',
    unread: 0,
    messages: [
      { id: 'm1', from: 'bot', text: 'Oi Juliana! 👋 Lembrete: você tem *Depilação a Laser* amanhã às 10h com a Dra. Beatriz. Confirma sua presença?', at: new Date(Date.now() - 2.5 * 60 * 60 * 1000) },
      { id: 'm2', from: 'client', text: 'Sim, confirmo minha presença!', at: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { id: 'm3', from: 'bot', text: 'Ótimo! Agendamento confirmado. Até amanhã! 😊', at: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30 * 1000) },
    ],
  },
  {
    id: '4',
    clientName: 'Fernanda Rodrigues',
    whatsapp: '(31) 96543-2109',
    lastMessage: 'Avora: Sentimos sua falta! Que tal retomar...',
    lastAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    status: 'idle',
    unread: 0,
    messages: [
      { id: 'm1', from: 'bot', text: 'Oi Fernanda! 💜 Sentimos sua falta! Faz 52 dias desde sua última visita. Que tal agendar uma sessão de *Limpeza de Pele* esta semana? Temos horários especiais para clientes como você!', at: new Date(Date.now() - 26 * 60 * 60 * 1000) },
    ],
  },
]

function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return format(date, 'dd/MM', { locale: ptBR })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const statusConfig: Record<ConvStatus, { label: string; dot: string }> = {
  bot:      { label: 'Avora ativa',         dot: 'bg-secondary-600' },
  handover: { label: 'Atenção humana',      dot: 'bg-red-500 animate-pulse' },
  idle:     { label: 'Aguardando cliente',  dot: 'bg-gray-300' },
}

export function ConversationsPage() {
  const [selected, setSelected] = useState<Conversation>(MOCK[0])
  const [filter, setFilter] = useState<'all' | 'handover' | 'bot'>('all')
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')

  const visible = MOCK.filter(c => {
    if (filter === 'handover' && c.status !== 'handover') return false
    if (filter === 'bot' && c.status !== 'bot') return false
    if (search && !c.clientName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const isHandover = selected.status === 'handover'

  return (
    <div className="flex h-full">
      {/* Painel esquerdo — lista */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white/60 border-r border-white/40">
        {/* Cabeçalho */}
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-base font-semibold text-on-surface mb-3">Conversas</h1>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-surface rounded-lg border border-border-light focus:outline-none focus:border-primary-700 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'handover', 'bot'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                  filter === f
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-on-surface-variant hover:bg-primary-50',
                )}
              >
                {f === 'all' ? 'Todas' : f === 'handover' ? '⚠ Handover' : '🤖 Bot'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {visible.map(conv => (
            <button
              key={conv.id}
              onClick={() => setSelected(conv)}
              className={clsx(
                'w-full text-left px-3 py-3 rounded-xl transition-all',
                selected.id === conv.id
                  ? 'bg-primary-100 shadow-sm'
                  : 'hover:bg-white/80',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-700">{initials(conv.clientName)}</span>
                  </div>
                  <span className={clsx('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white', statusConfig[conv.status].dot)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-on-surface truncate">{conv.clientName}</span>
                    <span className="text-[10px] text-outline flex-shrink-0 ml-1">{timeAgo(conv.lastAt)}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant truncate">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="mt-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-700 text-white text-[9px] font-bold">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {visible.length === 0 && (
            <p className="text-center text-sm text-outline pt-8">Nenhuma conversa encontrada</p>
          )}
        </div>
      </div>

      {/* Painel direito — chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header do chat */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/60 border-b border-white/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">{initials(selected.clientName)}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">{selected.clientName}</p>
              <div className="flex items-center gap-1.5">
                <span className={clsx('w-1.5 h-1.5 rounded-full', statusConfig[selected.status].dot)} />
                <span className="text-xs text-on-surface-variant">{statusConfig[selected.status].label}</span>
                <span className="text-xs text-outline">· {selected.whatsapp}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isHandover && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-700 text-white text-xs font-medium hover:bg-primary-600 transition-colors shadow-sm">
                <RefreshCw className="w-3 h-3" />
                Reativar Avora
              </button>
            )}
            <button className="p-2 rounded-lg text-outline hover:bg-primary-50 hover:text-primary-700 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          {selected.messages.map(msg => {
            if (msg.from === 'system') {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-xs text-amber-700">{msg.text}</span>
                  </div>
                </div>
              )
            }

            const isBot = msg.from === 'bot'
            const isHuman = msg.from === 'human'

            return (
              <div
                key={msg.id}
                className={clsx('flex gap-2', (isBot || isHuman) ? 'justify-end' : 'justify-start')}
              >
                {msg.from === 'client' && (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3 h-3 text-gray-500" />
                  </div>
                )}
                <div className={clsx(
                  'max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  isBot
                    ? 'bg-primary-700 text-white rounded-br-sm'
                    : isHuman
                      ? 'bg-secondary-600 text-white rounded-br-sm'
                      : 'bg-white border border-border-light text-on-surface rounded-bl-sm shadow-sm',
                )}>
                  {(isBot || isHuman) && (
                    <div className="flex items-center gap-1 mb-1">
                      {isBot
                        ? <><Bot className="w-3 h-3 opacity-70" /><span className="text-[10px] opacity-70">Avora</span></>
                        : <><User className="w-3 h-3 opacity-70" /><span className="text-[10px] opacity-70">Você</span></>
                      }
                    </div>
                  )}
                  <p>{msg.text}</p>
                  <p className={clsx(
                    'text-[10px] mt-1',
                    (isBot || isHuman) ? 'text-white/60 text-right' : 'text-outline text-right',
                  )}>
                    {format(msg.at, 'HH:mm')}
                  </p>
                </div>
                {(isBot || isHuman) && (
                  <div className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                    isBot ? 'bg-primary-100' : 'bg-secondary-100',
                  )}>
                    {isBot
                      ? <Bot className="w-3 h-3 text-primary-700" />
                      : <User className="w-3 h-3 text-secondary-600" />
                    }
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Input — só aparece em handover */}
        {isHandover ? (
          <div className="px-6 py-4 bg-white/60 border-t border-white/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-border-light shadow-sm focus-within:border-primary-700 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
              <input
                type="text"
                placeholder="Digite sua mensagem..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="flex-1 text-sm text-on-surface bg-transparent outline-none placeholder:text-outline"
              />
              <button
                disabled={!replyText.trim()}
                className="p-1.5 rounded-lg bg-primary-700 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-outline mt-1.5 text-center">
              Você está respondendo como humano. <button className="text-primary-700 hover:underline">Reativar Avora</button> quando terminar.
            </p>
          </div>
        ) : (
          <div className="px-6 py-4 bg-white/40 border-t border-white/40 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 py-2">
              <Bot className="w-4 h-4 text-primary-700" />
              <span className="text-sm text-on-surface-variant">
                {selected.status === 'bot' ? 'Avora está respondendo automaticamente' : 'Aguardando próxima mensagem do cliente'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
