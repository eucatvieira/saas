import { Router, type Request, type Response } from 'express'
import { getAuthUrl, exchangeCodeForTokens } from '../lib/googleCalendar'

const router = Router()
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'

// Step 1: redirect clinic to Google OAuth
router.get('/google/:clinicId', (req: Request, res: Response) => {
  const clinicId = req.params.clinicId as string
  const url = getAuthUrl(clinicId)
  res.redirect(url)
})

// Step 2: Google redirects here with ?code=...&state=clinicId
router.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state: clinicId, error } = req.query as Record<string, string>

  if (error || !code || !clinicId) {
    res.redirect(`${FRONTEND}/configuracoes?tab=calendar&error=auth_failed`)
    return
  }

  try {
    await exchangeCodeForTokens(code, clinicId)
    res.redirect(`${FRONTEND}/configuracoes?tab=calendar&success=1`)
  } catch (e: any) {
    console.error('[google callback]', e?.message)
    res.redirect(`${FRONTEND}/configuracoes?tab=calendar&error=token_failed`)
  }
})

export default router
