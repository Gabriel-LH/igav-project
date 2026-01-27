import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/src/utils/currency-format";
import { cn } from "@/lib/utils";

interface PriceBreakdownBaseProps {
  title?: string;
  unitPrice: number;
  quantity: number;
  days?: number;
  isEvent?: boolean;
  total: number;
}

export function PriceBreakdownBase({
  title = "Detalle de precios",
  unitPrice,
  quantity,
  days,
  isEvent = false,
  total,
}: PriceBreakdownBaseProps) {
  return (
    <Card className="px-4 py-2 shadow-sm">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-2">
        <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
      </div>

      {/* PRECIO UNITARIO */}
      <div className="flex justify-between -mt-3 text-sm">
        <span className="text-muted-foreground">
          Precio {isEvent ? "por evento" : "unitario"}
        </span>
        <span className="font-semibold">
          {formatCurrency(unitPrice)}
        </span>
      </div>

      {/* CANTIDAD */}
      <div className="flex justify-between -mt-3 text-sm">
        <span className="text-muted-foreground">Cantidad</span>
        <span className="font-semibold">× {quantity}</span>
      </div>

      {/* DÍAS (solo alquiler por día) */}
      {!isEvent && days && days > 1 && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Días</span>
          <span className="font-semibold">× {days}</span>
        </div>
      )}

      {/* TOTAL */}
      <div className="flex justify-between items-center -mt-2 border-t">
        <span className="text-sm font-bold mt-1 uppercase">Total</span>
        <span className={cn("text-lg font-black text-primary")}>
          {formatCurrency(total)}
        </span>
      </div>
    </Card>
  );
}
