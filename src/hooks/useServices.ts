import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Service {
  id: string
  clinic_id: string
  name: string
  duration_minutes: number
  price: number
  description: string | null
  active: boolean
  created_at: string
}

export function useServices(clinicId: string | null | undefined) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    if (!clinicId) return
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name')
    setServices((data ?? []) as Service[])
  }

  useEffect(() => {
    if (!clinicId) return
    refetch().finally(() => setLoading(false))
  }, [clinicId])

  return { services, loading, refetch }
}
