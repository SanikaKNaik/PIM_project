import React, { useState } from 'react';
import { X, Search, Barcode, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { productsApi } from '../../api/client';
import { BarcodeDisplay } from './BarcodeDisplay';

interface BarcodeLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: any) => void;
}

export const BarcodeLookupModal: React.FC<BarcodeLookupModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (codeToSearch?: string) => {
    const code = (codeToSearch || barcodeInput).trim();
    if (!code) return;

    setIsLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await productsApi.getByBarcode(code);
      setResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || `No product or variant found with barcode "${code}"`);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleBarcodes = [
    { label: 'Linen Workshirt', code: 'STH128001001' },
    { label: 'Workshirt Variant (M)', code: 'STH128001002' },
    { label: 'Field Bag', code: 'STH128002001' },
    { label: 'Espresso Cups', code: 'STH128003001' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DBCE] bg-[#F7F3EC]/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#49382F] text-white rounded-lg">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2A201A]">Barcode Lookup & Scanner</h3>
              <p className="text-xs text-[#6B5B52]">Scan or enter a Code 128 barcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8F7E73] hover:text-[#2A201A] p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#8F7E73]" />
              <input
                type="text"
                autoFocus
                placeholder="e.g. STH128001001"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5DBCE] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#80634D]/40 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !barcodeInput.trim()}
              className="px-4 py-2.5 bg-[#49382F] text-white rounded-lg text-sm font-medium hover:bg-[#382b24] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? 'Scanning...' : 'Lookup'}
            </button>
          </form>

          {/* Quick Test Samples */}
          <div>
            <div className="text-xs font-medium text-[#6B5B52] mb-2">Test with sample Code 128 barcodes:</div>
            <div className="flex flex-wrap gap-1.5">
              {sampleBarcodes.map((s) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => {
                    setBarcodeInput(s.code);
                    handleSearch(s.code);
                  }}
                  className="text-xs px-2.5 py-1 bg-[#F7F3EC] border border-[#E5DBCE] rounded hover:border-[#80634D] hover:bg-white transition-colors text-[#49382F]"
                >
                  {s.label} ({s.code})
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Matched Product Result */}
          {result && (
            <div className="border border-[#E5DBCE] rounded-lg p-4 bg-white shadow-xs">
              <div className="flex items-start gap-4">
                <img
                  src={result.product.image_url}
                  alt={result.product.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-cover rounded-md border border-[#E5DBCE] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#8F7E73] mb-1">
                    <span className="font-mono">{result.product.sku}</span>
                    <span>·</span>
                    <span>{result.product.brand}</span>
                    {result.variant && (
                      <>
                        <span>·</span>
                        <span className="text-[#B87555] font-medium">Variant</span>
                      </>
                    )}
                  </div>
                  <h4 className="font-semibold text-[#2A201A] truncate text-base">
                    {result.product.name}
                  </h4>

                  {result.variant && (
                    <div className="text-xs text-[#6B5B52] mt-0.5">
                      Selected: {Object.entries(result.variant.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="font-semibold text-[#49382F] tabular-nums">
                      ${(result.variant?.sale_price || result.variant?.regular_price || result.product.sale_price || result.product.regular_price).toFixed(2)}
                    </span>
                    <span className="text-xs text-[#6B5B52]">
                      Stock: <strong className="tabular-nums">{result.variant ? result.variant.stock_quantity : result.product.stock_quantity} units</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Barcode display */}
              <div className="mt-4 pt-3 border-t border-[#E5DBCE] flex justify-center bg-[#F7F3EC]/50 rounded py-2">
                <BarcodeDisplay
                  value={result.variant?.barcode || result.product.barcode}
                  width={1.6}
                  height={40}
                  fontSize={11}
                />
              </div>

              {onSelectProduct && (
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectProduct(result.product);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#80634D] hover:bg-[#6e533e] text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <span>View Product Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
