import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react'

const STAGES = [
  { key: 'new', label: 'Новая', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { key: 'qualification', label: 'Квалификация', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'proposal', label: 'КП отправлено', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { key: 'negotiation', label: 'Переговоры', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'won', label: 'Выиграна', color: 'bg-green-50 text-green-700 border-green-200' },
  { key: 'lost', label: 'Проиграна', color: 'bg-red-50 text-red-700 border-red-200' },
]

const EMPTY_FORM = { client_id: '', title: '', amount: '', stage: 'new', status: 'open', notes: '' }

export default function Deals() {
  const [deals, setDeals] = useState([])
  const [clients, setClients] = useState([])
  const [stageFilter, setStageFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [viewMode, setViewMode] = useState('kanban')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const params = {}
    if (stageFilter) params.stage = stageFilter
    api.getDeals(params).then(setDeals).finally(() => setLoading(false))
  }, [stageFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { api.getClients().then(setClients) }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (d) => {
    setEditing(d)
    setForm({ client_id: d.client_id || '', title: d.title, amount: d.amount || '', stage: d.stage, status: d.status, notes: d.notes || '' })
    setShowModal(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, amount: parseFloat(form.amount) || 0, client_id: form.client_id || null }
    if (editing) await api.updateDeal(editing.id, payload)
    else await api.createDeal(payload)
    setShowModal(false)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Удалить сделку?')) return
    await api.deleteDeal(id)
    load()
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalAmount = deals.filter(d => d.status === 'open').reduce((s, d) => s + (d.amount || 0), 0)

  const DealCard = ({ deal }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-slate-800 text-sm leading-tight">{deal.title}</p>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => openEdit(deal)} className="text-slate-400 hover:text-blue-600"><Pencil size={13} /></button>
          <button onClick={() => remove(deal.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
        </div>
      </div>
      {deal.client_name && <p className="text-xs text-slate-500 mt-1">{deal.client_name}</p>}
      {deal.amount > 0 && (
        <p className="text-xs font-semibold text-green-600 mt-2 flex items-center gap-1">
          <DollarSign size={11} />{deal.amount.toLocaleString('ru')} ₽
        </p>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Сделки</h1>
          <p className="text-sm text-slate-500 mt-0.5">Воронка: {totalAmount.toLocaleString('ru')} ₽</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >Канбан</button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >Список</button>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Загрузка...</div>
      ) : viewMode === 'kanban' ? (
        // Kanban view
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.stage === stage.key)
            const stageTotal = stageDeals.reduce((s, d) => s + (d.amount || 0), 0)
            return (
              <div key={stage.key} className="shrink-0 w-56">
                <div className={`flex items-center justify-between px-3 py-2 rounded-lg border mb-2 ${stage.color}`}>
                  <span className="text-xs font-semibold">{stage.label}</span>
                  <span className="text-xs">{stageDeals.length}</span>
                </div>
                {stageTotal > 0 && (
                  <p className="text-xs text-slate-400 px-1 mb-2">{stageTotal.toLocaleString('ru')} ₽</p>
                )}
                <div className="space-y-2">
                  {stageDeals.map(d => <DealCard key={d.id} deal={d} />)}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // List view
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Название</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Клиент</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Этап</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Сумма</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {deals.map(d => {
                const stage = STAGES.find(s => s.key === d.stage)
                return (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{d.title}</td>
                    <td className="px-4 py-3 text-slate-500">{d.client_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${stage?.color}`}>
                        {stage?.label || d.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600">
                      {d.amount ? `${d.amount.toLocaleString('ru')} ₽` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                        <button onClick={() => remove(d.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {deals.length === 0 && <p className="text-center py-10 text-slate-400">Сделки не найдены</p>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Редактировать сделку' : 'Новая сделка'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Название *</label>
              <input required className="input" value={form.title} onChange={e => field('title', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Клиент</label>
                <select className="input" value={form.client_id} onChange={e => field('client_id', e.target.value)}>
                  <option value="">— не выбран —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Сумма (₽)</label>
                <input type="number" className="input" value={form.amount} onChange={e => field('amount', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Этап</label>
                <select className="input" value={form.stage} onChange={e => field('stage', e.target.value)}>
                  {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                <select className="input" value={form.status} onChange={e => field('status', e.target.value)}>
                  <option value="open">Открыта</option>
                  <option value="closed">Закрыта</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Заметки</label>
              <textarea className="input h-20 resize-none" value={form.notes} onChange={e => field('notes', e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">Отмена</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                {editing ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
