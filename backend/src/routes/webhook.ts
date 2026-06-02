import { Router, type Request, type Response } from 'express'
import { handleIncomingMessage } from '../services/botEngine'

const router = Router()

// Z-API sends a POST for every incoming message
// URL pattern: /webhook/:clinicId
router.post('/:clinicId', async (req: Request, res: Response) => {
  const clinicId = req.params.clinicId as string
  const body = req.body

  // Ignore non-text messages and messages sent by the bot itself
  if (body.fromMe) { res.sendStatus(200); return }
  if (body.type !== 'ReceivedCallback') { res.sendStatus(200); return }

  const phone: string = body.phone ?? body.from ?? ''
  const text: string = body.text?.message ?? body.listResponseMessage?.title ?? body.buttonResponseMessage?.selectedButtonId ?? ''

  if (!phone || !text) { res.sendStatus(200); return }

  // Respond immediately so Z-API doesn't retry
  res.sendStatus(200)

  // Process asynchronously
  handleIncomingMessage(clinicId, phone, text).catch(err =>
    console.error('[webhook] error:', err?.message ?? err)
  )
})

export default router
