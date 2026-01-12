// src/components/home/product-grid.tsx
"use client";
import { useState } from "react";
import { ProductFilters } from "./home-product-filter";
import { CatalogProductCard } from "./catalog-product-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatSearchIcon,
  Calendar03Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/button";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";
import { hasActiveReservation } from "@/src/utils/filtered-products";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { getReservationsByProductId } from "@/src/utils/get-product-reservation";
import { ReservationRowCard } from "./ui/ReservationRowCard";
import { ReservationProductCard } from "./reservation-product-card";
import { useIsMobile } from "@/src/hooks/use-mobile";

// src/components/home/product-grid.tsx
export function ProductGrid() {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReserved, setShowReserved] = useState(false);



  // 1. Aquí traes tus dos fuentes de datos (Mocks o API)
  const products = PRODUCTS_MOCK;

  const filteredProducts = products.filter((product) => {
    const { isReserved, activeReservation } = getReservationsByProductId(
      product.id.toString()
    );

    // 2. LOGICA DE BÚSQUEDA AMPLIADA
    const query = searchQuery.toLowerCase();

    // Búsqueda básica (Producto/SKU)
    const matchesProduct =
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query);

    let matchesClient = false;

    // 3. SI ESTÁ EN MODO RESERVA, BUSCAMOS POR CLIENTE
    if (showReserved && activeReservation && query.length > 0) {
      // Buscamos la reserva activa específica para este producto
      const cliente = CLIENTS_MOCK.find(
        (c) => c.id === activeReservation.customerId
      );
      if (cliente) {
        const nombreCompleto =
          `${cliente.firstName} ${cliente.lastName}`.toLowerCase();
        matchesClient =
          nombreCompleto.includes(query) || cliente.dni?.includes(query);
      }
    }

    const matchesSearch = matchesProduct || matchesClient;

    // 4. Filtros de Tabs
    let matchesTab = true;
    if (activeTab === "alquiler") matchesTab = product.can_rent;
    if (activeTab === "venta") matchesTab = product.can_sell;

    // 5. Retorno final (Filtro Switch)
    if (showReserved) {
      return matchesSearch && matchesTab && isReserved;
    } else {
      return matchesSearch && matchesTab && !isReserved;
    }
  });

  // --- LÓGICA PARA MODO DISPONIBLE (Catálogo) ---
  const availableProducts = PRODUCTS_MOCK.filter((product) => {
    const { isReserved } = getReservationsByProductId(product.id.toString());
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "todos" ||
      (activeTab === "alquiler" ? product.can_rent : product.can_sell);

    return !isReserved && matchesSearch && matchesTab;
  });

  // --- LÓGICA PARA MODO RESERVADO (Operaciones individuales) ---
  const activeReservationItems = MOCK_RESERVATION_ITEM.filter((item) => {
    const product = PRODUCTS_MOCK.find(
      (p) => p.id.toString() === item.productId
    );
    const reservation = RESERVATIONS_MOCK.find(
      (r) => r.id === item.reservationId
    );
    const client = CLIENTS_MOCK.find((c) => c.id === reservation?.customerId);

    // Aquí el filtro de búsqueda es más potente: busca por cliente O producto
    const query = searchQuery.toLowerCase();
    const matchesProduct = product?.name.toLowerCase().includes(query);
    const matchesClient = `${client?.firstName} ${client?.lastName}`
      .toLowerCase()
      .includes(query);

    return (
      (reservation?.status === "pendiente" ||
        reservation?.status === "confirmada") &&
      (matchesProduct || matchesClient)
    );
  });
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

      <div className={showReserved ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6": "grid grid-cols-1 md:grid-cols-2 g:grid-cols-3 xl:grid-cols-4 gap-6"}>
        {showReserved
          ? // Aquí mapeamos las RESERVAS directamente para que cada una tenga su Card
            activeReservationItems.map((item) => {
              const product = PRODUCTS_MOCK.find(
                (p) => p.id.toString() === item.productId
              );
              const reservation = RESERVATIONS_MOCK.find(
                (r) => r.id === item.reservationId
              );

              // SI EL PRODUCTO O LA RESERVA NO EXISTEN, NO RENDERIZAR
              if (!product || !reservation) return null;
              return (
                <ReservationProductCard
                  key={item.id}
                  product={product}
                  reservation={reservation}
                />
              );
            })
          : // Grid normal de catálogo para disponibles
            filteredProducts.map((product) => (
              <CatalogProductCard key={product.id} product={product} />
            ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
          <div className="bg-muted rounded-full p-6 mb-4">
            {showReserved ? (
              <HugeiconsIcon
                icon={Calendar03Icon}
                className="w-12 h-12 text-muted-foreground/40"
              />
            ) : (
              <HugeiconsIcon
                icon={BubbleChatSearchIcon}
                className="w-12 h-12 text-muted-foreground/40"
              />
            )}
          </div>
          <h3 className="text-lg font-semibold">No hay resultados</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            {showReserved
              ? "No tienes ningún producto reservado en esta categoría actualmente."
              : "No encontramos productos disponibles que coincidan con tu búsqueda."}
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
