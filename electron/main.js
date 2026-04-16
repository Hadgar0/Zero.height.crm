const { app, BrowserWindow, shell, Menu, ipcMain, Notification } = require('electron')
const path = require('path')
const http = require('http')
const https = require('https')
const url = require('url')

// ── Прокси-сервер для 1С (встроен прямо в приложение) ────────────────────────
let proxyServer = null

function startProxy() {
  proxyServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

    const parsed = url.parse(req.url, true)
    if (parsed.pathname === '/config') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ status: 'running', port: 3001, app: 'zero.height.crm' }))
      return
    }
    if (!parsed.pathname.startsWith('/1c/')) {
      res.writeHead(404); res.end('Not found'); return
    }

    const endpoint = parsed.pathname.replace('/1c/', '')
    const target = (parsed.query.url || '').replace(/\/$/, '') + '/' + endpoint
    const login = parsed.query.login || ''
    const pass = parsed.query.pass || ''
    const auth = Buffer.from(login + ':' + pass).toString('base64')
    const p = url.parse(target)
    const lib = p.protocol === 'https:' ? https : http

    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      const opts = {
        hostname: p.hostname, port: p.port || (p.protocol === 'https:' ? 443 : 80),
        path: p.path, method: req.method,
        headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/json', 'Accept': 'application/json' }
      }
      if (body) opts.headers['Content-Length'] = Buffer.byteLength(body)
      const proxy = lib.request(opts, r2 => {
        let d = ''
        r2.on('data', c => d += c)
        r2.on('end', () => {
          res.writeHead(r2.statusCode, { 'Content-Type': r2.headers['content-type'] || 'application/json', 'Access-Control-Allow-Origin': '*' })
          res.end(d)
        })
      })
      proxy.on('error', e => { res.writeHead(502); res.end(JSON.stringify({ error: e.message })) })
      if (body) proxy.write(body)
      proxy.end()
    })
  })
  proxyServer.listen(3001, '127.0.0.1')
}

// ── Главное окно ──────────────────────────────────────────────────────────────
let win

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'zero.height.crm',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // разрешаем HTTP-запросы из HTTPS-контекста
    },
    backgroundColor: '#f5f5f5',
    show: false,
    titleBarStyle: 'default',
  })

  // Загружаем CRM
  win.loadFile(path.join(__dirname, '..', 'index.html'))

  win.once('ready-to-show', () => win.show())

  // Внешние ссылки открываем в браузере
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.on('closed', () => { win = null })
}

// ── Меню ──────────────────────────────────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'CRM',
      submenu: [
        { label: '🔄 Обновить', accelerator: 'F5', click: () => win?.reload() },
        { label: '🔍 Инструменты разработчика', accelerator: 'F12', click: () => win?.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: '🛒 Открыть витрину', click: () => {
          const w = new BrowserWindow({ width: 1280, height: 800, title: 'Витрина' })
          w.loadFile(path.join(__dirname, '..', 'shop.html'))
        }},
        { type: 'separator' },
        { label: '❌ Выход', accelerator: 'Alt+F4', role: 'quit' }
      ]
    },
    {
      label: 'Правка',
      submenu: [
        { role: 'undo', label: 'Отменить' },
        { role: 'redo', label: 'Повторить' },
        { type: 'separator' },
        { role: 'cut', label: 'Вырезать' },
        { role: 'copy', label: 'Копировать' },
        { role: 'paste', label: 'Вставить' },
        { role: 'selectAll', label: 'Выделить всё' },
      ]
    },
    {
      label: 'Вид',
      submenu: [
        { label: 'Обычный размер', role: 'resetZoom' },
        { label: 'Увеличить', role: 'zoomIn', accelerator: 'Ctrl+=' },
        { label: 'Уменьшить', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Полный экран', role: 'togglefullscreen', accelerator: 'F11' },
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── Запуск ────────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  startProxy()
  createMenu()
  createWindow()
})

app.on('window-all-closed', () => {
  if (proxyServer) proxyServer.close()
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
