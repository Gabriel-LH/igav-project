// src/components/home/maintenance-action-card.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ToolsIcon, StickyNote01Icon } from "@hugeicons/core-free-icons";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import Image from "next/image";
import { Badge } from "@/components/badge";

export function MaintenanceActionCard({ item }: { item: any }) {
  const updateStockStatus = useInventoryStore(
    (state) => state.updateStockStatus
  );

  const productName = PRODUCTS_MOCK.find(
    (product: any) => product.id === item.productId
  )?.name;
  const sku = PRODUCTS_MOCK.find(
    (product: any) => product.id === item.productId
  )?.sku;

  return (
    <Card className="relative flex flex-col items-center p-4 border-l-2 border-l-amber-500 gap-3">
      <Badge className="absolute animate-pulse -top-2 border border-amber-200/20 bg-amber-100/20 text-amber-500 -right-2 shadow-md backdrop-blur-sm transition-all hover:scale-101">
        Reparación Pendiente
      </Badge>

      <div className="flex w-full justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400"
              alt="Prenda"
              fill
              className="object-cover"
            />
          </div>

          <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center text-amber-600">
            <HugeiconsIcon icon={ToolsIcon} size={20} strokeWidth={2.2} />
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-tighter">
              {productName}
            </h4>
            <p className="text-[10px] text-muted-foreground uppercase font-black">
              Ref: {sku}
            </p>
          </div>
        </div>
      </div>

      <div className="flex  items-center gap-3">
        <p className="text-[10px] uppercase font-black">
          Talla: {item.size}
        </p>
        <p className="text-[10px] uppercase font-black">
          Color: {item.color}
        </p>
        <p className="text-[10px] uppercase font-black">
          Cantidad: {item.quantity}
        </p>
      </div>

      {/* NOTA DE DAÑO: Esto es lo que se guardó en el Drawer */}
      <div className=" w-full bg-slate-50/10 p-3 rounded-xl border border-dashed border-slate-200/40 flex gap-2">
        <HugeiconsIcon
          icon={StickyNote01Icon}
          size={16}
          strokeWidth={2.2}
          className="mt-0.5"
        />
        <p className="text-xs italic">
          "{item.damageNotes || "Sin notas adicionales"}"
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
        onClick={() => updateStockStatus(item.id, "disponible")}
        variant="outline"
        className="border-amber-500 uppercase tracking-wider text-amber-600 hover:bg-amber-500 hover:text-amber-500 font-black text-[10px] "
      >
        Listo
      </Button>
      <Button
        onClick={() => updateStockStatus(item.id, "lavanderia")}
        variant="outline"
        className="border-blue-500 uppercase tracking-wider text-blue-600 hover:bg-blue-500 hover:text-blue-500 font-black text-[10px] "
      >
        Lavandería
      </Button>
        <Button
          onClick={() => updateStockStatus(item.id, "baja")}
          variant="outline"
          className="border-red-500 border text-red-600 hover:bg-red-500 hover:text-red-500 font-black text-[10px] uppercase flex gap-0 group"
        >
          <span className="text-[11px] font-bold uppercase pl-2 tracking-wider">
            Dar de baja
          </span>
        </Button>
      </div>
    </Card>
  );
}
