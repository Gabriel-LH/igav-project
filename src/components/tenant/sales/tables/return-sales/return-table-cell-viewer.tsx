"use client";

import { z } from "zod";
import { salesReturnSchema } from "../type/type.return";
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
  IconCalendarEvent,
  IconPackage,
  IconReceipt2,
  IconRotateClockwise2,
  IconShoppingBag,
  IconUser,
} from "@tabler/icons-react";
import { formatCurrency } from "@/src/utils/currency-format";

type ReturnItemDetail = {
  id?: string;
  productName?: string;
  quantity?: number;
  priceAtMoment?: number;
  listPrice?: number;
  discountAmount?: number;
  variantCode?: string;
  serialCode?: string;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function TableCellViewerReturn({
  item,
}: {
  item: z.infer<typeof salesReturnSchema>;
}) {
  const isMobile = useIsMobile();
  const returnedQuantity = Number(item.returnedQuantity || item.count || 0);
  const refundAmount = Number(item.amountRefunded || 0);
  const restockingFee = Number(item.restockingFee || 0);
  const netReturnedValue = Math.max(0, refundAmount + restockingFee);
  const grossReturnedValue = (item.itemsDetail || []).reduce(
    (sum, detail) =>
      sum +
      Number(detail.priceAtMoment || 0) * Number(detail.quantity || 0),
    0,
  );

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
            <Badge variant="secondary" className="uppercase">
              {item.status.replace("_", " ")}
            </Badge>
          </div>
          <DrawerTitle className="text-xl">{item.nameCustomer}</DrawerTitle>
          <DrawerDescription>
            Devolución registrada • {item.returnDate || item.createdAt}
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <section>
            <h4 className="text-xs font-black uppercase text-muted-foreground mb-3 flex items-center gap-2">
              <IconPackage className="w-4 h-4" /> Productos devueltos (
              {returnedQuantity})
            </h4>

            <div className="space-y-3">
              {item.itemsDetail && item.itemsDetail.length > 0 ? (
                item.itemsDetail.map((detail: ReturnItemDetail, index: number) => (
                  (() => {
                    const quantity = Number(detail.quantity || 0);
                    const unitSalePrice = Number(detail.priceAtMoment || 0);
                    const lineGrossSale = roundMoney(unitSalePrice * quantity);
                    const listPrice =
                      detail.listPrice !== undefined
                        ? Number(detail.listPrice)
                        : unitSalePrice + Number(detail.discountAmount || 0);
                    const listLineTotal = roundMoney(listPrice * quantity);
                    const lineNetPaid =
                      grossReturnedValue > 0
                        ? roundMoney(
                            (netReturnedValue * lineGrossSale) / grossReturnedValue,
                          )
                        : lineGrossSale;
                    const proratedDiscount = roundMoney(
                      Math.max(0, listLineTotal - lineNetPaid),
                    );

                    return (
                  <div
                    key={detail.id || index}
                    className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors shadow-sm"
                  >
                    <div className="w-10 h-10 rounded bg-secondary text-emerald-600 flex items-center justify-center shrink-0 border">
                      <IconRotateClockwise2 className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-sm truncate text-slate-400">
                          {detail.productName || item.product}
                        </p>
                        <span className="font-mono text-sm font-bold text-slate-500">
                          {formatCurrency(lineNetPaid)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground gap-2">
                        <div className="truncate">
                          {detail.variantCode || detail.serialCode || "Sin detalle"}
                        </div>
                        <span className="font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                          x{quantity}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-[11px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Precio lista</span>
                          <span className="font-medium">
                            {formatCurrency(listLineTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Valor bruto</span>
                          <span className="font-medium">
                            {formatCurrency(lineGrossSale)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">
                            Desc. prorrateado
                          </span>
                          <span className="font-medium text-amber-600">
                            {formatCurrency(proratedDiscount)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Neto pagado</span>
                          <span className="font-semibold text-emerald-700">
                            {formatCurrency(lineNetPaid)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                    );
                  })()
                ))
              ) : (
                <div className="p-4 border border-dashed rounded text-center text-muted-foreground text-sm bg-muted/20">
                  <p className="font-medium text-slate-700">{item.product}</p>
                  <p className="text-xs mt-1">
                    Cantidad devuelta: {returnedQuantity}
                  </p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          <section className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconShoppingBag className="w-3 h-3" /> Valor retornado
                </h4>
                <p className="text-2xl font-black text-slate-700 tracking-tight">
                  {formatCurrency(netReturnedValue)}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconReceipt2 className="w-3 h-3" /> Reembolso neto
                </h4>
                <p className="text-lg font-black text-emerald-600">
                  {formatCurrency(refundAmount)}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconReceipt2 className="w-3 h-3" /> Cargo aplicado
                </h4>
                <p className="text-sm font-bold text-amber-600">
                  {formatCurrency(restockingFee)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconCalendarEvent className="w-3 h-3" /> Fecha venta
                </h4>
                <p className="text-sm font-medium">{item.saleDate || "---"}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconCalendarEvent className="w-3 h-3" /> Fecha devolución
                </h4>
                <p className="text-sm font-medium">{item.returnDate || "---"}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
                  <IconUser className="w-3 h-3" /> Vendedor
                </h4>
                <p className="text-sm font-medium truncate">
                  {item.sellerName || "N/A"}
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
