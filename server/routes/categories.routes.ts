import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Get all categories
router.get('/', (_req: Request, res: Response) => {
  return res.json(db.getCategories());
});

// Create category
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, parent_id } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const cat = db.createCategory({
      name: name.trim(),
      description: description?.trim() || '',
      parent_id: parent_id || null
    });

    return res.status(201).json(cat);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to create category' });
  }
});

// Update category
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    const updated = db.updateCategory(id, {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(parent_id !== undefined && { parent_id })
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Delete category (with reference check)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.deleteCategory(id);
    return res.json({ message: 'Category deleted successfully', id });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
