import React from 'react';
import { X, Edit, RefreshCw, ShoppingBag, Barcode, CheckCircle2, XCircle, Clock, Package } from 'lucide-react';
import { BarcodeDisplay } from '../barcode/BarcodeDisplay';
import { useAuth } from '../../context/AuthContext';

interface ProductDetailModalProps {
  isOpen: boolean;
  product: any;
  onClose: () => void;
  onEdit: () => void;
  onSync: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  product,
  onClose,
  onEdit,
  onSync,
}) => {
  const { canEdit } = useAuth();
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DBCE] bg-[#F7F3EC]/80">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8F7E73]">
              <span className="font-mono">{product.sku}</span>
              <span>·</span>
              <span>{product.brand}</span>
              <span>·</span>
              <span className="capitalize">{product.type} Product</span>
            </div>
            <h3 className="font-bold text-lg text-[#2A201A] mt-0.5">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8F7E73] hover:text-[#2A201A] p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Visual & Overview */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <img
              src={product.image_url}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full sm:w-44 h-44 object-cover rounded-lg border border-[#E5DBCE] shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <span className="text-xs text-[#8F7E73]">Category</span>
                <div className="text-sm font-semibold text-[#2A201A]">
                  {product.category_name || 'Unassigned'}
                </div>
              </div>

              <div className="flex items-baseline gap-3">
                <div>
                  <span className="text-xs text-[#8F7E73]">Price</span>
                  <div className="text-xl font-bold text-[#49382F] tabular-nums">
                    ${Number(product.sale_price || product.regular_price).toFixed(2)}
                  </div>
                </div>
                {product.sale_price && (
                  <div>
                    <span className="text-xs text-[#8F7E73]">Regular</span>
                    <div className="text-sm line-through text-[#8F7E73] tabular-nums">
                      ${Number(product.regular_price).toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="border-l border-[#E5DBCE] pl-3">
                  <span className="text-xs text-[#8F7E73]">Stock Level</span>
                  <div className="text-sm font-semibold text-[#2A201A] tabular-nums">
                    {product.stock_quantity} units ({product.stock_status})
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-xs flex items-center gap-2">
                <span className="text-[#8F7E73]">Status:</span>
                <span className="font-semibold capitalize text-[#49382F]">{product.status}</span>
              </div>
            </div>
          </div>

          {/* Barcode Section */}
          <div className="bg-[#F7F3EC] p-4 rounded-lg border border-[#E5DBCE] flex flex-col items-center">
            <span className="text-xs font-semibold text-[#6B5B52] mb-1">Code 128 Machine Readable Barcode</span>
            <BarcodeDisplay value={product.barcode} width={1.8} height={48} fontSize={11} />
          </div>

          {/* WooCommerce Integration Status Card */}
          <div className="border border-[#E5DBCE] rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#49382F]">
                <ShoppingBag className="w-4 h-4 text-[#80634D]" />
                <span>WooCommerce Store Connection</span>
              </div>
              {product.woo_sync_status === 'synced' ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Synced</span>
                </span>
              ) : product.woo_sync_status === 'failed' ? (
                <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>Sync Failed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[#8F7E73] text-xs">
                  <Clock className="w-4 h-4" />
                  <span>Pending Initial Export</span>
                </span>
              )}
            </div>

            <div className="text-xs space-y-1 text-[#6B5B52]">
              <div>
                Linked Store ID: <strong className="font-mono text-[#2A201A]">{product.woo_product_id ? `#${product.woo_product_id}` : 'None'}</strong>
              </div>
              {product.woo_synced_at && (
                <div>Last Synchronized: {new Date(product.woo_synced_at).toLocaleString()}</div>
              )}
              {product.woo_last_error && (
                <div className="text-red-700 bg-red-50 p-2 rounded border border-red-200 mt-2">
                  Error Details: {product.woo_last_error}
                </div>
              )}
            </div>
          </div>

          {/* Variants Breakdown if Variable */}
          {product.type === 'variable' && product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-[#2A201A]">Product Variants ({product.variants.length})</h4>
              <div className="border border-[#E5DBCE] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F3EC] text-[#6B5B52]">
                    <tr>
                      <th className="px-3 py-2">Variant SKU</th>
                      <th className="px-3 py-2">Attributes</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Stock</th>
                      <th className="px-3 py-2 text-center">Barcode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DBCE]">
                    {product.variants.map((v: any) => (
                      <tr key={v.id}>
                        <td className="px-3 py-2 font-mono font-medium">{v.sku}</td>
                        <td className="px-3 py-2">
                          {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ')}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">
                          ${Number(v.sale_price || v.regular_price).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.stock_quantity}</td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-[#8F7E73]">
                          {v.barcode}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Descriptions */}
          {product.short_description && (
            <div>
              <span className="text-xs text-[#8F7E73] block mb-0.5">Short Description</span>
              <p className="text-xs text-[#49382F] leading-relaxed">{product.short_description}</p>
            </div>
          )}

          {product.description && (
            <div>
              <span className="text-xs text-[#8F7E73] block mb-0.5">Craft & Technical Details</span>
              <p className="text-xs text-[#6B5B52] leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-[#E5DBCE] bg-[#F7F3EC]/50 flex items-center justify-between">
          <div className="text-[11px] text-[#8F7E73]">
            Created {new Date(product.created_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={onSync}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5DBCE] hover:border-[#80634D] text-[#49382F] rounded-lg text-xs font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#80634D]" />
                <span>Sync to WooCommerce</span>
              </button>
            )}
            {canEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Product</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
