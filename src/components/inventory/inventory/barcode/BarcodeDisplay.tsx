// components/inventory/BarcodeDisplay.tsx
"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeDisplayProps {
  value: string;
  title?: string;
  width?: number;
  height?: number;
}

export function BarcodeDisplay({
  value,
  title,
  width = 2,
  height = 100,
}: BarcodeDisplayProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "EAN13",
          width: width,
          height: height,
          displayValue: true,
          fontSize: 14,
          margin: 10,
          valid: (valid: boolean) => {
            if (!valid) {
              // Si no es válido, mostrar como CODE128
              JsBarcode(svgRef.current!, value, {
                format: "CODE128",
                width: width,
                height: height,
                displayValue: true,
                fontSize: 14,
                margin: 10,
              });
            }
          },
        });
      } catch (error) {
        // Fallback si hay error
        console.error("Error generando barcode:", error);
      }
    }
  }, [value, width, height]);

  if (!value) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg border">
        <div className="text-muted-foreground">Sin código de barras</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg border">
      {title && <h4 className="font-semibold text-lg">{title}</h4>}
      <svg ref={svgRef} className="w-full max-w-[300px]" />
      <div className="text-center">
        <div className="text-lg font-mono font-bold tracking-wider">
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {value.length === 13 ? "EAN-13" : "CODE128"}
        </div>
      </div>
    </div>
  );
}
