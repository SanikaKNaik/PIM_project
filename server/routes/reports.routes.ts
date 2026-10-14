import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Overall stats
router.get('/overview', (_req: Request, res: Response) => {
  return res.json(db.getStats());
});

// Category breakdown
router.get('/categories-distribution', (_req: Request, res: Response) => {
  const categories = db.getCategories();
  const distribution = categories.map(c => {
    const productsInCat = db.products.filter(p => p.category_id === c.id);
    const value = productsInCat.reduce((acc, p) => acc + (p.regular_price * p.stock_quantity), 0);
    return {
      category_id: c.id,
      category_name: c.name,
      count: productsInCat.length,
      valuation: value
    };
  });

  return res.json(distribution);
});

// Activity logs
router.get('/activity', (_req: Request, res: Response) => {
  return res.json(db.getActivityLogs());
});

// Database status & configuration
router.get('/database-status', (_req: Request, res: Response) => {
  const isMySql = db.isMySqlConnected;
  return res.json({
    engine: isMySql ? 'MySQL 8.0' : 'Unified In-Memory / File Store',
    host: process.env.DB_HOST || 'local-fallback (configure DB_HOST for live MySQL)',
    database: process.env.DB_NAME || 'stitch_pim',
    connected: true,
    is_live_mysql: isMySql,
    connection_error: db.connectionError,
    table_counts: {
      products: db.products.length,
      categories: db.categories.length,
      attributes: db.attributes.length,
      sync_logs: db.syncLogs.length,
      activity_logs: db.activityLogs.length,
      users: db.users.length
    },
    schema_script_path: '/database/schema.sql'
  });
});

export default router;
