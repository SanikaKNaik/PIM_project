import React, { useState, useEffect } from 'react';
import { X, Barcode, Plus, Trash2, Sparkles, AlertCircle, Save } from 'lucide-react';
import { productsApi } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { BarcodeDisplay } from '../barcode/BarcodeDisplay';

interface ProductModalProps {
  isOpen: boolean;
  product?: any | null;
  categories: any[];
  attributes: any[];
  onClose: () => void;
  onSaved: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  categories,
  attributes,
  onClose,
  onSaved,
}) => {
  const { success, error } = useToast();
  const isEditing = Boolean(product?.id);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('Stitch Atelier');
  const [type, setType] = useState<'simple' | 'variable'>('simple');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [regularPrice, setRegularPrice] = useState('0.00');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [barcode, setBarcode] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Variants state for variable products
  const [variants, setVariants] = useState<any[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setCategoryId(product.category_id || '');
      setBrand(product.brand || 'Stitch Atelier');
      setType(product.type || 'simple');
      setStatus(product.status || 'published');
      setRegularPrice(String(product.regular_price || 0));
      setSalePrice(product.sale_price ? String(product.sale_price) : '');
      setStockQuantity(String(product.stock_quantity || 0));
      setBarcode(product.barcode || '');
      setShortDescription(product.short_description || '');
      setDescription(product.description || '');
      setImageUrl(product.image_url || '');
      setVariants(product.variants || []);
    } else {
      // New product defaults
      setName('');
      const randomSku = `STH-${Date.now().toString().slice(-4)}`;
      setSku(randomSku);
      setCategoryId(categories[0]?.id || '');
      setBrand('Stitch Atelier');
      setType('simple');
      setStatus('published');
      setRegularPrice('85.00');
      setSalePrice('');
      setStockQuantity('25');
      setBarcode(`STH128${Date.now().toString().slice(-6)}`);
      setShortDescription('');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80');
      setVariants([]);
    }
    setFormError(null);
  }, [product, categories]);

  if (!isOpen) return null;

  const handleGenerateBarcode = () => {
    const generated = `STH128${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 89 + 10)}`;
    setBarcode(generated);
  };

  const handleAddVariant = () => {
    const varCount = variants.length + 1;
    const newVar = {
      id: `var-${Date.now().toString().slice(-4)}`,
      sku: `${sku || 'STH'}-V${varCount}`,
      attributes: { Color: 'Espresso Brown', Size: 'M' },
      regular_price: Number(regularPrice) || 0,
      sale_price: salePrice ? Number(salePrice) : null,
      stock_quantity: 10,
      barcode: `STH128${Date.now().toString().slice(-5)}${varCount}`,
    };
    setVariants([...variants, newVar]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend Validations
    if (!name.trim()) {
      setFormError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setFormError('Product SKU is required.');
      return;
    }
    if (isNaN(Number(regularPrice)) || Number(regularPrice) < 0) {
      setFormError('Regular price must be a valid non-negative number.');
      return;
    }
    if (salePrice && (isNaN(Number(salePrice)) || Number(salePrice) < 0)) {
      setFormError('Sale price must be a non-negative number.');
      return;
    }
    if (salePrice && Number(salePrice) > Number(regularPrice)) {
      setFormError('Sale price cannot exceed regular price.');
      return;
    }
    if (isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      setFormError('Stock quantity must be a non-negative number.');
      return;
    }
    if (!barcode.trim()) {
      setFormError('Code 128 barcode is required. Click "Generate" if needed.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category_id: categoryId || null,
      brand: brand.trim(),
      type,
      status,
      regular_price: Number(regularPrice),
      sale_price: salePrice ? Number(salePrice) : null,
      stock_quantity: parseInt(stockQuantity, 10),
      barcode: barcode.trim(),
      short_description: shortDescription.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      variants: type === 'variable' ? variants : [],
    };

    try {
      if (isEditing) {
        await productsApi.update(product.id, payload);
        success(`Updated product "${name}" successfully`);
      } else {
        await productsApi.create(payload);
        success(`Created product "${name}" successfully`);
      }
      onSaved();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save product. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DBCE] bg-[#F7F3EC]/80">
          <div>
            <h3 className="font-semibold text-lg text-[#2A201A]">
              {isEditing ? `Edit Product: ${product.name}` : 'Create New Product'}
            </h3>
            <p className="text-xs text-[#6B5B52]">
              Standardized PIM attributes and Code 128 barcode compliant
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8F7E73] hover:text-[#2A201A] p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Basic Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Heirloom Linen Workshirt"
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="e.g. STH-APP-001"
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 uppercase"
              />
            </div>
          </div>

          {/* Section 2: Category, Brand, Type, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              >
                <option value="">Unassigned</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Brand
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Product Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 font-medium"
              >
                <option value="simple">Simple Product</option>
                <option value="variable">Variable (Variants)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 capitalize"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Section 3: Pricing & Inventory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Regular Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Sale Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs tabular-nums focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>
          </div>

          {/* Section 4: Code 128 Barcode Generator & Live Preview */}
          <div className="bg-[#F7F3EC]/70 border border-[#E5DBCE] rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <span className="text-xs font-semibold text-[#49382F] block">
                  Code 128 Barcode Identifier
                </span>
                <span className="text-[11px] text-[#6B5B52]">
                  Unique machine-readable barcode for warehouse scanning & shelf labels
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E5DBCE] hover:border-[#80634D] text-[#49382F] text-xs font-medium rounded transition-colors self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B87555]" />
                <span>Auto-Generate Code 128</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="e.g. STH128001001"
                  className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
                />
              </div>

              {/* Real-time SVG Barcode preview */}
              <div className="bg-white p-2 border border-[#E5DBCE] rounded flex justify-center min-h-[56px] items-center">
                {barcode ? (
                  <BarcodeDisplay value={barcode} width={1.4} height={36} fontSize={10} />
                ) : (
                  <span className="text-xs text-[#8F7E73] italic">Barcode preview will appear here</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Variable Product Variants Builder */}
          {type === 'variable' && (
            <div className="border border-[#E5DBCE] rounded-lg p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-xs text-[#2A201A]">Product Variants Matrix</h4>
                  <p className="text-[11px] text-[#6B5B52]">Configure variant SKUs, attributes, prices and barcodes</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#F7F3EC] hover:bg-[#E5DBCE] text-[#49382F] rounded text-xs font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Variant</span>
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="text-xs text-[#8F7E73] p-4 text-center border border-dashed border-[#E5DBCE] rounded">
                  No variants defined yet. Click "Add Variant" to create combinations like Size / Color.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {variants.map((v, idx) => (
                    <div key={v.id || idx} className="grid grid-cols-12 gap-2 items-center bg-[#F7F3EC]/50 p-2 rounded border border-[#E5DBCE] text-xs">
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].sku = e.target.value.toUpperCase();
                            setVariants(updated);
                          }}
                          placeholder="Variant SKU"
                          className="w-full px-2 py-1 bg-white border border-[#E5DBCE] rounded text-[11px] font-mono"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={v.attributes?.Color || 'Espresso'}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].attributes = { ...updated[idx].attributes, Color: e.target.value };
                            setVariants(updated);
                          }}
                          placeholder="Color"
                          className="w-full px-2 py-1 bg-white border border-[#E5DBCE] rounded text-[11px]"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={v.regular_price}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].regular_price = Number(e.target.value);
                            setVariants(updated);
                          }}
                          placeholder="Price"
                          className="w-full px-2 py-1 bg-white border border-[#E5DBCE] rounded text-[11px] tabular-nums"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={v.barcode}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].barcode = e.target.value;
                            setVariants(updated);
                          }}
                          placeholder="Barcode"
                          className="w-full px-2 py-1 bg-white border border-[#E5DBCE] rounded text-[11px] font-mono"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 6: Descriptions & Media */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Short Description
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Brief one-line summary for product cards"
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Full Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed craft specifications, materials, sizing, and care instructions..."
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#49382F] mb-1">
                Product Image URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5DBCE] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5DBCE] bg-white hover:bg-[#F7F3EC] text-[#49382F] rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
