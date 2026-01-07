// src/components/home/product-grid.tsx
"use client";
import { useState } from "react";
import { ProductFilters } from "./home-product-filter";
import { ProductCard } from "./product-card";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatSearchIcon, Calendar03Icon, SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/button";
import { MOCK_DATA } from "@/src/util/mocks";

// src/components/home/product-grid.tsx
export function ProductGrid() {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReserved, setShowReserved] = useState(false); // Nuevo estado

  const filteredProducts = MOCK_DATA.filter((product) => {
    // 1. Filtro de Búsqueda
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // 2. Filtro de Tipo (Alquiler/Venta)
    let matchesTab = true;
    if (activeTab === "alquiler") matchesTab = product.can_rent;
    if (activeTab === "venta") matchesTab = product.can_sell;

    // 3. Filtro de Reservados (Excluyente)
    // Si showReserved es true, solo mostramos los que tienen is_reserved: true
    // Si showReserved es false, solo mostramos los que tienen is_reserved: false
    const matchesReserved = product.is_reserved === showReserved;

    return matchesSearch && matchesTab && matchesReserved;
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
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
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
             <HugeiconsIcon icon={SearchRemoveIcon} strokeWidth={2.2}/> Limpiar búsqueda
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
