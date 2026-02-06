import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Input } from "@/components/input";
import { SaleWithItems } from "@/src/types/sales/type.sale";
import { SaleItem } from "@/src/types/sales/type.saleItem";
import { formatCurrency } from "@/src/utils/currency-format";
import { Button } from "@/components/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";

export function ReturnProductModal({
  open,
  onOpenChange,
  sale,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: any;
  sale: SaleWithItems;
  onConfirm: (
    saleId: string,
    reason: string,
    items: {
      saleItemId: string;
      condition?: "perfecto" | "dañado" | "manchado";
      restockingFee: number;
    }[],
  ) => void;
}) {
  // Estado para manejar qué items se están devolviendo y sus condiciones
  const [returnItems, setReturnItems] = useState<
    Record<string, Partial<SaleItem>>
  >(
    sale.items.reduce(
      (acc, item) => ({
        ...acc,
        [item.id]: {
          isReturned: false,
          returnCondition: "perfecto",
          restockingFee: 0,
        },
      }),
      {},
    ),
  );

  const [reason, setReason] = useState("");

  const handleToggleItem = (id: string) => {
    setReturnItems((prev) => ({
      ...prev,
      [id]: { ...prev[id], isReturned: !prev[id].isReturned },
    }));
  };

  const totalToRefund = Object.keys(returnItems).reduce((acc, id) => {
    const config = returnItems[id];
    if (!config.isReturned) return acc;
    const item = sale.items.find((i) => i.id === id);
    return acc + (item?.priceAtMoment || 0) - (config.restockingFee || 0);
  }, 0);

  const itemsToReturn = Object.entries(returnItems)
    .filter(([, config]) => config.isReturned)
    .map(([saleItemId, config]) => ({
      saleItemId,
      condition: config.returnCondition,
      restockingFee: config.restockingFee ?? 0,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-hidden={!open} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Procesar Devolución de Mercadería</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div className="border rounded-md divide-y">
            {sale.items.map((item) => {
              const isAlreadyReturned = item.isReturned;
              return (
                <div key={item.id} className="p-4 flex items-start gap-4">
                  <Checkbox
                    disabled={isAlreadyReturned}
                    checked={returnItems[item.id].isReturned}
                    onCheckedChange={() => handleToggleItem(item.id)}
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-bold">
                        Stock ID: {item.stockId}
                      </p>
                      {returnItems[item.id].isReturned && (
                        <div className="flex flex-col justify-between">
                          <p className="text-sm">
                            {formatCurrency(item.priceAtMoment)}
                          </p>
                        </div>
                      )}
                      {isAlreadyReturned && (
                        <Badge variant="secondary">Ya devuelto</Badge>
                      )}
                    </div>

                    {returnItems[item.id].isReturned && (
                      <div className="flex gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">
                            Estado de retorno
                          </Label>
                          <Select
                            value={returnItems[item.id].returnCondition}
                            onValueChange={(val: any) =>
                              setReturnItems((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  returnCondition: val,
                                },
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="perfecto">
                                Perfecto Estado
                              </SelectItem>
                              {/* <SelectItem value="defectuoso">
                                Defecto minimo (+ Cargo de penalidad)
                              </SelectItem> */}{" "}
                              {/* mas adelante se implementara */}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-32">
                          <Label className="text-[10px] uppercase text-muted-foreground">
                            Cargo devolución (S/.)
                          </Label>
                          <Input
                            className="h-8 text-xs"
                            value={returnItems[item.id].restockingFee}
                            onChange={(e) =>
                              setReturnItems((prev) => ({
                                ...prev,
                                [item.id]: {
                                  ...prev[item.id],
                                  restockingFee: Number(e.target.value),
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
            <div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase">
                Total a devolver al cliente
              </p>
              <p className="text-xs text-muted-foreground italic">
                (Precio item - penalidades)
              </p>
            </div>
            <p className="text-2xl font-black text-emerald-600">
              {formatCurrency(totalToRefund)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Motivo de la devolución</Label>
          <Input
            placeholder="Ej: No le quedó, defecto, cambio de opinión"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            onClick={() => onConfirm(sale.id, reason, itemsToReturn)}
            disabled={itemsToReturn.length === 0 || !reason.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirmar Reingreso y Devolución
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
