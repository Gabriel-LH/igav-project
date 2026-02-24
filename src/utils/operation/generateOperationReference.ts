export function generateOperationReference(
  type: "alquiler" | "venta" | "reserva",
  date: Date,
  sequence: number,
) {
  const prefixMap = {
    alquiler: "ALQ",
    venta: "VEN",
    reserva: "RES",
  };

  const prefix = prefixMap[type];

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const formattedDate = `${yyyy}${mm}${dd}`;

  const paddedSequence = String(sequence).padStart(4, "0");

  return `${prefix}-${formattedDate}-${paddedSequence}`;
}
