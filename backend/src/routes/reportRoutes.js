import { Router } from 'express';
import {
  getOverview,
  getCategoriesDistribution,
  getActivityLogs,
  getDatabaseStatus,
} from '../controllers/reportController.js';

const router = Router();

router.get('/overview', getOverview);
router.get('/categories-distribution', getCategoriesDistribution);
router.get('/activity', getActivityLogs);
router.get('/database-status', getDatabaseStatus);

export default router;
