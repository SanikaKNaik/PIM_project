import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Get products list with filtering & pagination
router.get('/', (req: Request, res: Response) => {
  const { search, category_id, status, type, sync_status, page = '1', limit = '50', sort_by = 'created_at', sort_order = 'desc' } = req.query;

  let products = db.getProducts({
    search: search ? String(search) : undefined,
    category_id: category_id ? String(category_id) : undefined,
    status: status ? String(status) : undefined,
    type: type ? String(type) : undefined,
    sync_status: sync_status ? String(sync_status) : undefined,
  });

  // Sort
  products.sort((a: any, b: any) => {
    let fieldA = a[String(sort_by)] ?? '';
    let fieldB = b[String(sort_by)] ?? '';
    if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
    if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();

    if (fieldA < fieldB) return sort_order === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sort_order === 'asc' ? 1 : -1;
    return 0;
  });

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, parseInt(String(limit), 10) || 50);
  const total = products.length;
  const paginated = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return res.json({
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      total_pages: Math.ceil(total / limitNum)
    }
  });
});

// Barcode Lookup
router.get('/lookup/barcode/:barcode', (req: Request, res: Response) => {
  const { barcode } = req.params;
  const match = db.getProductByBarcode(barcode);

  if (!match) {
    return res.status(404).json({ error: `No product or variant found matching barcode "${barcode}"` });
  }

  return res.json(match);
});

// Single Product Details
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const product = db.getProductById(id);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json(product);
});

// Create Product
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      name,
      sku,
      regular_price,
      sale_price,
      category_id,
      brand,
      stock_quantity,
      type,
      status,
      barcode,
      short_description,
      description,
      image_url,
      variants
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (!sku || !sku.trim()) {
      return res.status(400).json({ error: 'Product SKU is required.' });
    }
    if (regular_price === undefined || regular_price === null || isNaN(Number(regular_price)) || Number(regular_price) < 0) {
      return res.status(400).json({ error: 'Valid non-negative regular price is required.' });
    }
    if (sale_price !== null && sale_price !== undefined && sale_price !== '') {
      if (isNaN(Number(sale_price)) || Number(sale_price) < 0) {
        return res.status(400).json({ error: 'Sale price must be a non-negative number.' });
      }
      if (Number(sale_price) > Number(regular_price)) {
        return res.status(400).json({ error: 'Sale price cannot exceed the regular price.' });
      }
    }

    // Auto-generate Code 128 barcode if not provided
    const finalBarcode = barcode && barcode.trim()
      ? barcode.trim()
      : `STH128${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 89 + 10)}`;

    const newProduct = db.createProduct({
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      regular_price: Number(regular_price),
      sale_price: sale_price ? Number(sale_price) : null,
      category_id: category_id || null,
      brand: brand?.trim() || 'Stitch Atelier',
      stock_quantity: parseInt(String(stock_quantity || 0), 10),
      type: type === 'variable' ? 'variable' : 'simple',
      status: status || 'draft',
      barcode: finalBarcode,
      short_description: short_description || '',
      description: description || '',
      image_url: image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      variants: Array.isArray(variants) ? variants : []
    });

    return res.status(201).json(newProduct);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create product' });
  }
});

// Update Product
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.regular_price !== undefined && (isNaN(Number(updates.regular_price)) || Number(updates.regular_price) < 0)) {
      return res.status(400).json({ error: 'Regular price must be non-negative.' });
    }

    if (updates.sale_price !== undefined && updates.sale_price !== null && updates.sale_price !== '') {
      const reg = updates.regular_price !== undefined ? Number(updates.regular_price) : db.getProductById(id)?.regular_price || 0;
      if (Number(updates.sale_price) > reg) {
        return res.status(400).json({ error: 'Sale price cannot exceed regular price.' });
      }
    }

    const updated = db.updateProduct(id, updates);
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to update product' });
  }
});

// Delete Product
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteProduct(id);

  if (!success) {
    return res.status(404).json({ error: 'Product not found' });
  }

  return res.json({ message: 'Product deleted successfully', id });
});

// Archive Product
router.post('/:id/archive', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const archived = db.archiveProduct(id);
    return res.json(archived);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Bulk Operations
router.post('/bulk', (req: Request, res: Response) => {
  const { action, ids, data } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'No product IDs specified' });
  }

  let count = 0;
  if (action === 'delete') {
    ids.forEach(id => {
      if (db.deleteProduct(id)) count++;
    });
    return res.json({ message: `Successfully deleted ${count} products.`, count });
  } else if (action === 'status') {
    ids.forEach(id => {
      try {
        db.updateProduct(id, { status: data.status });
        count++;
      } catch (e) {}
    });
    return res.json({ message: `Updated status for ${count} products.`, count });
  } else if (action === 'sync') {
    ids.forEach(id => {
      try {
        db.updateProduct(id, { woo_sync_status: 'pending' });
        count++;
      } catch (e) {}
    });
    return res.json({ message: `Queued ${count} products for WooCommerce sync.`, count });
  }

  return res.status(400).json({ error: `Unknown bulk action: ${action}` });
});

export default router;
