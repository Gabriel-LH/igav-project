"use client";
import { useState, useMemo } from "react";
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
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useReservationStore } from "@/src/store/useReservationStore";
import { HomeStats } from "./home-stats";
import { LaundryActionCard } from "./laundry/laundry-card";
import { MaintenanceActionCard } from "./maintance/maintance-card";
import { useInventoryStore } from "@/src/store/useInventoryStore";

export function ProductGrid() {
  const { products, inventoryItems, stockLots } = useInventoryStore();

  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("catalog");

  const showReserved = viewMode === "reserved";
  const currentUser = USER_MOCK[0];
  const query = searchQuery.toLowerCase();

  // --- 1. LÓGICA DE CATÁLOGO (PRODUCTOS DISPONIBLES) ---
  const filteredCatalog = useMemo(() => {
    return products.filter((product) => {
      // Stock total del producto en esta sucursal (combinando seriales y lotes)
      let isAvailable = true;
      if (product.is_serial) {
        isAvailable = inventoryItems.some(
          (i) =>
            String(i.productId) === String(product.id) &&
            i.branchId === currentUser.branchId &&
            i.status === "disponible",
        );
      } else {
        isAvailable = stockLots.some(
          (l) =>
            String(l.productId) === String(product.id) &&
            l.branchId === currentUser.branchId &&
            l.status === "disponible" &&
            l.quantity > 0,
        );
      }

      if (!isAvailable) return false;

      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "alquiler" ? product.can_rent : product.can_sell);

      return matchesSearch && matchesTab;
    });
  }, [
    products,
    inventoryItems,
    stockLots,
    query,
    activeTab,
    currentUser.branchId,
  ]);

  const { reservations } = useReservationStore();

  // --- 2. LÓGICA DE OPERACIONES (RESERVAS ACTIVAS) ---
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const isMyBranch =
        currentUser.role === "admin" || res.branchId === currentUser.branchId;
      if (!isMyBranch) return false;

      const isReadyForPickup =
        res.status === "confirmada" || res.status === "expirada";
      if (!isReadyForPickup) return false;

      const client = CLIENTS_MOCK.find((c) => c.id === res.customerId);
      const matchesClient =
        `${client?.firstName} ${client?.lastName}`
          .toLowerCase()
          .includes(query) || client?.dni?.includes(query);

      const resItems = reservations.filter((i) => i.id === res.id);
      const matchesAnyProduct = resItems.some((item) => {
        const p = PRODUCTS_MOCK.find((prod) => prod.id.toString() === item.id);
        return p?.name.toLowerCase().includes(query);
      });

      return matchesClient || matchesAnyProduct;
    });
  }, [query, currentUser.branchId, currentUser.role, reservations]);

  const filteredLaundry = useMemo(() => {
    return [
      ...inventoryItems.filter(
        (i) =>
          i.branchId === currentUser.branchId &&
          (i.status as any) === "en_lavanderia",
      ),
      ...stockLots.filter(
        (l) =>
          l.branchId === currentUser.branchId &&
          (l.status as any) === "en_lavanderia",
      ),
    ];
  }, [inventoryItems, stockLots, currentUser.branchId]);

  const filteredMaintenance = useMemo(() => {
    return [
      ...inventoryItems.filter(
        (i) =>
          i.branchId === currentUser.branchId &&
          (i.status as any) === "en_mantenimiento",
      ),
      ...stockLots.filter(
        (l) =>
          l.branchId === currentUser.branchId &&
          (l.status as any) === "en_mantenimiento",
      ),
    ];
  }, [inventoryItems, stockLots, currentUser.branchId]);

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
            <ReservationProductCard key={res.id} reservation={res} />
          ))}

        {viewMode === "catalog" &&
          filteredCatalog.map((prod) => (
            <CatalogProductCard key={prod.id} product={prod} />
          ))}

        {viewMode === "laundry" &&
          filteredLaundry.map((item: any) => (
            <LaundryActionCard
              key={item.serialCode || item.variantCode}
              item={item}
            />
          ))}

        {viewMode === "maintenance" &&
          filteredMaintenance.map((item: any) => (
            <MaintenanceActionCard
              key={item.serialCode || item.variantCode}
              item={item}
            />
          ))}
      </div>

      {/* Estado Vacío */}
      {displayList.length === 0 && (
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
