import { useEffect, useState } from 'react'
import { api } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Users, Briefcase, CheckSquare, TrendingUp, AlertCircle, DollarSign } from 'lucide-react'

const STAGE_LABELS = {
  new: 'Новая', qualification: 'Квалификация', proposal: 'КП',
  negotiation: 'Переговоры', won: 'Выиграна', lost: 'Проиграна'
}
const STAGE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#22c55e', '#ef4444']

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Загрузка...</div>
  if (!data) return null

  const { summary, dealsByStage, revenueByMonth, tasksByPriority } = data

  const stageData = dealsByStage.map((s) => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    сделки: s.count,
    сумма: s.total
  }))

  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' }
  const priorityLabels = { high: 'Высокий', medium: 'Средний', low: 'Низкий' }
  const pieData = tasksByPriority.map((t) => ({
    name: priorityLabels[t.priority] || t.priority,
    value: t.count,
    color: priorityColors[t.priority] || '#94a3b8'
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Дашборд</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Всего клиентов" value={summary.totalClients} sub={`${summary.activeClients} активных`} icon={Users} color="bg-blue-500" />
        <StatCard label="Открытых сделок" value={summary.openDeals} sub={`из ${summary.totalDeals} всего`} icon={Briefcase} color="bg-violet-500" />
        <StatCard label="Выручка" value={`${(summary.totalRevenue / 1000).toFixed(0)}K ₽`} sub="закрытые сделки" icon={DollarSign} color="bg-green-500" />
        <StatCard label="Воронка" value={`${(summary.pipelineValue / 1000).toFixed(0)}K ₽`} sub="открытые сделки" icon={TrendingUp} color="bg-amber-500" />
        <StatCard label="Задач" value={summary.pendingTasks} sub="ожидают выполнения" icon={CheckSquare} color="bg-sky-500" />
        <StatCard label="Просрочено" value={summary.overdueTasks} sub="нужно внимание" icon={AlertCircle} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals by stage */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold mb-4">Воронка продаж</h2>
          {stageData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="сделки" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tasks by priority */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold mb-4">Задачи по приоритету</h2>
          {pieData.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">Нет задач</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by month */}
        {revenueByMonth.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 lg:col-span-2">
            <h2 className="text-base font-semibold mb-4">Выручка по месяцам</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => `${v.toLocaleString('ru')} ₽`} />
                <Bar dataKey="total" name="Выручка" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
