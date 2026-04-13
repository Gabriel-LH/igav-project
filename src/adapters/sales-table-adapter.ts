import { Client } from "../types/clients/type.client";
import { Product } from "../types/product/type.product";
import { Sale } from "../types/sales/type.sale";
import { SaleItem } from "../types/sales/type.saleItem";
import { User } from "../types/user/type.user";
import { Operation } from "../types/operation/type.operations";

type SaleReversalRow = {
  type: string;
  createdAt?: Date | string;
  items?: Array<{
    restockingFee?: number | string | null;
  }>;
};

type SaleWithReversals = Sale & {
  saleReversals?: SaleReversalRow[];
};

type ItemWithPresentation = SaleItem & {
  productName: string;
  image?: string;
  sku?: string;
};

export interface SaleTableRow {
  rowId?: string;
  id: string;
  amountRefunded: number;
  returnedQuantity?: number;
  restockingFee?: number;
  branchName: string;
  sellerName: string;
  outDate: string;
  realOutDate: string;
  createdAt: string;
  cancelDate: string;
  returnDate: string;
  saleDate?: string;
  nameCustomer: string;
  summary: string;
  totalItems: number;
  itemsDetail: ItemWithPresentation[];
  product: string;
  count: number;
  income: number;
  taxAmount: number;
  roundingAmount: number;
  totalBeforeRounding: number;
  status: string;
  damage: string;
  searchContent: string;
}

function buildItemsWithNames(
  items: SaleItem[],
  products: Product[],
): ItemWithPresentation[] {
  return items.map((item) => {
    const prod = products.find((p) => p.id === item.productId);

    return {
      ...item,
      productName: prod?.name || "Desconocido",
      image: prod?.image,
      sku: prod?.baseSku,
    };
  });
}

function buildSummary(items: ItemWithPresentation[]): string {
  const mainProductName = items[0]?.productName || "Sin productos";
  const distinctCount = items.length;

  return distinctCount > 1
    ? `${mainProductName} (+${distinctCount - 1} más)`
    : mainProductName;
}

function buildSearchContent(
  sale: Sale,
  customer: Client | undefined,
  items: ItemWithPresentation[],
): string {
  return [
    sale.id,
    customer?.firstName,
    customer?.lastName,
    customer?.dni,
    ...items.map((item) => item.productName),
    ...items.map((item) => item.serialCode),
    ...items.map((item) => item.variantCode),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function buildItemsIncome(items: SaleItem[]): number {
  return items.reduce(
    (acc, item) =>
      acc + Number(item.priceAtMoment || 0) * Number(item.quantity || 0),
    0,
  );
}

function buildTotalItems(items: SaleItem[]): number {
  return items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
}

function buildRow(
  sale: SaleWithReversals,
  operation: Operation | undefined,
  customer: Client | undefined,
  seller: User | undefined,
  items: SaleItem[],
  products: Product[],
  overrides?: Partial<SaleTableRow>,
): SaleTableRow {
  const itemsWithNames = buildItemsWithNames(items, products);
  const totalItems = buildTotalItems(items);
  const itemsIncome = buildItemsIncome(items);

  return {
    rowId: overrides?.rowId,
    id: sale.id,
    amountRefunded: overrides?.amountRefunded ?? sale.amountRefunded ?? 0,
    returnedQuantity: overrides?.returnedQuantity,
    restockingFee: overrides?.restockingFee,
    branchName: "Principal",
    sellerName: seller?.firstName + " " + seller?.lastName || "",
    outDate: sale.outDate ? new Date(sale.outDate).toLocaleDateString() : "---",
    realOutDate: sale.realOutDate
      ? new Date(sale.realOutDate).toLocaleDateString()
      : "---",
    createdAt: sale.createdAt
      ? new Date(sale.createdAt).toLocaleDateString()
      : "---",
    cancelDate: sale.canceledAt
      ? new Date(sale.canceledAt).toLocaleDateString()
      : "---",
    returnDate: overrides?.returnDate ?? "---",
    saleDate: sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : "---",
    nameCustomer: customer?.firstName + " " + customer?.lastName || "---",
    summary: buildSummary(itemsWithNames),
    totalItems,
    itemsDetail: itemsWithNames,
    product: buildSummary(itemsWithNames),
    count: totalItems,
    income: overrides?.income ?? itemsIncome,
    taxAmount: operation?.taxAmount || 0,
    roundingAmount: operation?.roundingAmount || 0,
    totalBeforeRounding: operation?.totalBeforeRounding || sale.totalAmount,
    status: overrides?.status ?? sale.status,
    damage: "---",
    searchContent: buildSearchContent(sale, customer, itemsWithNames),
  };
}

export const mapSaleToTable = (
  customers: Client[],
  sales: Sale[],
  salesItems: SaleItem[],
  products: Product[],
  users: User[],
  operations: Operation[],
): SaleTableRow[] => {
  const usersById = new Map(users.map((user) => [user.id, user]));
  const operationsById = new Map(operations.map((op) => [op.id, op]));

  return sales.flatMap((rawSale) => {
    const sale = rawSale as SaleWithReversals;
    const customer = customers.find((c) => c.id === sale.customerId);
    const seller = usersById.get(sale.sellerId);
    const operation = operationsById.get(sale.operationId);

    const returnReversals = (sale.saleReversals || []).filter(
      (reversal) => reversal.type === "return",
    );

    const totalRestockingFee = returnReversals.reduce((sum, reversal) => {
      const reversalItems = reversal.items || [];

      return (
        sum +
        reversalItems.reduce(
          (itemSum, item) => itemSum + Number(item.restockingFee || 0),
          0,
        )
      );
    }, 0);

    const latestReturnDate =
      returnReversals[0]?.createdAt
        ? new Date(returnReversals[0].createdAt).toLocaleDateString()
        : sale.returnedAt
          ? new Date(sale.returnedAt).toLocaleDateString()
          : "---";

    const currentItems = salesItems.filter((item) => item.saleId === sale.id);
    const returnedItems = currentItems.filter((item) => item.isReturned);
    const remainingItems = currentItems.filter((item) => !item.isReturned);

    const hasPartialReturn =
      returnedItems.length > 0 && remainingItems.length > 0;

    if (hasPartialReturn) {
      const returnedRow = buildRow(
        sale,
        operation,
        customer,
        seller,
        returnedItems,
        products,
        {
          rowId: `${sale.id}-return`,
          status: "devuelto_parcial",
          returnDate: latestReturnDate,
          amountRefunded: sale.amountRefunded || 0,
          returnedQuantity: buildTotalItems(returnedItems),
          restockingFee: totalRestockingFee,
          income: buildItemsIncome(returnedItems),
        },
      );

      const remainingRow = buildRow(
        sale,
        operation,
        customer,
        seller,
        remainingItems,
        products,
        {
          rowId: `${sale.id}-remaining`,
          status: "vendido",
          amountRefunded: 0,
          returnedQuantity: 0,
          restockingFee: 0,
          income: buildItemsIncome(remainingItems),
        },
      );

      return [returnedRow, remainingRow];
    }

    if (sale.status === "devuelto") {
      return [
        buildRow(sale, operation, customer, seller, currentItems, products, {
          rowId: sale.id,
          status: "devuelto",
          returnDate: latestReturnDate,
          amountRefunded: sale.amountRefunded || 0,
          returnedQuantity: buildTotalItems(currentItems),
          restockingFee: totalRestockingFee,
          income: buildItemsIncome(currentItems),
        }),
      ];
    }

    return [
      buildRow(sale, operation, customer, seller, currentItems, products, {
        rowId: sale.id,
        status: sale.status,
        amountRefunded: sale.amountRefunded || 0,
        returnedQuantity: 0,
        restockingFee: 0,
        income:
          sale.status === "cancelado"
            ? sale.totalAmount
            : buildItemsIncome(currentItems),
        returnDate: "---",
      }),
    ];
  });
};
