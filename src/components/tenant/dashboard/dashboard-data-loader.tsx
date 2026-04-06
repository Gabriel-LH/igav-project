"use client";

import { useEffect, useState } from "react";
import { getDashboardDataAction } from "@/src/app/(tenant)/tenant/actions/dashboard.actions";
import { useOperationStore } from "@/src/store/useOperationStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useSaleStore } from "@/src/store/useSaleStore";
import { useCategoryStore } from "@/src/store/useCategoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { useSessionStore } from "@/src/store/useSessionStore";
import { Operation } from "@/src/types/operation/type.operations";
import { Client } from "@/src/types/clients/type.client";
import { Product } from "@/src/types/product/type.product";
import { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { Sale } from "@/src/types/sales/type.sale";
import { Category } from "@/src/types/category/type.category";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import { Loader2 } from "lucide-react";

interface DashboardDataLoaderProps {
  children: React.ReactNode;
}

interface DashboardData {
  operations: Operation[];
  customers: Client[];
  products: Product[];
  rentalItems: RentalItem[];
  saleItems: SaleItem[];
  sales: Sale[];
  categories: Category[];
  reservations: Reservation[];
  reservationItems: ReservationItem[];
}

export function DashboardDataLoader({ children }: DashboardDataLoaderProps) {
  const tenantId = useSessionStore((state) => state.membership?.tenantId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setOperations = useOperationStore((state) => state.setOperations);
  const setCustomers = useCustomerStore((state) => state.setCustomers);
  const setProducts = useInventoryStore((state) => state.setProducts);
  const setRentalData = useRentalStore((state) => state.setRentalData);
  const setSaleData = useSaleStore((state) => state.setSaleData);
  const setCategories = useCategoryStore((state) => state.setCategories);
  const setReservationData = useReservationStore((state) => state.setReservationData);

  useEffect(() => {
    if (!tenantId) return;

    async function loadData() {
      try {
        setLoading(true);
        const result = await getDashboardDataAction(tenantId!);

        if (result.success && result.data) {
          const {
            operations,
            customers,
            products,
            rentalItems,
            saleItems,
            sales,
            categories,
            reservations,
            reservationItems,
          } = result.data as unknown as DashboardData;
          
          setOperations(operations);
          setCustomers(customers);
          setProducts(products);
          setRentalData(operations.filter((op) => op.type === "alquiler"), rentalItems);
          setSaleData(sales, saleItems);
          setCategories(categories);
          setReservationData(reservations, reservationItems);
          
          setError(null);
        } else {
          setError(result.error || "Error al cargar los datos");
        }
      } catch (err: unknown) {
        console.error("Error loading dashboard data:", err);
        setError("Error de conexión al servidor");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [tenantId, setOperations, setCustomers, setProducts, setRentalData, setSaleData, setCategories, setReservationData]);

  if (!tenantId || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Cargando datos del sistema...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-destructive p-4 border border-destructive/20 rounded-lg bg-destructive/5">
        <p className="font-semibold text-lg">Huy, algo salió mal</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
