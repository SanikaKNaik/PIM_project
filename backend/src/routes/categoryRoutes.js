import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAttributes,
  createAttribute,
  addAttributeTerm,
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/categories', getCategories);
router.post('/categories', authenticate, authorize(['admin', 'editor']), createCategory);
router.put('/categories/:id', authenticate, authorize(['admin', 'editor']), updateCategory);
router.delete('/categories/:id', authenticate, authorize(['admin']), deleteCategory);

router.get('/attributes', getAttributes);
router.post('/attributes', authenticate, authorize(['admin', 'editor']), createAttribute);
router.post('/attributes/:id/terms', authenticate, authorize(['admin', 'editor']), addAttributeTerm);

export default router;
