export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: Clinic
        Insert: ClinicInsert
        Update: Partial<ClinicInsert>
      }
      services: {
        Row: Service
        Insert: ServiceInsert
        Update: Partial<ServiceInsert>
      }
      professionals: {
        Row: Professional
        Insert: ProfessionalInsert
        Update: Partial<ProfessionalInsert>
      }
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: Partial<ClientInsert>
      }
      appointments: {
        Row: Appointment
        Insert: AppointmentInsert
        Update: Partial<AppointmentInsert>
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: Partial<MessageInsert>
      }
      bot_sessions: {
        Row: BotSession
        Insert: BotSessionInsert
        Update: Partial<BotSessionInsert>
      }
      faq_items: {
        Row: FaqItem
        Insert: FaqItemInsert
        Update: Partial<FaqItemInsert>
      }
    }
  }
}

export interface Clinic {
  id: string
  user_id: string
  name: string
  phone: string
  zapi_instance_id: string | null
  zapi_token: string | null
  zapi_client_token: string | null
  plan: 'basic' | 'pro' | 'elite' | 'trial'
  plan_status: 'active' | 'inactive' | 'trial'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  google_calendar_token: Json | null
  google_calendar_id: string | null
  business_hours: Json
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type ClinicInsert = Omit<Clinic, 'id' | 'created_at' | 'updated_at'>

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

export type ServiceInsert = Omit<Service, 'id' | 'created_at'>

export interface Professional {
  id: string
  clinic_id: string
  name: string
  specialties: string[]
  active: boolean
  created_at: string
}

export type ProfessionalInsert = Omit<Professional, 'id' | 'created_at'>

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

export type ClientInsert = Omit<Client, 'id' | 'created_at'>

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'

export interface Appointment {
  id: string
  clinic_id: string
  client_id: string
  service_id: string
  professional_id: string
  scheduled_at: string
  status: AppointmentStatus
  reminder_sent: boolean
  google_calendar_event_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>

export type MessageDirection = 'inbound' | 'outbound'

export interface Message {
  id: string
  clinic_id: string
  client_id: string | null
  whatsapp: string
  direction: MessageDirection
  content: string
  zapi_message_id: string | null
  created_at: string
}

export type MessageInsert = Omit<Message, 'id' | 'created_at'>

export type BotState =
  | 'idle'
  | 'selecting_service'
  | 'selecting_professional'
  | 'selecting_date'
  | 'selecting_time'
  | 'confirming'
  | 'human_takeover'

export interface BotSession {
  id: string
  clinic_id: string
  whatsapp: string
  state: BotState
  context: Json
  updated_at: string
}

export type BotSessionInsert = Omit<BotSession, 'id' | 'updated_at'>

export interface FaqItem {
  id: string
  clinic_id: string
  question: string
  answer: string
  active: boolean
  created_at: string
}

export type FaqItemInsert = Omit<FaqItem, 'id' | 'created_at'>
