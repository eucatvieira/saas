import { google } from 'googleapis'
import { supabase } from './supabase'

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl(clinicId: string): string {
  const oauth2 = createOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: clinicId,
  })
}

export async function exchangeCodeForTokens(code: string, clinicId: string): Promise<void> {
  const oauth2 = createOAuth2Client()
  const { tokens } = await oauth2.getToken(code)
  await supabase
    .from('clinics')
    .update({ google_calendar_token: tokens })
    .eq('id', clinicId)
}

async function getAuthorizedClient(clinicId: string) {
  const { data: clinic } = await supabase
    .from('clinics')
    .select('google_calendar_token, google_calendar_id')
    .eq('id', clinicId)
    .single()

  if (!clinic?.google_calendar_token) return null

  const oauth2 = createOAuth2Client()
  oauth2.setCredentials(clinic.google_calendar_token as any)

  // Auto-refresh token if expired
  oauth2.on('tokens', async (tokens) => {
    const merged = { ...(clinic.google_calendar_token as object), ...tokens }
    await supabase.from('clinics').update({ google_calendar_token: merged }).eq('id', clinicId)
  })

  return { oauth2, calendarId: (clinic.google_calendar_id as string) || 'primary' }
}

export async function createCalendarEvent(
  clinicId: string,
  opts: {
    summary: string
    description: string
    startAt: string   // ISO string
    endAt: string     // ISO string
    attendeeEmail?: string
  }
): Promise<string | null> {
  const auth = await getAuthorizedClient(clinicId)
  if (!auth) return null

  const calendar = google.calendar({ version: 'v3', auth: auth.oauth2 })

  const attendees = opts.attendeeEmail
    ? [{ email: opts.attendeeEmail }]
    : []

  const { data } = await calendar.events.insert({
    calendarId: auth.calendarId,
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startAt, timeZone: 'America/Sao_Paulo' },
      end: { dateTime: opts.endAt, timeZone: 'America/Sao_Paulo' },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: 60 }],
      },
    },
  })

  return data.id ?? null
}

export async function deleteCalendarEvent(clinicId: string, eventId: string): Promise<void> {
  const auth = await getAuthorizedClient(clinicId)
  if (!auth) return

  const calendar = google.calendar({ version: 'v3', auth: auth.oauth2 })
  await calendar.events.delete({ calendarId: auth.calendarId, eventId }).catch(() => {})
}

export async function updateCalendarEvent(
  clinicId: string,
  eventId: string,
  status: 'confirmed' | 'cancelled'
): Promise<void> {
  const auth = await getAuthorizedClient(clinicId)
  if (!auth) return

  const calendar = google.calendar({ version: 'v3', auth: auth.oauth2 })

  if (status === 'cancelled') {
    await calendar.events.delete({ calendarId: auth.calendarId, eventId }).catch(() => {})
  } else {
    await calendar.events.patch({
      calendarId: auth.calendarId,
      eventId,
      requestBody: { status: 'confirmed' },
    })
  }
}
