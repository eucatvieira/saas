import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import webhookRouter from './routes/webhook'
import { runReminderJob } from './jobs/reminders'
import { runReactivationJob } from './jobs/reactivation'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

// Webhook Z-API: POST /webhook/:clinicId
app.use('/webhook', webhookRouter)

// ─── Cron jobs ────────────────────────────────────────────────────────────────

// Every hour: send 24h reminders
cron.schedule('0 * * * *', () => {
  runReminderJob().catch(e => console.error('[cron reminder]', e?.message))
})

// Every day at 10:00: reactivation messages
cron.schedule('0 10 * * *', () => {
  runReactivationJob().catch(e => console.error('[cron reactivation]', e?.message))
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`)
  console.log(`[server] webhook endpoint: POST /webhook/:clinicId`)
})
