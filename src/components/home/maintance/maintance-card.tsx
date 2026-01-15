// src/components/home/maintenance-action-card.tsx
import { Card } from "@/components/ui/card";
import { Button } from "@/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ToolsIcon, StickyNote01Icon } from "@hugeicons/core-free-icons";

export function MaintenanceActionCard({ item, onFinish }: { item: any, onFinish: () => void }) {
  return (
    <Card className="flex flex-col p-4 border-l-4 border-l-amber-500 gap-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <HugeiconsIcon icon={ToolsIcon} size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-tighter">{item.productName}</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-black">Ref: {item.sku}</p>
          </div>
        </div>
        <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded uppercase">
          Reparación Pendiente
        </span>
      </div>

      {/* NOTA DE DAÑO: Esto es lo que se guardó en el Drawer */}
      <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 flex gap-2">
        <HugeiconsIcon icon={StickyNote01Icon} size={16} className="text-slate-400 mt-0.5" />
        <p className="text-xs text-slate-600 italic">
          "{item.damageNotes || 'Sin notas adicionales'}"
        </p>
      </div>

      <Button 
        onClick={onFinish}
        variant="outline"
        className="w-full border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white font-black text-[10px] uppercase"
      >
        Marcar como Reparado
      </Button>
    </Card>
  );
}