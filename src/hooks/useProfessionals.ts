import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface Professional {
  id: string
  clinic_id: string
  name: string
  specialties: string[]
  active: boolean
  created_at: string
}

export function useProfessionals(clinicId: string | null | undefined) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    if (!clinicId) return
    const { data } = await supabase
      .from('professionals')
      .select('*')
      .eq('clinic_id', clinicId)
      .order('name')
    setProfessionals((data ?? []) as Professional[])
  }

  useEffect(() => {
    if (!clinicId) return
    refetch().finally(() => setLoading(false))
  }, [clinicId])

  return { professionals, loading, refetch }
}
