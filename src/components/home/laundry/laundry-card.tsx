// src/components/home/laundry-action-card.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CleanIcon,
  TickIcon,
  WashingMachineIcon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Badge } from "@/components/badge";

export function LaundryActionCard({ item }: { item: any }) {
  const updateStockStatus = useInventoryStore(
    (state) => state.updateItemStatus
  );

  const { products } = useInventoryStore();

  const productName = products.find(
    (product: any) => product.id === item.productId
  )?.name;
  const sku = products.find(
    (product: any) => product.id === item.productId
  )?.sku;

  return (
    <Card className="relative flex items-center p-3 w-fit gap-4 border-l-2 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
      <Badge className="absolute animate-pulse -top-2 border border-blue-200/20 bg-blue-100/20 text-blue-500 -right-2 shadow-md backdrop-blur-sm transition-all hover:scale-101">
        En Lavandería
      </Badge>

      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0">
            <Image
              src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400"
              alt="Prenda"
              fill
              className="object-cover"
            />
          </div>

          <div className="h-10 w-10 bg-accent rounded-lg flex items-center justify-center text-blue-600">
            <HugeiconsIcon
              icon={WashingMachineIcon}
              size={20}
              strokeWidth={2.2}
            />
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

      <div className="flex items-center gap-3">
        <p className="text-[10px] uppercase font-black">Talla: {item.size}</p>
        <p className="text-[10px] uppercase font-black">Color: {item.color}</p>
        <p className="text-[10px] uppercase font-black">
          Cantidad: {item.quantity}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => updateStockStatus(item.id, "disponible")}
          variant="outline"
          className="border-blue-500 border text-blue-600 hover:bg-blue-500 hover:text-blue-500 font-black text-[10px] uppercase flex gap-0 group"
        >
          <span className="text-[11px] font-bold uppercase pl-2 tracking-wider">
            Listo
          </span>
        </Button>
        <Button
          onClick={() => updateStockStatus(item.id, "en_mantenimiento")}
          variant="outline"
          className="border-amber-500 border text-amber-600 hover:bg-amber-500 hover:text-amber-500 font-black text-[10px] uppercase flex gap-0 group"
        >
          <span className="text-[11px] font-bold uppercase pl-2 tracking-wider">
            Mantenimiento
          </span>
        </Button>
      </div>
    </Card>
  );
}
