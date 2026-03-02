// src/utils/barcode.ts

/**
 * Genera un código de barras EAN-13 válido (13 dígitos numéricos)
 */
export function generateBarcode(
  baseSku: string,
  attributes: Record<string, string>,
  variantIndex: number
): string {
  // Limpiar SKU: solo números, máximo 3 dígitos
  const skuNumbers = baseSku.replace(/\D/g, "").slice(0, 3).padStart(3, "0");
  
  // Si no hay números en el SKU, usar hash del nombre (convertido a número)
  const skuPart = skuNumbers === "000" 
    ? String(baseSku.charCodeAt(0) % 900 + 100) // 100-999
    : skuNumbers;

  // Atributos: convertir primera letra de cada valor a número (01-26)
  const attrCodes = Object.values(attributes)
    .map((val, idx) => {
      const firstChar = val.charAt(0).toUpperCase();
      const charCode = firstChar.charCodeAt(0);
      // A=1, B=2, ..., Z=26, pero como string "01" a "26"
      if (charCode >= 65 && charCode <= 90) {
        return String(charCode - 64).padStart(2, "0");
      }
      // Si no es letra, usar los últimos 2 dígitos del charCode
      return String(charCode % 100).padStart(2, "0");
    })
    .join("")
    .slice(0, 4)
    .padStart(4, "0");

  // Índice de variante (2 dígitos: 01-99)
  const indexPart = String((variantIndex % 99) + 1).padStart(2, "0");

  // Combinar: 3 + 4 + 2 = 9 dígitos, necesitamos 12 para EAN-13
  // Rellenar con dígitos del índice y un offset
  const filler = String(variantIndex * 7).padStart(3, "0").slice(0, 3);
  
  const barcode12 = `${skuPart}${attrCodes}${indexPart}${filler}`.slice(0, 12);
  
  // Calcular checksum
  const checksum = calculateEANChecksum(barcode12);
  
  return barcode12 + checksum;
}

/**
 * Calcula el dígito de verificación EAN-13
 * El input debe ser exactamente 12 dígitos numéricos
 */
export function calculateEANChecksum(barcode12: string): string {
  // Validar que solo contenga números
  if (!/^\d{12}$/.test(barcode12)) {
    console.error("Invalid barcode for checksum (must be 12 digits):", barcode12);
    // Fallback: retornar "0" si no es válido
    return "0";
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i], 10);
    // Posiciones pares (0,2,4...) se multiplican por 1, impares por 3
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  
  const checksum = (10 - (sum % 10)) % 10;
  return String(checksum);
}

/**
 * Genera un código CODE-128 (formato alfanumérico, no EAN-13)
 * Usar cuando se necesita texto en el código
 */
export function generateCode128(
  baseSku: string,
  variantIndex: number
): string {
  // Formato: SKU-TIMESTAMP-INDEX (sin NaN)
  const cleanSku = baseSku.replace(/[^A-Z0-9]/gi, "").slice(0, 6);
  const timestamp = Date.now().toString().slice(-6); // 6 dígitos numéricos
  const index = String(variantIndex).padStart(3, "0");
  
  return `${cleanSku}-${timestamp}-${index}`;
}

/**
 * Valida si un código es EAN-13 válido
 */
export function isValidEAN13(barcode: string): boolean {
  if (!barcode || barcode.length !== 13) return false;
  if (!/^\d{13}$/.test(barcode)) return false; // Solo 13 dígitos exactos

  const withoutChecksum = barcode.slice(0, 12);
  const checksum = barcode[12];
  
  return calculateEANChecksum(withoutChecksum) === checksum;
}