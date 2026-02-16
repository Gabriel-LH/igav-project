import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { useState } from "react";
import { Rental } from "@/src/types/rentals/type.rentals";
import { useRentalStore } from "@/src/store/useRentalStore";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { GuaranteeSection } from "@/src/components/home/ui/reservation/GuaranteeSection";
import { useGuaranteeStore } from "@/src/store/useGuaranteeStore";
import { Checkbox } from "@/components/checkbox";
import { Badge } from "@/components/badge";

interface DeliverRentalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: Rental;
  onConfirm: (
    id: string,
    guarantee: { value: string; type: GuaranteeType },
    selectedIds?: string[],
  ) => void;
}

export const DeliverRentalModal = ({
  open,
  onOpenChange,
  rental,
  onConfirm,
}: DeliverRentalModalProps) => {
  const [loading, setLoading] = useState(false);
  const { guarantees } = useGuaranteeStore();
  const guaranteeStore = guarantees.find((g) => g.id === rental.guaranteeId);

  const [guarantee, setGuarantee] = useState(
    guaranteeStore?.value === ""
      ? guaranteeStore?.description
      : guaranteeStore?.value,
  );

  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>(
    guaranteeStore?.type === "por_cobrar"
      ? "dinero"
      : guaranteeStore?.type || "dinero",
  );

  const { products } = useInventoryStore();
  const { rentalItems } = useRentalStore();
  const customers = CLIENTS_MOCK;
  const customer = customers.find((c) => c.id === rental.customerId);
  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : "";

  // 1. Obtener items de este alquiler
  const currentRentalItems = rentalItems.filter(
    (i) => i.rentalId === rental.id,
  );

  // 2. Agrupar items
  const groupedItems = currentRentalItems.reduce(
    (acc, item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return acc;
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = {
          product,
          items: [],
          quantity: 0,
          isSerial: product.is_serial || false,
        };
      }
      acc[key].items.push(item);
      acc[key].quantity += item.quantity; // Usually 1 for rental items stored individually
      return acc;
    },
    {} as Record<
      string,
      { product: any; items: any[]; quantity: number; isSerial: boolean }
    >,
  );

  const groups = Object.values(groupedItems);

  // Estado para selección
  const [selection, setSelection] = useState<
    Record<string, { selectedIds: Set<string>; selectedQty: number }>
  >({});

  const handleToggleSerial = (productId: string, itemId: string) => {
    setSelection((prev) => {
      const prodSel = prev[productId] || {
        selectedIds: new Set(),
        selectedQty: 0,
      };
      const newIds = new Set(prodSel.selectedIds);
      if (newIds.has(itemId)) {
        newIds.delete(itemId);
      } else {
        newIds.add(itemId);
      }
      return {
        ...prev,
        [productId]: {
          ...prodSel,
          selectedIds: newIds,
          selectedQty: newIds.size,
        },
      };
    });
  };

  const handleChangeQty = (productId: string, qty: number, max: number) => {
    if (qty < 0) qty = 0;
    if (qty > max) qty = max;
    setSelection((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        selectedQty: qty,
        selectedIds: new Set(),
      },
    }));
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const idsToDeliver: string[] = [];
      groups.forEach((group) => {
        const sel = selection[group.product.id];
        if (!sel) return;
        if (group.isSerial) {
          sel.selectedIds.forEach((id) => idsToDeliver.push(id));
        } else {
          const itemsToTake = group.items.slice(0, sel.selectedQty);
          itemsToTake.forEach((item) => idsToDeliver.push(item.id));
        }
      });

      // @ts-ignore - Passing extra argument for items
      await onConfirm(
        rental.id,
        {
          value: guarantee!,
          type: guaranteeType,
        },
        idsToDeliver,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entregar Alquiler</DialogTitle>
          <DialogDescription>
            Confirma los items a entregar y la garantía.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-1 bg-muted/50 p-3 rounded-md">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              Cliente
            </Label>
            <p className="font-medium text-sm">{customerName}</p>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-bold">Productos a Entregar</Label>
            {groups.map((group) => {
              const sel = selection[group.product.id] || {
                selectedIds: new Set(),
                selectedQty: 0,
              };
              const isAllSelected = group.isSerial
                ? sel.selectedIds.size === group.items.length
                : sel.selectedQty === group.quantity;

              return (
                <div
                  key={group.product.id}
                  className="border rounded-lg p-3 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{group.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cant. Total: {group.quantity}
                      </p>
                    </div>
                    {isAllSelected && (
                      <Badge
                        variant="default"
                        className="bg-emerald-600 text-[10px]"
                      >
                        Completo
                      </Badge>
                    )}
                  </div>

                  {group.isSerial ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">
                        Seleccionar items:
                      </p>
                      {group.items.map((item) => {
                        const isChecked = sel.selectedIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 border border-transparent hover:border-border transition-all"
                          >
                            <Checkbox
                              id={`item-${item.id}`}
                              checked={isChecked}
                              onCheckedChange={() =>
                                handleToggleSerial(group.product.id, item.id)
                              }
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className="text-xs cursor-pointer flex-1"
                            >
                              ID:{" "}
                              <span className="font-mono text-muted-foreground">
                                {item.stockId || item.id.slice(0, 8)}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-md">
                      <Label
                        htmlFor={`qty-${group.product.id}`}
                        className="text-xs whitespace-nowrap"
                      >
                        Entregar:
                      </Label>
                      <Input
                        id={`qty-${group.product.id}`}
                        type="number"
                        min={0}
                        max={group.quantity}
                        value={sel.selectedQty}
                        onChange={(e) =>
                          handleChangeQty(
                            group.product.id,
                            Number(e.target.value),
                            group.quantity,
                          )
                        }
                        className="h-8 w-20 text-center font-bold"
                      />
                      <span className="text-xs text-muted-foreground">
                        / {group.quantity} unid.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <GuaranteeSection
          guarantee={guarantee!}
          setGuarantee={setGuarantee}
          guaranteeType={guaranteeType}
          setGuaranteeType={setGuaranteeType}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !guarantee || !guaranteeType}
          >
            {loading ? "Entregando..." : "Entregar Alquiler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
