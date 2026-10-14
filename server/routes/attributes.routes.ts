import { Router, Request, Response } from 'express';
import { db } from '../db/database';

const router = Router();

// Get all attributes & their terms
router.get('/', (_req: Request, res: Response) => {
  return res.json(db.getAttributes());
});

// Create attribute
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, code, type, is_variant_enabled } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Attribute name is required.' });
    }

    const attr = db.createAttribute({
      name: name.trim(),
      code: code ? code.trim() : undefined,
      type: type || 'select',
      is_variant_enabled: is_variant_enabled ?? true
    });

    return res.status(201).json(attr);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Add attribute term
router.post('/:id/terms', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { value, label, color_hex } = req.body;

    if (!value || !value.trim()) {
      return res.status(400).json({ error: 'Term value is required.' });
    }

    const term = db.addAttributeTerm(id, {
      value: value.trim(),
      label: label ? label.trim() : value.trim(),
      color_hex: color_hex || undefined
    });

    return res.status(201).json(term);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
