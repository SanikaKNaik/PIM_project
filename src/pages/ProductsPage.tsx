import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Printer,
  ChevronLeft,
  ChevronRight,
  Barcode,
  ArrowUpDown,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers
} from 'lucide-react';
import { productsApi, categoriesApi, attributesApi, wooApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BarcodeDisplay } from '../components/barcode/BarcodeDisplay';
import { PrintableLabelsModal } from '../components/barcode/PrintableLabelsModal';
import { ProductModal } from '../components/products/ProductModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';

export const ProductsPage: React.FC = () => {
  const { canEdit, isAdmin } = useAuth();
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [syncFilter, setSyncFilter] = useState('all');

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Check URL params for direct actions
  useEffect(() => {
    if (searchParams.get('action') === 'new' && canEdit) {
      setEditingProduct(null);
      setIsEditModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, canEdit]);

  const loadCatalogue = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, attrRes] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        attributesApi.getAll(),
      ]);
      setProducts(prodRes.data?.data || []);
      setCategories(catRes.data || []);
      setAttributes(attrRes.data || []);
    } catch (err: any) {
      error('Failed to load product catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, []);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q))
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category_id === categoryFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter((p) => p.type === typeFilter);
    }

    if (syncFilter !== 'all') {
      result = result.filter((p) => p.woo_sync_status === syncFilter);
    }

    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, categoryFilter, statusFilter, typeFilter, syncFilter, sortBy, sortOrder]);

  // Pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!canEdit || selectedIds.size === 0) return;
    const confirm = window.confirm(`Permanently delete ${selectedIds.size} selected products?`);
    if (!confirm) return;

    try {
      const res = await productsApi.bulk('delete', Array.from(selectedIds));
      success(res.data.message);
      setSelectedIds(new Set());
      loadCatalogue();
    } catch (err: any) {
      error('Failed to delete selected products');
    }
  };

  const handleBulkSync = async () => {
    if (!canEdit || selectedIds.size === 0) return;
    try {
      const res = await productsApi.bulk('sync', Array.from(selectedIds));
      success(res.data.message);
      setSelectedIds(new Set());
      loadCatalogue();
    } catch (err: any) {
      error('Failed to queue products for sync');
    }
  };

  // Single sync
  const handleSyncSingle = async (p: any) => {
    if (!canEdit) return;
    setSyncingId(p.id);
    try {
      const res = await wooApi.syncProduct(p.id);
      success(res.data?.message || `Published "${p.name}" to WooCommerce`);
      loadCatalogue();
    } catch (err: any) {
      error(err.response?.data?.error || `Failed to sync "${p.name}"`);
    } finally {
      setSyncingId(null);
    }
  };

  // Single delete
  const handleDeleteSingle = async (p: any) => {
    if (!isAdmin) {
      info('Only administrators have permission to delete products. You may archive instead.');
      return;
    }
    const confirm = window.confirm(`Delete product "${p.name}" (${p.sku})?`);
    if (!confirm) return;

    try {
      await productsApi.delete(p.id);
      success(`Deleted "${p.name}"`);
      loadCatalogue();
    } catch (err: any) {
      error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#2A201A]">Central Product Catalogue</h2>
          <p className="text-xs text-[#6B5B52]">
            {totalItems} total products registered · Code 128 barcode compliant
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#FFFDF8] border border-[#E5DBCE] hover:border-[#80634D] text-[#49382F] rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#80634D]" />
              <span>Print Labels ({selectedIds.size})</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-4 shadow-xs space-y-3">
        {/* Search & primary filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8F7E73]" />
            <input
              type="text"
              placeholder="Search by name, SKU, barcode, or brand..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs text-[#2A201A] focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs text-[#2A201A] focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
            >
              <option value="all">All Types (Simple & Variable)</option>
              <option value="simple">Simple Products</option>
              <option value="variable">Variable Products</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Tabs & Bulk Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5DBCE]/60 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F7F3EC] rounded-lg">
            {['all', 'published', 'draft', 'archived'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md capitalize transition-colors font-medium ${
                  statusFilter === st
                    ? 'bg-white text-[#2A201A] shadow-xs'
                    : 'text-[#6B5B52] hover:text-[#2A201A]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* WooCommerce Sync Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[#8F7E73]">Sync:</span>
            <select
              value={syncFilter}
              onChange={(e) => {
                setSyncFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-[#E5DBCE] rounded text-xs"
            >
              <option value="all">All Sync States</option>
              <option value="synced">Synced</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Bulk Operations Bar */}
          {selectedIds.size > 0 && canEdit && (
            <div className="flex items-center gap-2 bg-[#F7F3EC] px-3 py-1 rounded-lg border border-[#E5DBCE]">
              <span className="font-semibold text-[#49382F]">{selectedIds.size} selected</span>
              <span className="text-[#8F7E73]">·</span>
              <button
                onClick={handleBulkSync}
                className="text-[#80634D] hover:text-[#49382F] font-medium transition-colors"
              >
                Queue Sync
              </button>
              <span className="text-[#8F7E73]">·</span>
              <button
                onClick={handleBulkDelete}
                className="text-red-700 hover:text-red-900 font-medium transition-colors"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Data Table */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F3EC] text-[#6B5B52] border-b border-[#E5DBCE] uppercase tracking-wider font-semibold">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-[#6B5B52] hover:text-[#2A201A]"
                  >
                    {selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-[#80634D]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Product Item</th>
                <th className="px-4 py-3">SKU & Barcode</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-center">WooCommerce</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DBCE]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8F7E73]">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#80634D]" />
                      <span>Loading product catalogue...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8F7E73]">
                    No products matched your search or filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p) => {
                  const isSelected = selectedIds.has(p.id);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-[#F7F3EC]/50 transition-colors ${
                        isSelected ? 'bg-[#F7F3EC]/80' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="text-[#6B5B52] hover:text-[#2A201A]"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#80634D]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product Name & Image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded border border-[#E5DBCE] shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-[#2A201A] hover:text-[#80634D] cursor-pointer truncate max-w-[200px]"
                              onClick={() => {
                                setViewingProduct(p);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              {p.name}
                            </div>
                            <div className="text-[11px] text-[#8F7E73] flex items-center gap-1.5">
                              <span>{p.brand}</span>
                              {p.type === 'variable' && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#B87555] font-medium">
                                    {p.variants?.length || 0} variants
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-[#49382F]">{p.sku}</div>
                        <div className="text-[11px] font-mono text-[#8F7E73] flex items-center gap-1 mt-0.5">
                          <Barcode className="w-3 h-3 text-[#80634D]" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap text-[#6B5B52]">
                        {p.category_name || 'Unassigned'}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                        {p.sale_price ? (
                          <div>
                            <span className="font-bold text-[#49382F]">${Number(p.sale_price).toFixed(2)}</span>
                            <span className="text-[10px] text-[#8F7E73] line-through ml-1.5">
                              ${Number(p.regular_price).toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-semibold text-[#2A201A]">${Number(p.regular_price).toFixed(2)}</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                        <div className={`font-semibold ${p.stock_quantity <= 0 ? 'text-red-700' : 'text-[#2A201A]'}`}>
                          {p.stock_quantity}
                        </div>
                        <div className="text-[10px] text-[#8F7E73] capitalize">
                          {p.stock_status}
                        </div>
                      </td>

                      {/* WooCommerce Sync */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {p.woo_sync_status === 'synced' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Synced (#{p.woo_product_id})</span>
                          </span>
                        ) : p.woo_sync_status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 text-red-700 font-medium text-[11px]" title={p.woo_last_error}>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#8F7E73] text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => {
                              setViewingProduct(p);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1 text-[#6B5B52] hover:text-[#2A201A] rounded transition-colors"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 text-[#80634D] hover:text-[#49382F] rounded transition-colors"
                              title="Edit Product"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Sync */}
                          {canEdit && (
                            <button
                              onClick={() => handleSyncSingle(p)}
                              disabled={syncingId === p.id}
                              className="p-1 text-[#80634D] hover:text-[#49382F] rounded transition-colors"
                              title="Sync with WooCommerce"
                            >
                              <RefreshCw className={`w-4 h-4 ${syncingId === p.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          {/* Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteSingle(p)}
                              className="p-1 text-red-600 hover:text-red-800 rounded transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Row Count Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5DBCE] bg-[#F7F3EC]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B5B52]">
          <div className="flex items-center gap-3">
            <span>
              Showing {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems} items
            </span>
            <div className="flex items-center gap-1.5 border-l border-[#E5DBCE] pl-3">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#E5DBCE] rounded px-1.5 py-0.5 text-xs text-[#2A201A]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-[#E5DBCE] bg-white text-[#2A201A] disabled:opacity-40 hover:bg-[#F7F3EC] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-medium text-[#2A201A]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-[#E5DBCE] bg-white text-[#2A201A] disabled:opacity-40 hover:bg-[#F7F3EC] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isEditModalOpen && (
        <ProductModal
          isOpen={isEditModalOpen}
          product={editingProduct}
          categories={categories}
          attributes={attributes}
          onClose={() => setIsEditModalOpen(false)}
          onSaved={() => {
            setIsEditModalOpen(false);
            loadCatalogue();
          }}
        />
      )}

      {/* Product Detail Modal */}
      {isDetailModalOpen && viewingProduct && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          product={viewingProduct}
          onClose={() => setIsDetailModalOpen(false)}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setEditingProduct(viewingProduct);
            setIsEditModalOpen(true);
          }}
          onSync={() => handleSyncSingle(viewingProduct)}
        />
      )}

      {/* Printable Barcode Labels Modal */}
      {isPrintModalOpen && (
        <PrintableLabelsModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          products={products.filter((p) => selectedIds.has(p.id))}
        />
      )}
    </div>
  );
};
