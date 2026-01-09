// src/components/home/product-grid.tsx
"use client";
import { useState } from "react";
import { ProductFilters } from "./home-product-filter";
import { ProductCard } from "./product-card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatSearchIcon,
  Calendar03Icon,
  SearchRemoveIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/button";
import { MOCK_DATA } from "@/src/mocks/mocks.product";
import { RESERVATIONS_MOCK } from "@/src/mocks/mock.reservation";
import { hasActiveReservation } from "@/src/utils/filtered-products";
import { Reservation } from "@/src/types/payments/type.reservation";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";

// src/components/home/product-grid.tsx
export function ProductGrid() {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReserved, setShowReserved] = useState(false);

  // 1. Aquí traes tus dos fuentes de datos (Mocks o API)
  const products = MOCK_DATA;
  const reservations = RESERVATIONS_MOCK; // Tu nueva tabla de reservas
  const clients = CLIENTS_MOCK;

  const filteredProducts = products.filter((product) => {
    // 1. DETERMINAR SI ESTÁ RESERVADO
    const productReservations = reservations.filter(
      (r) => r.productId === product.id
    );
    const active = hasActiveReservation(productReservations);

    // 2. LOGICA DE BÚSQUEDA AMPLIADA
    const query = searchQuery.toLowerCase();

    // Búsqueda básica (Producto/SKU)
    const matchesProduct =
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query);

    let matchesClient = false;

    // 3. SI ESTÁ EN MODO RESERVA, BUSCAMOS POR CLIENTE
    if (showReserved && active && query.length > 0) {
      // Buscamos la reserva activa específica para este producto
      const currentRes = productReservations.find(
        (r) => r.status === "pendiente"
      ); // o tu lógica de activa

      if (currentRes) {
        const cliente = clients.find((c) => c.id === currentRes.customerId);
        if (cliente) {
          const nombreCompleto =
            `${cliente.firstName} ${cliente.lastName}`.toLowerCase();
          matchesClient =
            nombreCompleto.includes(query) || cliente.dni?.includes(query); // Asumiendo que existe el campo dni
        }
      }
    }

    const matchesSearch = matchesProduct || matchesClient;

    // 4. Filtros de Tabs
    let matchesTab = true;
    if (activeTab === "alquiler") matchesTab = product.can_rent;
    if (activeTab === "venta") matchesTab = product.can_sell;

    // 5. Retorno final (Filtro Switch)
    if (showReserved) {
      return matchesSearch && matchesTab && active;
    } else {
      return matchesSearch && matchesTab && !active;
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 g:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
          return (
            <ProductCard
              key={product.id}
              product={product as any}
              reservations={reservations as any}
            />
          );
        })}
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
