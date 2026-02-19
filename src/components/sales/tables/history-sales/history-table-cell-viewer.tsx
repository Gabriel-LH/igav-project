"use client";

import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/separator";
import {
  IconPackage,
  IconReceipt2,
  IconUser,
  IconBuildingStore,
  IconCalendarEvent,
  IconRuler,
  IconPalette,
} from "@tabler/icons-react";
import { formatCurrency } from "@/src/utils/currency-format";

// ⚠️ NOTA IMPORTANTE: Asegúrate de que salesHistorySchema incluya 'itemsDetail'
// en tu definición Zod (type.history.ts), o usa 'any' temporalmente si prefieres.
// itemsDetail: z.array(z.any()).optional(),

export function TableCellViewerHistory({
  item,
}: {
  item: any; // O 'any' si el tipo te da problemas
}) {
  const isMobile = useIsMobile();


  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground hover:underline cursor-pointer w-full justify-start px-0 text-left h-auto py-1 whitespace-normal"
        >
          <span className="truncate font-bold hover:underline">
            {item.nameCustomer}
          </span>
        </Button>
      </DrawerTrigger>

      <DrawerContent
        className={
          isMobile
            ? "max-h-[90vh]"
            : "h-full w-[450px] ml-auto rounded-none border-l"
        }
      >
        <DrawerHeader className="border-b pb-4 bg-muted/10">
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="outline"
              className="font-mono text-[10px] text-muted-foreground"
            >
              ID: {item.id.slice(0, 8)}...
            </Badge>
            <Badge
              variant={
                item.status === "vendido"
                  ? "default"
                  : item.status === "anulado"
                    ? "destructive"
                    : "secondary"
              }
              className="uppercase"
            >
              {item.status.replace("_", " ")}
            </Badge>
          </div>
          <DrawerTitle className="text-xl">{item.nameCustomer}</DrawerTitle>
          <DrawerDescription>
            Historial de Venta • {item.createdAt}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECCIÓN 1: PRODUCTOS */}
          <section>
            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <IconPackage className="w-4 h-4" /> Productos Vendidos (
              {item.totalItems || item.count})
            </h4>

            <div className="space-y-3">
              {/* RENDERIZADO DE ITEMS */}
              {item.itemsDetail && item.itemsDetail.length > 0 ? (
                item.itemsDetail.map((detail: any, index: number) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors shadow-sm"
                  >
                    {/* Icono */}
                    <div className="w-10 h-10 rounded bg-secondary text-orange-600 flex items-center justify-center shrink-0 border">
                      <IconPackage className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm truncate pr-2 text-slate-400">
                          {detail.productName}
                        </p>
                        <span className="font-mono text-sm font-bold text-slate-500">
                          {formatCurrency(
                            detail.priceAtMoment * detail.quantity,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                        <div className="flex gap-2 items-center">
                          {/* Variantes */}
                          {detail.size && (
                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded border border-muted-foreground/10">
                              <IconRuler className="w-3 h-3" /> {detail.size}
                            </span>
                          )}
                          {detail.color && (
                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded border border-muted-foreground/10">
                              <IconPalette className="w-3 h-3" /> {detail.color}
                            </span>
                          )}
                        </div>
                        <span className="font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                          x{detail.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* FALLBACK SI NO HAY DETALLE (Legacy) */
                <div className="p-4 border border-dashed rounded text-center text-muted-foreground text-sm bg-muted/20">
                  <p className="font-medium text-slate-700">{item.product}</p>
                  <p className="text-xs mt-1">
                    (Resumen simple sin detalle desglosado)
                  </p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* SECCIÓN 2: INFO FINANCIERA & LOGÍSTICA */}
          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconReceipt2 className="w-3 h-3" /> Ingreso Total
                </h4>
                <p className="text-2xl font-black text-emerald-600 tracking-tight">
                  {formatCurrency(item.income)}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconCalendarEvent className="w-3 h-3" /> Fecha Venta
                </h4>
                <p className="text-sm font-medium">{item.saleDate}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconUser className="w-3 h-3" /> Vendedor
                </h4>
                <p
                  className="text-sm font-medium truncate"
                  title={item.sellerName}
                >
                  {item.sellerName || "N/A"}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconBuildingStore className="w-3 h-3" /> Sucursal
                </h4>
                <p className="text-sm font-medium truncate">
                  {item.branchName}
                </p>
              </div>
            </div>
          </section>
        </div>

        <DrawerFooter className="border-t pt-4 bg-muted/10">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">
              Cerrar Detalles
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
