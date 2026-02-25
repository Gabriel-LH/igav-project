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
import { getOperationBalances } from "@/src/utils/payment-helpers";
import { PaymentHistoryModal } from "./ui/modals/PaymentHistorialModal";
import React, { useState, useMemo } from "react";
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
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { convertReservationUseCase } from "@/src/services/use-cases/converterReservation.usecase";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { StockAssignmentWidget } from "./ui/widget/StockAssignmentWidget"; // Tu widget actualizado
import { useAttributeStore } from "@/src/store/useAttributeStore";

export function DetailsReservedViewer({
  reservation: activeRes,
}: {
  reservation?: z.infer<typeof reservationSchema>;
}) {
  const isMobile = useIsMobile();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const currentUser = USER_MOCK[0];
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const { products } = useInventoryStore();
  const { reservationItems, cancelReservation, rearrangeReservation } =
    useReservationStore();
  const { payments: globalPayments } = usePaymentStore();
  const { operations } = useOperationStore();
  const { customers } = useCustomerStore();

  const [guarantee, setGuarantee] = React.useState("");
  const [guaranteeType, setGuaranteeType] =
    React.useState<GuaranteeType>("dinero");

  const [checklist, setChecklist] = useState({
    limpieza: false,
    garantia: false,
  });

  // 1. Obtener items relacionados a esta reserva
  const activeResItems = useMemo(
    () => reservationItems.filter((ri) => ri.reservationId === activeRes?.id),
    [reservationItems, activeRes?.id],
  );

  // 2. Inicializar selección con lo que ya viene guardado (para ventas ya asignadas)
  const [selectedStocks, setSelectedStocks] = useState<Record<string, string>>(
    () => {
      const initialSelections: Record<string, string> = {};
      activeResItems.forEach((item) => {
        if (item.stockId) {
          // Rellenamos todos los slots de este item con el stockId guardado
          // (Si es serial quantity=1, si es lote quantity=N)
          for (let i = 0; i < item.quantity; i++) {
            initialSelections[`${item.id}-${i}`] = item.stockId;
          }
        }
      });
      return initialSelections;
    },
  );

  const handleDrawerOpenChange = (open: boolean) => setIsDrawerOpen(open);

  const operation = operations.find((op) => op.id === activeRes?.operationId);
  const currentClient = customers.find((c) => c.id === activeRes?.customerId);
  const seller = USER_MOCK[0];

  const {colors, sizes} = useAttributeStore();

  // Agrupamos items por "clave compuesta" para mostrarlos juntos
  const groupedItems = useMemo(() => {
    const groups: Record<
      string,
      { items: typeof activeResItems; totalQty: number }
    > = {};

    activeResItems.forEach((item) => {
      const key = `${item.productId}-${item.sizeId}-${item.colorId}`;
      if (!groups[key]) {
        groups[key] = { items: [], totalQty: 0 };
      }
      groups[key].items.push(item);
      groups[key].totalQty += item.quantity;
    });

    return Object.values(groups);
  }, [activeResItems]);

  // Cálculos Financieros
  const allPaymentsForThisOp = useMemo(
    () =>
      globalPayments.filter(
        (p) => String(p.operationId) === String(operation?.id),
      ),
    [globalPayments, operation?.id],
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

  // Validación de Entrega
  const totalUnitsNeeded = activeResItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const totalUnitsAssigned = Object.keys(selectedStocks).length;
  // Solo exigimos asignación completa si NO es un simple "Pendiente de Recojo" diferido
  const allItemsAssigned = totalUnitsAssigned >= totalUnitsNeeded;

  const isReadyToDeliver =
    (balance === 0 || isCredit) &&
    checklist.limpieza &&
    (activeRes?.operationType === "venta" ? true : checklist.garantia) && // Venta no exige garantía física
    allItemsAssigned;

  const handleDeliver = async (deliverImmediately: boolean) => {
    if (!activeRes) return;
    if (!isReadyToDeliver) {
      return toast.error(
        "Faltan requisitos para la entrega (Pagos, Checklist o Stock)",
      );
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
        guarantee: { type: guaranteeType, value: guarantee },
        notes: "Conversión desde reserva",
        shouldDeliverImmediately: deliverImmediately,
      });

      const ticketHtml = buildDeliveryTicketHtml(
        seller,
        activeRes,
        currentClient!,
        activeResItems,
        guaranteeType,
        guarantee,
      );
      printTicket(ticketHtml);

      toast.success(
        activeRes.operationType === "venta"
          ? "¡Venta finalizada!"
          : "¡Alquiler entregado!",
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la operación");
    }
  };

  const handleAddPayment = (data: any): Payment => {
    return registerPayment({
      operationId: operation?.id || "",
      ...data,
    });
  };

  const handleConfirmReschedule = (newStartDate: Date, newEndDate: Date) => {
    if (!activeRes) return;
    rearrangeReservation(activeRes.id, newStartDate, newEndDate);
    toast.success("Reserva reagendada");
    setIsRescheduleOpen(false);
    setIsDrawerOpen(false);
  };

  const handleConfirmCancel = () => {
    if (!activeRes) return;
    cancelReservation(activeRes.id);
    toast.success("Reserva anulada");
    setIsCancelOpen(false);
    setIsDrawerOpen(false);
  };

  const sedeName =
    BRANCH_MOCKS.find((b) => b.id === activeRes?.branchId)?.name ||
    "Sede central";

  const cliente = customers.find((c) => c.id === activeRes?.customerId);

  return (
    <>
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
      >
        <DrawerTrigger asChild>
          <Button variant="secondary" className="w-full shadow-sm">
            Ver reserva de{" "}
            {activeRes?.operationType === "venta" ? "venta" : "alquiler"}
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

            {/* SECCIÓN 3: ASIGNACIÓN DE STOCK (WIDGET HÍBRIDO) */}
            <div className="flex flex-col gap-4">
              {groupedItems.map((group) => {
                // Tomamos el primer item como referencia para datos comunes (foto, nombre)
                const refItem = group.items[0];
                const prod = products.find(
                  (p) => p.id.toString() === refItem.productId,
                );
                const isSerial = prod?.is_serial ?? true;

                // Aplanamos todos los stockIds que ya tengan estos items para pasarlos al widget
                const allInitialSelections = group.items.flatMap((i) => {
                  if (i.stockId) return Array(i.quantity).fill(i.stockId);
                  return [];
                });

                const color = colors.find((c) => c.id === refItem.colorId);
                const size = sizes.find((s) => s.id === refItem.sizeId);

                return (
                  <div
                    key={`${refItem.id}-group`}
                    className="p-3 border rounded-xl bg-card shadow-sm"
                  >
                    {/* HEADER ÚNICO */}
                    <div className="flex mb-3 items-start gap-3">
                      <div className="h-12 w-10 rounded overflow-hidden bg-muted">
                        {/* ... Imagen ... */}
                      </div>
                      <div className="flex-1 pl-3">
                        <p className="text-sm font-bold">{prod?.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {size?.name}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {color?.name}
                          </Badge>
                          {group.totalQty > 1 && (
                            <Badge className="text-[10px] bg-orange-100 text-orange-700">
                              x{group.totalQty} Total
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* UN SOLO WIDGET QUE MANEJA LOS N SELECTS */}
                    <StockAssignmentWidget
                      productId={refItem.productId}
                      sizeId={refItem.sizeId}
                      colorId={refItem.colorId}
                      quantity={group.totalQty} // 👈 Cantidad total del grupo
                      operationType={activeRes?.operationType || "alquiler"}
                      dateRange={{
                        from: activeRes?.startDate || new Date(),
                        to: activeRes?.endDate || new Date(),
                      }}
                      currentBranchId={activeRes?.branchId || ""}
                      isSerial={isSerial}
                      initialSelections={allInitialSelections}
                      readOnly={allInitialSelections.length > 0}
                      onAssignmentChange={(selectedIds) => {
                        // AQUÍ VIENE LA MAGIA DE LA DISTRIBUCIÓN
                        // El widget nos devuelve un array de IDs [ID1, ID2, ID3...]
                        // Tenemos que repartirlos entre los items originales del grupo para actualizar el estado padre

                        setSelectedStocks((prev) => {
                          const newState = { ...prev };
                          let idIndex = 0;

                          group.items.forEach((item) => {
                            // Para este item específico, ¿cuántos IDs necesita?
                            // (Si item.quantity es 1, toma 1. Si es lote de 5, toma 5 iguales)
                            for (let q = 0; q < item.quantity; q++) {
                              const assignedId = selectedIds[idIndex];
                              if (assignedId) {
                                // Usamos la clave única basada en el ID real del item en base de datos
                                newState[`${item.id}-${q}`] = assignedId;
                              }
                              idIndex++;
                            }
                          });

                          return newState;
                        });
                      }}
                    />
                  </div>
                );
              })}
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
