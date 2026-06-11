import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cron from 'node-cron'
import webhookRouter from './routes/webhook'
import authRouter from './routes/auth'
import caktoRouter from './routes/cakto'
import { runReminderJob } from './jobs/reminders'
import { runReactivationJob } from './jobs/reactivation'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use('/webhook', webhookRouter)   // Z-API: POST /webhook/:clinicId
app.use('/auth', authRouter)          // Google OAuth: GET /auth/google/:clinicId
app.use('/cakto', caktoRouter)        // Cakto: POST /cakto/webhook

// ─── Cron jobs ────────────────────────────────────────────────────────────────

cron.schedule('0 * * * *', () => {
  runReminderJob().catch(e => console.error('[cron reminder]', e?.message))
})

cron.schedule('0 10 * * *', () => {
  runReactivationJob().catch(e => console.error('[cron reactivation]', e?.message))
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT}`)
  console.log(`  POST /webhook/:clinicId  — Z-API`)
  console.log(`  GET  /auth/google/:clinicId  — Google OAuth`)
  console.log(`  POST /cakto/webhook    — Cakto events`)
})
