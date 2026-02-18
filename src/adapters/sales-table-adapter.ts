import { BRANCH_MOCKS } from "../mocks/mock.branch";
import { USER_MOCK } from "../mocks/mock.user";
import { Client } from "../types/clients/type.client";
import { Product } from "../types/product/type.product";
import { Sale } from "../types/sales/type.sale";
import { SaleItem } from "../types/sales/type.saleItem";

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

  // Nuevos campos de agrupación (La clave del cambio)
  summary: string; // Texto corto para la tabla: "Producto (+N más)"
  totalItems: number; // Cantidad total de unidades
  itemsDetail: any[]; // Array enriquecido con nombres/fotos para el Drawer

  // Campos legacy (Mantenidos para que no rompa tu <DataTable /> actual)
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
): SaleTableRow[] => {
  return sales.map((sale) => {
    const branch = BRANCH_MOCKS.find((b) => b.id === sale.branchId);
    const customer = customers.find((c) => c.id === sale.customerId);
    const seller = USER_MOCK[0];

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
        sku: prod?.sku,
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
      branchName: branch?.name || "Principal",
      sellerName: seller?.name || "",

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

      // --- CAMPOS LEGACY ---
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
