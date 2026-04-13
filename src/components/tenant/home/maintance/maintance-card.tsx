import { Card } from "@/components/ui/card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ToolsIcon,
  StickyNote01Icon,
  Tick01Icon,
  WashingMachineIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import Image from "next/image";
import { Badge } from "@/components/badge";
import { useMemo, useState } from "react";
import type { AttributeType } from "@/src/types/attributes/type.attribute-type";
import type { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import { StatusTransitionModal } from "../ui/StatusTransitionModal";
import { toast } from "sonner";

import { updateStockStatusAction } from "@/src/app/(tenant)/tenant/actions/inventory.actions";

interface MaintenanceActionCardProps {
  item: any;
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
  onRefresh: () => void;
}

export function MaintenanceActionCard({
  item,
  attributeTypes,
  attributeValues,
  onRefresh,
}: MaintenanceActionCardProps) {
  const { products, productVariants } = useInventoryStore();

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "disponible" | "en_lavanderia" | "retirado";
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
          (t) =>
            t.name.toLowerCase() === key.toLowerCase() ||
            t.code.toLowerCase() === key.toLowerCase()
        );
        const attrValue = attributeValues.find(
          (v) =>
            v.id === val || v.value.toLowerCase() === String(val).toLowerCase()
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

      const statusLabel = 
        modalConfig.type === "disponible" ? "Disponible" : 
        modalConfig.type === "en_lavanderia" ? "Lavandería" : "Baja";
      
      toast.success(`Producto movido a ${statusLabel}`);
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el estado");
    }
  };

  return (
    <Card className="relative flex flex-col p-4 w-full border-l-2 border-l-amber-500 gap-4 shadow-sm hover:shadow-md transition-all group">
      <Badge className="absolute animate-pulse -top-2 border border-amber-200/20 bg-amber-100/20 text-amber-500 -right-2 shadow-md backdrop-blur-sm transition-all hover:scale-101">
        Reparación Pendiente
      </Badge>

      <div className="flex gap-3 items-center">
        <div className="relative h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0 border border-slate-100 italic">
          <Image
            src={
              product?.image?.[0] ||
              "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400"
            }
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

        <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
          <HugeiconsIcon icon={ToolsIcon} size={20} strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2 border-y border-slate-50">
        {displayAttributes.map((attr, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-black text-muted-foreground">
              {attr.label}:
            </span>
            <div className="flex items-center gap-1">
              {attr.hex && (
                <div
                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: attr.hex }}
                />
              )}
              <span className="text-[10px] uppercase font-black text-slate-700">
                {attr.value}
              </span>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] uppercase font-black text-muted-foreground">
            Cant:
          </span>
          <span className="text-[10px] uppercase font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
            {item.quantity || 1}
          </span>
        </div>
      </div>

      {item.damageNotes && (
        <div className="w-full bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200 flex gap-2 items-start">
          <HugeiconsIcon
            icon={StickyNote01Icon}
            size={14}
            strokeWidth={2.2}
            className="mt-0.5 text-slate-400"
          />
          <p className="text-[11px] italic text-slate-600 leading-tight">
            "{item.damageNotes}"
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto">
        <Button
          onClick={() => setModalConfig({ isOpen: true, type: "disponible" })}
          variant="outline"
          className="flex-1 border-emerald-500 border-2 text-emerald-600 hover:bg-emerald-500 hover:text-white font-black text-[10px] uppercase h-8 px-1"
        >
          <HugeiconsIcon icon={Tick01Icon} size={14} className="mr-1" />
          Listo
        </Button>
        <Button
          onClick={() => setModalConfig({ isOpen: true, type: "en_lavanderia" })}
          variant="outline"
          className="flex-1 border-blue-500 border-2 text-blue-600 hover:bg-blue-500 hover:text-white font-black text-[10px] uppercase h-8 px-1"
        >
          <HugeiconsIcon icon={WashingMachineIcon} size={14} className="mr-1" />
          Lavado
        </Button>
        <Button
          onClick={() => setModalConfig({ isOpen: true, type: "retirado" })}
          variant="outline"
          className="flex-none border-red-500 border-2 text-red-600 hover:bg-red-500 hover:text-white font-black text-[10px] uppercase h-8 w-8 p-0"
          title="Dar de baja"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
        </Button>
      </div>

      <StatusTransitionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={handleConfirm}
        title={
          modalConfig.type === "disponible"
            ? "Reparación Completa"
            : modalConfig.type === "en_lavanderia"
            ? "Mover a Lavandería"
            : "Dar de Baja"
        }
        description={
          modalConfig.type === "disponible"
            ? "¿Seguro que la prenda ya está reparada y lista para volver al inventario?"
            : modalConfig.type === "en_lavanderia"
            ? "¿Deseas mover esta prenda a lavandería antes de ponerla disponible?"
            : "¿Estás seguro de dar de baja esta prenda permanentemente?"
        }
        confirmText={
          modalConfig.type === "disponible"
            ? "Confirmar Listo"
            : modalConfig.type === "en_lavanderia"
            ? "Confirmar Lavado"
            : "Confirmar Baja"
        }
        confirmVariant={modalConfig.type === "retirado" ? "destructive" : "default"}
        productName={product?.name}
      />
    </Card>
  );
}
