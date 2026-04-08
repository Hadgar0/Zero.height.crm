const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const totalClients = db.prepare('SELECT COUNT(*) as cnt FROM clients').get().cnt;
  const activeClients = db.prepare("SELECT COUNT(*) as cnt FROM clients WHERE status = 'active'").get().cnt;

  const totalDeals = db.prepare('SELECT COUNT(*) as cnt FROM deals').get().cnt;
  const openDeals = db.prepare("SELECT COUNT(*) as cnt FROM deals WHERE status = 'open'").get().cnt;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deals WHERE stage = 'won'").get().total;
  const pipelineValue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM deals WHERE status = 'open'").get().total;

  const pendingTasks = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'pending'").get().cnt;
  const overdueTasks = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE status = 'pending' AND due_date < datetime('now')").get().cnt;

  // Deals by stage
  const dealsByStage = db.prepare(`
    SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total
    FROM deals WHERE status = 'open'
    GROUP BY stage
  `).all();

  // Revenue last 6 months
  const revenueByMonth = db.prepare(`
    SELECT strftime('%Y-%m', closed_at) as month,
           COALESCE(SUM(amount), 0) as total,
           COUNT(*) as count
    FROM deals WHERE stage = 'won' AND closed_at IS NOT NULL
    AND closed_at >= datetime('now', '-6 months')
    GROUP BY month ORDER BY month
  `).all();

  // Tasks by priority
  const tasksByPriority = db.prepare(`
    SELECT priority, COUNT(*) as count FROM tasks
    WHERE status = 'pending' GROUP BY priority
  `).all();

  res.json({
    summary: {
      totalClients, activeClients,
      totalDeals, openDeals,
      totalRevenue, pipelineValue,
      pendingTasks, overdueTasks
    },
    dealsByStage,
    revenueByMonth,
    tasksByPriority
  });
});

module.exports = router;
