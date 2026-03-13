export interface StockFormData {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  variantCode: string;
  variantBarcode: string; // Barcode de la variante (referencia)

  branchId: string;
  branchName: string;

  quantity: number;
  barcode?: string; // Opcional: puede usar el de la variante o uno específico del lote

  expirationDate?: Date;
  lotNumber?: string;

  isForRent: boolean;
  isForSale: boolean;

  status: "en_transito" | "disponible" | "bajo_pedido" | "discontinuado";

  condition: "Nuevo" | "Usado" | "Vintage";
}
