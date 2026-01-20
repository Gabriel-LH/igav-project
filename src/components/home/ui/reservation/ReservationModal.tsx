import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ReservationFormContent } from "../forms/ReservationFormContent"; // El que unificamos antes
import { Button } from "@/components/ui/button";
import React from "react";
import { useReservationStore } from "@/src/store/useReservationStore";
import { toast } from "sonner";

export function ReservationModal({ item, children, currentBranchId, originBranchId }: any) {
  const [dateRange, setDateRange] = React.useState(undefined);
  const [selectedCustomer, setSelectedCustomer] = React.useState(null);
  const [notes, setNotes] = React.useState("");

  const [quantity, setQuantity] = React.useState(1);
  const [downPayment, setDownPayment] = React.useState(0);
  const [guarantee, setGuarantee] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [guaranteeType, setGuaranteeType] = React.useState<"money" | "item">("money");

  const { createReservation } = useReservationStore();

  const handleConfirm = () => {
  // 1. Validaciones básicas
  if (!dateRange?.from || !selectedCustomer) return;

  // 2. Construcción del objeto según lo que pulimos
  const newRes = {
    productId: item.id,
    productName: item.name,
    sku: item.sku,
    size: item.size,
    color: item.color,
    customerId: selectedCustomer.id,
    customerName: selectedCustomer.name,
    startDate: dateRange.from,
    endDate: dateRange.to,
    quantity: quantity,
    status: "pendiente", // O "reservado"
    notes: notes,
    financials: {
      priceRent: item.price_rent,
      downPayment: Number(downPayment),
      guarantee: guarantee, // Recordar que puede ser texto o número
      guaranteeType: guaranteeType,
      paymentMethod: paymentMethod,
    },
    branchId: currentBranchId,
  };

  console.log("newRes", newRes);

  // 3. Guardar en Zustand
  createReservation(newRes);

  // 4. Feedback y cerrar
  toast.success("Reserva creada exitosamente");
  // Aquí podrías cerrar el modal
};


  return (
    <Dialog>
      <DialogTrigger asChild>
        {children} 
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Reserva: {item.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <ReservationFormContent 
          item={item}
          originBranchId={originBranchId}
          currentBranchId={currentBranchId}
          dateRange={dateRange}
          setDateRange={setDateRange}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          // PASAMOS LOS NUEVOS ESTADOS:
          quantity={quantity}
          setQuantity={setQuantity}
          downPayment={downPayment}
          setDownPayment={setDownPayment}
          guarantee={guarantee}
          setGuarantee={setGuarantee}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          guaranteeType={guaranteeType}
          setGuaranteeType={setGuaranteeType}
          notes={notes}
          setNotes={setNotes}
        />
        </div>

        <Button 
          className="w-full bg-emerald-600"
          disabled={!dateRange?.to || !selectedCustomer}
          onClick={() => {handleConfirm()}}
        >
          Confirmar y Crear Contrato
        </Button>
      </DialogContent>
    </Dialog>
  );
}