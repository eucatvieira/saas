import { useState } from 'react'
import { ExternalLink, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Clinic } from '../../hooks/useClinic'

export function WhatsAppTab({ clinic, onSaved }: { clinic: Clinic; onSaved: () => void }) {
  const [instanceId, setInstanceId] = useState(clinic.zapi_instance_id ?? '')
  const [token, setToken] = useState(clinic.zapi_token ?? '')
  const [clientToken, setClientToken] = useState(clinic.zapi_client_token ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const isConnected = !!(clinic.zapi_instance_id && clinic.zapi_token && clinic.zapi_client_token)

  async function handleSave() {
    if (!instanceId.trim() || !token.trim() || !clientToken.trim()) {
      setError('Preencha todos os campos.')
      return
    }
    setError('')
    setSaving(true)
    await supabase.from('clinics').update({
      zapi_instance_id: instanceId.trim(),
      zapi_token: token.trim(),
      zapi_client_token: clientToken.trim(),
    }).eq('id', clinic.id)
    setSaving(false)
    setSaved(true)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Conexão WhatsApp</h2>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isConnected ? 'Credenciais configuradas' : 'Não configurado'}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">Credenciais Z-API para o bot funcionar no WhatsApp da clínica.</p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-800 mb-1">Como obter as credenciais</p>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Acesse o painel Z-API e crie uma instância</li>
          <li>Copie o <strong>Instance ID</strong> e o <strong>Token</strong></li>
          <li>Copie o <strong>Client-Token</strong> do perfil de segurança</li>
        </ol>
        <a href="https://z-api.io" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-2 hover:underline">
          Abrir Z-API <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label>
          <input type="text" value={instanceId} onChange={e => setInstanceId(e.target.value)}
            placeholder="Ex: 3EB12AB34C5D"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token da instância</label>
          <input type="text" value={token} onChange={e => setToken(e.target.value)}
            placeholder="Token Z-API"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client-Token</label>
          <input type="text" value={clientToken} onChange={e => setClientToken(e.target.value)}
            placeholder="Client-Token do perfil Z-API"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {saved && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Credenciais salvas!</p>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="mt-5 px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
        {saving ? 'Salvando...' : 'Salvar credenciais'}
      </button>
    </div>
  )
}
