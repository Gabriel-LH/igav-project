"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductFilters } from "./home-product-filter";
import { CatalogProductCard } from "./catalog-product-card";
import { ReservationProductCard } from "./reservation-product-card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatSearchIcon,
  Calendar03Icon,
  CleanIcon,
  Loading03Icon,
  SearchRemoveIcon,
  ToolsIcon,
} from "@hugeicons/core-free-icons";

// Mocks e IDs
import { useReservationStore } from "@/src/store/useReservationStore";
import { HomeStats } from "./home-stats";
import { LaundryActionCard } from "./laundry/laundry-card";
import { MaintenanceActionCard } from "./maintance/maintance-card";
import { useBranchStore } from "@/src/store/useBranchStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";
import { resolveProductLookup } from "@/src/utils/product/resolveProductLookup";
import { toast } from "sonner";
import { getBranchInventoryAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";
import { getAvailabilityCalendarDataAction } from "@/src/app/(tenant)/tenant/actions/availability.actions";
import type { Product } from "@/src/types/product/type.product";
import type { ProductVariant } from "@/src/types/product/type.productVariant";
import type { InventoryItem } from "@/src/types/product/type.inventoryItem";
import type { StockLot } from "@/src/types/product/type.stockLote";
import type { Category } from "@/src/types/category/type.category";
import type { AttributeType } from "@/src/types/attributes/type.attribute-type";
import type { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { getClientsAction } from "@/src/app/(tenant)/tenant/actions/client.actions";
import { usePaymentStore } from "@/src/store/usePaymentStore";
import { useOperationStore } from "@/src/store/useOperationStore";

interface ProductGridProps {
  categories: Category[];
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
}

export function ProductGrid({
  categories,
  attributeTypes,
  attributeValues,
}: ProductGridProps) {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const router = useRouter();
  const setReservationData = useReservationStore((s) => s.setReservationData);
  const setRentalData = useRentalStore((s) => s.setRentalData);
  const setOperations = useOperationStore((s) => s.setOperations);
  const setPayments = usePaymentStore((s) => s.setPayments);
  const setProductsInStore = useInventoryStore((s) => s.setProducts);
  const setVariantsInStore = useInventoryStore((s) => s.setProductVariants);
  const setInventoryItemsInStore = useInventoryStore((s) => s.setInventoryItems);
  const setStockLotsInStore = useInventoryStore((s) => s.setStockLots);
  const setCustomers = useCustomerStore((s) => s.setCustomers);
  const customers = useCustomerStore((s) => s.customers);

  const [products, setProducts] = useState<Product[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("catalog");
  const query = searchQuery.toLowerCase();
  const stockLotsWithExtendedStatus = stockLots as Array<
    StockLot & { status: string }
  >;

  const loadInventory = useCallback(async () => {
    if (!selectedBranchId) {
      setProducts([]);
      setProductVariants([]);
      setInventoryItems([]);
      setStockLots([]);
      setProductsInStore([]);
      setVariantsInStore([]);
      setInventoryItemsInStore([]);
      setStockLotsInStore([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [inventoryResult, availabilityResult, clientsResult] = await Promise.all([
        getBranchInventoryAction(selectedBranchId),
        getAvailabilityCalendarDataAction(),
        getClientsAction(),
      ]);

      if (!inventoryResult.success || !inventoryResult.data) {
        toast.error(inventoryResult.error || "No se pudo cargar el inventario");
        return;
      }

      setProducts(inventoryResult.data.products as Product[]);
      setProductVariants(inventoryResult.data.variants as ProductVariant[]);
      setInventoryItems(inventoryResult.data.inventoryItems as InventoryItem[]);
      setStockLots(inventoryResult.data.stockLots as StockLot[]);
      setProductsInStore(inventoryResult.data.products as Product[]);
      setVariantsInStore(inventoryResult.data.variants as ProductVariant[]);
      setInventoryItemsInStore(
        inventoryResult.data.inventoryItems as InventoryItem[],
      );
      setStockLotsInStore(inventoryResult.data.stockLots as StockLot[]);

      if (!availabilityResult.success || !availabilityResult.data) {
        toast.error(
          availabilityResult.error || "No se pudo cargar la disponibilidad",
        );
        return;
      }

      setReservationData(
        availabilityResult.data.reservations,
        availabilityResult.data.reservationItems,
      );
      setRentalData(
        availabilityResult.data.rentals,
        availabilityResult.data.rentalItems,
      );
      setOperations(availabilityResult.data.operations);
      setPayments(availabilityResult.data.payments);

      if (clientsResult.success && clientsResult.data) {
        setCustomers(clientsResult.data);
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedBranchId,
    setInventoryItemsInStore,
    setProductsInStore,
    setRentalData,
    setReservationData,
    setStockLotsInStore,
    setVariantsInStore,
    setCustomers,
    setOperations,
    setPayments,
  ]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useBarcodeScanner({
    onScan: (code) => {
      const resolution = resolveProductLookup({
        products,
        productVariants,
        inventoryItems,
        stockLots,
        lookup: code,
      });

      if (!resolution) {
        toast.error(`Código no encontrado: ${code}`);
        return;
      }

      const variantQuery = resolution.variantId
        ? `?variantId=${encodeURIComponent(resolution.variantId)}`
        : "";

      router.push(
        `/product-details/${encodeURIComponent(code)}${variantQuery}`,
      );
    },
  });

  // --- 1. LÓGICA DE CATÁLOGO ---
  const filteredCatalog = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.baseSku.toLowerCase().includes(query);

      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "alquiler" ? product.can_rent : product.can_sell);

      return matchesSearch && matchesTab;
    });
  }, [products, query, activeTab]);

  const { reservations, reservationItems } = useReservationStore();

  // --- 2. LÓGICA DE OPERACIONES (RESERVAS ACTIVAS) ---
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const isMyBranch = res.branchId === selectedBranchId;
      if (!isMyBranch) return false;

      const isReadyForPickup =
        res.status === "confirmada" || res.status === "expirada";
      if (!isReadyForPickup) return false;

      const client = customers.find((c) => c.id === res.customerId);
      const matchesClient =
        `${client?.firstName} ${client?.lastName}`
          .toLowerCase()
          .includes(query) || client?.dni?.includes(query);

      const resItems = reservationItems.filter((i) => i.reservationId === res.id);
      const matchesAnyProduct = resItems.some((item) => {
        const p = products.find((prod) => prod.id === item.productId);
        return p?.name.toLowerCase().includes(query);
      });

      return matchesClient || matchesAnyProduct;
    });
  }, [query, selectedBranchId, reservations, customers, products, reservationItems]);

  const filteredLaundry = useMemo(() => {
    return [
      ...inventoryItems.filter(
        (i) =>
          i.branchId === selectedBranchId &&
          i.status === "en_lavanderia",
      ),
      ...stockLotsWithExtendedStatus.filter(
        (l) =>
          l.branchId === selectedBranchId &&
          (l.status as unknown as string) === "en_lavanderia",
      ),
    ];
  }, [inventoryItems, selectedBranchId, stockLotsWithExtendedStatus]);

  const filteredMaintenance = useMemo(() => {
    return [
      ...inventoryItems.filter(
        (i) =>
          i.branchId === selectedBranchId &&
          i.status === "en_mantenimiento",
      ),
      ...stockLotsWithExtendedStatus.filter(
        (l) =>
          l.branchId === selectedBranchId &&
          (l.status as unknown as string) === "en_mantenimiento",
      ),
    ];
  }, [inventoryItems, selectedBranchId, stockLotsWithExtendedStatus]);

  // Decidir qué lista mostrar
  const displayList = useMemo(() => {
    if (viewMode === "reserved") return filteredReservations;
    if (viewMode === "laundry") return filteredLaundry;
    if (viewMode === "maintenance") return filteredMaintenance;
    return filteredCatalog;
  }, [
    viewMode,
    filteredReservations,
    filteredLaundry,
    filteredMaintenance,
    filteredCatalog,
  ]);

  return (
    <div className="w-full">
      <HomeStats reservations={reservations} />
      <ProductFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Grid Dinámico */}
      <div
        className={`grid gap-6 ${
          viewMode !== "catalog"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        }`}
      >
        {viewMode === "reserved" &&
          filteredReservations.map((res) => (
            <ReservationProductCard
              key={res.id}
              reservation={res}
              attributeTypes={attributeTypes}
              attributeValues={attributeValues}
              onRefresh={loadInventory}
            />
          ))}

        {isLoading && viewMode === "catalog" && (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
            <HugeiconsIcon icon={Loading03Icon} className="w-8 h-8 mb-2 animate-spin" />
            <p className="text-sm animate-pulse font-semibold">Cargando catálogo...</p>
          </div>
        )}

        {!isLoading && viewMode === "catalog" &&
          filteredCatalog.map((prod) => (
            <CatalogProductCard 
              key={prod.id} 
              product={prod}
              inventoryItems={inventoryItems}
              stockLots={stockLots}
              allVariants={productVariants}
              categories={categories}
              attributeTypes={attributeTypes}
              attributeValues={attributeValues}
            />
          ))}

        {viewMode === "laundry" &&
          filteredLaundry.map((item) => (
            <LaundryActionCard
              key={item.id}
              item={item as unknown as InventoryItem}
            />
          ))}

        {viewMode === "maintenance" &&
          filteredMaintenance.map((item) => (
            <MaintenanceActionCard
              key={item.id}
              item={item as unknown as InventoryItem}
            />
          ))}
      </div>

      {/* Estado Vacío */}
      {!isLoading && displayList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="bg-muted rounded-full p-6 mb-4">
            <HugeiconsIcon
              icon={
                viewMode === "reserved"
                  ? Calendar03Icon
                  : viewMode === "laundry"
                    ? CleanIcon
                    : viewMode === "maintenance"
                      ? ToolsIcon
                      : BubbleChatSearchIcon
              }
              className="w-12 h-12 text-muted-foreground/40"
            />
          </div>
          <h3 className="text-lg font-semibold">No hay resultados</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {viewMode === "laundry"
              ? "No hay prendas pendientes de lavado."
              : viewMode === "maintenance"
                ? "No hay prendas en reparación."
                : viewMode === "reserved"
                  ? "No hay reservas activas."
                  : "No hay productos con stock disponible."}
          </p>
          {searchQuery && (
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-primary"
            >
              <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2.2} />{" "}
              Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
