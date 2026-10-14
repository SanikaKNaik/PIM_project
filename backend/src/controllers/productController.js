import { ProductModel } from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, category_id, status, type, sync_status, page = 1, limit = 50, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    const products = await ProductModel.findAll({
      search,
      category_id,
      status,
      type,
      sync_status,
      sort_by,
      sort_order
    });

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
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
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(product);
  } catch (err) {
    next(err);
  }
};

export const lookupByBarcode = async (req, res, next) => {
  try {
    const result = await ProductModel.findByBarcode(req.params.barcode);
    if (!result) {
      return res.status(404).json({ error: `No product or variant found for barcode "${req.params.barcode}"` });
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    const product = await ProductModel.create(req.body, userName);
    return res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    const updated = await ProductModel.update(req.params.id, req.body, userName);
    return res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    const success = await ProductModel.delete(req.params.id, userName);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ message: 'Product deleted successfully', id: req.params.id });
  } catch (err) {
    next(err);
  }
};

export const archiveProduct = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    const archived = await ProductModel.archive(req.params.id, userName);
    return res.json(archived);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const bulkAction = async (req, res, next) => {
  try {
    const { action, ids, data } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No product IDs specified' });
    }

    let count = 0;
    if (action === 'delete') {
      for (const id of ids) {
        if (await ProductModel.delete(id)) count++;
      }
      return res.json({ message: `Successfully deleted ${count} products.`, count });
    } else if (action === 'status') {
      for (const id of ids) {
        try {
          await ProductModel.update(id, { status: data.status });
          count++;
        } catch (e) {}
      }
      return res.json({ message: `Updated status for ${count} products.`, count });
    } else if (action === 'sync') {
      for (const id of ids) {
        try {
          await ProductModel.update(id, { woo_sync_status: 'pending' });
          count++;
        } catch (e) {}
      }
      return res.json({ message: `Queued ${count} products for sync.`, count });
    }

    return res.status(400).json({ error: `Unsupported bulk action: ${action}` });
  } catch (err) {
    next(err);
  }
};
