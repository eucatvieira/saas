import { useEffect, useState } from 'react'
import { Calendar, CheckCircle2, ExternalLink } from 'lucide-react'
import type { Clinic } from '../../hooks/useClinic'
import { supabase } from '../../lib/supabase'

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001'

export function CalendarTab({ clinic, onSaved }: { clinic: Clinic; onSaved: () => void }) {
  const [calendarId, setCalendarId] = useState(clinic.google_calendar_id ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isConnected = !!(clinic.google_calendar_token)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'calendar' && params.get('success') === '1') {
      onSaved()
      window.history.replaceState({}, '', '/configuracoes?tab=calendar')
    }
  }, [])

  async function saveCalendarId() {
    setSaving(true)
    await supabase.from('clinics').update({ google_calendar_id: calendarId || 'primary' }).eq('id', clinic.id)
    setSaving(false)
    setSaved(true)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  function connectGoogle() {
    window.location.href = `${BACKEND}/auth/google/${clinic.id}`
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">Google Calendar</h2>
        <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
          isConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {isConnected
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> Conectado</>
            : <><Calendar className="w-3.5 h-3.5" /> Não conectado</>
          }
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Quando conectado, cada agendamento cria automaticamente um evento no seu Google Calendar.
        Disponível no plano <strong>Elite</strong>.
      </p>

      {!isConnected ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-sm font-medium text-blue-800 mb-1">Como conectar</p>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Clique em "Conectar Google Calendar"</li>
              <li>Faça login com sua conta Google</li>
              <li>Autorize o acesso ao calendário</li>
              <li>Você será redirecionado de volta aqui</li>
            </ol>
          </div>
          <button
            onClick={connectGoogle}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Conectar Google Calendar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">
              Google Calendar conectado! Novos agendamentos serão criados automaticamente.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID do calendário (opcional)
            </label>
            <input
              type="text"
              value={calendarId}
              onChange={e => setCalendarId(e.target.value)}
              placeholder="primary (padrão) ou email@gmail.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              Deixe vazio para usar o calendário principal. Encontre o ID em Configurações do Google Calendar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveCalendarId}
              disabled={saving}
              className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
            <button
              onClick={connectGoogle}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Reconectar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
