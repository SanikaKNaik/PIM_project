import { Router } from 'express';
import {
  getConfig,
  updateConfig,
  testConnection,
  syncProduct,
  syncAll,
  importFromStore,
  getLogs,
  retryLog,
} from '../controllers/wooCommerceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/config', getConfig);
router.post('/config', authenticate, authorize(['admin']), updateConfig);
router.post('/test-connection', testConnection);
router.post('/sync/product/:id', authenticate, authorize(['admin', 'editor']), syncProduct);
router.post('/sync/all', authenticate, authorize(['admin', 'editor']), syncAll);
router.post('/import', authenticate, authorize(['admin', 'editor']), importFromStore);
router.get('/logs', getLogs);
router.post('/logs/:id/retry', authenticate, authorize(['admin', 'editor']), retryLog);

export default router;
