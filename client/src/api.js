const BASE = '/api'

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Ошибка сервера')
  return res.json()
}

export const api = {
  // Clients
  getClients: (params = {}) => req('/clients?' + new URLSearchParams(params)),
  getClient: (id) => req(`/clients/${id}`),
  createClient: (data) => req('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id, data) => req(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id) => req(`/clients/${id}`, { method: 'DELETE' }),
  addInteraction: (id, data) => req(`/clients/${id}/interactions`, { method: 'POST', body: JSON.stringify(data) }),

  // Deals
  getDeals: (params = {}) => req('/deals?' + new URLSearchParams(params)),
  getDeal: (id) => req(`/deals/${id}`),
  createDeal: (data) => req('/deals', { method: 'POST', body: JSON.stringify(data) }),
  updateDeal: (id, data) => req(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDeal: (id) => req(`/deals/${id}`, { method: 'DELETE' }),

  // Tasks
  getTasks: (params = {}) => req('/tasks?' + new URLSearchParams(params)),
  createTask: (data) => req('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => req(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: (id) => req(`/tasks/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: () => req('/analytics'),
}
