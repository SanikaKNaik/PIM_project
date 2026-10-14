import { db as memoryDb } from '../../../server/db/database.ts';
import db from '../config/db.config.js';

export const getOverview = (_req, res) => {
  return res.json(memoryDb.getStats());
};

export const getCategoriesDistribution = (_req, res) => {
  const categories = memoryDb.getCategories();
  const distribution = categories.map(c => {
    const productsInCat = memoryDb.products.filter(p => p.category_id === c.id);
    const value = productsInCat.reduce((acc, p) => acc + (p.regular_price * p.stock_quantity), 0);
    return {
      category_id: c.id,
      category_name: c.name,
      count: productsInCat.length,
      valuation: value
    };
  });
  return res.json(distribution);
};

export const getActivityLogs = (_req, res) => {
  return res.json(memoryDb.getActivityLogs());
};

export const getDatabaseStatus = (_req, res) => {
  const status = db.getStatus();
  return res.json({
    engine: status.isConnected ? 'MySQL 8.0' : 'Unified In-Memory / File Store',
    host: status.host,
    port: status.port,
    database: status.database,
    connected: true,
    is_live_mysql: status.isConnected,
    table_counts: {
      products: memoryDb.products.length,
      categories: memoryDb.categories.length,
      attributes: memoryDb.attributes.length,
      sync_logs: memoryDb.syncLogs.length,
      activity_logs: memoryDb.activityLogs.length,
      users: memoryDb.users.length
    },
    schema_script_path: 'backend/src/database/schema.sql'
  });
};
