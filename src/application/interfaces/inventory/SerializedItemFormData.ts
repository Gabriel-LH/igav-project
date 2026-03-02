export interface SerializedItemFormData {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  variantCode: string;
  variantBarcode: string;
  branchId: string;
  branchName: string;
  quantity: number;
  serialCodes: string[];
  isForRent: boolean;
  isForSale: boolean;
  condition: "Nuevo" | "Usado" | "Vintage";
  status: "disponible" | "en_mantenimiento" | "retirado";
  lastMaintenance?: Date;
  damageNotes?: string;
  autoGenerateSerials: boolean;
  prefix?: string;
}
