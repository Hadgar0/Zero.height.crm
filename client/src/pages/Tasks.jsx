import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Modal from '../components/Modal'
import { Plus, Pencil, Trash2, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react'

const PRIORITY_COLORS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  low: 'text-green-600 bg-green-50 border-green-200'
}
const PRIORITY_LABELS = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }
const STATUS_LABELS = { pending: 'Ожидает', in_progress: 'В работе', completed: 'Выполнена', cancelled: 'Отменена' }

const EMPTY_FORM = { client_id: '', deal_id: '', title: '', description: '', status: 'pending', priority: 'medium', due_date: '' }

function isOverdue(task) {
  return task.status === 'pending' && task.due_date && new Date(task.due_date) < new Date()
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [deals, setDeals] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    const params = {}
    if (statusFilter) params.status = statusFilter
    if (priorityFilter) params.priority = priorityFilter
    api.getTasks(params).then(setTasks).finally(() => setLoading(false))
  }, [statusFilter, priorityFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    api.getClients().then(setClients)
    api.getDeals().then(setDeals)
  }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true) }
  const openEdit = (t) => {
    setEditing(t)
    setForm({
      client_id: t.client_id || '', deal_id: t.deal_id || '',
      title: t.title, description: t.description || '',
      status: t.status, priority: t.priority,
      due_date: t.due_date ? t.due_date.slice(0, 16) : ''
    })
    setShowModal(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    const payload = { ...form, client_id: form.client_id || null, deal_id: form.deal_id || null }
    if (editing) await api.updateTask(editing.id, payload)
    else await api.createTask(payload)
    setShowModal(false)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Удалить задачу?')) return
    await api.deleteTask(id)
    load()
  }

  const toggleStatus = async (task) => {
    const status = task.status === 'completed' ? 'pending' : 'completed'
    await api.updateTask(task.id, { ...task, status })
    load()
  }

  const field = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const done = tasks.filter(t => t.status === 'completed' || t.status === 'cancelled')

  const TaskRow = ({ task }) => {
    const overdue = isOverdue(task)
    return (
      <div className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 ${overdue ? 'bg-red-50/50' : ''}`}>
        <button onClick={() => toggleStatus(task)} className="mt-0.5 shrink-0">
          {task.status === 'completed'
            ? <CheckCircle2 size={18} className="text-green-500" />
            : <Circle size={18} className="text-slate-300 hover:text-blue-500" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {task.client_name && <span className="text-xs text-slate-500">{task.client_name}</span>}
            {task.deal_title && <span className="text-xs text-slate-400">• {task.deal_title}</span>}
            {task.due_date && (
              <span className={`flex items-center gap-1 text-xs ${overdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                {overdue ? <AlertCircle size={11} /> : <Clock size={11} />}
                {new Date(task.due_date).toLocaleDateString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          <button onClick={() => openEdit(task)} className="text-slate-400 hover:text-blue-600"><Pencil size={13} /></button>
          <button onClick={() => remove(task.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Задачи</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="in_progress">В работе</option>
          <option value="completed">Выполнена</option>
        </select>
        <select
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
        >
          <option value="">Все приоритеты</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Загрузка...</div>
      ) : (
        <div className="space-y-4">
          {/* Pending tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Активные задачи</h2>
              <span className="text-xs text-slate-400">{pending.length}</span>
            </div>
            {pending.length === 0
              ? <p className="text-center py-8 text-slate-400 text-sm">Нет активных задач</p>
              : pending.map(t => <TaskRow key={t.id} task={t} />)}
          </div>

          {/* Completed tasks */}
          {done.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-500">Завершённые</h2>
                <span className="text-xs text-slate-400">{done.length}</span>
              </div>
              {done.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal title={editing ? 'Редактировать задачу' : 'Новая задача'} onClose={() => setShowModal(false)}>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Сделка</label>
                <select className="input" value={form.deal_id} onChange={e => field('deal_id', e.target.value)}>
                  <option value="">— не выбрана —</option>
                  {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Приоритет</label>
                <select className="input" value={form.priority} onChange={e => field('priority', e.target.value)}>
                  <option value="high">Высокий</option>
                  <option value="medium">Средний</option>
                  <option value="low">Низкий</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус</label>
                <select className="input" value={form.status} onChange={e => field('status', e.target.value)}>
                  <option value="pending">Ожидает</option>
                  <option value="in_progress">В работе</option>
                  <option value="completed">Выполнена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Срок</label>
              <input type="datetime-local" className="input" value={form.due_date} onChange={e => field('due_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Описание</label>
              <textarea className="input h-20 resize-none" value={form.description} onChange={e => field('description', e.target.value)} />
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
