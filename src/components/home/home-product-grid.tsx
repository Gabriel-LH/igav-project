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
import { MOCK_DATA, RESERVATIONS_MOCK } from "@/src/util/mocks";

// src/components/home/product-grid.tsx
export function ProductGrid() {
 const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReserved, setShowReserved] = useState(false);

  // 1. Aquí traes tus dos fuentes de datos (Mocks o API)
  const products = MOCK_DATA; 
  const reservations = RESERVATIONS_MOCK; // Tu nueva tabla de reservas

  const filteredProducts = products.filter((product) => {
    // 2. DETERMINAR SI ESTÁ RESERVADO REALMENTE
    // Buscamos si el ID del producto existe en la lista de reservas
    const hasActiveReservation = reservations.some(
      (res) => res.productId === product.id && res.status !== "finalizada"
    );

    // 3. Filtros básicos
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = true;
    if (activeTab === "alquiler") matchesTab = product.can_rent;
    if (activeTab === "venta") matchesTab = product.can_sell;

    // 4. EL FILTRO CLAVE:
    // Ahora comparamos contra la existencia real de la reserva, no contra el campo de la DB
    if (showReserved) {
      return matchesSearch && matchesTab && hasActiveReservation;
    } else {
      return matchesSearch && matchesTab && !hasActiveReservation;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
        // Buscamos la info de la reserva para pasársela a la Card
        const reservationData = reservations.find(res => res.productId === product.id);
        
        return (
          <ProductCard 
            key={product.id} 
            product={product as any} 
            reservation={reservationData} 
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
