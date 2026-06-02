import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface Clinic {
  id: string
  user_id: string
  name: string
  phone: string
  zapi_instance_id: string | null
  zapi_token: string | null
  zapi_client_token: string | null
  plan: string
  plan_status: string
  business_hours: Record<string, { open: string; close: string; enabled: boolean }>
  onboarding_completed: boolean
  google_calendar_id: string | null
  google_calendar_token: unknown
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export function useClinic() {
  const { user } = useAuth()
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)

  async function refetch() {
    if (!user) return
    const { data } = await supabase
      .from('clinics')
      .select('*')
      .eq('user_id', user.id)
      .single()
    setClinic(data as Clinic)
  }

  useEffect(() => {
    if (!user) return
    refetch().finally(() => setLoading(false))
  }, [user])

  return { clinic, loading, refetch }
}
