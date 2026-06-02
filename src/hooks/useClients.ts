import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Client {
  id: string
  clinic_id: string
  name: string | null
  whatsapp: string
  total_appointments: number
  last_appointment_at: string | null
  reactivation_sent_at: string | null
  created_at: string
}

export function useClients(clinicId: string | null | undefined) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    if (!clinicId) return
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('created_at', { ascending: false })
    setClients((data ?? []) as Client[])
  }

  useEffect(() => {
    if (!clinicId) return
    refetch().finally(() => setLoading(false))
  }, [clinicId])

  return { clients, loading, refetch }
}
