import { supabase } from '../lib/supabase'
import { sendText } from '../lib/zapi'
import { subDays } from 'date-fns'

// Runs daily at 10h — finds clients inactive for 45+ days and sends reactivation message
export async function runReactivationJob(): Promise<void> {
  const cutoff45 = subDays(new Date(), 45).toISOString()
  const cutoff90 = subDays(new Date(), 90).toISOString()

  // Get all clinics with Z-API configured
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, zapi_instance_id, zapi_token, zapi_client_token')
    .not('zapi_instance_id', 'is', null)
    .not('zapi_token', 'is', null)

  if (!clinics || clinics.length === 0) return

  for (const clinic of clinics as any[]) {
    if (!clinic.zapi_instance_id || !clinic.zapi_token || !clinic.zapi_client_token) continue

    // Clients inactive 45+ days and not reactivated in last 90 days
    const { data: clients } = await supabase
      .from('clients')
      .select('id, name, whatsapp, last_appointment_at, reactivation_sent_at')
      .eq('clinic_id', clinic.id)
      .or(`last_appointment_at.lte.${cutoff45},last_appointment_at.is.null`)
      .or(`reactivation_sent_at.lte.${cutoff90},reactivation_sent_at.is.null`)

    if (!clients || clients.length === 0) continue

    console.log(`[reactivation] clinic ${clinic.name}: ${clients.length} clients`)

    for (const client of clients as any[]) {
      const name = client.name ? `, ${client.name}` : ''
      const msg =
        `Olá${name}! 😊 Sentimos sua falta na *${clinic.name}*!\n\n` +
        `Faz um tempo que não te vemos por aqui. Que tal agendar um horário e cuidar de você? ✨\n\n` +
        `Digite *oi* para ver nossos serviços e agendar agora mesmo!`

      try {
        await sendText(clinic.zapi_instance_id, clinic.zapi_token, clinic.zapi_client_token, client.whatsapp, msg)
        await supabase
          .from('clients')
          .update({ reactivation_sent_at: new Date().toISOString() })
          .eq('id', client.id)
        await supabase.from('messages').insert({
          clinic_id: clinic.id,
          whatsapp: client.whatsapp,
          direction: 'outbound',
          content: msg,
        })
      } catch (e: any) {
        console.error(`[reactivation] failed for client ${client.id}:`, e?.message)
      }
    }
  }
}
