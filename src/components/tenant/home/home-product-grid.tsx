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
import { getPromotionsAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { usePromotionStore } from "@/src/store/usePromotionStore";
import type { Reservation } from "@/src/types/reservation/type.reservation";
import type { ReservationItem } from "@/src/types/reservation/type.reservationItem";
import type { Rental } from "@/src/types/rentals/type.rentals";
import type { RentalItem } from "@/src/types/rentals/type.rentalsItem";
import type { Operation } from "@/src/types/operation/type.operations";
import type { Payment } from "@/src/types/payments/type.payments";
import { useCartStore } from "@/src/store/useCartStore";
import { ScannerModal } from "./ui/modals/ScannerModal";



interface ProductGridProps {
  categories: Category[];
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
  initialInventory: {
    products: Product[];
    variants: ProductVariant[];
    inventoryItems: InventoryItem[];
    stockLots: StockLot[];
  } | null;
  initialAvailability: {
    reservations: Reservation[];
    reservationItems: ReservationItem[];
    rentals: Rental[];
    rentalItems: RentalItem[];
    operations: Operation[];
    payments: Payment[];
  } | null;
}

export function ProductGrid({
  categories,
  attributeTypes,
  attributeValues,
  initialInventory,
  initialAvailability,
}: ProductGridProps) {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const router = useRouter();
  const setReservationData = useReservationStore((s) => s.setReservationData);
  const setRentalData = useRentalStore((s) => s.setRentalData);
  const setOperations = useOperationStore((s) => s.setOperations);
  const setPayments = usePaymentStore((s) => s.setPayments);
  const setProductsInStore = useInventoryStore((s) => s.setProducts);
  const setVariantsInStore = useInventoryStore((s) => s.setProductVariants);
  const setInventoryItemsInStore = useInventoryStore(
    (s) => s.setInventoryItems,
  );
  const setStockLotsInStore = useInventoryStore((s) => s.setStockLots);
  const setCustomers = useCustomerStore((s) => s.setCustomers);
  const setPromotions = usePromotionStore((s) => s.setPromotions);
  const customers = useCustomerStore((s) => s.customers);

  const [products, setProducts] = useState<Product[]>(
    initialInventory?.products ?? [],
  );
  const [productVariants, setProductVariants] = useState<ProductVariant[]>(
    initialInventory?.variants ?? [],
  );
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(
    initialInventory?.inventoryItems ?? [],
  );
  const [stockLots, setStockLots] = useState<StockLot[]>(
    initialInventory?.stockLots ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialInventory);

  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("catalog");
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const { addItem, isCollectorMode } = useCartStore();


  // Track the last loaded branch to avoid redundant fetches
  const [lastLoadedBranchId, setLastLoadedBranchId] = useState<string | null>(
    initialInventory ? selectedBranchId : null,
  );

  const query = searchQuery.toLowerCase();
  const stockLotsWithExtendedStatus = stockLots as Array<
    StockLot & { status: string }
  >;

  const loadSecondaryData = useCallback(async () => {
    try {
      const [clientsResult, promotionsResult] = await Promise.all([
        getClientsAction(),
        getPromotionsAction(),
      ]);

      if (clientsResult.success && clientsResult.data) {
        setCustomers(clientsResult.data);
      }
      if (promotionsResult.success && promotionsResult.data) {
        setPromotions(promotionsResult.data);
      }
    } catch (error) {
      console.error("Error loading secondary data:", error);
    }
  }, [setCustomers, setPromotions]);

  useEffect(() => {
    if (initialInventory) {
      setProductsInStore(initialInventory.products);
      setVariantsInStore(initialInventory.variants);
      setInventoryItemsInStore(initialInventory.inventoryItems);
      setStockLotsInStore(initialInventory.stockLots);
    }
    if (initialAvailability) {
      setReservationData(
        initialAvailability.reservations,
        initialAvailability.reservationItems,
      );
      setRentalData(
        initialAvailability.rentals,
        initialAvailability.rentalItems,
      );
      setOperations(initialAvailability.operations);
      setPayments(initialAvailability.payments);
    }
    // Carga de datos secundarios (Promos/Clientes) de forma diferida
    loadSecondaryData();
  }, [
    initialInventory,
    initialAvailability,
    setProductsInStore,
    setVariantsInStore,
    setInventoryItemsInStore,
    setStockLotsInStore,
    setReservationData,
    setRentalData,
    setOperations,
    setPayments,
    loadSecondaryData,
  ]); // Solo una vez al montar (o si cambian las deps iniciales)

  const loadInventory = useCallback(
    async (branchId: string) => {
      if (!branchId || branchId === lastLoadedBranchId) return;

      setIsLoading(true);
      try {
        const [inventoryResult, availabilityResult] = await Promise.all([
          getBranchInventoryAction(branchId),
          getAvailabilityCalendarDataAction(),
        ]);

        if (inventoryResult.success && inventoryResult.data) {
          const { products, variants, inventoryItems, stockLots } =
            inventoryResult.data;
          setProducts(products as Product[]);
          setProductVariants(variants as ProductVariant[]);
          setInventoryItems(inventoryItems as InventoryItem[]);
          setStockLots(stockLots as StockLot[]);

          setProductsInStore(products as Product[]);
          setVariantsInStore(variants as ProductVariant[]);
          setInventoryItemsInStore(inventoryItems as InventoryItem[]);
          setStockLotsInStore(stockLots as StockLot[]);
        }

        if (availabilityResult.success && availabilityResult.data) {
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
        }

        setLastLoadedBranchId(branchId);
      } catch {
        toast.error("Error de red al actualizar inventario");
      } finally {
        setIsLoading(false);
      }
    },
    [
      lastLoadedBranchId,
      setProductsInStore,
      setVariantsInStore,
      setInventoryItemsInStore,
      setStockLotsInStore,
      setReservationData,
      setRentalData,
      setOperations,
      setPayments,
    ],
  );

  useEffect(() => {
    // Solo cargamos si el branchId ha cambiado realmente con respecto al inicial o anterior
    if (selectedBranchId && selectedBranchId !== lastLoadedBranchId) {
      loadInventory(selectedBranchId);
    }
  }, [selectedBranchId, lastLoadedBranchId, loadInventory]);

  const handleScan = useCallback((code: string) => {
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

    // MODO RECOLECTOR: Añadir directamente al carrito
    if (isCollectorMode) {
      const product = products.find((p) => p.id === resolution.productId);
      if (!product) return;

      const cartMode = useCartStore.getState().items[0]?.operationType;

      // Determinar tipo de operación: Priorizar modo del carrito o tab activo
      const opType: "venta" | "alquiler" =
        cartMode ||
        (activeTab === "alquiler"
          ? "alquiler"
          : activeTab === "venta"
            ? "venta"
            : product.can_rent
              ? "alquiler"
              : "venta");

      const isSpecificItem = [
        "serialCode",
        "inventoryItemId",
        "stockLotId",
        "stockLotBarcode",
      ].includes(resolution.matchType);
      const specificId = isSpecificItem ? code : undefined;

      addItem(product, opType, specificId, undefined, resolution.variantId);
      return;
    }

    // MODO CATÁLOGO: Navegar a detalles
    const isSpecificItem = ["serialCode", "inventoryItemId", "stockLotId", "stockLotBarcode"].includes(resolution.matchType);
    const preselectParam = isSpecificItem ? `&preselect=${encodeURIComponent(code)}` : "";
    const variantQuery = resolution.variantId
      ? `?variantId=${encodeURIComponent(resolution.variantId)}`
      : "?v=1";

    router.push(`/tenant/product-details/${encodeURIComponent(resolution.productId)}${variantQuery}${preselectParam}`);
  }, [products, productVariants, inventoryItems, stockLots, isCollectorMode, activeTab, addItem, router]);

  useBarcodeScanner({
    onScan: handleScan,
    enabled: !isScannerModalOpen,
  }, [handleScan, isScannerModalOpen]);

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

      const resItems = reservationItems.filter(
        (i) => i.reservationId === res.id,
      );
      const matchesAnyProduct = resItems.some((item) => {
        const p = products.find((prod) => prod.id === item.productId);
        return p?.name.toLowerCase().includes(query);
      });

      return matchesClient || matchesAnyProduct;
    });
  }, [
    query,
    selectedBranchId,
    reservations,
    customers,
    products,
    reservationItems,
  ]);

  const filteredLaundry = useMemo(() => {
    return [
      ...inventoryItems.filter(
        (i) => i.branchId === selectedBranchId && i.status === "en_lavanderia",
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
          i.branchId === selectedBranchId && i.status === "en_mantenimiento",
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
        isCollectorMode={isCollectorMode}
        setIsCollectorMode={useCartStore((s) => s.setIsCollectorMode)}
        onCameraClick={() => setIsScannerModalOpen(true)}
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
              onRefresh={() => loadInventory(selectedBranchId)}
            />
          ))}

        {isLoading && viewMode === "catalog" && (
          <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"></div>
            <p className="text-sm animate-pulse font-semibold">
              Cargando catálogo...
            </p>
          </div>
        )}

        {!isLoading &&
          viewMode === "catalog" &&
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
              attributeTypes={attributeTypes}
              attributeValues={attributeValues}
              onRefresh={() => loadInventory(selectedBranchId)}
            />
          ))}

        {viewMode === "maintenance" &&
          filteredMaintenance.map((item) => (
            <MaintenanceActionCard
              key={item.id}
              item={item as unknown as InventoryItem}
              attributeTypes={attributeTypes}
              attributeValues={attributeValues}
              onRefresh={() => loadInventory(selectedBranchId)}
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
      {/* Modales de Escaneo */}
      <ScannerModal
        open={isScannerModalOpen}
        onOpenChange={setIsScannerModalOpen}
        onScan={handleScan}
      />
    </div>
  );
}
