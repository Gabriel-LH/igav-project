"use client";
import { useState, useMemo } from "react";
import { ProductFilters } from "./home-product-filter";
import { CatalogProductCard } from "./catalog-product-card";
import { ReservationProductCard } from "./reservation-product-card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatSearchIcon, Calendar03Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons";

// Mocks e IDs
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";
import { USER_MOCK } from "@/src/mocks/mock.user";

export function ProductGrid() {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReserved, setShowReserved] = useState(false);

  const currentUser = USER_MOCK[0];
  const query = searchQuery.toLowerCase();

  // --- 1. LÓGICA DE CATÁLOGO (PRODUCTOS DISPONIBLES) ---
  const filteredCatalog = useMemo(() => {
    return PRODUCTS_MOCK.filter((product) => {
      // Filtro de Sede: Sumamos stock total del producto en esta sucursal
      const branchStock = STOCK_MOCK.filter(
        (s) => s.productId.toString() === product.id.toString() && s.branchId === currentUser.branchId
      ).reduce((acc, curr) => acc + curr.quantity, 0);

      // Si no hay stock en esta sede, no va al catálogo de disponibles
      if (branchStock <= 0) return false;

      // Filtro de Búsqueda (Nombre o SKU)
      const matchesSearch = product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query);
      
      // Filtro de Tabs
      const matchesTab = activeTab === "todos" || 
                        (activeTab === "alquiler" ? product.can_rent : product.can_sell);

      return matchesSearch && matchesTab;
    });
  }, [activeTab, query, currentUser.branchId]);

  // --- 2. LÓGICA DE OPERACIONES (RESERVAS ACTIVAS) ---
  const filteredReservations = useMemo(() => {
    return RESERVATIONS_MOCK.filter((res) => {
      // Seguridad: Solo de mi sede (a menos que sea admin)
      const isMyBranch = currentUser.role === "admin" || res.branchId === currentUser.branchId;
      if (!isMyBranch) return false;

      // Estado: Solo pendientes o confirmadas
      const isActive = res.status === "pendiente" || res.status === "confirmada";
      if (!isActive) return false;

      // Búsqueda: Por Cliente o por nombre de algún producto dentro de la reserva
      const client = CLIENTS_MOCK.find((c) => c.id === res.customerId);
      const matchesClient = `${client?.firstName} ${client?.lastName}`.toLowerCase().includes(query) || client?.dni?.includes(query);
      
      const resItems = MOCK_RESERVATION_ITEM.filter(i => i.reservationId === res.id);
      const matchesAnyProduct = resItems.some(item => {
        const p = PRODUCTS_MOCK.find(prod => prod.id.toString() === item.productId);
        return p?.name.toLowerCase().includes(query);
      });

      return matchesClient || matchesAnyProduct;
    });
  }, [query, currentUser.branchId, currentUser.role]);

  // Decidir qué lista mostrar
  const displayList = showReserved ? filteredReservations : filteredCatalog;

  return (
    <div className="w-full">
      <ProductFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showReserved={showReserved}
        setShowReserved={setShowReserved}
      />

      {/* Grid Dinámico */}
      <div className={`grid gap-6 ${
        showReserved 
          ? "grid-cols-1 md:grid-cols-2 items-start" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }`}>
        {showReserved 
          ? filteredReservations.map((res) => (
              <ReservationProductCard key={res.id} reservation={res} />
            ))
          : filteredCatalog.map((prod) => (
              <CatalogProductCard key={prod.id} product={prod} />
            ))
        }
      </div>

      {/* Estado Vacío */}
      {displayList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="bg-muted rounded-full p-6 mb-4">
            <HugeiconsIcon
              icon={showReserved ? Calendar03Icon : BubbleChatSearchIcon}
              className="w-12 h-12 text-muted-foreground/40"
            />
          </div>
          <h3 className="text-lg font-semibold">No hay resultados</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {showReserved
              ? "No hay reservas que coincidan con la búsqueda en esta sede."
              : "No hay productos con stock disponible actualmente."}
          </p>
          {searchQuery && (
            <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2 text-primary">
              <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2.2} /> Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}