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
  `brand` VARCHAR(100) DEFAULT 'Stitch Atelier',
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
  `attributes` JSON NOT NULL,
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
INSERT INTO `users` (`id`, `role_id`, `username`, `email`, `password_hash`, `full_name`, `department`) VALUES
('usr-1', 'role-admin', 'admin', 'admin@stitchpim.internal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alexandra Rivera', 'Head of E-Commerce'),
('usr-2', 'role-editor', 'editor', 'editor@stitchpim.internal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Marcus Vance', 'Merchandising'),
('usr-3', 'role-viewer', 'viewer', 'viewer@stitchpim.internal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Elena Rostova', 'Inventory Auditor');

-- Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `product_count`) VALUES
('cat-1', 'Apparel & Textiles', 'apparel-textiles', 'Organic cotton tops, linen shirting and knitwear', 3),
('cat-2', 'Leather Goods', 'leather-goods', 'Hand-stitched full grain accessories and satchels', 2),
('cat-3', 'Footwear', 'footwear', 'Benchcrafted leather boots, oxfords and loafers', 2),
('cat-4', 'Studio Ceramics', 'studio-ceramics', 'Handcrafted stoneware, vessels and glazed tableware', 2),
('cat-5', 'Home Goods', 'home-goods', 'Woven wool throws, brass table lamps and home essentials', 1);

-- Attributes
INSERT INTO `attributes` (`id`, `name`, `code`, `type`, `is_variant_enabled`) VALUES
('attr-1', 'Color', 'pa_color', 'color', TRUE),
('attr-2', 'Size', 'pa_size', 'select', TRUE),
('attr-3', 'Material', 'pa_material', 'text', FALSE);

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

-- Products
INSERT INTO `products` (`id`, `sku`, `name`, `slug`, `type`, `status`, `category_id`, `brand`, `regular_price`, `sale_price`, `stock_quantity`, `stock_status`, `barcode`, `short_description`, `description`, `image_url`, `woo_product_id`, `woo_sync_status`, `woo_synced_at`) VALUES
('prod-001', 'STH-APP-001', 'Heirloom Linen Workshirt', 'heirloom-linen-workshirt', 'variable', 'published', 'cat-1', 'Stitch Atelier', 145.00, 125.00, 48, 'instock', 'STH128001001', 'Pre-washed French flax linen relaxed utility shirt with horn buttons.', 'Crafted from sustainable French flax linen, our Heirloom Workshirt is structured yet breathable.', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80', 4821, 'synced', NOW()),
('prod-002', 'STH-LEA-002', 'Full-Grain Artisan Field Bag', 'full-grain-artisan-field-bag', 'simple', 'published', 'cat-2', 'Stitch Leatherworks', 285.00, NULL, 14, 'instock', 'STH128002001', 'Vegetable-tanned full-grain leather messenger with solid brass hardware.', 'Hand-burnished leather messenger bag treated with organic beeswax. Holds a 15-inch laptop securely.', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80', 4825, 'synced', NOW()),
('prod-003', 'STH-CER-003', 'Hand-Turned Espresso Vessel Set', 'hand-turned-espresso-vessel-set', 'simple', 'published', 'cat-4', 'Stitch Ceramics', 64.00, 54.00, 32, 'instock', 'STH128003001', 'Pair of wheel-thrown stoneware demitasse cups with matte reactive glaze.', 'Handcrafted by studio potters. Each cup holds 3.5oz of espresso and has a tactile natural clay base.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', 4826, 'synced', NOW());

-- Variants
INSERT INTO `product_variants` (`id`, `product_id`, `sku`, `attributes`, `regular_price`, `sale_price`, `stock_quantity`, `barcode`, `woo_variation_id`) VALUES
('var-101', 'prod-001', 'STH-APP-001-SND-M', '{"Color": "Warm Sand", "Size": "M"}', 145.00, 125.00, 24, 'STH128001002', 4822),
('var-102', 'prod-001', 'STH-APP-001-SND-L', '{"Color": "Warm Sand", "Size": "L"}', 145.00, 125.00, 16, 'STH128001003', 4823),
('var-103', 'prod-001', 'STH-APP-001-TER-M', '{"Color": "Terracotta Clay", "Size": "M"}', 145.00, NULL, 8, 'STH128001004', 4824);
