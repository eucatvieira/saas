import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Professional } from '../../hooks/useProfessionals'

interface Props {
  clinicId: string
  professionals: Professional[]
  onSaved: () => void
}

interface EditState { name: string; specialties: string[] }
const EMPTY: EditState = { name: '', specialties: [] }

export function ProfessionalsTab({ clinicId, professionals, onSaved }: Props) {
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<EditState>(EMPTY)
  const [specialty, setSpecialty] = useState('')
  const [saving, setSaving] = useState(false)

  function startAdd() { setForm(EMPTY); setSpecialty(''); setAdding(true); setEditId(null) }
  function startEdit(p: Professional) {
    setForm({ name: p.name, specialties: [...p.specialties] })
    setSpecialty('')
    setEditId(p.id)
    setAdding(false)
  }
  function cancel() { setAdding(false); setEditId(null) }

  function addSpecialty() {
    const s = specialty.trim()
    if (!s || form.specialties.includes(s)) return
    setForm(f => ({ ...f, specialties: [...f.specialties, s] }))
    setSpecialty('')
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (adding) {
      await supabase.from('professionals').insert({ ...form, clinic_id: clinicId })
    } else if (editId) {
      await supabase.from('professionals').update(form).eq('id', editId)
    }
    setSaving(false)
    cancel()
    onSaved()
  }

  async function remove(id: string) {
    if (!confirm('Excluir este profissional?')) return
    await supabase.from('professionals').delete().eq('id', id)
    onSaved()
  }

  async function toggleActive(p: Professional) {
    await supabase.from('professionals').update({ active: !p.active }).eq('id', p.id)
    onSaved()
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Profissionais</h2>
          <p className="text-sm text-gray-500">{professionals.length} profissionais cadastrados</p>
        </div>
        <button onClick={startAdd}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Novo profissional
        </button>
      </div>

      {(adding || editId) && (
        <div className="border border-violet-200 rounded-xl p-4 mb-4 bg-violet-50/30 space-y-3">
          <p className="text-sm font-medium text-gray-700">{adding ? 'Novo profissional' : 'Editar profissional'}</p>
          <input type="text" placeholder="Nome completo" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Especialidades</label>
            <div className="flex gap-2 mb-2">
              <input type="text" placeholder="Ex: Depilação a laser" value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              <button onClick={addSpecialty}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors">+</button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.specialties.map(s => (
                <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs">
                  {s}
                  <button onClick={() => setForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
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
        {professionals.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">Nenhum profissional cadastrado ainda.</p>
        )}
        {professionals.map(p => (
          <div key={p.id} className={`flex items-center gap-4 py-3 ${!p.active ? 'opacity-50' : ''}`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              {p.specialties.length > 0 && (
                <p className="text-xs text-gray-500">{p.specialties.join(', ')}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(p)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${p.active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {p.active ? 'Ativo' : 'Inativo'}
              </button>
              <button onClick={() => startEdit(p)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => remove(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
