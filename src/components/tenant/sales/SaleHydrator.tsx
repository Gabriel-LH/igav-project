"use client";

import { useEffect } from "react";
import { useSaleStore } from "@/src/store/useSaleStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Sale } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { Product } from "@/src/types/product/type.product";
import { InventoryItem } from "@/src/types/product/type.inventoryItem";
import { StockLot } from "@/src/types/product/type.stockLote";

interface SaleHydratorData {
  sales: Sale[];
  saleItems: SaleItem[];
  products: Product[];
  inventoryItems: InventoryItem[];
  stockLots: StockLot[];
}

export function SaleHydrator({ data }: { data: SaleHydratorData }) {
  const setSaleData = useSaleStore((state) => state.setSaleData);
  const setProducts = useInventoryStore((state) => state.setProducts);
  const setInventoryItems = useInventoryStore((state) => state.setInventoryItems);
  const setStockLots = useInventoryStore((state) => state.setStockLots);

  useEffect(() => {
    if (data) {
      setSaleData(data.sales, data.saleItems);
      setProducts(data.products);
      setInventoryItems(data.inventoryItems);
      setStockLots(data.stockLots);
    }
  }, [data, setInventoryItems, setProducts, setSaleData, setStockLots]);

  return null;
}
