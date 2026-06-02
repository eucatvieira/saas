import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Service } from '../../hooks/useServices'

interface Props {
  clinicId: string
  services: Service[]
  onSaved: () => void
}

interface EditState {
  name: string
  duration_minutes: number
  price: number
  description: string
}

const EMPTY: EditState = { name: '', duration_minutes: 60, price: 0, description: '' }

export function ServicesTab({ clinicId, services, onSaved }: Props) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EditState>(EMPTY)
  const [saving, setSaving] = useState(false)

  function startAdd() { setForm(EMPTY); setAdding(true); setEditId(null) }
  function startEdit(s: Service) {
    setForm({ name: s.name, duration_minutes: s.duration_minutes, price: s.price, description: s.description ?? '' })
    setEditId(s.id)
    setAdding(false)
  }
  function cancel() { setAdding(false); setEditId(null) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (adding) {
      await supabase.from('services').insert({ ...form, clinic_id: clinicId })
    } else if (editId) {
      await supabase.from('services').update(form).eq('id', editId)
    }
    setSaving(false)
    cancel()
    onSaved()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este serviço?')) return
    await supabase.from('services').delete().eq('id', id)
    onSaved()
  }

  async function toggleActive(s: Service) {
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id)
    onSaved()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Serviços</h2>
          <p className="text-sm text-gray-500">{services.length} serviços cadastrados</p>
        </div>
        <button onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Novo serviço
        </button>
      </div>

      {(adding || editId) && (
        <div className="border border-violet-200 rounded-xl p-4 mb-4 bg-violet-50/30 space-y-3">
          <p className="text-sm font-medium text-gray-700">{adding ? 'Novo serviço' : 'Editar serviço'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input type="text" placeholder="Nome do serviço" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duração (min)</label>
              <input type="number" min={15} step={15} value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Preço (R$)</label>
              <input type="number" min={0} step={0.01} value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="col-span-2">
              <input type="text" placeholder="Descrição (opcional)" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              <Check className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={cancel}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {services.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Nenhum serviço cadastrado ainda.</p>
        )}
        {services.map(s => (
          <div key={s.id} className={`flex items-center gap-4 py-3 ${!s.active ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-500">{s.duration_minutes} min · R$ {s.price.toFixed(2)}</p>
              {s.description && <p className="text-xs text-gray-400 mt-0.5">{s.description}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(s)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${s.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s.active ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => startEdit(s)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(s.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
