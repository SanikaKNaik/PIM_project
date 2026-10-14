import db from '../config/db.config.js';
import { db as memoryDb } from '../../../server/db/database.ts';

export class ProductModel {
  static async findAll(filters = {}) {
    // If MySQL connected
    if (db.getStatus().isConnected) {
      try {
        let query = `
          SELECT p.*, c.name as category_name 
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id 
          WHERE 1=1
        `;
        const params = [];

        if (filters.search) {
          query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
          const s = `%${filters.search}%`;
          params.push(s, s, s);
        }
        if (filters.category_id && filters.category_id !== 'all') {
          query += ` AND p.category_id = ?`;
          params.push(filters.category_id);
        }
        if (filters.status && filters.status !== 'all') {
          query += ` AND p.status = ?`;
          params.push(filters.status);
        }
        if (filters.type && filters.type !== 'all') {
          query += ` AND p.type = ?`;
          params.push(filters.type);
        }
        if (filters.sync_status && filters.sync_status !== 'all') {
          query += ` AND p.woo_sync_status = ?`;
          params.push(filters.sync_status);
        }

        query += ` ORDER BY p.created_at DESC`;
        const rows = await db.query(query, params);
        if (rows) return rows;
      } catch (err) {
        console.warn('[ProductModel] MySQL query failed, using in-memory store:', err.message);
      }
    }

    // High performance fallback
    return memoryDb.getProducts(filters);
  }

  static async findById(id) {
    if (db.getStatus().isConnected) {
      try {
        const rows = await db.query(
          `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`,
          [id]
        );
        if (rows && rows.length > 0) {
          const product = rows[0];
          const variants = await db.query(`SELECT * FROM product_variants WHERE product_id = ?`, [id]);
          product.variants = variants || [];
          return product;
        }
      } catch (err) {
        console.warn('[ProductModel] MySQL error:', err.message);
      }
    }
    return memoryDb.getProductById(id);
  }

  static async findBySku(sku) {
    if (db.getStatus().isConnected) {
      try {
        const rows = await db.query(`SELECT * FROM products WHERE sku = ?`, [sku]);
        if (rows && rows.length > 0) return rows[0];
      } catch (err) {}
    }
    return memoryDb.getProductBySku(sku);
  }

  static async findByBarcode(barcode) {
    return memoryDb.getProductByBarcode(barcode);
  }

  static async create(data, userName = 'Admin') {
    return memoryDb.createProduct(data, userName);
  }

  static async update(id, updates, userName = 'Admin') {
    return memoryDb.updateProduct(id, updates, userName);
  }

  static async delete(id, userName = 'Admin') {
    return memoryDb.deleteProduct(id, userName);
  }

  static async archive(id, userName = 'Admin') {
    return memoryDb.archiveProduct(id, userName);
  }
}

export default ProductModel;
