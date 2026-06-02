import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Appointment {
  id: string
  clinic_id: string
  client_id: string
  service_id: string
  professional_id: string
  scheduled_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
  reminder_sent: boolean
  notes: string | null
  created_at: string
  client: { id: string; name: string | null; whatsapp: string }
  service: { id: string; name: string; duration_minutes: number; price: number }
  professional: { id: string; name: string }
}

export function useAppointments(clinicId: string | null | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    if (!clinicId) return
    const { data } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(id, name, whatsapp),
        service:services(id, name, duration_minutes, price),
        professional:professionals(id, name)
      `)
      .eq('clinic_id', clinicId)
      .order('scheduled_at', { ascending: true })
    setAppointments((data ?? []) as unknown as Appointment[])
  }

  useEffect(() => {
    if (!clinicId) return
    refetch().finally(() => setLoading(false))
  }, [clinicId])

  return { appointments, loading, refetch }
}
