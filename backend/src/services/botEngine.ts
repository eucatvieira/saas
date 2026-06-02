import { supabase } from '../lib/supabase'
import { sendText } from '../lib/zapi'
import { createCalendarEvent } from '../lib/googleCalendar'
import {
  addDays, format, parseISO, addMinutes,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Types ────────────────────────────────────────────────────────────────────

type BotState =
  | 'idle'
  | 'selecting_service'
  | 'selecting_professional'
  | 'selecting_date'
  | 'selecting_time'
  | 'confirming'
  | 'human_takeover'

interface BotContext {
  serviceId?: string
  serviceName?: string
  serviceDuration?: number
  servicePrice?: number
  professionalId?: string
  professionalName?: string
  date?: string       // yyyy-MM-dd
  time?: string       // HH:mm
  clientId?: string
  clientName?: string
}

interface Clinic {
  id: string
  name: string
  zapi_instance_id: string
  zapi_token: string
  zapi_client_token: string
  business_hours: Record<string, { open: string; close: string; enabled: boolean }>
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function handleIncomingMessage(
  clinicId: string,
  whatsapp: string,
  text: string
): Promise<void> {
  const clinic = await getClinic(clinicId)
  if (!clinic) return

  // Persist inbound message
  await saveMessage(clinicId, whatsapp, 'inbound', text)

  // Upsert client
  const client = await upsertClient(clinicId, whatsapp)

  // Get or create session
  const session = await getSession(clinicId, whatsapp)
  const state: BotState = (session?.state as BotState) ?? 'idle'
  const ctx: BotContext = (session?.context as BotContext) ?? {}

  await processState(clinic, whatsapp, client, state, ctx, text.trim())
}

// ─── State machine ────────────────────────────────────────────────────────────

async function processState(
  clinic: Clinic,
  whatsapp: string,
  client: { id: string; name: string | null },
  state: BotState,
  ctx: BotContext,
  text: string
): Promise<void> {
  const lower = text.toLowerCase()

  // Human takeover: only "voltar" exits
  if (state === 'human_takeover') {
    if (lower === 'voltar' || lower === '#voltar') {
      await setState(clinic.id, whatsapp, 'idle', {})
      await reply(clinic, whatsapp, 'Voltei ao atendimento automático! Como posso ajudar? Digite *oi* para ver as opções.')
    }
    return
  }

  // Global commands
  if (lower === 'cancelar' || lower === 'menu' || lower === 'oi' || lower === 'olá' || lower === 'ola') {
    await setState(clinic.id, whatsapp, 'idle', {})
    await sendMainMenu(clinic, whatsapp, client.name)
    return
  }

  switch (state) {
    case 'idle':
      await handleIdle(clinic, whatsapp, client, ctx, text)
      break
    case 'selecting_service':
      await handleSelectService(clinic, whatsapp, ctx, text)
      break
    case 'selecting_professional':
      await handleSelectProfessional(clinic, whatsapp, ctx, text)
      break
    case 'selecting_date':
      await handleSelectDate(clinic, whatsapp, ctx, text)
      break
    case 'selecting_time':
      await handleSelectTime(clinic, whatsapp, ctx, text)
      break
    case 'confirming':
      await handleConfirming(clinic, whatsapp, client, ctx, text)
      break
  }
}

// ─── idle ─────────────────────────────────────────────────────────────────────

async function handleIdle(
  clinic: Clinic,
  whatsapp: string,
  client: { id: string; name: string | null },
  _ctx: BotContext,
  text: string
): Promise<void> {
  const lower = text.toLowerCase()

  if (lower === '1' || lower.includes('agendar')) {
    await startBooking(clinic, whatsapp)
    return
  }
  if (lower === '2' || lower.includes('reagendar') || lower.includes('cancelar agendamento')) {
    await reply(clinic, whatsapp, 'Para reagendar ou cancelar, fale diretamente com nossa equipe. Um momento! 👩‍💼')
    await setState(clinic.id, whatsapp, 'human_takeover', {})
    return
  }
  if (lower === '3' || lower.includes('preço') || lower.includes('valor') || lower.includes('quanto')) {
    await sendFaq(clinic, whatsapp)
    return
  }
  if (lower === '4' || lower.includes('falar') || lower.includes('atendente') || lower.includes('humano')) {
    await reply(clinic, whatsapp, '👩‍💼 Transferindo para atendimento humano. Um momento!\n\nDigite *#voltar* para voltar ao bot automático.')
    await setState(clinic.id, whatsapp, 'human_takeover', {})
    return
  }

  await sendMainMenu(clinic, whatsapp, client.name)
}

async function sendMainMenu(clinic: Clinic, whatsapp: string, name: string | null): Promise<void> {
  const greeting = name ? `Olá, *${name}*! 👋` : 'Olá! 👋'
  const msg = `${greeting} Bem-vindo(a) à *${clinic.name}*!\n\nComo posso te ajudar?\n\n*1* - 📅 Agendar horário\n*2* - 🔄 Reagendar ou cancelar\n*3* - 💬 Dúvidas e preços\n*4* - 👩‍💼 Falar com atendente\n\nDigite o número da opção desejada.`
  await reply(clinic, whatsapp, msg)
  await setState(clinic.id, whatsapp, 'idle', {})
}

// ─── selecting_service ────────────────────────────────────────────────────────

async function startBooking(clinic: Clinic, whatsapp: string): Promise<void> {
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price')
    .eq('clinic_id', clinic.id)
    .eq('active', true)
    .order('name')

  if (!services || services.length === 0) {
    await reply(clinic, whatsapp, 'No momento não temos serviços disponíveis. Entre em contato com nossa equipe! 🙏')
    return
  }

  const list = services.map((s: any, i: number) => `*${i + 1}* - ${s.name} (${s.duration_minutes}min · R$${Number(s.price).toFixed(2)})`).join('\n')
  await reply(clinic, whatsapp, `Ótimo! Qual serviço você deseja agendar?\n\n${list}\n\nDigite o número da opção.`)
  await setState(clinic.id, whatsapp, 'selecting_service', {})
}

async function handleSelectService(clinic: Clinic, whatsapp: string, ctx: BotContext, text: string): Promise<void> {
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price')
    .eq('clinic_id', clinic.id)
    .eq('active', true)
    .order('name')

  if (!services) return
  const idx = parseInt(text) - 1
  const service = services[idx] as any

  if (!service) {
    await reply(clinic, whatsapp, `Opção inválida. Digite um número entre 1 e ${services.length}.`)
    return
  }

  const newCtx: BotContext = {
    ...ctx,
    serviceId: service.id,
    serviceName: service.name,
    serviceDuration: service.duration_minutes,
    servicePrice: Number(service.price),
  }

  // Check professionals
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name')
    .eq('clinic_id', clinic.id)
    .eq('active', true)
    .order('name')

  if (!professionals || professionals.length === 0) {
    await reply(clinic, whatsapp, 'Nenhum profissional disponível no momento.')
    return
  }

  if (professionals.length === 1) {
    const p = professionals[0] as any
    newCtx.professionalId = p.id
    newCtx.professionalName = p.name
    await setState(clinic.id, whatsapp, 'selecting_date', newCtx)
    await askDate(clinic, whatsapp)
    return
  }

  const list = professionals.map((p: any, i: number) => `*${i + 1}* - ${p.name}`).join('\n')
  await reply(clinic, whatsapp, `Com qual profissional você prefere?\n\n${list}\n\nDigite o número.`)
  await setState(clinic.id, whatsapp, 'selecting_professional', newCtx)
}

// ─── selecting_professional ───────────────────────────────────────────────────

async function handleSelectProfessional(clinic: Clinic, whatsapp: string, ctx: BotContext, text: string): Promise<void> {
  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name')
    .eq('clinic_id', clinic.id)
    .eq('active', true)
    .order('name')

  if (!professionals) return
  const idx = parseInt(text) - 1
  const prof = professionals[idx] as any

  if (!prof) {
    await reply(clinic, whatsapp, `Opção inválida. Digite um número entre 1 e ${professionals.length}.`)
    return
  }

  const newCtx = { ...ctx, professionalId: prof.id, professionalName: prof.name }
  await setState(clinic.id, whatsapp, 'selecting_date', newCtx)
  await askDate(clinic, whatsapp)
}

// ─── selecting_date ───────────────────────────────────────────────────────────

async function askDate(clinic: Clinic, whatsapp: string): Promise<void> {
  const days: string[] = []
  for (let i = 1; i <= 7; i++) {
    const d = addDays(new Date(), i)
    const dayName = format(d, 'EEEE', { locale: ptBR })
    const dayKey = format(d, 'EEEE', { locale: ptBR }).toLowerCase().replace('-feira', '').trim()
    const mapped: Record<string, string> = {
      'segunda': 'monday', 'terça': 'tuesday', 'quarta': 'wednesday',
      'quinta': 'thursday', 'sexta': 'friday', 'sábado': 'saturday', 'domingo': 'sunday',
    }
    const key = mapped[dayKey] ?? dayKey
    const hours = clinic.business_hours[key]
    if (hours?.enabled) {
      days.push(`*${i}* - ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${format(d, 'dd/MM')}`)
    }
  }

  if (days.length === 0) {
    await reply(clinic, whatsapp, 'Não há dias disponíveis nos próximos 7 dias. Entre em contato com nossa equipe.')
    await setState(clinic.id, whatsapp, 'idle', {})
    return
  }

  await reply(clinic, whatsapp, `Qual data você prefere?\n\n${days.join('\n')}\n\nDigite o número do dia.`)
}

async function handleSelectDate(clinic: Clinic, whatsapp: string, ctx: BotContext, text: string): Promise<void> {
  const num = parseInt(text)
  if (isNaN(num) || num < 1 || num > 7) {
    await reply(clinic, whatsapp, 'Opção inválida. Digite o número do dia desejado.')
    return
  }

  const chosenDate = addDays(new Date(), num)
  const dateStr = format(chosenDate, 'yyyy-MM-dd')
  const dayKey = getDayKey(chosenDate)
  const hours = clinic.business_hours[dayKey]

  if (!hours?.enabled) {
    await reply(clinic, whatsapp, 'Esse dia não está disponível. Por favor, escolha outro dia.')
    await askDate(clinic, whatsapp)
    return
  }

  // Build available slots
  const slots = buildSlots(hours.open, hours.close, ctx.serviceDuration ?? 60)

  // Remove already-booked slots
  const { data: booked } = await supabase
    .from('appointments')
    .select('scheduled_at, service:services(duration_minutes)')
    .eq('clinic_id', clinic.id)
    .eq('professional_id', ctx.professionalId!)
    .gte('scheduled_at', `${dateStr}T00:00:00`)
    .lte('scheduled_at', `${dateStr}T23:59:59`)
    .not('status', 'in', '("cancelled","no_show")')

  const free = slots.filter(slot => {
    if (!booked) return true
    const slotStart = new Date(`${dateStr}T${slot}:00`)
    const slotEnd = new Date(slotStart.getTime() + (ctx.serviceDuration ?? 60) * 60000)
    return !(booked as any[]).some((b: any) => {
      const bStart = parseISO(b.scheduled_at)
      const bDur = b.service?.duration_minutes ?? 60
      const bEnd = new Date(bStart.getTime() + bDur * 60000)
      return slotStart < bEnd && slotEnd > bStart
    })
  })

  if (free.length === 0) {
    await reply(clinic, whatsapp, 'Não há horários disponíveis nesse dia. Escolha outro dia:')
    await askDate(clinic, whatsapp)
    return
  }

  const slotList = free.map((s, i) => `*${i + 1}* - ${s}`).join('\n')
  await reply(clinic, whatsapp, `Horários disponíveis em ${format(chosenDate, "d 'de' MMMM", { locale: ptBR })}:\n\n${slotList}\n\nDigite o número do horário.`)
  await setState(clinic.id, whatsapp, 'selecting_time', { ...ctx, date: dateStr, _freeSlots: free } as any)
}

// ─── selecting_time ───────────────────────────────────────────────────────────

async function handleSelectTime(clinic: Clinic, whatsapp: string, ctx: BotContext, text: string): Promise<void> {
  const freeSlots: string[] = (ctx as any)._freeSlots ?? []
  const idx = parseInt(text) - 1
  const slot = freeSlots[idx]

  if (!slot) {
    await reply(clinic, whatsapp, `Opção inválida. Digite um número entre 1 e ${freeSlots.length}.`)
    return
  }

  const newCtx = { ...ctx, time: slot }
  delete (newCtx as any)._freeSlots

  const dateFormatted = format(parseISO(ctx.date!), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const summary =
    `📋 *Resumo do agendamento*\n\n` +
    `👤 Profissional: ${ctx.professionalName}\n` +
    `💆 Serviço: ${ctx.serviceName}\n` +
    `📅 Data: ${dateFormatted}\n` +
    `⏰ Horário: ${slot}\n` +
    `💰 Valor: R$ ${ctx.servicePrice?.toFixed(2)}\n\n` +
    `Confirma o agendamento? Digite *SIM* para confirmar ou *NÃO* para cancelar.`

  await reply(clinic, whatsapp, summary)
  await setState(clinic.id, whatsapp, 'confirming', newCtx)
}

// ─── confirming ───────────────────────────────────────────────────────────────

async function handleConfirming(
  clinic: Clinic,
  whatsapp: string,
  client: { id: string; name: string | null },
  ctx: BotContext,
  text: string
): Promise<void> {
  const lower = text.toLowerCase()

  if (lower !== 'sim' && lower !== 's') {
    await reply(clinic, whatsapp, 'Agendamento cancelado. Quando quiser, é só me chamar! 😊')
    await setState(clinic.id, whatsapp, 'idle', {})
    return
  }

  const scheduledAt = `${ctx.date}T${ctx.time}:00`
  const endAt = addMinutes(parseISO(scheduledAt), ctx.serviceDuration ?? 60).toISOString()

  const { data: newAppt, error } = await supabase
    .from('appointments')
    .insert({
      clinic_id: clinic.id,
      client_id: client.id,
      service_id: ctx.serviceId!,
      professional_id: ctx.professionalId!,
      scheduled_at: scheduledAt,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !newAppt) {
    await reply(clinic, whatsapp, 'Erro ao criar agendamento. Tente novamente ou entre em contato conosco.')
    await setState(clinic.id, whatsapp, 'idle', {})
    return
  }

  // Create Google Calendar event (only if clinic has token)
  const calEventId = await createCalendarEvent(clinic.id, {
    summary: `${ctx.serviceName} — ${client.name ?? whatsapp}`,
    description: `Profissional: ${ctx.professionalName}\nCliente: ${client.name ?? whatsapp}\nWhatsApp: ${whatsapp}`,
    startAt: scheduledAt,
    endAt,
  }).catch(() => null)

  if (calEventId) {
    await supabase
      .from('appointments')
      .update({ google_calendar_event_id: calEventId })
      .eq('id', newAppt.id)
  }

  const dateFormatted = format(parseISO(ctx.date!), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  await reply(
    clinic,
    whatsapp,
    `✅ *Agendamento confirmado!*\n\n` +
    `📅 ${dateFormatted} às ${ctx.time}\n` +
    `💆 ${ctx.serviceName} com ${ctx.professionalName}\n\n` +
    `Você receberá uma confirmação 24h antes. Até lá! 👋`
  )
  await setState(clinic.id, whatsapp, 'idle', {})
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

async function sendFaq(clinic: Clinic, whatsapp: string): Promise<void> {
  const { data: faqs } = await supabase
    .from('faq_items')
    .select('question, answer')
    .eq('clinic_id', clinic.id)
    .eq('active', true)

  if (!faqs || faqs.length === 0) {
    const { data: services } = await supabase
      .from('services')
      .select('name, price, duration_minutes')
      .eq('clinic_id', clinic.id)
      .eq('active', true)
      .order('name')

    if (services && services.length > 0) {
      const list = (services as any[]).map((s: any) => `• ${s.name}: R$${Number(s.price).toFixed(2)} (${s.duration_minutes}min)`).join('\n')
      await reply(clinic, whatsapp, `💰 *Nossos serviços e valores:*\n\n${list}\n\nPara agendar, digite *1*.`)
    } else {
      await reply(clinic, whatsapp, 'Para informações sobre preços e serviços, entre em contato com nossa equipe!')
    }
    return
  }

  const text = (faqs as any[]).map((f: any) => `❓ *${f.question}*\n${f.answer}`).join('\n\n')
  await reply(clinic, whatsapp, text)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSlots(open: string, close: string, durationMin: number): string[] {
  const slots: string[] = []
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  let current = oh * 60 + om
  const end = ch * 60 + cm

  while (current + durationMin <= end) {
    const h = String(Math.floor(current / 60)).padStart(2, '0')
    const m = String(current % 60).padStart(2, '0')
    slots.push(`${h}:${m}`)
    current += durationMin
  }
  return slots
}

function getDayKey(date: Date): string {
  const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return map[date.getDay()]
}

async function reply(clinic: Clinic, whatsapp: string, message: string): Promise<void> {
  await sendText(clinic.zapi_instance_id, clinic.zapi_token, clinic.zapi_client_token, whatsapp, message)
  await saveMessage(clinic.id, whatsapp, 'outbound', message)
}

async function getClinic(clinicId: string): Promise<Clinic | null> {
  const { data } = await supabase.from('clinics').select('*').eq('id', clinicId).single()
  return data as Clinic | null
}

async function upsertClient(clinicId: string, whatsapp: string): Promise<{ id: string; name: string | null }> {
  const { data } = await supabase
    .from('clients')
    .upsert({ clinic_id: clinicId, whatsapp }, { onConflict: 'clinic_id,whatsapp' })
    .select('id, name')
    .single()
  return (data ?? { id: '', name: null }) as { id: string; name: string | null }
}

async function getSession(clinicId: string, whatsapp: string) {
  const { data } = await supabase
    .from('bot_sessions')
    .select('state, context')
    .eq('clinic_id', clinicId)
    .eq('whatsapp', whatsapp)
    .single()
  return data
}

async function setState(clinicId: string, whatsapp: string, state: BotState, context: object): Promise<void> {
  await supabase
    .from('bot_sessions')
    .upsert({ clinic_id: clinicId, whatsapp, state, context }, { onConflict: 'clinic_id,whatsapp' })
}

async function saveMessage(clinicId: string, whatsapp: string, direction: 'inbound' | 'outbound', content: string): Promise<void> {
  await supabase.from('messages').insert({ clinic_id: clinicId, whatsapp, direction, content })
}
