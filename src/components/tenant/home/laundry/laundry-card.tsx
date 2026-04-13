import { Card } from "@/components/ui/card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  WashingMachineIcon,
  ToolsIcon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Badge } from "@/components/badge";
import { useMemo, useState } from "react";
import type { AttributeType } from "@/src/types/attributes/type.attribute-type";
import type { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { StatusTransitionModal } from "../ui/StatusTransitionModal";
import { toast } from "sonner";

import { updateStockStatusAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";

interface LaundryActionCardProps {
  item: any;
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
  onRefresh: () => void;
}

export function LaundryActionCard({
  item,
  attributeTypes,
  attributeValues,
  onRefresh,
}: LaundryActionCardProps) {
  const { products, productVariants } = useInventoryStore();
  
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "disponible" | "en_mantenimiento";
  }>({ isOpen: false, type: "disponible" });

  const product = useMemo(
    () => products.find((p: any) => p.id === item.productId),
    [products, item.productId]
  );
  
  const variant = useMemo(
    () => productVariants.find((v: any) => v.id === item.variantId),
    [productVariants, item.variantId]
  );

  const displayAttributes = useMemo(() => {
    if (!variant || !variant.attributes) return [];
    
    return Object.entries(variant.attributes)
      .slice(0, 2)
      .map(([key, val]) => {
        const type = attributeTypes.find(
          (t) => t.name.toLowerCase() === key.toLowerCase() || t.code.toLowerCase() === key.toLowerCase()
        );
        const attrValue = attributeValues.find(
          (v) => v.id === val || v.value.toLowerCase() === String(val).toLowerCase()
        );
        return {
          label: type?.name || key,
          value: attrValue?.value || String(val),
          hex: attrValue?.hexColor,
        };
      });
  }, [variant, attributeTypes, attributeValues]);

  const handleConfirm = async () => {
    try {
      const result = await updateStockStatusAction({
        id: item.id,
        type: item.serialCode ? "serial" : "lot",
        status: modalConfig.type
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success(`Producto movido a ${modalConfig.type === "disponible" ? "Disponible" : "Mantenimiento"}`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el estado");
    }
  };

  return (
    <Card className="relative flex flex-col p-4 w-full gap-4 border-l-2 border-l-blue-500 shadow-sm hover:shadow-md transition-all group">
      <Badge className="absolute animate-pulse -top-2 border border-blue-200/20 bg-blue-100/20 text-blue-500 -right-2 shadow-md backdrop-blur-sm transition-all hover:scale-101">
        En Lavandería
      </Badge>

      <div className="flex gap-3 items-center">
        <div className="relative h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0 border border-slate-100 italic">
          <Image
            src={product?.image?.[0] || "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400"}
            alt={product?.name || "Prenda"}
            fill
            className="object-cover transition-transform group-hover:scale-110"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-black text-sm uppercase tracking-tight line-clamp-1">
            {product?.name || "Producto desconocido"}
          </h4>
          <p className="text-[10px] text-muted-foreground uppercase font-black">
            SKU: {item.serialCode || item.id.split("-")[0]}
          </p>
        </div>

        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
          <HugeiconsIcon icon={WashingMachineIcon} size={20} strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 border-y border-slate-50">
        {displayAttributes.map((attr, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-black text-muted-foreground">{attr.label}:</span>
            <div className="flex items-center gap-1">
              {attr.hex && (
                <div 
                  className="w-2.5 h-2.5 rounded-full border border-black/10" 
                  style={{ backgroundColor: attr.hex }}
                />
              )}
              <span className="text-[10px] uppercase font-black text-slate-700">{attr.value}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] uppercase font-black text-muted-foreground">Cant:</span>
          <span className="text-[10px] uppercase font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            {item.quantity || 1}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <Button
          onClick={() => setModalConfig({ isOpen: true, type: "disponible" })}
          variant="outline"
          className="flex-1 border-emerald-500 border-2 text-emerald-600 hover:bg-emerald-500 hover:text-white font-black text-[10px] uppercase h-8"
        >
          <HugeiconsIcon icon={Tick01Icon} size={14} className="mr-1" />
          Listo
        </Button>
        <Button
          onClick={() => setModalConfig({ isOpen: true, type: "en_mantenimiento" })}
          variant="outline"
          className="flex-1 border-amber-500 border-2 text-amber-600 hover:bg-amber-500 hover:text-white font-black text-[10px] uppercase h-8"
        >
          <HugeiconsIcon icon={ToolsIcon} size={14} className="mr-1" />
          Taller
        </Button>
      </div>

      <StatusTransitionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirm}
        title={modalConfig.type === "disponible" ? "Marcar como Listo" : "Mover a Mantenimiento"}
        description={
          modalConfig.type === "disponible" 
            ? "¿Seguro que esta prenda está lista para volver al inventario disponible?"
            : "¿Deseas mover esta prenda a mantenimiento/taller para reparación?"
        }
        confirmText={modalConfig.type === "disponible" ? "Confirmar Listo" : "Mover a Taller"}
        confirmVariant={modalConfig.type === "en_mantenimiento" ? "secondary" : "default"}
        productName={product?.name}
      />
    </Card>
  );
}
