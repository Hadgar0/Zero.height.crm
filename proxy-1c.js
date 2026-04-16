/**
 * zero.height.crm — 1С прокси-сервер
 * Запуск: node proxy-1c.js
 * Работает на http://localhost:3001
 *
 * CRM отправляет запросы на localhost:3001/1c/...
 * Прокси пробрасывает их в реальный 1С сервер
 */

const http = require('http')
const https = require('https')
const url = require('url')

const PORT = 3001

// ── CORS заголовки ────────────────────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

// ── Читаем настройки из аргументов или используем дефолт ─────────────────────
// node proxy-1c.js http://89.169.28.198/unf_2025/ru_RU/ СаминовАС пароль
const [,, ARG_URL, ARG_LOGIN, ARG_PASS] = process.argv

const server = http.createServer((req, res) => {
  setCors(res)

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Конфигурация — читаем из query ?url=...&login=...&pass=...
  // или из аргументов командной строки
  const parsed = url.parse(req.url, true)
  const path = parsed.pathname // например /1c/items

  // Эндпоинт /config — возвращаем текущие настройки
  if (path === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ url: ARG_URL || '', login: ARG_LOGIN || '', status: 'running', port: PORT }))
    return
  }

  // Все запросы /1c/* проксируем в 1С
  if (!path.startsWith('/1c/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Используй /1c/<endpoint>' }))
    return
  }

  const target1c = parsed.query.url || ARG_URL || ''
  const login    = parsed.query.login || ARG_LOGIN || ''
  const pass     = parsed.query.pass  || ARG_PASS  || ''

  if (!target1c) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Укажи URL 1С через ?url=... или аргумент командной строки' }))
    return
  }

  // Формируем URL для 1С
  const endpoint = path.replace('/1c/', '') // items, warehouses, goods, ...
  const oneC_url = target1c.replace(/\/$/, '') + '/' + endpoint

  const parsedTarget = url.parse(oneC_url)
  const isHttps = parsedTarget.protocol === 'https:'
  const lib = isHttps ? https : http

  const auth = Buffer.from(login + ':' + pass).toString('base64')

  console.log(`[${new Date().toLocaleTimeString('ru')}] ${req.method} ${oneC_url}`)

  // Собираем тело запроса
  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    const options = {
      hostname: parsedTarget.hostname,
      port: parsedTarget.port || (isHttps ? 443 : 80),
      path: parsedTarget.path,
      method: req.method,
      headers: {
        'Authorization': 'Basic ' + auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }

    if (body) options.headers['Content-Length'] = Buffer.byteLength(body)

    const proxy = lib.request(options, (proxyRes) => {
      let data = ''
      proxyRes.on('data', chunk => data += chunk)
      proxyRes.on('end', () => {
        res.writeHead(proxyRes.statusCode, {
          'Content-Type': proxyRes.headers['content-type'] || 'application/json',
          'Access-Control-Allow-Origin': '*'
        })
        res.end(data)
      })
    })

    proxy.on('error', (e) => {
      console.error('Ошибка проксирования:', e.message)
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Не удалось подключиться к 1С: ' + e.message }))
    })

    if (body) proxy.write(body)
    proxy.end()
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log('╔════════════════════════════════════════╗')
  console.log('║   zero.height.crm — 1С Прокси-сервер  ║')
  console.log('╠════════════════════════════════════════╣')
  console.log(`║  Адрес:  http://localhost:${PORT}          ║`)
  if (ARG_URL)   console.log(`║  1С URL: ${ARG_URL.slice(0,32).padEnd(32)}║`)
  if (ARG_LOGIN) console.log(`║  Логин:  ${ARG_LOGIN.padEnd(32)}║`)
  console.log('╠════════════════════════════════════════╣')
  console.log('║  CRM будет слать запросы на:           ║')
  console.log(`║  http://localhost:${PORT}/1c/<endpoint>    ║`)
  console.log('╚════════════════════════════════════════╝')
  console.log('')
  console.log('Пример: http://localhost:3001/1c/items?url=http://89.169.28.198/...')
  console.log('Для остановки: Ctrl+C')
})
