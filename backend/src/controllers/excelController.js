import * as XLSX from 'xlsx';
import { db as memoryDb } from '../../../server/db/database.ts';

export const downloadTemplate = (_req, res) => {
  const sample = [
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
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Import_Template');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="stitch_pim_import_template.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buf);
};

export const validateBatch = (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No row data provided' });
  }

  const validRows = [];
  const invalidRows = [];
  const seenSKUs = new Set();
  const categories = memoryDb.getCategories();

  rows.forEach((row, i) => {
    const rowNum = i + 2;
    const errors = [];
    const sku = (row['SKU *'] || row['SKU'] || row['sku'] || '').toString().trim();
    const name = (row['Product Name *'] || row['Product Name'] || row['name'] || '').toString().trim();
    const catName = (row['Category'] || row['category'] || '').toString().trim();
    const regPriceRaw = row['Regular Price *'] || row['Regular Price'] || row['regular_price'] || row['price'];

    if (!name) errors.push('Product name is required.');
    if (!sku) {
      errors.push('SKU is required.');
    } else {
      if (seenSKUs.has(sku.toUpperCase())) {
        errors.push(`Duplicate SKU "${sku}" in uploaded file.`);
      } else {
        seenSKUs.add(sku.toUpperCase());
      }
      if (memoryDb.getProductBySku(sku)) {
        errors.push(`SKU "${sku}" already exists in database.`);
      }
    }

    const regPrice = Number(regPriceRaw);
    if (regPriceRaw === undefined || isNaN(regPrice) || regPrice < 0) {
      errors.push('Regular price must be a valid non-negative number.');
    }

    let catId = null;
    if (catName) {
      const match = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
      if (match) catId = match.id;
      else errors.push(`Category "${catName}" not found in PIM.`);
    }

    const item = {
      row_number: rowNum,
      sku: sku.toUpperCase(),
      name,
      category_id: catId,
      regular_price: regPrice,
      sale_price: row['Sale Price'] ? Number(row['Sale Price']) : null,
      stock_quantity: parseInt(row['Stock Quantity *'] || row['Stock Quantity'] || 0, 10),
      barcode: (row['Barcode (Code 128)'] || row['Barcode'] || '').toString().trim() || `STH128${Date.now().toString().slice(-5)}${i}`,
      brand: row['Brand'] || 'Stitch Atelier',
      type: (row['Type'] || 'simple').toLowerCase()
    };

    if (errors.length > 0) invalidRows.push({ ...item, errors });
    else validRows.push(item);
  });

  return res.json({
    total_processed: rows.length,
    valid_count: validRows.length,
    invalid_count: invalidRows.length,
    valid_rows: validRows,
    invalid_rows: invalidRows
  });
};

export const commitImport = (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No validated items provided' });
  }

  let imported = 0;
  items.forEach(item => {
    try {
      memoryDb.createProduct(item, 'Excel Bulk Import');
      imported++;
    } catch (e) {}
  });

  return res.json({
    success: true,
    message: `Successfully imported ${imported} products into PIM catalogue.`,
    imported_count: imported
  });
};

export const exportCatalogue = (req, res) => {
  const { format = 'xlsx' } = req.query;
  const products = memoryDb.getProducts();

  const exportRows = products.map(p => ({
    'SKU': p.sku,
    'Name': p.name,
    'Category': p.category_name,
    'Brand': p.brand,
    'Regular Price ($)': p.regular_price,
    'Sale Price ($)': p.sale_price || '',
    'Stock': p.stock_quantity,
    'Barcode': p.barcode,
    'WooCommerce ID': p.woo_product_id || 'Not linked',
    'Sync Status': p.woo_sync_status
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
};
