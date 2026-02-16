export const generateProductsSummary = (
  items: { productName?: string; quantity: number }[],
): string => {
  const counts: Record<string, number> = {};

  items.forEach((item) => {
    const name = item.productName || "Producto Desconocido";
    counts[name] = (counts[name] || 0) + item.quantity;
  });

  const distinctProducts = Object.entries(counts);
  if (distinctProducts.length === 0) return "Sin productos";

  // Tomamos los 2 primeros
  const firstTwo = distinctProducts
    .slice(0, 2)
    .map(([name, count]) => (count > 1 ? `${count}x ${name}` : name))
    .join(", ");

  // Si hay más, agregamos el "+N más"
  if (distinctProducts.length > 2) {
    return `${firstTwo} (+${distinctProducts.length - 2} más)`;
  }

  return firstTwo;
};
