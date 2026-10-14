import { Router } from 'express';
import {
  downloadTemplate,
  validateBatch,
  commitImport,
  exportCatalogue,
} from '../controllers/excelController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/template', downloadTemplate);
router.post('/validate', validateBatch);
router.post('/import', authenticate, authorize(['admin', 'editor']), commitImport);
router.get('/export', exportCatalogue);

export default router;
