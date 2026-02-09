// src/components/home/details-reserved-viewer.tsx
import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { Separator } from "@/components/separator";
import { z } from "zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkBadge03Icon,
  CalendarAdd01Icon,
  CalendarRemove01Icon,
} from "@hugeicons/core-free-icons";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import { getOperationBalances } from "@/src/utils/payment-helpers";
import { PaymentHistoryModal } from "./ui/modals/PaymentHistorialModal";
import React, { useState } from "react";
import { Badge } from "@/components/badge";
import { reservationSchema } from "@/src/types/reservation/type.reservation";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { formatCurrency } from "@/src/utils/currency-format";
import { Payment } from "@/src/types/payments/type.payments";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { toast } from "sonner";
import { buildDeliveryTicketHtml } from "../ticket/build-delivered-ticket";
import { printTicket } from "@/src/utils/ticket/print-ticket";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { useReservationStore } from "@/src/store/useReservationStore";
import { usePaymentStore } from "@/src/store/usePaymentStore";
import { useOperationStore } from "@/src/store/useOperationStore";
import { registerPayment } from "@/src/services/paymentService";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/checkbox";
import { Label } from "@/components/label";
import { RescheduleModal } from "./ui/modals/RescheduleModal";
import { CancelReservationModal } from "./ui/modals/CancelReservationModal";
import { GuaranteeSection } from "./ui/reservation/GuaranteeSection";
import Image from "next/image";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { convertReservationUseCase } from "@/src/services/use-cases/converterReservation.usecase";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";


export function DetailsReservedViewer({
  reservation: activeRes,
}: {
  reservation?: z.infer<typeof reservationSchema>;
}) {
  const isMobile = useIsMobile();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const currentUser = USER_MOCK[0];

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState<Record<string, string>>(
    {},
  );
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const stock = useInventoryStore((state) => state.stock);

  const [guarantee, setGuarantee] = React.useState<G>("");
  const [guaranteeType, setGuaranteeType] = React.useState<GuaranteeType>("dinero");

  const cancelReservation = useReservationStore(
    (state) => state.cancelReservation,
  );
  const rearrangeReservation = useReservationStore(
    (state) => state.rearrangeReservation,
  );

  const { reservationItems } = useReservationStore();

  const { payments: globalPayments } = usePaymentStore();

  const { products } = useInventoryStore();

  const { operations } = useOperationStore();

  const { customers } = useCustomerStore();

  const currentClient = customers.find((c) => c.id === activeRes?.customerId);

  const seller = USER_MOCK[0];

  const [checklist, setChecklist] = useState({
    limpieza: false,
    garantia: false,
  });
  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const operation = operations.find((op) => op.id === activeRes?.operationId);

  const handleConfirmReschedule = (newStartDate: Date, newEndDate: Date) => {
    if (!activeRes) return;

    rearrangeReservation(activeRes.id, newStartDate, newEndDate);
    toast.success("Reserva reagendada correctamente");
    setIsRescheduleOpen(false);
    setIsDrawerOpen(false);
  };

  const handleConfirmCancel = () => {
    if (!activeRes) return;

    cancelReservation(activeRes.id);
    toast.success("Reserva anulada correctamente");
    setIsCancelOpen(false);
    setIsDrawerOpen(false);
  };

  // 4. Función para agregar un pago (esta se la pasaremos al modal)
  const handleAddPayment = (data: any): Payment => {
    return registerPayment({
      operationId: operation?.id || "",
      ...data,
    });
  };

  // 2. Combinamos pagos del Mock con los reales del Store
  const allPaymentsForThisOp = [
    ...globalPayments.filter(
      (p) => String(p.operationId) === String(operation?.id),
    ),
  ];

  const activeResItems = reservationItems.filter(
    (ri) => ri.reservationId === activeRes?.id,
  );

  const allItemsAssigned = activeResItems.every(
    (item) => selectedStocks[item.id],
  );

  const totalCalculated = activeResItems.reduce(
    (acc, item) => acc + item.priceAtMoment * item.quantity,
    0,
  );

  const { totalPaid, balance, isCredit, creditAmount } = getOperationBalances(
    operation?.id || "",
    allPaymentsForThisOp,
    totalCalculated,
  );

  const isReadyToDeliver =
    (balance === 0 || isCredit) &&
    checklist.limpieza &&
    checklist.garantia &&
    allItemsAssigned;

  const handleDeliver = async (deliverImmediately: boolean) => {
    if (!activeRes) return;

    if (!isReadyToDeliver) {
      toast.error("Faltan requisitos para la entrega");
      return;
    }

    try {
      setChecklist({ limpieza: false, garantia: false });
      setIsDrawerOpen(false);

      await convertReservationUseCase({
        reservation: activeRes,
        reservationItems: activeResItems,
        selectedStocks,
        sellerId: currentUser.id,
        totalCalculated,
        downPayment: 0,
        totalPaid,
        isCredit,
        guarantee: {
          type: guaranteeType as GuaranteeType,
          value: guarantee,
        },
        notes: "Conversión desde reserva",
        shouldDeliverImmediately: deliverImmediately,
      });

      // Generación de Ticket (Mantenemos tu lógica de impresión)
      const ticketHtml = buildDeliveryTicketHtml(
        seller,
        activeRes,
        currentClient!,
        activeResItems,
        guaranteeType,
        guarantee,
      );

      printTicket(ticketHtml);

      setTimeout(() => {
        toast.success(
          activeRes.operationType === "venta"
            ? deliverImmediately
              ? "¡Venta finalizada y entregada!"
              : "¡Venta guardada! Pendiente de recojo."
            : "¡Alquiler entregado correctamente!",
          { duration: 3000 },
        );
      }, 500);
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la operación");
    }
  };

  const sedeName =
    BRANCH_MOCKS.find((b) => b.id === activeRes?.branchId)?.name ||
    "Sede central";
  const cliente = CLIENTS_MOCK.find((c) => c.id === activeRes?.customerId);

  return (
    <>
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
      >
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
              <Badge className="w-fit bg-card text-amber-400 border- text-sm">
                Sede: {sedeName}
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
                    Hora sugerida: {activeRes?.hour}
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
                    {activeRes?.operationType === "alquiler"
                      ? activeRes?.endDate.getDate()
                      : "NO APLICA"}
                  </p>
                  <p className="text-[10px] uppercase font-medium">
                    {activeRes?.operationType === "alquiler"
                      ? activeRes?.endDate.toLocaleString("es-ES", {
                          month: "long",
                          year: "numeric",
                        })
                      : "NO APLICA"}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ESTADO FINANCIERO ACTUALIZADO */}
            <div className="px-4 py-3 border rounded-xl bg-card space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Resumen de Pagos
                </h4>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 font-bold text-[11px]"
                  onClick={() => setIsHistoryOpen(true)}
                >
                  Ver historial ({allPaymentsForThisOp.length})
                </Button>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-emerald-600">
                    {formatCurrency(totalPaid)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Total abonado
                  </p>
                </div>
                <div className="text-right">
                  {/* Lógica de color dinámica: Naranja si debe, Azul si es saldo a favor, Verde si está saldado */}
                  <p
                    className={`text-xl font-black ${
                      isCredit
                        ? "text-blue-600"
                        : balance > 0
                          ? "text-orange-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {isCredit
                      ? `+ ${formatCurrency(creditAmount)}`
                      : balance > 0
                        ? formatCurrency(balance)
                        : "PAGADO"}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">
                    {isCredit ? "Crédito a favor" : "Saldo pendiente"}
                  </p>
                </div>
              </div>

              {/* Pequeño indicador visual del total real del contrato */}
              <div className="pt-2 border-t border-dashed flex justify-between text-[10px] text-muted-foreground">
                <span>Valor total del servicio:</span>
                <span className="font-bold">
                  {formatCurrency(totalCalculated)}
                </span>
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
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground">
                Artículos en esta reserva ({activeResItems.length})
              </span>
              <div>
                {activeResItems.map((item) => {
                  const prod = products.find(
                    (p) => p.id.toString() === item.productId,
                  );

                  const allMatchingStock = stock.filter(
                    (s) =>
                      String(s.productId) === String(item.productId) &&
                      s.size === item.size &&
                      s.color?.toLowerCase() === item.color?.toLowerCase() &&
                      s.status === "disponible",
                  );

                  // 2. Lo dividimos en dos grupos para la UI
                  const localOptions = allMatchingStock.filter(
                    (s) => s.branchId === activeRes?.branchId,
                  );
                  const remoteOptions = allMatchingStock.filter(
                    (s) => s.branchId !== activeRes?.branchId,
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 p-3 border rounded-xl bg-muted/20"
                    >
                      <div className="flex">
                        <div className="h-12 w-10 rounded overflow-hidden">
                          <Image
                            src={prod?.image || "/placeholder.jpg"}
                            alt={prod?.name || ""}
                            width={40}
                            height={40}
                            className="object-cover h-full w-full"
                          />
                        </div>
                        <div className="flex-1 pl-2">
                          <p className="text-sm font-bold leading-tight">
                            {prod?.name}
                          </p>
                          <div className="flex gap-2 text-[10px]  font-semibold mt-1">
                            <span className="px-1.5 rounded border">
                              TALLA {item.size}
                            </span>
                            <span className="px-1.5 rounded border uppercase">
                              {item.color}
                            </span>
                            <span>x{item.quantity}</span>
                          </div>
                        </div>
                        <span className="font-bold text-sm">
                          {formatCurrency(item.priceAtMoment)}
                        </span>
                      </div>

                      {/* NUEVO: Selector de Stock Físico */}
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <p className="text-[10px] font-bold text-primary uppercase mb-1">
                          Asignar Prenda Física:
                        </p>
                        <Select
                          value={selectedStocks[item.id] || ""}
                          onValueChange={(value) =>
                            setSelectedStocks({
                              ...selectedStocks,
                              [item.id]: value,
                            })
                          }
                        >
                          <SelectTrigger className="w-full text-xs p-2 rounded border">
                            <SelectValue placeholder="Seleccionar código de barra (Stock)..." />
                          </SelectTrigger>
                          <SelectContent aria-hidden="false">
                            {/* GRUPO 1: Disponibles aquí mismo */}
                            {localOptions.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-emerald-600 font-bold text-[10px]">
                                  EN ESTA SEDE
                                </SelectLabel>
                                {localOptions.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.id} -{" "}
                                    {s.damageNotes || "Excelente estado"}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )}

                            {remoteOptions.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-orange-600 font-bold text-[10px] border-t mt-1 pt-1">
                                  EN OTRA SEDE (Requiere traslado)
                                </SelectLabel>
                                {remoteOptions.map((s) => {
                                  const otherBranch =
                                    BRANCH_MOCKS.find(
                                      (b) => b.id === s.branchId,
                                    )?.name || "Otra Sede";
                                  return (
                                    <SelectItem
                                      key={s.id}
                                      value={s.id}
                                      className="text-orange-700"
                                    >
                                      {s.id} - Ubicado en: {otherBranch} -{" "}
                                      {s.damageNotes || "Excelente estado"}
                                    </SelectItem>
                                  );
                                })}
                              </SelectGroup>
                            )}
                          </SelectContent>
                        </Select>
                        {allMatchingStock.length === 0 && (
                          <p className="text-xs p-3 text-center text-muted-foreground">
                            No hay stock disponible en ninguna sede.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SECCIÓN DE GARANTÍA (Solo para alquiler) */}
            {activeRes?.operationType === "alquiler" && (
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Garantía
                </h4>
                <GuaranteeSection
                  guarantee={guarantee}
                  setGuarantee={setGuarantee}
                  guaranteeType={guaranteeType}
                  setGuaranteeType={setGuaranteeType}
                />
              </div>
            )}

            {/* 4. CHECKLIST DE SALIDA (Corregido con el balance real) */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Checklist de salida
              </h4>
              <div className="space-y-2">
                {/* Solo mostramos el check de cobro si realmente falta dinero */}
                {balance > 0 && !isCredit && (
                  <label className="flex items-center gap-3 p-3 border  rounded-lg cursor-pointer animate-in fade-in slide-in-from-top-1">
                    <span className="text-sm font-medium text-orange-800">
                      Cobrar saldo pendiente: {formatCurrency(balance)}
                    </span>
                  </label>
                )}

                <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <Checkbox
                        id="credit-check"
                        checked={checklist.limpieza}
                        onCheckedChange={(checked) =>
                          setChecklist({
                            ...checklist,
                            limpieza: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="credit-check"
                        className="text-[11px] font-medium text-blue-400"
                      >
                        El producto esta revisado y desinfectado
                      </Label>
                    </Field>
                  </FieldGroup>
                </Label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <Checkbox
                        id="garantia-check"
                        checked={checklist.garantia}
                        onCheckedChange={(checked) =>
                          setChecklist({
                            ...checklist,
                            garantia: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="credit-check"
                        className="text-[11px] font-medium text-blue-400"
                      >
                        DNI o Garantía física en resguardo
                      </Label>
                    </Field>
                  </FieldGroup>
                </label>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t bg-muted/20">
            <div className="flex flex-col gap-2">
              <Button
                // El botón se deshabilita si NO está listo para entregar
                disabled={!isReadyToDeliver}
                onClick={() => {
                  handleDeliver(true);
                }}
                className={`w-full text-white font-black py-5 text-[12px] shadow-lg transition-all ${
                  isReadyToDeliver
                    ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                    : "bg-slate-400 cursor-not-allowed opacity-70"
                }`}
              >
                <HugeiconsIcon icon={CheckmarkBadge03Icon} strokeWidth={3} />
                {balance > 0 && !isCredit
                  ? `FALTA COBRO: ${formatCurrency(balance)}`
                  : !isReadyToDeliver
                    ? "COMPLETE EL CHECKLIST"
                    : activeRes?.operationType === "venta"
                      ? "FINALIZAR VENTA Y ENTREGAR"
                      : "CONFIRMAR ENTREGA Y SALIDA"}
              </Button>

              {/* Botón 2: Acción Diferida (Pendiente de recoger) */}
              {activeRes?.operationType === "venta" && (
                <Button
                  disabled={!isReadyToDeliver}
                  onClick={() => {
                    handleDeliver(false);
                  }}
                  className="w-full bg-amber-400 text-white hover:bg-amber-500 py-5"
                >
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={3} />
                  <span className="text-[12px] font-black">
                    {balance > 0 && !isCredit ? "" : "PAGADO - "}
                    GUARDAR COMO PENDIENTE DE RECOJO
                  </span>
                </Button>
              )}
            </div>

            <div className="flex justify-between gap-2 w-full ">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setIsRescheduleOpen(true)}
              >
                <HugeiconsIcon
                  icon={CalendarAdd01Icon}
                  strokeWidth={2.2}
                  className="mr-1"
                />
                Reagendar
              </Button>
              <Button
                variant="outline"
                className="text-destructive border-destructive/20 w-1/2"
                onClick={() => setIsCancelOpen(true)}
              >
                <HugeiconsIcon
                  icon={CalendarRemove01Icon}
                  strokeWidth={2.2}
                  className="mr-1"
                />
                Anular
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <RescheduleModal
        open={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
        onConfirm={handleConfirmReschedule}
        currentStartDate={activeRes?.startDate}
        currentEndDate={activeRes?.endDate}
        operationType={activeRes?.operationType}
      />

      <CancelReservationModal
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        onConfirm={handleConfirmCancel}
        balance={totalPaid}
      />

      <PaymentHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        payments={allPaymentsForThisOp}
        operationId={operation?.id || 0}
        // Pasamos los valores ya calculados para evitar el "parpadeo" de los logs
        totalOperation={totalCalculated}
        calculatedBalance={balance}
        calculatedIsCredit={isCredit}
        onAddPayment={handleAddPayment}
        customerName={cliente?.firstName + " " + cliente?.lastName}
      />
    </>
  );
}
