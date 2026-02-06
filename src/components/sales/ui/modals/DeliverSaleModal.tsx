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
import { z } from "zod";
import { Sale } from "@/src/types/sales/type.sale";
import { useSaleStore} from "@/src/store/useSaleStore";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { useInventoryStore } from "@/src/store/useInventoryStore";

interface DeliverSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onConfirm: (id: string) => void;
}

export const DeliverSaleModal = ({
  open,
  onOpenChange,
  sale,
  onConfirm,
}: DeliverSaleModalProps) => {
  const [loading, setLoading] = useState(false);

  const { products } = useInventoryStore()

  const {saleItems} = useSaleStore()

  const customers = CLIENTS_MOCK;

  const customer = customers.find((c) => c.id === sale.customerId);

  const saleItem = saleItems.find((s) => s.saleId === sale.id);

  const product = products.find((p) => p.id === saleItem?.productId);

  const sellerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : "";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(sale.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Entregar Venta</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas entregar esta venta? Esta acción no se
            puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Cliente
            </Label>
            <Input
              id="name"
              value={sellerName}
              className="col-span-3"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="product" className="text-right">
              Producto
            </Label>
            <Input
              id="product"
              value={product?.name}
              className="col-span-3"
              disabled
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="count" className="text-right">
              Cantidad
            </Label>
            <Input
              id="count"
              value={saleItem?.quantity}
              className="col-span-3"
              disabled
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Entregando..." : "Entregar Venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
