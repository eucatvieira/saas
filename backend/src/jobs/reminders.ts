import { supabase } from '../lib/supabase'
import { sendText } from '../lib/zapi'
import { format, parseISO, addHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Run every hour — sends reminders for appointments in the next 24h
export async function runReminderJob(): Promise<void> {
  const now = new Date()
  const in24h = addHours(now, 24)
  const in25h = addHours(now, 25)

  // Fetch appointments that need a reminder
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id, scheduled_at, clinic_id,
      client:clients(whatsapp, name),
      service:services(name),
      professional:professionals(name),
      clinic:clinics(zapi_instance_id, zapi_token, zapi_client_token)
    `)
    .gte('scheduled_at', in24h.toISOString())
    .lte('scheduled_at', in25h.toISOString())
    .eq('reminder_sent', false)
    .in('status', ['pending', 'confirmed'])

  if (error) { console.error('[reminder] query error:', error.message); return }
  if (!appointments || appointments.length === 0) return

  console.log(`[reminder] sending ${appointments.length} reminders`)

  for (const appt of appointments as any[]) {
    const clinic = appt.clinic
    if (!clinic?.zapi_instance_id || !clinic?.zapi_token || !clinic?.zapi_client_token) continue

    const whatsapp = appt.client?.whatsapp
    if (!whatsapp) continue

    const dateStr = format(parseISO(appt.scheduled_at), "d 'de' MMMM", { locale: ptBR })
    const timeStr = format(parseISO(appt.scheduled_at), 'HH:mm')
    const name = appt.client?.name ? `, ${appt.client.name}` : ''

    const msg =
      `Olá${name}! 👋 Lembrando que você tem um agendamento *amanhã*:\n\n` +
      `📅 ${dateStr} às ${timeStr}\n` +
      `💆 ${appt.service?.name} com ${appt.professional?.name}\n\n` +
      `Você confirma sua presença?\n\n*SIM* - Confirmo ✅\n*NÃO* - Preciso cancelar ❌`

    try {
      await sendText(clinic.zapi_instance_id, clinic.zapi_token, clinic.zapi_client_token, whatsapp, msg)
      await supabase.from('appointments').update({ reminder_sent: true }).eq('id', appt.id)
      await supabase.from('messages').insert({
        clinic_id: appt.clinic_id, whatsapp, direction: 'outbound', content: msg,
      })
    } catch (e: any) {
      console.error(`[reminder] failed for appt ${appt.id}:`, e?.message)
    }
  }
}

// Handle reminder replies (SIM / NÃO) — called from botEngine when state is idle
// and message matches a pending reminder appointment
export async function handleReminderReply(
  clinicId: string,
  whatsapp: string,
  text: string
): Promise<boolean> {
  const lower = text.toLowerCase().trim()
  if (lower !== 'sim' && lower !== 'não' && lower !== 'nao' && lower !== 'n' && lower !== 's') {
    return false
  }

  // Find the next upcoming appointment for this client
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('whatsapp', whatsapp)
    .single()

  if (!client) return false

  const { data: appt } = await supabase
    .from('appointments')
    .select('id, clinic:clinics(zapi_instance_id, zapi_token, zapi_client_token)')
    .eq('clinic_id', clinicId)
    .eq('client_id', client.id)
    .eq('reminder_sent', true)
    .in('status', ['pending', 'confirmed'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(1)
    .single()

  if (!appt) return false

  const confirmed = lower === 'sim' || lower === 's'
  const newStatus = confirmed ? 'confirmed' : 'cancelled'

  await supabase.from('appointments').update({ status: newStatus }).eq('id', appt.id)

  const clinic = (appt as any).clinic
  if (clinic?.zapi_instance_id) {
    const msg = confirmed
      ? 'Ótimo! Presença confirmada. Te esperamos! 🎉'
      : 'Entendido! Agendamento cancelado. Se quiser remarcar, é só me chamar! 😊'
    await sendText(clinic.zapi_instance_id, clinic.zapi_token, clinic.zapi_client_token, whatsapp, msg)
  }

  return true
}
