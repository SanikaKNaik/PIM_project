import React, { useState, useEffect } from 'react';
import { Barcode, Search, Printer, Sparkles, Download, Check, AlertCircle, Package } from 'lucide-react';
import { productsApi } from '../api/client';
import { BarcodeDisplay } from '../components/barcode/BarcodeDisplay';
import { useToast } from '../context/ToastContext';

export const BarcodePage: React.FC = () => {
  const { success, error } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Generator tool state
  const [generatorText, setGeneratorText] = useState('STH128994821');
  const [barcodeHeight, setBarcodeHeight] = useState(48);
  const [barcodeWidth, setBarcodeWidth] = useState(1.6);

  // Scanner state
  const [scanInput, setScanInput] = useState('');
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    productsApi.getAll({ limit: 100 })
      .then((res) => {
        const prods = res.data?.data || [];
        setProducts(prods);
        // Default select first 4 items for label printing preview
        if (prods.length > 0) {
          setSelectedProductIds(new Set(prods.slice(0, 4).map((p: any) => p.id)));
        }
      })
      .catch(() => {});
  }, []);

  const handleLookup = async (codeToSearch?: string) => {
    const code = (codeToSearch || scanInput).trim();
    if (!code) return;

    setIsScanning(true);
    setScanError(null);
    setScannedResult(null);

    try {
      const res = await productsApi.getByBarcode(code);
      setScannedResult(res.data);
      success(`Found item: ${res.data.product.name}`);
    } catch (err: any) {
      setScanError(err.response?.data?.error || `No item found for barcode "${code}"`);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePrintLabels = () => {
    window.print();
  };

  const selectedProducts = products.filter((p) => selectedProductIds.has(p.id));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="no-print">
        <h2 className="text-xl font-bold text-[#2A201A]">Code 128 Barcode Station & Label Studio</h2>
        <p className="text-xs text-[#6B5B52]">
          Generate compliant Code 128 retail barcodes, perform rapid lookup, and print shelf tags
        </p>
      </div>

      {/* Top 2 Cards: Generator & Scanner */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Code 128 Generator Tool */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DBCE] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-[#49382F] text-white rounded-lg">
                <Barcode className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#2A201A]">Interactive Code 128 Generator</h3>
                <p className="text-xs text-[#6B5B52]">Type any SKU or identifier to render crisp vector barcode</p>
              </div>
            </div>
            <button
              onClick={() => setGeneratorText(`STH128${Date.now().toString().slice(-6)}`)}
              className="flex items-center gap-1 text-xs text-[#80634D] hover:text-[#49382F] font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Randomize</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#49382F] mb-1">
              Barcode Encoded Value
            </label>
            <input
              type="text"
              value={generatorText}
              onChange={(e) => setGeneratorText(e.target.value)}
              placeholder="e.g. STH128001001"
              className="w-full px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#6B5B52] block mb-1">Bar Width ({barcodeWidth}px)</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.2"
                value={barcodeWidth}
                onChange={(e) => setBarcodeWidth(Number(e.target.value))}
                className="w-full accent-[#80634D]"
              />
            </div>
            <div>
              <span className="text-[#6B5B52] block mb-1">Height ({barcodeHeight}px)</span>
              <input
                type="range"
                min="30"
                max="80"
                step="2"
                value={barcodeHeight}
                onChange={(e) => setBarcodeHeight(Number(e.target.value))}
                className="w-full accent-[#80634D]"
              />
            </div>
          </div>

          {/* Barcode Output Container */}
          <div className="bg-[#F7F3EC] p-6 rounded-lg border border-[#E5DBCE] flex flex-col items-center justify-center min-h-[110px]">
            <BarcodeDisplay
              value={generatorText}
              width={barcodeWidth}
              height={barcodeHeight}
              fontSize={12}
            />
          </div>
        </div>

        {/* Card 2: Rapid Product Lookup & Scanning Station */}
        <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5DBCE] pb-3">
            <div className="p-2 bg-[#80634D] text-white rounded-lg">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#2A201A]">Rapid Barcode Scanner</h3>
              <p className="text-xs text-[#6B5B52]">Scan with USB scanner or enter barcode value</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="Scan or paste barcode..."
              className="flex-1 px-3 py-2 bg-white border border-[#E5DBCE] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#80634D]/30"
            />
            <button
              type="submit"
              disabled={isScanning || !scanInput.trim()}
              className="px-4 py-2 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isScanning ? 'Searching...' : 'Scan'}
            </button>
          </form>

          {/* Quick test buttons */}
          <div className="text-xs space-y-1">
            <span className="text-[#8F7E73] block">Test with existing catalogue barcodes:</span>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setScanInput(p.barcode);
                    handleLookup(p.barcode);
                  }}
                  className="px-2 py-1 bg-[#F7F3EC] border border-[#E5DBCE] rounded hover:border-[#80634D] text-[11px] font-mono text-[#49382F]"
                >
                  {p.barcode}
                </button>
              ))}
            </div>
          </div>

          {/* Scan Error */}
          {scanError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Matched Product Output */}
          {scannedResult && (
            <div className="p-4 bg-white border border-[#80634D]/30 rounded-lg shadow-2xs space-y-2">
              <div className="flex items-start gap-3">
                <img
                  src={scannedResult.product.image_url}
                  alt={scannedResult.product.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 object-cover rounded border border-[#E5DBCE] shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#2A201A] truncate">
                    {scannedResult.product.name}
                  </div>
                  <div className="text-[11px] text-[#6B5B52] font-mono mt-0.5">
                    SKU: {scannedResult.variant?.sku || scannedResult.product.sku}
                  </div>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="font-bold text-[#49382F] tabular-nums">
                      ${Number(scannedResult.variant?.sale_price || scannedResult.product.sale_price || scannedResult.product.regular_price).toFixed(2)}
                    </span>
                    <span className="text-[#6B5B52]">
                      Stock: <strong className="tabular-nums">{scannedResult.variant?.stock_quantity ?? scannedResult.product.stock_quantity} units</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Shelf Labels Studio */}
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-xs overflow-hidden">
        {/* Header (No print) */}
        <div className="no-print px-6 py-4 border-b border-[#E5DBCE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-sm text-[#2A201A]">Printable Shelf & Retail Label Sheet</h3>
            <p className="text-xs text-[#6B5B52]">
              Select items from the catalogue to compose a printable 3-column sticker sheet
            </p>
          </div>
          <button
            onClick={handlePrintLabels}
            className="flex items-center gap-2 px-4 py-2 bg-[#49382F] hover:bg-[#382b24] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print {selectedProducts.length} Selected Labels</span>
          </button>
        </div>

        {/* Product selector strip (No print) */}
        <div className="no-print px-6 py-3 border-b border-[#E5DBCE] bg-[#F7F3EC]/50 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#6B5B52] font-medium">Toggle products:</span>
          {products.map((p) => {
            const isSelected = selectedProductIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  const next = new Set(selectedProductIds);
                  if (isSelected) next.delete(p.id);
                  else next.add(p.id);
                  setSelectedProductIds(next);
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                  isSelected
                    ? 'bg-[#49382F] text-white border-[#49382F]'
                    : 'bg-white text-[#49382F] border-[#E5DBCE] hover:border-[#80634D]'
                }`}
              >
                {p.name.split(' ')[0]} ({p.sku})
              </button>
            );
          })}
        </div>

        {/* Printable Grid Sheet */}
        <div className="p-6 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
            {selectedProducts.map((p) => (
              <div
                key={p.id}
                className="border border-[#E5DBCE] rounded-lg p-4 flex flex-col items-center justify-between text-center bg-white shadow-2xs print:border-black/30 print:shadow-none break-inside-avoid"
              >
                <div className="w-full">
                  <div className="text-[10px] tracking-widest uppercase text-[#8F7E73] font-semibold">
                    {p.brand}
                  </div>
                  <div className="text-xs font-bold text-[#2A201A] truncate mt-0.5">
                    {p.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#6B5B52]">
                    {p.sku}
                  </div>
                </div>

                <div className="my-2.5 flex justify-center w-full">
                  <BarcodeDisplay
                    value={p.barcode}
                    width={1.5}
                    height={40}
                    fontSize={11}
                  />
                </div>

                <div className="w-full pt-2 border-t border-[#E5DBCE] flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-semibold text-[#8F7E73]">RETAIL</span>
                  <span className="text-sm font-bold text-[#2A201A] tabular-nums">
                    ${Number(p.sale_price || p.regular_price).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
