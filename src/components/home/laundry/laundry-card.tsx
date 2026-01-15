// src/components/home/laundry-action-card.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { CleanIcon, TickIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

export function LaundryActionCard({ item, onFinish }: { item: any, onFinish: () => void }) {

    console.log(item)
  return (
    <Card className="flex items-center p-3 w-fit gap-4 border-l-4 shadow-sm hover:shadow-md transition-all">
      <div className="relative h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0">
        <Image src={"https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=400" || "/placeholder.png"} alt="Prenda" fill className="object-cover" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="border text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
            Lavandería
          </span>
        </div>
        <h4 className="font-bold text-sm truncate uppercase tracking-tighter text-slate-800">{item.productName}</h4>
        <p className="text-[10px] text-muted-foreground font-medium">Talla {item.size} • Color {item.color}</p>
      </div>

      <Button 
        onClick={onFinish}
        className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-4 flex flex-col gap-0 group"
      >
        <HugeiconsIcon icon={CleanIcon} size={18} className="group-hover:animate-pulse" />
        <span className="text-[9px] font-black uppercase">Listo</span>
      </Button>
    </Card>
  );
}