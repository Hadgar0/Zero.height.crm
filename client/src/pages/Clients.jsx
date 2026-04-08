import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import { Plus, Search, Pencil, Trash2, Phone, Mail, Building2, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'

const STATUS_LABELS = { active: 'Активный', inactive: 'Неактивный', lead: 'Лид' }
const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-600',
  lead: 'bg-blue-100 text-blue-700'
}

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', status: 'active', notes: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [expanded, setExpanded] = useState(null)
  const [detail, setDetail] = useState(null)
  const [interNote, setInterNote] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const params = {}
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter
    api.getClients(params).then(setClients).finally(() => setLoading(false))
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (expanded) {
      api.getClient(expanded).then(setDetail)
    } else {
      setDetail(null)
    }
  }, [expanded])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email || '', phone: c.phone || '', company: c.company || '', status: c.status, notes: c.notes || '' }); setShowModal(true) }

  const submit = async (e) => {
    e.preventDefault()
    if (editing) await api.updateClient(editing.id, form)
    else await api.createClient(form)
    setShowModal(false)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Удалить клиента?')) return
    await api.deleteClient(id)
    if (expanded === id) setExpanded(null)
    load()
  }

  const addInteraction = async (clientId) => {
    if (!interNote.trim()) return
    await api.addInteraction(clientId, { type: 'note', notes: interNote })
    setInterNote('')
    const updated = await api.getClient(clientId)
    setDetail(updated)
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Клиенты</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Поиск по имени, email, компании..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="active">Активный</option>
          <option value="lead">Лид</option>
          <option value="inactive">Неактивный</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Загрузка...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-slate-400">Клиенты не найдены</div>
      ) : (
        <div className="space-y-2">
          {clients.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                    {c.company && <span className="flex items-center gap-1"><Building2 size={11} />{c.company}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span>}
                    {c.email && <span className="flex items-center gap-1"><Mail size={11} />{c.email}</span>}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || STATUS_COLORS.inactive}`}>
                  {STATUS_LABELS[c.status] || c.status}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded"><Pencil size={15} /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded"><Trash2 size={15} /></button>
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded">
                    {expanded === c.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === c.id && detail && (
                <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Deals */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Сделки ({detail.deals?.length || 0})</p>
                    {detail.deals?.length === 0 && <p className="text-xs text-slate-400">Нет сделок</p>}
                    {detail.deals?.map(d => (
                      <div key={d.id} className="text-xs mb-1 flex justify-between">
                        <span className="text-slate-700">{d.title}</span>
                        <span className="text-slate-500">{d.amount?.toLocaleString('ru')} ₽</span>
                      </div>
                    ))}
                  </div>
                  {/* Tasks */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Задачи ({detail.tasks?.length || 0})</p>
                    {detail.tasks?.length === 0 && <p className="text-xs text-slate-400">Нет задач</p>}
                    {detail.tasks?.map(t => (
                      <div key={t.id} className="text-xs mb-1 text-slate-700">• {t.title}</div>
                    ))}
                  </div>
                  {/* Interactions */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">История</p>
                    <div className="flex gap-2 mb-2">
                      <input
                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Добавить заметку..."
                        value={interNote}
                        onChange={e => setInterNote(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addInteraction(c.id)}
                      />
                      <button onClick={() => addInteraction(c.id)} className="p-1.5 bg-blue-600 text-white rounded">
                        <MessageSquare size={12} />
                      </button>
                    </div>
                    {detail.interactions?.slice(0, 5).map(i => (
                      <div key={i.id} className="text-xs text-slate-600 mb-1">
                        <span className="text-slate-400">{new Date(i.created_at).toLocaleDateString('ru')} — </span>{i.notes}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Редактировать клиента' : 'Новый клиент'} onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Имя *</label>
              <input required className="input" value={form.name} onChange={e => field('name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="input" value={form.email} onChange={e => field('email', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Телефон</label>
                <input className="input" value={form.phone} onChange={e => field('phone', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Компания</label>
                <input className="input" value={form.company} onChange={e => field('company', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                <select className="input" value={form.status} onChange={e => field('status', e.target.value)}>
                  <option value="lead">Лид</option>
                  <option value="active">Активный</option>
                  <option value="inactive">Неактивный</option>
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
