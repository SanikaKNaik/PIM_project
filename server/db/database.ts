import mysql, { Pool } from 'mysql2/promise';

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

export interface User {
  id: string;
  role_id: string;
  role?: string;
  username: string;
  email: string;
  full_name: string;
  department: string;
  is_active: boolean;
  password_hash?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  woo_category_id: number | null;
  product_count: number;
  created_at: string;
}

export interface AttributeTerm {
  id: string;
  attribute_id: string;
  value: string;
  label: string;
  color_hex?: string | null;
  sort_order: number;
}

export interface Attribute {
  id: string;
  name: string;
  code: string;
  type: 'select' | 'color' | 'text' | 'number';
  is_variant_enabled: boolean;
  terms: AttributeTerm[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  attributes: Record<string, string>; // e.g. { Color: 'Espresso Brown', Size: 'M' }
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  barcode: string;
  image_url?: string;
  woo_variation_id?: number | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  type: 'simple' | 'variable';
  status: 'draft' | 'published' | 'archived';
  category_id: string | null;
  category_name?: string;
  brand: string;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  barcode: string;
  short_description: string;
  description: string;
  image_url: string;
  woo_product_id: number | null;
  woo_sync_status: 'synced' | 'pending' | 'failed' | 'never';
  woo_synced_at: string | null;
  woo_last_error: string | null;
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface WooCommerceConfig {
  id: string;
  store_url: string;
  consumer_key: string;
  consumer_secret: string;
  is_active: boolean;
  auto_sync_stock: boolean;
  last_connection_test: string | null;
  connection_status: 'connected' | 'failed' | 'untested';
  last_error_message: string | null;
}

export interface SyncLog {
  id: string;
  operation: 'export_product' | 'import_products' | 'update_stock' | 'delete_product';
  product_id: string | null;
  product_name: string;
  sku: string;
  direction: 'pim_to_woo' | 'woo_to_pim';
  status: 'success' | 'failed' | 'retrying';
  http_status: number | null;
  message: string;
  payload_summary?: any;
  error_details?: string | null;
  initiated_by: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
}

// In-Memory Database with Seed Data for immediate testing & fallback
class UnifiedDataStore {
  private pool: Pool | null = null;
  public isMySqlConnected: boolean = false;
  public connectionError: string | null = null;

  public roles: Role[] = [
    {
      id: 'role-admin',
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full unrestricted catalogue, sync, users and config management',
      permissions: ['products.create', 'products.read', 'products.update', 'products.delete', 'categories.manage', 'attributes.manage', 'variants.manage', 'woocommerce.sync', 'woocommerce.settings', 'users.manage', 'reports.view', 'excel.import', 'excel.export']
    },
    {
      id: 'role-editor',
      name: 'editor',
      display_name: 'Product Manager / Editor',
      description: 'Manage products, categories, variants, barcodes and permitted sync actions',
      permissions: ['products.create', 'products.read', 'products.update', 'categories.manage', 'attributes.manage', 'variants.manage', 'woocommerce.sync', 'reports.view', 'excel.import', 'excel.export']
    },
    {
      id: 'role-viewer',
      name: 'viewer',
      display_name: 'Viewer / Auditor',
      description: 'Read-only access to catalogue, barcode lookup and reports',
      permissions: ['products.read', 'reports.view']
    }
  ];

  public users: User[] = [
    {
      id: 'usr-1',
      role_id: 'role-admin',
      role: 'admin',
      username: 'admin',
      email: 'admin@stitchpim.internal',
      full_name: 'Alexandra Rivera',
      department: 'Head of E-Commerce',
      is_active: true
    },
    {
      id: 'usr-2',
      role_id: 'role-editor',
      role: 'editor',
      username: 'editor',
      email: 'editor@stitchpim.internal',
      full_name: 'Marcus Vance',
      department: 'Merchandising',
      is_active: true
    },
    {
      id: 'usr-3',
      role_id: 'role-viewer',
      role: 'viewer',
      username: 'viewer',
      email: 'viewer@stitchpim.internal',
      full_name: 'Elena Rostova',
      department: 'Inventory Auditor',
      is_active: true
    }
  ];

  public categories: Category[] = [
    { id: 'cat-1', name: 'Apparel & Textiles', slug: 'apparel-textiles', description: 'Organic cotton tops, linen shirting and knitwear', parent_id: null, woo_category_id: 101, product_count: 3, created_at: '2026-03-01T10:00:00Z' },
    { id: 'cat-2', name: 'Leather Goods', slug: 'leather-goods', description: 'Hand-stitched full grain accessories and satchels', parent_id: null, woo_category_id: 102, product_count: 2, created_at: '2026-03-01T10:00:00Z' },
    { id: 'cat-3', name: 'Footwear', slug: 'footwear', description: 'Benchcrafted leather boots, oxfords and loafers', parent_id: null, woo_category_id: 103, product_count: 2, created_at: '2026-03-01T10:00:00Z' },
    { id: 'cat-4', name: 'Studio Ceramics', slug: 'studio-ceramics', description: 'Handcrafted stoneware, vessels and glazed tableware', parent_id: null, woo_category_id: 104, product_count: 2, created_at: '2026-03-01T10:00:00Z' },
    { id: 'cat-5', name: 'Home Accents', slug: 'home-accents', description: 'Woven wool throws and brass table fixtures', parent_id: null, woo_category_id: null, product_count: 1, created_at: '2026-03-01T10:00:00Z' }
  ];

  public attributes: Attribute[] = [
    {
      id: 'attr-1',
      name: 'Color',
      code: 'pa_color',
      type: 'color',
      is_variant_enabled: true,
      terms: [
        { id: 'av-1', attribute_id: 'attr-1', value: 'espresso', label: 'Espresso Brown', color_hex: '#49382F', sort_order: 1 },
        { id: 'av-2', attribute_id: 'attr-1', value: 'terracotta', label: 'Terracotta Clay', color_hex: '#B87555', sort_order: 2 },
        { id: 'av-3', attribute_id: 'attr-1', value: 'sand', label: 'Warm Sand', color_hex: '#E5DBCE', sort_order: 3 },
        { id: 'av-4', attribute_id: 'attr-1', value: 'charcoal', label: 'Dark Charcoal', color_hex: '#2A201A', sort_order: 4 }
      ]
    },
    {
      id: 'attr-2',
      name: 'Size',
      code: 'pa_size',
      type: 'select',
      is_variant_enabled: true,
      terms: [
        { id: 'av-5', attribute_id: 'attr-2', value: 'S', label: 'Small', sort_order: 1 },
        { id: 'av-6', attribute_id: 'attr-2', value: 'M', label: 'Medium', sort_order: 2 },
        { id: 'av-7', attribute_id: 'attr-2', value: 'L', label: 'Large', sort_order: 3 },
        { id: 'av-8', attribute_id: 'attr-2', value: 'XL', label: 'Extra Large', sort_order: 4 }
      ]
    },
    {
      id: 'attr-3',
      name: 'Material',
      code: 'pa_material',
      type: 'text',
      is_variant_enabled: false,
      terms: [
        { id: 'av-9', attribute_id: 'attr-3', value: 'wool', label: 'Merino Wool', sort_order: 1 },
        { id: 'av-10', attribute_id: 'attr-3', value: 'linen', label: 'Heavy French Linen', sort_order: 2 },
        { id: 'av-11', attribute_id: 'attr-3', value: 'leather', label: 'Vegetable Tanned Leather', sort_order: 3 }
      ]
    }
  ];

  public products: Product[] = [
    {
      id: 'prod-001',
      sku: 'STH-APP-001',
      name: 'Heirloom Linen Workshirt',
      slug: 'heirloom-linen-workshirt',
      type: 'variable',
      status: 'published',
      category_id: 'cat-1',
      brand: 'Stitch Atelier',
      regular_price: 145.00,
      sale_price: 125.00,
      stock_quantity: 48,
      stock_status: 'instock',
      barcode: 'STH128001001',
      short_description: 'Pre-washed French flax linen relaxed utility shirt with horn buttons.',
      description: 'Crafted from sustainable French flax linen, our Heirloom Workshirt is structured yet breathable. Features reinforced elbow patches, dual chest cargo pockets, and durable corozo nut buttons.',
      image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4821,
      woo_sync_status: 'synced',
      woo_synced_at: '2026-10-14T02:15:00Z',
      woo_last_error: null,
      created_at: '2026-09-12T08:30:00Z',
      updated_at: '2026-10-14T02:15:00Z',
      variants: [
        { id: 'var-101', product_id: 'prod-001', sku: 'STH-APP-001-SND-M', attributes: { Color: 'Warm Sand', Size: 'M' }, regular_price: 145.00, sale_price: 125.00, stock_quantity: 24, barcode: 'STH128001002', woo_variation_id: 4822 },
        { id: 'var-102', product_id: 'prod-001', sku: 'STH-APP-001-SND-L', attributes: { Color: 'Warm Sand', Size: 'L' }, regular_price: 145.00, sale_price: 125.00, stock_quantity: 16, barcode: 'STH128001003', woo_variation_id: 4823 },
        { id: 'var-103', product_id: 'prod-001', sku: 'STH-APP-001-TER-M', attributes: { Color: 'Terracotta Clay', Size: 'M' }, regular_price: 145.00, sale_price: null, stock_quantity: 8, barcode: 'STH128001004', woo_variation_id: 4824 }
      ]
    },
    {
      id: 'prod-002',
      sku: 'STH-LEA-002',
      name: 'Full-Grain Artisan Field Bag',
      slug: 'full-grain-artisan-field-bag',
      type: 'simple',
      status: 'published',
      category_id: 'cat-2',
      brand: 'Stitch Leatherworks',
      regular_price: 285.00,
      sale_price: null,
      stock_quantity: 14,
      stock_status: 'instock',
      barcode: 'STH128002001',
      short_description: 'Vegetable-tanned full-grain leather messenger with solid brass hardware.',
      description: 'Hand-burnished leather messenger bag treated with organic beeswax. Holds a 15-inch laptop securely with padded interior divider, pen loops, and magnetic quick-release buckles under brass rollers.',
      image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4825,
      woo_sync_status: 'synced',
      woo_synced_at: '2026-10-13T18:40:00Z',
      woo_last_error: null,
      created_at: '2026-09-18T11:20:00Z',
      updated_at: '2026-10-13T18:40:00Z'
    },
    {
      id: 'prod-003',
      sku: 'STH-CER-003',
      name: 'Hand-Turned Espresso Vessel Set',
      slug: 'hand-turned-espresso-vessel-set',
      type: 'simple',
      status: 'published',
      category_id: 'cat-4',
      brand: 'Stitch Ceramics',
      regular_price: 64.00,
      sale_price: 54.00,
      stock_quantity: 32,
      stock_status: 'instock',
      barcode: 'STH128003001',
      short_description: 'Pair of wheel-thrown stoneware demitasse cups with matte reactive glaze.',
      description: 'Handcrafted by studio potters in Kyoto. Each cup holds 3.5oz of espresso and has a tactile natural clay base contrasting against the dark espresso-tone iron-rich slip glaze.',
      image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4826,
      woo_sync_status: 'synced',
      woo_synced_at: '2026-10-12T09:12:00Z',
      woo_last_error: null,
      created_at: '2026-09-22T14:15:00Z',
      updated_at: '2026-10-12T09:12:00Z'
    },
    {
      id: 'prod-004',
      sku: 'STH-FOO-004',
      name: 'Norwegian Welt Lugged Derby',
      slug: 'norwegian-welt-lugged-derby',
      type: 'variable',
      status: 'published',
      category_id: 'cat-3',
      brand: 'Stitch Footwear',
      regular_price: 360.00,
      sale_price: null,
      stock_quantity: 19,
      stock_status: 'instock',
      barcode: 'STH128004001',
      short_description: 'Storm-welted calfskin derby shoe with Vibram Commando lug outsole.',
      description: 'Built on a classic archival British boot last. Hand-stitched storm welt provides complete water resistance while the heavy Vibram rubber sole delivers superior traction on city pavement or country trails.',
      image_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4830,
      woo_sync_status: 'synced',
      woo_synced_at: '2026-10-11T16:05:00Z',
      woo_last_error: null,
      created_at: '2026-09-25T16:00:00Z',
      updated_at: '2026-10-11T16:05:00Z',
      variants: [
        { id: 'var-401', product_id: 'prod-004', sku: 'STH-FOO-004-ESP-42', attributes: { Color: 'Espresso Brown', Size: 'M' }, regular_price: 360.00, sale_price: null, stock_quantity: 11, barcode: 'STH128004002', woo_variation_id: 4831 },
        { id: 'var-402', product_id: 'prod-004', sku: 'STH-FOO-004-ESP-43', attributes: { Color: 'Espresso Brown', Size: 'L' }, regular_price: 360.00, sale_price: null, stock_quantity: 8, barcode: 'STH128004003', woo_variation_id: 4832 }
      ]
    },
    {
      id: 'prod-005',
      sku: 'STH-APP-005',
      name: 'Boiled Merino Knit Cardigan',
      slug: 'boiled-merino-knit-cardigan',
      type: 'simple',
      status: 'draft',
      category_id: 'cat-1',
      brand: 'Stitch Atelier',
      regular_price: 210.00,
      sale_price: null,
      stock_quantity: 20,
      stock_status: 'instock',
      barcode: 'STH128005001',
      short_description: 'Dense 100% boiled wool cardigan with raglan shoulders and horn toggles.',
      description: 'Wind-resistant and naturally thermoregulating. Cut for clean everyday layering with seamless ribbed hems and patch waist pockets.',
      image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&q=80',
      woo_product_id: null,
      woo_sync_status: 'pending',
      woo_synced_at: null,
      woo_last_error: 'Awaiting first export to WooCommerce store',
      created_at: '2026-10-01T12:00:00Z',
      updated_at: '2026-10-10T14:20:00Z'
    },
    {
      id: 'prod-006',
      sku: 'STH-HOM-006',
      name: 'Raw Brass Table Luminaire',
      slug: 'raw-brass-table-luminaire',
      type: 'simple',
      status: 'published',
      category_id: 'cat-5',
      brand: 'Stitch Living',
      regular_price: 195.00,
      sale_price: 175.00,
      stock_quantity: 0,
      stock_status: 'outofstock',
      barcode: 'STH128006001',
      short_description: 'Machined solid brass desk lamp with directional swivel hood and braided cord.',
      description: 'Unlacquered solid brass that patinas gracefully with age. Features an inline rotary dimming switch and warm 2700K LED filament capsule bulb.',
      image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4835,
      woo_sync_status: 'failed',
      woo_synced_at: '2026-10-08T11:00:00Z',
      woo_last_error: 'WooCommerce API timeout (504 Gateway Timeout on image payload sync)',
      created_at: '2026-10-02T10:00:00Z',
      updated_at: '2026-10-08T11:00:00Z'
    },
    {
      id: 'prod-007',
      sku: 'STH-LEA-007',
      name: 'Minimalist Card Sleeve Folio',
      slug: 'minimalist-card-sleeve-folio',
      type: 'simple',
      status: 'published',
      category_id: 'cat-2',
      brand: 'Stitch Leatherworks',
      regular_price: 48.00,
      sale_price: null,
      stock_quantity: 65,
      stock_status: 'instock',
      barcode: 'STH128007001',
      short_description: 'Ultra-slim saddle-stitched leather card case holding up to 8 cards.',
      description: 'Cut from durable English bridle leather with hand-waxed edges. Features an ergonomic central pull notch for effortless card access.',
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4840,
      woo_sync_status: 'synced',
      woo_synced_at: '2026-10-14T01:30:00Z',
      woo_last_error: null,
      created_at: '2026-10-03T15:20:00Z',
      updated_at: '2026-10-14T01:30:00Z'
    },
    {
      id: 'prod-008',
      sku: 'STH-CER-008',
      name: 'Glazed Terracotta Pour-Over Dripper',
      slug: 'glazed-terracotta-pour-over-dripper',
      type: 'simple',
      status: 'published',
      category_id: 'cat-4',
      brand: 'Stitch Ceramics',
      regular_price: 52.00,
      sale_price: null,
      stock_quantity: 42,
      stock_status: 'instock',
      barcode: 'STH128008001',
      short_description: 'Conical ceramic coffee brewer featuring spiral interior extraction ridges.',
      description: 'Designed for standard size 02 paper filters. Interior ribbing promotes uniform extraction and optimal heat retention during the brew cycle.',
      image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
      woo_product_id: 4845,
      woo_sync_status: 'synced',
      woo_synced_at: '2026-10-13T20:10:00Z',
      woo_last_error: null,
      created_at: '2026-10-04T09:45:00Z',
      updated_at: '2026-10-13T20:10:00Z'
    }
  ];

  public wooConfig: WooCommerceConfig = {
    id: 'cfg-1',
    store_url: 'https://shop.stitch-artisan.com',
    consumer_key: 'ck_7b99c08002a246819ba25c6c0e0b3952f4',
    consumer_secret: 'cs_88a6d9102b3788a1a3196f014e2d48c0a1',
    is_active: true,
    auto_sync_stock: true,
    last_connection_test: '2026-10-14T02:50:00Z',
    connection_status: 'connected',
    last_error_message: null
  };

  public syncLogs: SyncLog[] = [
    {
      id: 'sync-001',
      operation: 'export_product',
      product_id: 'prod-001',
      product_name: 'Heirloom Linen Workshirt',
      sku: 'STH-APP-001',
      direction: 'pim_to_woo',
      status: 'success',
      http_status: 200,
      message: 'Product and 3 variations synchronized to WooCommerce ID #4821',
      payload_summary: { sku: 'STH-APP-001', regular_price: '145.00', variations_count: 3 },
      initiated_by: 'Alexandra Rivera',
      created_at: '2026-10-14T02:15:00Z'
    },
    {
      id: 'sync-002',
      operation: 'update_stock',
      product_id: 'prod-007',
      product_name: 'Minimalist Card Sleeve Folio',
      sku: 'STH-LEA-007',
      direction: 'pim_to_woo',
      status: 'success',
      http_status: 200,
      message: 'Inventory count updated to 65 units (instock)',
      payload_summary: { sku: 'STH-LEA-007', stock_quantity: 65 },
      initiated_by: 'Auto-Sync Worker',
      created_at: '2026-10-14T01:30:00Z'
    },
    {
      id: 'sync-003',
      operation: 'export_product',
      product_id: 'prod-006',
      product_name: 'Raw Brass Table Luminaire',
      sku: 'STH-HOM-006',
      direction: 'pim_to_woo',
      status: 'failed',
      http_status: 504,
      message: 'WooCommerce API timeout (504 Gateway Timeout on image payload sync)',
      payload_summary: { sku: 'STH-HOM-006', attempts: 3 },
      error_details: 'Gateway Timeout: WooCommerce server took longer than 15000ms responding to POST /wp-json/wc/v3/products/4835',
      initiated_by: 'Marcus Vance',
      created_at: '2026-10-08T11:00:00Z'
    },
    {
      id: 'sync-004',
      operation: 'import_products',
      product_id: null,
      product_name: 'Batch Catalogue Import',
      sku: 'BATCH-IMPORT',
      direction: 'woo_to_pim',
      status: 'success',
      http_status: 200,
      message: 'Fetched 8 active items from WooCommerce store',
      payload_summary: { imported_count: 8, skipped_duplicates: 0 },
      initiated_by: 'Alexandra Rivera',
      created_at: '2026-10-07T14:30:00Z'
    }
  ];

  public activityLogs: ActivityLog[] = [
    {
      id: 'act-001',
      user_name: 'Alexandra Rivera',
      user_role: 'admin',
      action: 'UPDATE_PRODUCT',
      entity_type: 'product',
      entity_id: 'prod-001',
      description: 'Updated sale price from $130.00 to $125.00 for Heirloom Linen Workshirt',
      created_at: '2026-10-14T02:14:00Z'
    },
    {
      id: 'act-002',
      user_name: 'Marcus Vance',
      user_role: 'editor',
      action: 'CREATE_PRODUCT',
      entity_type: 'product',
      entity_id: 'prod-005',
      description: 'Drafted new product Boiled Merino Knit Cardigan (SKU: STH-APP-005)',
      created_at: '2026-10-10T14:20:00Z'
    },
    {
      id: 'act-003',
      user_name: 'Alexandra Rivera',
      user_role: 'admin',
      action: 'TEST_CONNECTION',
      entity_type: 'woocommerce',
      entity_id: 'cfg-1',
      description: 'Verified active REST API connection to https://shop.stitch-artisan.com',
      created_at: '2026-10-14T02:50:00Z'
    },
    {
      id: 'act-004',
      user_name: 'Elena Rostova',
      user_role: 'viewer',
      action: 'EXPORT_EXCEL',
      entity_type: 'catalogue',
      entity_id: 'all',
      description: 'Exported complete product catalogue (8 items) to XLSX report',
      created_at: '2026-10-13T10:15:00Z'
    }
  ];

  constructor() {
    this.initMySQLIfConfigured();
  }

  private async initMySQLIfConfigured() {
    const host = process.env.DB_HOST;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME || 'stitch_pim';
    const port = Number(process.env.DB_PORT) || 3306;

    if (!host || !user) {
      console.log('[DB] No MySQL environment variables supplied (DB_HOST/DB_USER). Using high-performance Unified Store with pre-loaded demo catalogue.');
      return;
    }

    try {
      this.pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      const conn = await this.pool.getConnection();
      console.log(`[DB] Successfully connected to live MySQL instance at ${host}:${port}/${database}`);
      conn.release();
      this.isMySqlConnected = true;
    } catch (err: any) {
      this.connectionError = err.message || 'Failed to connect to MySQL';
      console.warn(`[DB] MySQL connection attempt failed: ${this.connectionError}. Falling back to resilient Unified Store.`);
      this.isMySqlConnected = false;
    }
  }

  // --- Products CRUD ---
  public getProducts(filters: { search?: string; category_id?: string; status?: string; type?: string; sync_status?: string } = {}): Product[] {
    let result = [...this.products];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }

    if (filters.category_id && filters.category_id !== 'all') {
      result = result.filter(p => p.category_id === filters.category_id);
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    if (filters.type && filters.type !== 'all') {
      result = result.filter(p => p.type === filters.type);
    }

    if (filters.sync_status && filters.sync_status !== 'all') {
      result = result.filter(p => p.woo_sync_status === filters.sync_status);
    }

    // Attach category name
    return result.map(p => {
      const cat = this.categories.find(c => c.id === p.category_id);
      return {
        ...p,
        category_name: cat ? cat.name : 'Unassigned'
      };
    });
  }

  public getProductById(id: string): Product | null {
    const p = this.products.find(x => x.id === id);
    if (!p) return null;
    const cat = this.categories.find(c => c.id === p.category_id);
    return {
      ...p,
      category_name: cat ? cat.name : 'Unassigned'
    };
  }

  public getProductBySku(sku: string): Product | null {
    return this.products.find(x => x.sku.toLowerCase() === sku.toLowerCase()) || null;
  }

  public getProductByBarcode(barcode: string): { product: Product; variant?: ProductVariant } | null {
    const trimmed = barcode.trim();
    // Check main products
    const mainProd = this.products.find(p => p.barcode === trimmed);
    if (mainProd) return { product: mainProd };

    // Check variants
    for (const p of this.products) {
      if (p.variants) {
        const v = p.variants.find(varItem => varItem.barcode === trimmed);
        if (v) return { product: p, variant: v };
      }
    }

    return null;
  }

  public createProduct(data: Partial<Product>, userName: string = 'Admin'): Product {
    // Validate SKU uniqueness
    if (this.getProductBySku(data.sku || '')) {
      throw new Error(`SKU "${data.sku}" already exists in the catalogue.`);
    }

    // Validate Barcode uniqueness
    if (data.barcode && this.getProductByBarcode(data.barcode)) {
      throw new Error(`Barcode "${data.barcode}" is already assigned to another item.`);
    }

    const id = `prod-${Date.now().toString().slice(-6)}`;
    const newProduct: Product = {
      id,
      sku: data.sku || `STH-${Date.now().toString().slice(-4)}`,
      name: data.name || 'Untitled Product',
      slug: (data.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: data.type || 'simple',
      status: data.status || 'draft',
      category_id: data.category_id || null,
      brand: data.brand || 'Stitch Atelier',
      regular_price: Number(data.regular_price) || 0,
      sale_price: data.sale_price ? Number(data.sale_price) : null,
      stock_quantity: Number(data.stock_quantity) || 0,
      stock_status: (Number(data.stock_quantity) || 0) > 0 ? 'instock' : 'outofstock',
      barcode: data.barcode || `STH128${Date.now().toString().slice(-6)}`,
      short_description: data.short_description || '',
      description: data.description || '',
      image_url: data.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      woo_product_id: null,
      woo_sync_status: 'never',
      woo_synced_at: null,
      woo_last_error: null,
      variants: data.variants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.products.unshift(newProduct);
    this.updateCategoryCounts();

    this.logActivity({
      user_name: userName,
      user_role: 'admin',
      action: 'CREATE_PRODUCT',
      entity_type: 'product',
      entity_id: newProduct.id,
      description: `Created product "${newProduct.name}" (SKU: ${newProduct.sku})`
    });

    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>, userName: string = 'Admin'): Product {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Product not found');

    const existing = this.products[idx];

    // Check SKU collision
    if (updates.sku && updates.sku !== existing.sku) {
      const match = this.getProductBySku(updates.sku);
      if (match && match.id !== id) {
        throw new Error(`SKU "${updates.sku}" is already in use by another product.`);
      }
    }

    // Check Barcode collision
    if (updates.barcode && updates.barcode !== existing.barcode) {
      const match = this.getProductByBarcode(updates.barcode);
      if (match && match.product.id !== id) {
        throw new Error(`Barcode "${updates.barcode}" is already in use.`);
      }
    }

    const updated: Product = {
      ...existing,
      ...updates,
      stock_status: (updates.stock_quantity !== undefined ? Number(updates.stock_quantity) : existing.stock_quantity) > 0 ? 'instock' : 'outofstock',
      updated_at: new Date().toISOString()
    };

    this.products[idx] = updated;
    this.updateCategoryCounts();

    this.logActivity({
      user_name: userName,
      user_role: 'admin',
      action: 'UPDATE_PRODUCT',
      entity_type: 'product',
      entity_id: updated.id,
      description: `Updated product "${updated.name}" (${updated.sku})`
    });

    return updated;
  }

  public deleteProduct(id: string, userName: string = 'Admin'): boolean {
    const prod = this.products.find(p => p.id === id);
    if (!prod) return false;

    this.products = this.products.filter(p => p.id !== id);
    this.updateCategoryCounts();

    this.logActivity({
      user_name: userName,
      user_role: 'admin',
      action: 'DELETE_PRODUCT',
      entity_type: 'product',
      entity_id: id,
      description: `Deleted product "${prod.name}" (${prod.sku})`
    });

    return true;
  }

  public archiveProduct(id: string, userName: string = 'Admin'): Product {
    return this.updateProduct(id, { status: 'archived' }, userName);
  }

  // --- Categories ---
  public getCategories(): Category[] {
    this.updateCategoryCounts();
    return this.categories;
  }

  public createCategory(data: Partial<Category>, userName: string = 'Admin'): Category {
    const slug = (data.slug || data.name || 'cat').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (this.categories.some(c => c.slug === slug || c.name.toLowerCase() === (data.name || '').toLowerCase())) {
      throw new Error(`Category "${data.name}" already exists.`);
    }

    const cat: Category = {
      id: `cat-${Date.now().toString().slice(-5)}`,
      name: data.name || 'New Category',
      slug,
      description: data.description || '',
      parent_id: data.parent_id || null,
      woo_category_id: null,
      product_count: 0,
      created_at: new Date().toISOString()
    };

    this.categories.push(cat);

    this.logActivity({
      user_name: userName,
      user_role: 'admin',
      action: 'CREATE_CATEGORY',
      entity_type: 'category',
      entity_id: cat.id,
      description: `Created category "${cat.name}"`
    });

    return cat;
  }

  public updateCategory(id: string, updates: Partial<Category>, userName: string = 'Admin'): Category {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');

    this.categories[idx] = {
      ...this.categories[idx],
      ...updates
    };

    return this.categories[idx];
  }

  public deleteCategory(id: string, userName: string = 'Admin'): boolean {
    const hasProducts = this.products.some(p => p.category_id === id);
    if (hasProducts) {
      throw new Error('Cannot delete category: products are assigned to this category. Reassign them first.');
    }

    const cat = this.categories.find(c => c.id === id);
    this.categories = this.categories.filter(c => c.id !== id);

    if (cat) {
      this.logActivity({
        user_name: userName,
        user_role: 'admin',
        action: 'DELETE_CATEGORY',
        entity_type: 'category',
        entity_id: id,
        description: `Deleted category "${cat.name}"`
      });
    }

    return true;
  }

  private updateCategoryCounts() {
    for (const cat of this.categories) {
      cat.product_count = this.products.filter(p => p.category_id === cat.id).length;
    }
  }

  // --- Attributes ---
  public getAttributes(): Attribute[] {
    return this.attributes;
  }

  public createAttribute(data: Partial<Attribute>): Attribute {
    const code = (data.code || data.name || 'attr').toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if (this.attributes.some(a => a.code === code)) {
      throw new Error(`Attribute with code "${code}" already exists.`);
    }

    const attr: Attribute = {
      id: `attr-${Date.now().toString().slice(-5)}`,
      name: data.name || 'Attribute',
      code,
      type: data.type || 'select',
      is_variant_enabled: data.is_variant_enabled ?? true,
      terms: []
    };

    this.attributes.push(attr);
    return attr;
  }

  public addAttributeTerm(attributeId: string, term: { value: string; label: string; color_hex?: string }): AttributeTerm {
    const attr = this.attributes.find(a => a.id === attributeId);
    if (!attr) throw new Error('Attribute not found');

    if (attr.terms.some(t => t.value.toLowerCase() === term.value.toLowerCase())) {
      throw new Error(`Term value "${term.value}" already exists for this attribute.`);
    }

    const newTerm: AttributeTerm = {
      id: `av-${Date.now().toString().slice(-5)}`,
      attribute_id: attributeId,
      value: term.value,
      label: term.label,
      color_hex: term.color_hex || null,
      sort_order: attr.terms.length + 1
    };

    attr.terms.push(newTerm);
    return newTerm;
  }

  // --- WooCommerce ---
  public getWooConfig(): WooCommerceConfig {
    return this.wooConfig;
  }

  public updateWooConfig(updates: Partial<WooCommerceConfig>): WooCommerceConfig {
    this.wooConfig = {
      ...this.wooConfig,
      ...updates
    };
    return this.wooConfig;
  }

  public addSyncLog(log: Omit<SyncLog, 'id' | 'created_at'>): SyncLog {
    const newLog: SyncLog = {
      id: `sync-${Date.now().toString().slice(-6)}`,
      ...log,
      created_at: new Date().toISOString()
    };
    this.syncLogs.unshift(newLog);
    // Keep max 100 logs
    if (this.syncLogs.length > 100) this.syncLogs.pop();
    return newLog;
  }

  public getSyncLogs(): SyncLog[] {
    return this.syncLogs;
  }

  // --- Activity Logs ---
  public logActivity(log: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog {
    const newLog: ActivityLog = {
      id: `act-${Date.now().toString().slice(-6)}`,
      ...log,
      created_at: new Date().toISOString()
    };
    this.activityLogs.unshift(newLog);
    if (this.activityLogs.length > 100) this.activityLogs.pop();
    return newLog;
  }

  public getActivityLogs(): ActivityLog[] {
    return this.activityLogs;
  }

  // --- Dashboard Statistics ---
  public getStats() {
    const totalProducts = this.products.length;
    const publishedProducts = this.products.filter(p => p.status === 'published').length;
    const draftProducts = this.products.filter(p => p.status === 'draft').length;
    const outOfStock = this.products.filter(p => p.stock_quantity <= 0).length;
    const lowStock = this.products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
    const totalCategories = this.categories.length;

    let totalVariants = 0;
    this.products.forEach(p => {
      if (p.variants) totalVariants += p.variants.length;
    });

    const syncedCount = this.products.filter(p => p.woo_sync_status === 'synced').length;
    const pendingSyncCount = this.products.filter(p => p.woo_sync_status === 'pending').length;
    const failedSyncCount = this.products.filter(p => p.woo_sync_status === 'failed').length;

    const inventoryValue = this.products.reduce((acc, p) => acc + (p.regular_price * p.stock_quantity), 0);

    return {
      totalProducts,
      publishedProducts,
      draftProducts,
      outOfStock,
      lowStock,
      totalCategories,
      totalVariants,
      syncedCount,
      pendingSyncCount,
      failedSyncCount,
      inventoryValue,
      wooConnection: this.wooConfig.connection_status,
      lastSyncTime: this.syncLogs[0]?.created_at || null,
      isMySqlConnected: this.isMySqlConnected
    };
  }
}

export const db = new UnifiedDataStore();
