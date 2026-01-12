// src/components/home/details-reserved-viewer.tsx
import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/separator";
import { z } from "zod";
import { productSchema } from "../../types/product/type.product";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InformationCircleIcon,
  Layers01Icon,
  CheckmarkBadge03Icon,
  CalendarAdd01Icon,
  CalendarRemove01Icon,
  ColorsIcon,
} from "@hugeicons/core-free-icons";
import { OPERATIONS_MOCK } from "@/src/mocks/mock.operation";
import { PAYMENTS_MOCK } from "@/src/mocks/mock.payment";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { sumPayments, getRemainingBalance } from "@/src/utils/payment-helpers";
import { PaymentHistoryModal } from "./ui/PaymentHistorialModal";
import { useState } from "react";
import { Badge } from "@/components/badge";
import { reservationSchema } from "@/src/types/reservation/type.reservation"; 
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { formatCurrency } from "@/src/utils/currency-format";

export function DetailsReservedViewer({
  reservation: activeRes,
   item,
}: {
  item: z.infer<typeof productSchema>;
  reservation?: z.infer<typeof reservationSchema>;
}) {
  const isMobile = useIsMobile();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // --- NUEVA LÓGICA DE ITEMS ---
  // Recuperamos los ítems vinculados a esta reserva
  const activeResItems = MOCK_RESERVATION_ITEM.filter(
    (ri) => ri.reservationId === activeRes?.id
  );
  
  // Tomamos el primer ítem para las etiquetas rápidas (talla/color)
  const firstItem = activeResItems[0];

  // --- LÓGICA DE SEDE ---
  const sedeName = BRANCH_MOCKS.find(
    (b) => b.id === activeRes?.branchId
  )?.name || "Sede no encontrada";


  // LOGICA FINANCIERA ACTUALIZADA
  const operation = OPERATIONS_MOCK.find(
    (op) => op.reservationId === activeRes?.id
  );
  const allPayments = PAYMENTS_MOCK.filter(
    (p) => p.operationId === operation?.id
  );

  // Separar adelantos de garantía
  const paymentsTowardsPrice = allPayments.filter((p) => p.type !== "garantia");
  const totalAbonado = sumPayments(paymentsTowardsPrice);
  const garantiaRecibida = sumPayments(
    allPayments.filter((p) => p.type === "garantia")
  );

  const pendiente = operation
    ? getRemainingBalance(operation.totalAmount, totalAbonado)
    : 0;

  const cliente = CLIENTS_MOCK.find((c) => c.id === activeRes?.customerId);

  return (
    <>
      <Drawer direction={isMobile ? "bottom" : "right"}>
        <DrawerTrigger asChild>
          <Button variant="secondary" className="w-full shadow-sm">
            Ver reserva
          </Button>
        </DrawerTrigger>

        <DrawerContent className={isMobile ? "" : "max-w-md ml-auto h-full"}>
          <DrawerHeader className="border-b bg-amber-50/50 dark:bg-amber-950/10">
            <div className="flex justify-between items-center text-amber-700 dark:text-amber-500">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={Calendar03Icon}
                  strokeWidth={2.2}
                  size={20}
                />
                <DrawerTitle>Reserva Pendiente de Entrega</DrawerTitle>
              </div>
            </div>
            <DrawerDescription>
              {/* NUEVO: Información de Sede */}
              <Badge className="w-fit bg-amber-200 text-amber-800 hover:bg-amber-200 border-none text-sm">
                Sede:{" "}{sedeName}
              </Badge>
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-2 space-y-6 overflow-y-auto">
            {/* 1. EL "CUÁNDO" */}
            <div className="bg-card border rounded-xl overflow-hidden mt-4">
              <div className="bg-muted/50 px-4 py-1 border-b">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Agenda de Retiro
                </span>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-2xl font-black">
                    {activeRes?.startDate.getDate()}
                  </p>
                  <p className="text-[10px] uppercase font-medium">
                    {activeRes?.startDate.toLocaleString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="flex-2 pl-6">
                  <p className="text-sm font-bold">Retiro programado</p>
                  <p className="text-xs text-muted-foreground">
                    Hora sugerida: {activeRes?.hour} HS
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl overflow-hidden mt-4">
              <div className="bg-muted/50 px-4 py-1 flex items-center justify-between border-b">
                <span className="text-[9px] font-bold uppercase text-muted-foreground">
                  Registrado el:
                </span>
                <Separator orientation="vertical" className="h-10" />
                <span className="text-[9px] font-bold uppercase text-muted-foreground">
                  Aprox. de devolución:
                </span>
              </div>
              <div className="px-4 py-1 flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-xl font-black">
                    {activeRes?.createdAt.getDate()}
                  </p>
                  <p className="text-[10px] uppercase font-medium">
                    {activeRes?.createdAt.toLocaleString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center flex-1">
                  <p className="text-xl font-black">
                    {activeRes?.endDate.getDate()}
                  </p>
                  <p className="text-[10px] uppercase font-medium">
                    {activeRes?.endDate.toLocaleString("es-ES", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ESTADO FINANCIERO */}
            <div className="px-4 py-3 border rounded-xl bg-card space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Resumen de Pagos
                </h4>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 font-bold"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  Ver historial ({allPayments.length})
                </Button>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-emerald-600">
                    {formatCurrency(totalAbonado)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Total recibido
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      pendiente > 0 ? "text-orange-600" : "text-emerald-600"
                    }`}
                  >
                    {pendiente > 0 ? formatCurrency(pendiente) : "Pagado"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Saldo pendiente
                  </p>
                </div>
              </div>
            </div>

            {/* 3. DATOS DEL CLIENTE */}
            <div className="px-4 py-1 border rounded-xl bg-card space-y-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                Cliente Responsable
              </span>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {cliente?.firstName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">
                    {cliente?.firstName + " " + cliente?.lastName ||
                      "Cliente no encontrado"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cliente?.phone}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-1 text-sm border-t">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={Layers01Icon} size={14} /> Cant:{" "}
                  {firstItem.quantity}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={InformationCircleIcon} size={14} />{" "}
                  Talla: {firstItem.size}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={ColorsIcon} size={14} /> Color:{" "}
                  {firstItem.color}
                </span>
              </div>
            </div>

            {/* NUEVO: GARANTÍA (Agregado debajo de datos de cliente) */}
            <div className="px-4 py-3 border rounded-xl bg-blue-50/30 border-blue-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-700">
                  Garantía / Depósito
                </p>
                <p className="text-sm font-bold">
                  {garantiaRecibida > 0
                    ? `$${garantiaRecibida} en caja`
                    : "Pendiente de cobro"}
                </p>
              </div>
              <HugeiconsIcon
                icon={CheckmarkBadge03Icon}
                className={
                  garantiaRecibida > 0 ? "text-blue-500" : "text-slate-300"
                }
              />
            </div>

            {/* 4. CHECKLIST DE PREPARACIÓN */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Checklist de salida
              </h4>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm">
                    Limpieza y desinfección verificada
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm">
                    Cobro de saldo pendiente verificado (${pendiente})
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary"
                  />
                  <span className="text-sm">Garantía/DNI en resguardo</span>
                </label>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t bg-muted/20 grid grid-cols-2 gap-3">
            <Button
              disabled={pendiente > 0 && operation?.type === "venta"}
              className="w-full text-white bg-amber-600 hover:bg-amber-700 font-bold col-span-2 py-6 text-md shadow-lg"
            >
              <HugeiconsIcon
                icon={CheckmarkBadge03Icon}
                strokeWidth={3}
                className="mr-2"
              />
              {pendiente > 0 ? "LIQUIDAR Y ENTREGAR" : "ENTREGAR AHORA"}
            </Button>
            <Button variant="outline" className="w-full">
              <HugeiconsIcon
                icon={CalendarAdd01Icon}
                strokeWidth={2.2}
                className="mr-1"
              />
              Reagendar
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/20"
            >
              <HugeiconsIcon
                icon={CalendarRemove01Icon}
                strokeWidth={2.2}
                className="mr-1"
              />
              Anular
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="col-span-2">
                Regresar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <PaymentHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        payments={allPayments}
        totalOperation={operation?.totalAmount || 0}
      />
    </>
  );
}
