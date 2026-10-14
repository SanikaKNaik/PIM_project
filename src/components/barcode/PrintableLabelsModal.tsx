import React, { useState } from 'react';
import { X, Printer, Check, Copy } from 'lucide-react';
import { BarcodeDisplay } from './BarcodeDisplay';

interface PrintableLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
}

export const PrintableLabelsModal: React.FC<PrintableLabelsModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [copiesPerItem, setCopiesPerItem] = useState(2);
  const [includePrice, setIncludePrice] = useState(true);
  const [labelSize, setLabelSize] = useState<'standard' | 'compact'>('standard');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Build the list of labels to print
  const labelList: any[] = [];
  products.forEach((prod) => {
    // If it has variants, we can include variants too, or main product
    for (let i = 0; i < copiesPerItem; i++) {
      labelList.push({
        id: `${prod.id}-${i}`,
        name: prod.name,
        sku: prod.sku,
        brand: prod.brand || 'Stitch Atelier',
        price: prod.sale_price || prod.regular_price,
        barcode: prod.barcode,
      });
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#FFFDF8] border border-[#E5DBCE] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header (Hidden on print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-[#E5DBCE] bg-[#F7F3EC]/80">
          <div>
            <h3 className="font-semibold text-lg text-[#2A201A]">Printable Code 128 Barcode Labels</h3>
            <p className="text-xs text-[#6B5B52]">
              Generating {labelList.length} total printable labels across {products.length} products
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#49382F] hover:bg-[#382b24] text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Sheet</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#8F7E73] hover:text-[#2A201A] p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Controls Bar (Hidden on print) */}
        <div className="no-print px-6 py-3 border-b border-[#E5DBCE] bg-white flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-[#49382F] font-medium">
              <span>Copies per item:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={copiesPerItem}
                onChange={(e) => setCopiesPerItem(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 border border-[#E5DBCE] rounded text-center"
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#49382F]">
              <input
                type="checkbox"
                checked={includePrice}
                onChange={(e) => setIncludePrice(e.target.checked)}
                className="rounded border-[#E5DBCE] text-[#80634D] focus:ring-[#80634D]"
              />
              <span>Include Retail Price</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8F7E73]">Format:</span>
            <div className="inline-flex rounded-md border border-[#E5DBCE] p-0.5 bg-[#F7F3EC]">
              <button
                type="button"
                onClick={() => setLabelSize('standard')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  labelSize === 'standard' ? 'bg-white font-medium text-[#2A201A] shadow-xs' : 'text-[#6B5B52]'
                }`}
              >
                Standard (3-Column)
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('compact')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  labelSize === 'compact' ? 'bg-white font-medium text-[#2A201A] shadow-xs' : 'text-[#6B5B52]'
                }`}
              >
                Shelf Compact (2-Column)
              </button>
            </div>
          </div>
        </div>

        {/* Printable Label Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F7F3EC]/40 print:p-0 print:bg-white">
          <div
            className={`grid gap-4 print:gap-3 ${
              labelSize === 'standard'
                ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3'
                : 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
            }`}
          >
            {labelList.map((lbl) => (
              <div
                key={lbl.id}
                className="bg-white border border-[#E5DBCE] rounded-lg p-3.5 flex flex-col items-center justify-between text-center shadow-2xs print:border-black/30 print:shadow-none break-inside-avoid"
              >
                <div className="w-full">
                  <div className="text-[10px] tracking-wider uppercase text-[#8F7E73] font-medium">
                    {lbl.brand}
                  </div>
                  <div className="text-xs font-semibold text-[#2A201A] line-clamp-1 mt-0.5">
                    {lbl.name}
                  </div>
                  <div className="text-[11px] font-mono text-[#6B5B52] mt-0.5">
                    {lbl.sku}
                  </div>
                </div>

                <div className="my-2 py-1 w-full flex justify-center">
                  <BarcodeDisplay
                    value={lbl.barcode}
                    width={labelSize === 'standard' ? 1.4 : 1.7}
                    height={38}
                    fontSize={10}
                  />
                </div>

                {includePrice && (
                  <div className="w-full pt-1.5 border-t border-[#E5DBCE]/60 flex items-center justify-between text-xs font-medium">
                    <span className="text-[#8F7E73] text-[10px]">RETAIL</span>
                    <span className="text-[#2A201A] font-semibold tabular-nums">
                      ${Number(lbl.price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
