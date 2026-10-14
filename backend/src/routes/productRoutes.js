import { Router } from 'express';
import {
  getProducts,
  getProductById,
  lookupByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  bulkAction,
} from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.get('/lookup/barcode/:barcode', lookupByBarcode);
router.get('/:id', getProductById);
router.post('/', authenticate, authorize(['admin', 'editor']), createProduct);
router.put('/:id', authenticate, authorize(['admin', 'editor']), updateProduct);
router.delete('/:id', authenticate, authorize(['admin']), deleteProduct);
router.post('/:id/archive', authenticate, authorize(['admin', 'editor']), archiveProduct);
router.post('/bulk', authenticate, authorize(['admin', 'editor']), bulkAction);

export default router;
