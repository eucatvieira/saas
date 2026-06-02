import { useState } from 'react'
import { ExternalLink, CheckCircle2, Smartphone } from 'lucide-react'
import type { OnboardingData } from '../../pages/OnboardingPage'
import { supabase } from '../../lib/supabase'

interface Props {
  data: OnboardingData
  update: (partial: Partial<OnboardingData>) => void
}

export function StepWhatsApp({ data }: Props) {
  const [instanceId, setInstanceId] = useState('')
  const [token, setToken] = useState('')
  const [clientToken, setClientToken] = useState('')
  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [testError, setTestError] = useState('')

  async function saveAndTest() {
    if (!instanceId.trim() || !token.trim() || !clientToken.trim()) {
      setTestError('Preencha todos os campos da Z-API.')
      return
    }
    setTesting(true)
    setTestError('')
    setConnected(false)

    const { error } = await supabase
      .from('clinics')
      .update({
        zapi_instance_id: instanceId.trim(),
        zapi_token: token.trim(),
        zapi_client_token: clientToken.trim(),
      })
      .eq('id', data.clinicId!)

    setTesting(false)
    if (error) {
      setTestError(error.message)
      return
    }
    setConnected(true)
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">Conectar WhatsApp</h2>
      <p className="text-gray-500 text-sm mt-1 mb-6">
        Usamos a Z-API para conectar o WhatsApp da sua clínica ao bot. Você precisará de uma conta na Z-API.
      </p>

      {/* Z-API guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-800 mb-2">Como obter as credenciais Z-API</p>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Acesse o painel da Z-API e crie uma instância</li>
          <li>Copie o <strong>Instance ID</strong> e o <strong>Token</strong> da instância</li>
          <li>Copie o <strong>Client-Token</strong> do seu perfil de segurança</li>
          <li>Cole os valores abaixo e salve</li>
        </ol>
        <a
          href="https://z-api.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium mt-3 hover:underline"
        >
          Abrir Z-API <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instance ID</label>
          <input
            type="text"
            value={instanceId}
            onChange={e => setInstanceId(e.target.value)}
            placeholder="Ex: 3EB12AB34C5D"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Token da instância</label>
          <input
            type="text"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Token da instância Z-API"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client-Token (segurança)</label>
          <input
            type="text"
            value={clientToken}
            onChange={e => setClientToken(e.target.value)}
            placeholder="Client-Token do perfil Z-API"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
          />
        </div>
      </div>

      {testError && <p className="text-sm text-red-500 mt-3">{testError}</p>}

      {connected && (
        <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700 font-medium">Credenciais salvas com sucesso!</p>
        </div>
      )}

      <button
        onClick={saveAndTest}
        disabled={testing}
        className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Smartphone className="w-4 h-4" />
        {testing ? 'Salvando...' : 'Salvar credenciais'}
      </button>

      <p className="text-xs text-gray-400 mt-4">
        Pode pular essa etapa agora e configurar depois em <strong>Configurações → WhatsApp</strong>.
      </p>
    </div>
  )
}
