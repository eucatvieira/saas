import axios from 'axios'

const BASE = process.env.ZAPI_BASE_URL ?? 'https://api.z-api.io'

export async function sendText(
  instanceId: string,
  token: string,
  clientToken: string,
  phone: string,
  message: string
): Promise<void> {
  await axios.post(
    `${BASE}/instances/${instanceId}/token/${token}/send-text`,
    { phone, message },
    { headers: { 'Client-Token': clientToken } }
  )
}

export async function sendList(
  instanceId: string,
  token: string,
  clientToken: string,
  phone: string,
  title: string,
  description: string,
  buttonLabel: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[]
): Promise<void> {
  await axios.post(
    `${BASE}/instances/${instanceId}/token/${token}/send-list`,
    { phone, title, description, buttonLabel, sections },
    { headers: { 'Client-Token': clientToken } }
  )
}
