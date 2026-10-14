import { CategoryModel, AttributeModel } from '../models/Category.js';

export const getCategories = async (_req, res, next) => {
  try {
    const categories = await CategoryModel.findAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    const cat = await CategoryModel.create(req.body, userName);
    res.status(201).json(cat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    const cat = await CategoryModel.update(req.params.id, req.body, userName);
    res.json(cat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const userName = req.user?.full_name || 'Admin';
    await CategoryModel.delete(req.params.id, userName);
    res.json({ message: 'Category deleted successfully', id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAttributes = async (_req, res, next) => {
  try {
    const attrs = await AttributeModel.findAll();
    res.json(attrs);
  } catch (err) {
    next(err);
  }
};

export const createAttribute = async (req, res, next) => {
  try {
    const attr = await AttributeModel.create(req.body);
    res.status(201).json(attr);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const addAttributeTerm = async (req, res, next) => {
  try {
    const term = await AttributeModel.addTerm(req.params.id, req.body);
    res.status(201).json(term);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
