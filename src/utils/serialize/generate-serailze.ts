export function generateSerialCodes(
  prefix: string,
  variantCode: string,
  quantity: number,
  existingCodes: string[] = [],
): string[] {
  const codes: string[] = [];
  const usedCodes = new Set(existingCodes);

  // Limpiar prefijo
  const cleanPrefix = prefix.trim().toUpperCase();
  const cleanVariant = variantCode.replace(/-/g, "").substring(0, 8);

  let attempts = 0;
  const maxAttempts = quantity * 100; // Prevenir loop infinito

  while (codes.length < quantity && attempts < maxAttempts) {
    attempts++;

    // Formato: PREFIX-VARIANT-TIMESTAMP-RANDOM
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const sequential = String(codes.length + 1).padStart(3, "0");

    const serialCode = `${cleanPrefix}-${cleanVariant}-${timestamp}${random}-${sequential}`;

    if (!usedCodes.has(serialCode)) {
      codes.push(serialCode);
      usedCodes.add(serialCode);
    }
  }

  return codes;
}
