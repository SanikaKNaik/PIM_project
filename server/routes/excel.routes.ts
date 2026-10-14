import { Router, Request, Response } from 'express';
import * as XLSX from 'xlsx';
import { db } from '../db/database';

const router = Router();

// Generate and download sample Excel import template
router.get('/template', (_req: Request, res: Response) => {
  const sampleData = [
    {
      'SKU *': 'STH-APP-701',
      'Product Name *': 'Merino Crewneck Sweater',
      'Category': 'Apparel & Textiles',
      'Brand': 'Stitch Atelier',
      'Type (simple/variable)': 'simple',
      'Regular Price *': 165.00,
      'Sale Price': 145.00,
      'Stock Quantity *': 35,
      'Barcode (Code 128)': 'STH128701001',
      'Status': 'published',
      'Short Description': 'Fine gauge 19.5 micron Australian merino crewneck.',
      'Description': 'Knitted with seamless whole-garment 3D technology for zero yarn waste and an ergonomic drape.'
    },
    {
      'SKU *': 'STH-LEA-702',
      'Product Name *': 'Bridle Leather Watch Strap',
      'Category': 'Leather Goods',
      'Brand': 'Stitch Leatherworks',
      'Type (simple/variable)': 'simple',
      'Regular Price *': 68.00,
      'Sale Price': null,
      'Stock Quantity *': 50,
      'Barcode (Code 128)': 'STH128702001',
      'Status': 'draft',
      'Short Description': '20mm tapered vegetable tanned watch strap with quick-release spring bars.',
      'Description': 'Lined with hypoallergenic French zermatt calfskin for maximum wrist comfort and sweat resistance.'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename="stitch_pim_product_import_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
});

// Validate uploaded batch rows (from Excel or JSON array)
router.post('/validate', (req: Request, res: Response) => {
  const { rows } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No row data provided in payload.' });
  }

  const validRows: any[] = [];
  const invalidRows: any[] = [];
  const seenSKUsInFile = new Set<string>();
  const seenBarcodesInFile = new Set<string>();

  const categories = db.getCategories();

  rows.forEach((row: any, index: number) => {
    const rowNum = index + 2; // account for header row
    const errors: string[] = [];

    // Map common column name variations
    const sku = (row['SKU *'] || row['SKU'] || row['sku'] || '').toString().trim();
    const name = (row['Product Name *'] || row['Product Name'] || row['name'] || '').toString().trim();
    const categoryName = (row['Category'] || row['category'] || '').toString().trim();
    const regPriceRaw = row['Regular Price *'] || row['Regular Price'] || row['regular_price'] || row['price'];
    const salePriceRaw = row['Sale Price'] || row['sale_price'];
    const stockRaw = row['Stock Quantity *'] || row['Stock Quantity'] || row['stock_quantity'] || row['stock'] || 0;
    const barcode = (row['Barcode (Code 128)'] || row['Barcode'] || row['barcode'] || '').toString().trim();
    const brand = (row['Brand'] || row['brand'] || 'Stitch Atelier').toString().trim();
    const type = (row['Type (simple/variable)'] || row['Type'] || row['type'] || 'simple').toString().trim().toLowerCase();
    const shortDesc = (row['Short Description'] || row['short_description'] || '').toString().trim();
    const desc = (row['Description'] || row['description'] || '').toString().trim();

    // Required field checks
    if (!name) errors.push('Product name is required.');
    if (!sku) {
      errors.push('SKU is required.');
    } else {
      // Check file internal duplicate
      if (seenSKUsInFile.has(sku.toUpperCase())) {
        errors.push(`Duplicate SKU "${sku}" found multiple times inside uploaded file.`);
      } else {
        seenSKUsInFile.add(sku.toUpperCase());
      }

      // Check DB existing duplicate
      if (db.getProductBySku(sku)) {
        errors.push(`SKU "${sku}" already exists in the PIM database.`);
      }
    }

    // Barcode uniqueness check
    if (barcode) {
      if (seenBarcodesInFile.has(barcode)) {
        errors.push(`Duplicate barcode "${barcode}" found multiple times inside uploaded file.`);
      } else {
        seenBarcodesInFile.add(barcode);
      }

      if (db.getProductByBarcode(barcode)) {
        errors.push(`Barcode "${barcode}" already exists in database.`);
      }
    }

    // Price checks
    const regPrice = Number(regPriceRaw);
    if (regPriceRaw === undefined || regPriceRaw === '' || isNaN(regPrice) || regPrice < 0) {
      errors.push('Regular price must be a valid positive number.');
    }

    let salePrice: number | null = null;
    if (salePriceRaw !== undefined && salePriceRaw !== null && salePriceRaw !== '') {
      salePrice = Number(salePriceRaw);
      if (isNaN(salePrice) || salePrice < 0) {
        errors.push('Sale price must be a non-negative number.');
      } else if (salePrice > regPrice) {
        errors.push('Sale price cannot be higher than regular price.');
      }
    }

    // Stock check
    const stock = parseInt(String(stockRaw), 10);
    if (isNaN(stock) || stock < 0) {
      errors.push('Stock quantity must be a non-negative integer.');
    }

    // Category mapping
    let matchedCatId: string | null = null;
    if (categoryName) {
      const match = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase() || c.slug === categoryName.toLowerCase());
      if (match) {
        matchedCatId = match.id;
      } else {
        errors.push(`Category "${categoryName}" does not exist in PIM. Create the category first or leave blank.`);
      }
    }

    const parsedItem = {
      row_number: rowNum,
      sku: sku.toUpperCase(),
      name,
      category_id: matchedCatId,
      category_name: categoryName || 'Unassigned',
      brand,
      type: type === 'variable' ? 'variable' : 'simple',
      status: 'published',
      regular_price: regPrice,
      sale_price: salePrice,
      stock_quantity: isNaN(stock) ? 0 : stock,
      barcode: barcode || `STH128${Date.now().toString().slice(-5)}${index}`,
      short_description: shortDesc,
      description: desc
    };

    if (errors.length > 0) {
      invalidRows.push({
        ...parsedItem,
        errors
      });
    } else {
      validRows.push(parsedItem);
    }
  });

  return res.json({
    total_processed: rows.length,
    valid_count: validRows.length,
    invalid_count: invalidRows.length,
    valid_rows: validRows,
    invalid_rows: invalidRows
  });
});

// Commit Validated Rows
router.post('/import', (req: Request, res: Response) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No validated items provided for import.' });
  }

  const createdItems: any[] = [];
  const errors: string[] = [];

  items.forEach((item: any) => {
    try {
      const created = db.createProduct({
        sku: item.sku,
        name: item.name,
        category_id: item.category_id || null,
        brand: item.brand || 'Stitch Atelier',
        type: item.type || 'simple',
        status: item.status || 'published',
        regular_price: Number(item.regular_price),
        sale_price: item.sale_price ? Number(item.sale_price) : null,
        stock_quantity: Number(item.stock_quantity || 0),
        barcode: item.barcode,
        short_description: item.short_description || '',
        description: item.description || ''
      }, 'Excel Bulk Import');

      createdItems.push(created);
    } catch (err: any) {
      errors.push(`Failed importing SKU ${item.sku}: ${err.message}`);
    }
  });

  db.logActivity({
    user_name: 'Excel Import Service',
    user_role: 'admin',
    action: 'EXCEL_IMPORT',
    entity_type: 'product',
    entity_id: 'bulk',
    description: `Imported ${createdItems.length} products via Excel spreadsheet batch`
  });

  return res.json({
    success: true,
    message: `Successfully imported ${createdItems.length} products.`,
    imported_count: createdItems.length,
    failures: errors
  });
});

// Export Catalogue to Excel (XLSX)
router.get('/export', (req: Request, res: Response) => {
  const { format = 'xlsx', category_id, status } = req.query;
  const products = db.getProducts({
    category_id: category_id ? String(category_id) : undefined,
    status: status ? String(status) : undefined
  });

  const exportRows = products.map(p => ({
    'ID': p.id,
    'SKU': p.sku,
    'Product Name': p.name,
    'Category': p.category_name,
    'Brand': p.brand,
    'Type': p.type,
    'Status': p.status,
    'Regular Price ($)': p.regular_price,
    'Sale Price ($)': p.sale_price || '',
    'Stock Quantity': p.stock_quantity,
    'Stock Status': p.stock_status,
    'Barcode (Code 128)': p.barcode,
    'WooCommerce ID': p.woo_product_id || 'Not linked',
    'Sync Status': p.woo_sync_status,
    'Last Synced': p.woo_synced_at || '',
    'Created At': p.created_at
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    res.setHeader('Content-Disposition', 'attachment; filename="stitch_pim_catalogue.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  }

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="stitch_pim_catalogue.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
});

export default router;
