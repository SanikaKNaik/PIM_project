import db from '../config/db.config.js';
import { db as memoryDb } from '../../../server/db/database.ts';

export class CategoryModel {
  static async findAll() {
    if (db.getStatus().isConnected) {
      try {
        const rows = await db.query(`SELECT * FROM categories ORDER BY name ASC`);
        if (rows) return rows;
      } catch (e) {}
    }
    return memoryDb.getCategories();
  }

  static async create(data, userName) {
    return memoryDb.createCategory(data, userName);
  }

  static async update(id, data, userName) {
    return memoryDb.updateCategory(id, data, userName);
  }

  static async delete(id, userName) {
    return memoryDb.deleteCategory(id, userName);
  }
}

export class AttributeModel {
  static async findAll() {
    return memoryDb.getAttributes();
  }

  static async create(data) {
    return memoryDb.createAttribute(data);
  }

  static async addTerm(attrId, termData) {
    return memoryDb.addAttributeTerm(attrId, termData);
  }
}

export class SyncLogModel {
  static async findAll() {
    return memoryDb.getSyncLogs();
  }

  static async create(logData) {
    return memoryDb.addSyncLog(logData);
  }
}

export class ActivityLogModel {
  static async findAll() {
    return memoryDb.getActivityLogs();
  }

  static async create(actData) {
    return memoryDb.logActivity(actData);
  }
}

export class UserModel {
  static async findByUsername(username) {
    return memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  static async findById(id) {
    return memoryDb.users.find(u => u.id === id) || null;
  }

  static async findAll() {
    return memoryDb.users;
  }

  static async getRoles() {
    return memoryDb.roles;
  }
}
