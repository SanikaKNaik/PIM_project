-- ============================================================================
-- Stitch PIM & WooCommerce Integration - Production Database Schema
-- Compatible with MySQL 8.0+ / MariaDB 10.5+
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `stitch_pim` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `stitch_pim`;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `activity_logs`;
DROP TABLE IF EXISTS `sync_logs`;
DROP TABLE IF EXISTS `woocommerce_configs`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `product_category_mappings`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `attribute_values`;
DROP TABLE IF EXISTS `attributes`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. Roles and Users
-- ----------------------------------------------------------------------------
CREATE TABLE `roles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `display_name` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `permissions` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `role_id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `department` VARCHAR(100),
  `is_active` BOOLEAN DEFAULT TRUE,
  `last_login_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. Categories
-- ----------------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `parent_id` VARCHAR(36) NULL,
  `woo_category_id` INT NULL,
  `product_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. Product Attributes & Global Term Values
-- ----------------------------------------------------------------------------
CREATE TABLE `attributes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `type` ENUM('select', 'color', 'text', 'number') DEFAULT 'select',
  `is_variant_enabled` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `attribute_values` (
  `id` VARCHAR(36) PRIMARY KEY,
  `attribute_id` VARCHAR(36) NOT NULL,
  `value` VARCHAR(100) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `color_hex` VARCHAR(10) NULL,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attrval_attr` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_attr_val` (`attribute_id`, `value`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. Products Core Table
-- ----------------------------------------------------------------------------
CREATE TABLE `products` (
  `id` VARCHAR(36) PRIMARY KEY,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `type` ENUM('simple', 'variable') NOT NULL DEFAULT 'simple',
  `status` ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  `category_id` VARCHAR(36) NULL,
  `brand` VARCHAR(100) DEFAULT 'Artisan Studio',
  `regular_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `sale_price` DECIMAL(10,2) NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `stock_status` ENUM('instock', 'outofstock', 'onbackorder') NOT NULL DEFAULT 'instock',
  `barcode` VARCHAR(100) NOT NULL UNIQUE,
  `short_description` TEXT,
  `description` LONGTEXT,
  `image_url` VARCHAR(500),
  `woo_product_id` INT NULL,
  `woo_sync_status` ENUM('synced', 'pending', 'failed', 'never') DEFAULT 'never',
  `woo_synced_at` TIMESTAMP NULL,
  `woo_last_error` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_products_sku` (`sku`),
  INDEX `idx_products_barcode` (`barcode`),
  INDEX `idx_products_status` (`status`),
  INDEX `idx_products_sync_status` (`woo_sync_status`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. Product Variants (for Variable Products)
-- ----------------------------------------------------------------------------
CREATE TABLE `product_variants` (
  `id` VARCHAR(36) PRIMARY KEY,
  `product_id` VARCHAR(36) NOT NULL,
  `sku` VARCHAR(100) NOT NULL UNIQUE,
  `attributes` JSON NOT NULL, -- e.g. {"Size": "M", "Color": "Espresso"}
  `regular_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `sale_price` DECIMAL(10,2) NULL,
  `stock_quantity` INT NOT NULL DEFAULT 0,
  `barcode` VARCHAR(100) NOT NULL UNIQUE,
  `image_url` VARCHAR(500),
  `woo_variation_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_variants_sku` (`sku`),
  INDEX `idx_variants_barcode` (`barcode`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. WooCommerce Integration Settings (Protected)
-- ----------------------------------------------------------------------------
CREATE TABLE `woocommerce_configs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `store_url` VARCHAR(255) NOT NULL,
  `consumer_key` VARCHAR(255) NOT NULL,
  `consumer_secret` VARCHAR(255) NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `auto_sync_stock` BOOLEAN DEFAULT TRUE,
  `last_connection_test` TIMESTAMP NULL,
  `connection_status` ENUM('connected', 'failed', 'untested') DEFAULT 'untested',
  `last_error_message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. Synchronization Logs & Audit History
-- ----------------------------------------------------------------------------
CREATE TABLE `sync_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `operation` ENUM('export_product', 'import_products', 'update_stock', 'delete_product') NOT NULL,
  `product_id` VARCHAR(36) NULL,
  `product_name` VARCHAR(255),
  `sku` VARCHAR(100),
  `direction` ENUM('pim_to_woo', 'woo_to_pim') NOT NULL DEFAULT 'pim_to_woo',
  `status` ENUM('success', 'failed', 'retrying') NOT NULL,
  `http_status` INT NULL,
  `message` TEXT NOT NULL,
  `payload_summary` JSON,
  `error_details` LONGTEXT,
  `initiated_by` VARCHAR(100) DEFAULT 'System',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_synclogs_status` (`status`),
  INDEX `idx_synclogs_operation` (`operation`)
) ENGINE=InnoDB;

CREATE TABLE `activity_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NULL,
  `user_name` VARCHAR(100) NOT NULL,
  `user_role` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` VARCHAR(100),
  `description` TEXT NOT NULL,
  `metadata` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_actlogs_action` (`action`),
  INDEX `idx_actlogs_created_at` (`created_at`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- INITIAL SEED DATA
-- ----------------------------------------------------------------------------

-- Roles
INSERT INTO `roles` (`id`, `name`, `display_name`, `description`, `permissions`) VALUES
('role-admin', 'admin', 'Administrator', 'Full unrestricted catalogue, sync, users and config management', '["products.create", "products.read", "products.update", "products.delete", "categories.manage", "attributes.manage", "variants.manage", "woocommerce.sync", "woocommerce.settings", "users.manage", "reports.view", "excel.import", "excel.export"]'),
('role-editor', 'editor', 'Product Manager / Editor', 'Manage products, categories, variants, barcodes and permitted sync actions', '["products.create", "products.read", "products.update", "categories.manage", "attributes.manage", "variants.manage", "woocommerce.sync", "reports.view", "excel.import", "excel.export"]'),
('role-viewer', 'viewer', 'Viewer / Auditor', 'Read-only access to catalogue, barcode lookup and reports', '["products.read", "reports.view"]');

-- Default Users (Password is 'admin123' for placement evaluation)
-- bcrypt hash for 'admin123': $2a$10$wTqgI718s0rA933uW5N4kOrjO8iNqFw.6QkI5oU9c7W9FfF1j5Y/6
INSERT INTO `users` (`id`, `role_id`, `username`, `email`, `password_hash`, `full_name`, `department`) VALUES
('usr-1', 'role-admin', 'admin', 'admin@stitchpim.internal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alexandra Rivera', 'Head of E-Commerce'),
('usr-2', 'role-editor', 'editor', 'editor@stitchpim.internal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Marcus Vance', 'Merchandising'),
('usr-3', 'role-viewer', 'viewer', 'viewer@stitchpim.internal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Elena Rostova', 'Inventory Auditor');

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `product_count`) VALUES
('cat-1', 'Apparel & Textiles', 'apparel-textiles', 'Organic cotton tops, linen shirting and knitwear', 5),
('cat-2', 'Leather Goods', 'leather-goods', 'Hand-stitched full grain accessories and satchels', 3),
('cat-3', 'Footwear', 'footwear', 'Benchcrafted leather boots, oxfords and loafers', 3),
('cat-4', 'Studio Ceramics', 'studio-ceramics', 'Handcrafted stoneware, vessels and glazed tableware', 4),
('cat-5', 'Home Goods', 'home-goods', 'Woven wool throws, brass table lamps and home essentials', 2);

-- Attributes
INSERT INTO `attributes` (`id`, `name`, `code`, `type`, `is_variant_enabled`) VALUES
('attr-1', 'Color', 'pa_color', 'color', TRUE),
('attr-2', 'Size', 'pa_size', 'select', TRUE),
('attr-3', 'Material', 'pa_material', 'text', FALSE),
('attr-4', 'Finish', 'pa_finish', 'select', TRUE);

-- Attribute Values
INSERT INTO `attribute_values` (`id`, `attribute_id`, `value`, `label`, `color_hex`, `sort_order`) VALUES
('av-1', 'attr-1', 'espresso', 'Espresso Brown', '#49382F', 1),
('av-2', 'attr-1', 'terracotta', 'Terracotta Clay', '#B87555', 2),
('av-3', 'attr-1', 'sand', 'Warm Sand', '#E5DBCE', 3),
('av-4', 'attr-1', 'charcoal', 'Slate Charcoal', '#2A201A', 4),
('av-5', 'attr-2', 'S', 'Small', NULL, 1),
('av-6', 'attr-2', 'M', 'Medium', NULL, 2),
('av-7', 'attr-2', 'L', 'Large', NULL, 3),
('av-8', 'attr-2', 'XL', 'Extra Large', NULL, 4);
