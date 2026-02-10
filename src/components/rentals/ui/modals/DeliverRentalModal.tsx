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

interface DeliverRentalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental: Rental;
  onConfirm: (
    id: string,
    guarantee: { value: string; type: GuaranteeType },
  ) => void;
}

export const DeliverRentalModal = ({
  open,
  onOpenChange,
  rental,
  onConfirm,
}: DeliverRentalModalProps) => {
  const [loading, setLoading] = useState(false);

  const {guarantees} = useGuaranteeStore()

  const guaranteeStore = guarantees.find((g) => g.id === rental.guaranteeId);


  const [guarantee, setGuarantee] = useState(
    guaranteeStore?.value === "" ? guaranteeStore?.description : guaranteeStore?.value,
  );


  const [guaranteeType, setGuaranteeType] = useState<GuaranteeType>(
    guaranteeStore?.type === "por_cobrar" ? "dinero" : guaranteeStore?.type || "dinero",
  );

  const { products } = useInventoryStore();

  const { rentalItems } = useRentalStore();

  const customers = CLIENTS_MOCK;

  const customer = customers.find((c) => c.id === rental.customerId);

  const rentalItem = rentalItems.find((s) => s.rentalId === rental.id);

  const product = products.find((p) => p.id === rentalItem?.productId);

  const sellerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : "";

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(rental.id, {
        value: guarantee!,
        type: guaranteeType,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Entregar Alquiler</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas entregar este alquiler? Esta acción no
            se puede deshacer.
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
              value={rentalItem?.quantity}
              className="col-span-3"
              disabled
            />
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
          <Button onClick={handleConfirm} disabled={loading || !guarantee || !guaranteeType}>
            {loading ? "Entregando..." : "Entregar Alquiler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
