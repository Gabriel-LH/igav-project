// src/utils/barcode.ts

import { SelectedValue } from "@/src/components/inventory/inventory/products/selected-atribute";
import { SelectedAttributeConfig } from "@/src/interfaces/ProductForm";

/**
 * Genera un código de barras EAN-13 único basado en SKU, atributos e índice
 */
export function generateBarcode(
  baseSku: string,
  attributes: Record<string, string>,
  variantIndex: number,
): string {
  // 1. Tomar 2 dígitos del SKU base (limpiado)
  const skuPart = baseSku
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, 2)
    .toUpperCase()
    .padStart(2, "0");

  // Convertir letras a números (A=1, B=2, etc.) para hacerlo numérico
  const skuNumeric = skuPart
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      // Si es letra (A-Z), convertir a 1-26, si es número usarlo directo
      if (code >= 65 && code <= 90) return String((code - 64) % 10);
      return char;
    })
    .join("")
    .padStart(2, "0")
    .slice(0, 2);

  // 2. Códigos de atributos (2 dígitos por cada atributo)
  const attrPart = Object.values(attributes)
    .map((value, idx) => {
      // Tomar primera letra del valor, convertir a número
      const firstChar = value.charAt(0).toUpperCase();
      const charCode = firstChar.charCodeAt(0);
      if (charCode >= 65 && charCode <= 90) {
        return String((charCode - 64 + idx) % 10); // +idx para diferenciar atributos
      }
      return firstChar;
    })
    .join("")
    .padStart(4, "0")
    .slice(0, 4);

  // 3. Índice de variante (2 dígitos) - ESTO ES CLAVE
  const indexPart = String(variantIndex + 1).padStart(2, "0");

  // 4. Número aleatorio de 4 dígitos basado en el índice (no timestamp)
  // Usamos un algoritmo determinístico pero único por variante
  const randomPart = String(
    ((variantIndex * 997) % 9000) + 1000, // Números entre 1000-9999
  ).padStart(4, "0");

  // Combinar: 2 + 4 + 2 + 4 = 12 dígitos
  const barcode12 = `${skuNumeric}${attrPart}${indexPart}${randomPart}`;

  // Calcular dígito de verificación para hacerlo EAN-13
  const checksum = calculateEANChecksum(barcode12);

  return barcode12 + checksum;
}

/**
 * Calcula el dígito de verificación EAN-13
 */
function calculateEANChecksum(barcode12: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i]);
    // Posiciones impares (1,3,5...) se multiplican por 1, pares por 3
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return checksum.toString();
}

/**
 * Valida si un código es EAN-13 válido
 */
export function isValidEAN13(barcode: string): boolean {
  if (!barcode || barcode.length !== 13) return false;
  if (!/^\d+$/.test(barcode)) return false;

  const withoutChecksum = barcode.slice(0, 12);
  const checksum = barcode[12];

  return calculateEANChecksum(withoutChecksum) === checksum;
}

/**
 * Genera un código de barras CODE-128 (cuando EAN-13 no es posible)
 */
export function generateCode128(baseSku: string, variantIndex: number): string {
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const index = String(variantIndex).padStart(3, "0");
  return `${baseSku.slice(0, 4)}-${timestamp}-${index}`;
}

export const createSignature = (
  attrs: SelectedAttributeConfig[],
  combination: SelectedValue[],
): string => {
  return attrs
    .map((attr, idx) => `${attr.attributeName}:${combination[idx].value}`)
    .join("|");
};

export const generateSku = (
  base: string,
  attrs: SelectedAttributeConfig[],
  combination: SelectedValue[],
  index: number,
): string => {
  // Usar códigos de atributo para generar SKU compacto
  const attrCodes = combination
    .map((val) => val.code.substring(0, 5).toUpperCase())
    .join("-");
  return `${base}-${attrCodes}-${String(index + 1).padStart(2, "0")}`;
};
