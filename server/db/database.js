const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crm.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    title TEXT NOT NULL,
    amount REAL DEFAULT 0,
    stage TEXT DEFAULT 'new',
    status TEXT DEFAULT 'open',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    deal_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (deal_id) REFERENCES deals(id)
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    type TEXT DEFAULT 'note',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

// Seed demo data if empty
const clientCount = db.prepare('SELECT COUNT(*) as cnt FROM clients').get();
if (clientCount.cnt === 0) {
  const insertClient = db.prepare(
    'INSERT INTO clients (name, email, phone, company, status, notes) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertDeal = db.prepare(
    'INSERT INTO deals (client_id, title, amount, stage, status) VALUES (?, ?, ?, ?, ?)'
  );
  const insertTask = db.prepare(
    'INSERT INTO tasks (client_id, title, priority, due_date, status) VALUES (?, ?, ?, ?, ?)'
  );

  const c1 = insertClient.run('Иван Петров', 'ivan@example.com', '+7 900 123-45-67', 'ООО Ромашка', 'active', 'Крупный клиент');
  const c2 = insertClient.run('Анна Смирнова', 'anna@example.com', '+7 910 987-65-43', 'ИП Смирнова', 'active', '');
  const c3 = insertClient.run('Сергей Козлов', 'sergey@example.com', '+7 920 555-00-11', 'Козлов и Ко', 'inactive', 'Требует внимания');

  insertDeal.run(c1.lastInsertRowid, 'Поставка оборудования', 150000, 'negotiation', 'open');
  insertDeal.run(c1.lastInsertRowid, 'Техническое обслуживание', 45000, 'won', 'closed');
  insertDeal.run(c2.lastInsertRowid, 'Консультация', 25000, 'proposal', 'open');
  insertDeal.run(c3.lastInsertRowid, 'Разработка сайта', 80000, 'new', 'open');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  insertTask.run(c1.lastInsertRowid, 'Позвонить для уточнения деталей', 'high', tomorrow.toISOString(), 'pending');
  insertTask.run(c2.lastInsertRowid, 'Отправить коммерческое предложение', 'medium', nextWeek.toISOString(), 'pending');
  insertTask.run(c3.lastInsertRowid, 'Провести встречу', 'low', nextWeek.toISOString(), 'completed');
}

module.exports = db;
