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
import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useReservationStore } from "@/src/store/useReservationStore";
import { HomeStats } from "./home-stats";
import { LaundryActionCard } from "./laundry/laundry-card";
import { MaintenanceActionCard } from "./maintance/maintance-card";
import { useRentalStore } from "@/src/store/useRentalStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { toast } from "sonner";

export function ProductGrid() {
  const { updateStatus } = useReservationStore();
  const { addRental } = useRentalStore(); // NUEVO
  const { updateStockStatus } = useInventoryStore();

  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("catalog");

  const showReserved = viewMode === "reserved";
  const currentUser = USER_MOCK[0];
  const query = searchQuery.toLowerCase();

  const stock = useInventoryStore((state) => state.stock);

  // --- 1. LÓGICA DE CATÁLOGO (PRODUCTOS DISPONIBLES) ---
  const filteredCatalog = useMemo(() => {
    return PRODUCTS_MOCK.filter((product) => {
      // Filtro de Sede: Sumamos stock total del producto en esta sucursal
      const branchStock = stock
        .filter(
          (s) =>
            s.productId.toString() === product.id.toString() &&
            s.branchId === currentUser.branchId,
        )
        .reduce((acc, curr) => acc + curr.quantity, 0);

      // Si no hay stock en esta sede, no va al catálogo de disponibles
      if (branchStock <= 0) return false;

      // Filtro de Búsqueda (Nombre o SKU)
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query);

      // Filtro de Tabs
      const matchesTab =
        activeTab === "todos" ||
        (activeTab === "alquiler" ? product.can_rent : product.can_sell);

      return matchesSearch && matchesTab;
    });
  }, [activeTab, query, currentUser.branchId]);

  const { reservations } = useReservationStore();

  // --- 2. LÓGICA DE OPERACIONES (RESERVAS ACTIVAS) ---
  const filteredReservations = useMemo(() => {
    return reservations.filter((res) => {
      const isMyBranch =
        currentUser.role === "admin" || res.branchId === currentUser.branchId;
      if (!isMyBranch) return false;

      // CAMBIO: Solo mostramos lo que está listo para salir.
      // Si el status es "completada", significa que ya es un Rental y no va aquí.
      const isReadyForPickup =
        res.status === "confirmada" || res.status === "expirada";
      if (!isReadyForPickup) return false;
      // Búsqueda: Por Cliente o por nombre de algún producto dentro de la reserva
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
    return stock.filter(
      (s) =>
        s.branchId === currentUser.branchId && s.status === "en_lavanderia",
    );
  }, [stock, currentUser.branchId]);

  const filteredMaintenance = useMemo(() => {
    return stock.filter(
      // Usamos 'stock' de Zustand
      (s) =>
        s.branchId === currentUser.branchId &&
        (s.status as string) === "en_mantenimiento",
    );
  }, [currentUser.branchId, stock]); // IMPORTANTE: Agregar 'stock' aquí también

  // // Función profesional de entrega
  // const handleDeliver = (reservation: any) => {
  //   // 1. En un futuro aquí abrirás un Modal para elegir el stockId real.
  //   // Por ahora, simulamos que elegimos el primer stock disponible del producto.
  //   const mockSelectedItems = MOCK_RESERVATION_ITEM.filter(
  //     (item) => item.reservationId === reservation.id,
  //   ).map((item) => ({
  //     ...item,
  //     stockId: `STK-GENERIC-${item.productId}`, // Esto lo cambiaremos por el Selector
  //   }));

  //   // A) Creamos el Alquiler Activo
  //   addRental(reservation, mockSelectedItems);

  //   // B) Marcamos los items de stock como "alquilado"
  //   mockSelectedItems.forEach((item) => {
  //     updateStockStatus(item.stockId, "alquilado");
  //   });

  //   // C) Cerramos la reserva (cambia de 'confirmada' a 'completada')
  //   // Al cambiar a 'completada', desaparecerá de esta vista automáticamente
  //   updateStatus(reservation.id, "convertida");
  // };

  // Decidir qué lista mostrar
  const displayList = showReserved ? filteredReservations : filteredCatalog;

  return (
    <div className="w-full">
      <HomeStats reservations={reservations} />
      <ProductFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        viewMode={viewMode} // Pasamos el estado
        setViewMode={setViewMode} // Pasamos la función (ESTO CORRIGE TU ERROR)
      />

      {/* Grid Dinámico */}
      <div
        className={`grid gap-6 ${
          viewMode !== "catalog"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 items-start"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
        }`}
      >
        {viewMode === "reserved" &&
          filteredReservations.map((res) => (
            <ReservationProductCard
              key={res.id}
              reservation={res}
              onDeliver={(itemsWithStock) => {
                // 👈 RECIBE LOS ITEMS AQUÍ

                // 1. Crear el Alquiler Activo
                // createRentalFromReservation(res, itemsWithStock);

                // 2. Actualizar Inventario (Stock)
                itemsWithStock.forEach((item) => {
                  updateStockStatus(item.stockId, "alquilado");
                });

                // 3. Marcar Reserva como completada para que desaparezca del Home
                updateStatus(res.id, "convertida");

                toast.success("Alquiler iniciado correctamente");
              }}
            />
          ))}

        {viewMode === "catalog" &&
          filteredCatalog.map((prod) => (
            <CatalogProductCard key={prod.id} product={prod} />
          ))}

        {viewMode === "laundry" &&
          filteredLaundry.map((item) => (
            <LaundryActionCard key={item.id} item={item} />
          ))}

        {viewMode === "maintenance" &&
          filteredMaintenance.map((item) => (
            <MaintenanceActionCard key={item.id} item={item} />
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
