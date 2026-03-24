
import { Client } from "../types/clients/type.client";
import { Product } from "../types/product/type.product";
import { Sale } from "../types/sales/type.sale";
import { SaleItem } from "../types/sales/type.saleItem";
import { User } from "../types/user/type.user";

export interface SaleTableRow {
  id: string;
  amountRefunded: number;
  branchName: string;
  sellerName: string;
  outDate: string;
  realOutDate: string;
  createdAt: string;
  cancelDate: string;
  returnDate: string;
  nameCustomer: string;
  summary: string; 
  totalItems: number; 
  itemsDetail: any[]; 
  product: string;
  count: number;
  income: number;
  status: string;
  damage: string;
  searchContent: string;
}

export const mapSaleToTable = (
  customers: Client[],
  sales: Sale[],
  salesItems: SaleItem[],
  products: Product[],
  users: User[],
): SaleTableRow[] => {
  const usersById = new Map(users.map(u => [u.id, u]));
  return sales.map((sale) => {
    const branchName = "Principal";
    const customer = customers.find((c) => c.id === sale.customerId);
    const seller = usersById.get(sale.sellerId);

    // 1. Buscamos TODOS los items de esta venta
    const currentItems = salesItems.filter((s) => s.saleId === sale.id);

    // 2. ENRIQUECIMIENTO (Crucial para el Drawer)
    // Agregamos nombre, imagen y SKU a cada item para no tener que buscarlos luego
    const itemsWithNames = currentItems.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        ...item,
        productName: prod?.name || "Desconocido",
        image: prod?.image,
        sku: prod?.baseSku,
        // Aseguramos tener el precio unitario visible
        priceAtMoment: item.priceAtMoment,
      };
    });

    const mainProductName = itemsWithNames[0]?.productName || "Sin productos";
    const distinctCount = itemsWithNames.length;

    const cleanSummary =
      distinctCount > 1
        ? `${mainProductName} (+${distinctCount - 1} más)`
        : mainProductName;

    const totalItems = currentItems.reduce(
      (acc, item) => acc + (item.quantity || 1),
      0,
    );

    // 4. CONTENIDO DE BÚSQUEDA (Para filtro global)
    const searchContent = [
      sale.id,
      customer?.firstName,
      customer?.lastName,
      customer?.dni,
      ...itemsWithNames.map((i) => i.productName),
      ...currentItems.map((i) => i.serialCode),
      ...currentItems.map((i) => i.variantCode),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      id: sale.id,
      branchName,
      sellerName: seller?.firstName + " " + seller?.lastName || "",

      createdAt: sale.createdAt
        ? new Date(sale.createdAt).toLocaleDateString()
        : "---",
      saleDate: sale.saleDate // Ojo: a veces saleDate no existe en el tipo, usa createdAt si falla
        ? new Date(sale.saleDate).toLocaleDateString()
        : "---",
      outDate: sale.outDate
        ? new Date(sale.outDate).toLocaleDateString()
        : "---",
      realOutDate: sale.realOutDate
        ? new Date(sale.realOutDate).toLocaleDateString()
        : "---",
      cancelDate: sale.canceledAt
        ? new Date(sale.canceledAt).toLocaleDateString()
        : "---",
      returnDate: sale.returnedAt
        ? new Date(sale.returnedAt).toLocaleDateString()
        : "---",

      amountRefunded: sale.amountRefunded || 0,
      nameCustomer: customer?.firstName + " " + customer?.lastName || "---",

      // --- NUEVOS CAMPOS LIMPIOS ---
      summary: cleanSummary,
      totalItems: totalItems,
      itemsDetail: itemsWithNames, // Esto alimenta tu Drawer de tarjetas

      // --- CAMPOS DE COMPATIBILIDAD ---
      // Mapeamos 'product' al resumen limpio para que la tabla se vea bien de inmediato
      product: cleanSummary,
      count: totalItems,
      income: sale.totalAmount,
      status: sale.status,
      damage: "---",
      searchContent,
    };
  });
};
