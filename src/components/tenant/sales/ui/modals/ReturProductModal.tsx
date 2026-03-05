import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { useInventoryStore } from "@/src/store/useInventoryStore";
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
      quantity: number; // Added quantity
      condition?: "perfecto" | "dañado" | "manchado";
      restockingFee: number;
    }[],
  ) => void;
}) {
  const { products, inventoryItems, stockLots } = useInventoryStore(); // Access products to check is_serial

  // Estado para manejar qué items se están devolviendo y sus condiciones
  const [returnItems, setReturnItems] = useState<
    Record<
      string,
      Partial<SaleItem> & {
        quantityToReturn?: number;
        restockingFee?: number;
        returnCondition?: string;
        isReturned?: boolean;
      }
    >
  >(() => {
    // Inicializamos usando el ID único de la fila (RITEM-xxx o SITEM-xxx)
    const init: Record<
      string,
      Partial<SaleItem> & {
        quantityToReturn?: number;
        restockingFee?: number;
        returnCondition?: string;
        isReturned?: boolean;
      }
    > = {};
    sale.items.forEach((item) => {
      init[item.id] = {
        isReturned: false,
        quantityToReturn: 0,
        returnCondition: "perfecto",
        restockingFee: 0,
      };
    });
    return init;
  });

  const [reason, setReason] = useState("");

  const handleToggleItem = (id: string, maxQty: number) => {
    setReturnItems((prev) => {
      const current = prev[id];
      const newIsReturned = !current.isReturned;
      return {
        ...prev,
        [id]: {
          ...current,
          isReturned: newIsReturned,
          // If toggled ON, select maxQty (full row). If OFF, 0.
          quantityToReturn: newIsReturned ? maxQty : 0,
        },
      };
    });
  };

  const handleChangeQuantity = (
    productId: string,
    qty: number,
    itemsInGroup: SaleItem[],
  ) => {
    let remaining = qty;

    setReturnItems((prev) => {
      const next = { ...prev };

      itemsInGroup.forEach((item) => {
        if (remaining > 0) {
          const take = Math.min(item.quantity, remaining);
          next[item.id] = {
            ...next[item.id],
            isReturned: true,
            quantityToReturn: take,
          };
          remaining -= take;
        } else {
          next[item.id] = {
            ...next[item.id],
            isReturned: false,
            quantityToReturn: 0,
          };
        }
      });
      return next;
    });
  };

  const handleBatchConditionChange = (
    itemsInGroup: SaleItem[],
    field: "returnCondition" | "restockingFee",
    value: any,
  ) => {
    setReturnItems((prev) => {
      const next = { ...prev };
      itemsInGroup.forEach((item) => {
        // Update all items in the group (or only returned ones?)
        // Better to update all so if quantity increases, they inherit the settings.
        next[item.id] = { ...next[item.id], [field]: value };
      });
      return next;
    });
  };

  const totalToRefund = Object.keys(returnItems).reduce((acc, id) => {
    const config = returnItems[id];
    if (!config.isReturned || !config.quantityToReturn) return acc;
    const item = sale.items.find((i) => i.id === id);
    // Refund = (Price * Qty) - Fee
    // Fee is usually per unit or flat? Assuming flat fee per ROW in existing UI, but logically per unit?
    // User UI shows "Cargo (S/.)" input per row.
    // Let's assume the fee entered is TOTAL for that return line.
    return (
      acc +
      (item?.priceAtMoment || 0) * config.quantityToReturn -
      (config.restockingFee || 0)
    );
  }, 0);

  const itemsToReturn = Object.entries(returnItems)
    .filter(
      ([, config]) => config.isReturned && (config.quantityToReturn || 0) > 0,
    )
    .map(([saleItemId, config]) => ({
      saleItemId,
      quantity: config.quantityToReturn || 1,
      condition: config.returnCondition,
      restockingFee: config.restockingFee ?? 0,
    }));

  const groupedItems = useMemo(() => {
    return sale.items.reduce(
      (acc, item) => {
        // Buscamos info física para diferenciar grupos (usando el ID que es UUID)
        const physicalItem =
          inventoryItems.find((s) => s.id === item.stockId) ||
          stockLots.find((s) => s.id === item.stockId);

        const product = products.find((p) => p.id === item.productId);

        const size = (physicalItem as any)?.sizeId || "Única";
        const color = (physicalItem as any)?.colorId || "N/A";
        // Unique key for grouping
        const key = `${item.productId}-${size}-${color}`;

        if (!acc[key]) {
          acc[key] = {
            product,
            items: [], // Aquí guardaremos todas las filas que pertenecen a este grupo
            isSerial: product?.is_serial || false,
            size,
            color,
          };
        }
        acc[key].items.push(item);
        return acc;
      },
      {} as Record<
        string,
        {
          product: any;
          items: SaleItem[];
          isSerial: boolean;
          size: string;
          color: string;
        }
      >,
    );
  }, [sale.items, inventoryItems, stockLots, products]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-hidden={!open}
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Procesar Devolución de Mercadería</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Por favor, seleccione los productos que desea devolver y configure sus
          respectivas condiciones.
        </DialogDescription>

        <div className="space-y-4 my-2">
          <div className="border rounded-md divide-y">
            {Object.values(groupedItems).map((group) => {
              const { product, items, isSerial, size, color } = group; // 👈 Extraemos size y color
              const productName = product?.name || "Producto Desconocido";

              // Required for non-serial input
              const totalGroupQty = items.reduce(
                (acc, i) => acc + i.quantity,
                0,
              );

              const returnedCount = items.reduce(
                (acc, i) => acc + (returnItems[i.id]?.quantityToReturn || 0),
                0,
              );

              // Get first item config for batch controls (representative)
              const firstItemConfig = returnItems[items[0].id];

              return (
                <div
                  key={
                    /* Clave única basada en el grupo */ `${product?.id}-${size}-${color}`
                  }
                  className="p-4 space-y-3 bg-card"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm">{productName}</h4>
                      {/* ✅ Mostramos los atributos para diferenciar las filas */}
                      <div className="flex gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase"
                        >
                          {size}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase"
                        >
                          {color}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Cantidad Original: {totalGroupQty}
                      </p>
                    </div>
                    {isSerial && (
                      <Badge className="bg-blue-100 text-blue-700 border-none text-[9px]">
                        Seriado
                      </Badge>
                    )}
                  </div>

                  {/* CONTROLS */}
                  {isSerial ? (
                    <div className="space-y-2 pl-2 border-l-2 border-muted">
                      {items.map((item) => {
                        const isAlreadyReturned = item.isReturned; // From DB (SaleItem)
                        const isChecked =
                          returnItems[item.id]?.isReturned || false;

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 p-2 rounded bg-muted/20"
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox
                                disabled={isAlreadyReturned}
                                checked={isChecked}
                                onCheckedChange={() =>
                                  handleToggleItem(item.id, item.quantity)
                                }
                                id={`chk-${item.id}`}
                              />
                              <Label
                                htmlFor={`chk-${item.id}`}
                                className="cursor-pointer text-xs"
                              >
                                ID: {item.stockId || item.id.slice(0, 8)}
                              </Label>
                              {isAlreadyReturned && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px]"
                                >
                                  Ya devuelto
                                </Badge>
                              )}
                            </div>

                            {/* Condition Controls Per Item (Serial) */}
                            {isChecked && (
                              <div className="grid grid-cols-2 gap-2 mt-1 animate-in fade-in">
                                <div>
                                  <Label className="text-[9px] uppercase text-muted-foreground">
                                    Estado
                                  </Label>
                                  <Select
                                    value={
                                      returnItems[item.id]?.returnCondition
                                    }
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
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="perfecto">
                                        Perfecto
                                      </SelectItem>
                                      <SelectItem value="dañado">
                                        Dañado
                                      </SelectItem>
                                      <SelectItem value="manchado">
                                        Manchado
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-[9px] uppercase text-muted-foreground">
                                    Cargo (S/.)
                                  </Label>
                                  <Input
                                    type="number"
                                    className="h-7 text-xs"
                                    value={returnItems[item.id]?.restockingFee}
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
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3 pl-2 border-l-2 border-blue-200/50">
                      {/* Non-Serial Logic */}

                      <div className="flex items-center gap-3">
                        <Label className="text-xs">Cantidad a Devolver:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={totalGroupQty}
                          value={returnedCount}
                          onChange={(e) =>
                            handleChangeQuantity(
                              product.id,
                              Number(e.target.value),
                              items,
                            )
                          }
                          className="w-20 h-8 font-bold text-center"
                        />
                        <span className="text-xs text-muted-foreground">
                          / {totalGroupQty}
                        </span>
                      </div>

                      {/* Batch Settings for Non-Serial */}
                      {returnedCount > 0 && (
                        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-2 rounded">
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">
                              Estado (Lote)
                            </Label>
                            <Select
                              value={firstItemConfig?.returnCondition}
                              onValueChange={(val: any) =>
                                handleBatchConditionChange(
                                  items,
                                  "returnCondition",
                                  val,
                                )
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="perfecto">
                                  Perfecto
                                </SelectItem>
                                <SelectItem value="dañado">Dañado</SelectItem>
                                <SelectItem value="manchado">
                                  Manchado
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-[10px] uppercase text-muted-foreground">
                              Cargo x Unidad (S/.)
                            </Label>
                            <Input
                              type="number"
                              className="h-7 text-xs"
                              value={firstItemConfig?.restockingFee}
                              onChange={(e) =>
                                handleBatchConditionChange(
                                  items,
                                  "restockingFee",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
