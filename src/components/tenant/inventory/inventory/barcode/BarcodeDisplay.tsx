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
    if (!svgRef.current || !value) return;

    // Determinar formato basado en el valor
    const isEAN13 = /^\d{13}$/.test(value) && isValidEAN13(value);
    const isNumeric = /^\d+$/.test(value);

    const format = isEAN13 ? "EAN13" : isNumeric ? "CODE128" : "CODE128";

    try {
      JsBarcode(svgRef.current, value, {
        format: format,
        width: width,
        height: height,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        lineColor: "#000",
      });
    } catch (error) {
      console.error("Error generando barcode:", error);
      // Mostrar valor como texto si falla
      if (svgRef.current) {
        svgRef.current.innerHTML = `
          <text x="150" y="50" text-anchor="middle" font-family="monospace" font-size="16">
            ${value}
          </text>
          <text x="150" y="80" text-anchor="middle" font-size="12" fill="red">
            Código inválido
          </text>
        `;
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

  // Validar si es EAN-13 válido
  const isValid = /^\d{13}$/.test(value) && isValidEAN13(value);

  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-lg border">
      {title && <h4 className="font-semibold text-lg">{title}</h4>}

      <svg ref={svgRef} className="w-full " />

      <div className="text-center">
        <div className="text-xs text-muted-foreground mt-1">
          {isValid ? "EAN-13 válido" : "CODE128 (no EAN)"}
          {value.includes("NaN") && (
            <span className="text-red-500 ml-2">Error en generación</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper local
function isValidEAN13(barcode: string): boolean {
  if (!barcode || barcode.length !== 13) return false;

  const withoutChecksum = barcode.slice(0, 12);
  const checksum = barcode[12];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(withoutChecksum[i], 10);
    if (isNaN(digit)) return false;
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return String(calculatedChecksum) === checksum;
}
