import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeDisplayProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
}

export const BarcodeDisplay: React.FC<BarcodeDisplayProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 42,
  fontSize = 12,
  displayValue = true,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hasError, setHasError] = React.useState(false);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: 'JetBrains Mono',
        textMargin: 4,
        margin: 6,
        background: 'transparent',
        lineColor: '#2A201A',
      });
      setHasError(false);
    } catch (err) {
      console.warn('Barcode render error for:', value, err);
      setHasError(true);
    }
  }, [value, format, width, height, fontSize, displayValue]);

  if (!value) {
    return <span className="text-xs text-[#8F7E73] italic">No barcode assigned</span>;
  }

  if (hasError) {
    return (
      <div className="text-xs text-amber-700 bg-amber-50 px-2 py-1 border border-amber-200 rounded font-mono">
        {value} (invalid format)
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg ref={svgRef} className="max-w-full overflow-visible" />
    </div>
  );
};
