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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkBadge03Icon,
  CalendarAdd01Icon,
  CalendarRemove01Icon,
} from "@hugeicons/core-free-icons";
import { getOperationBalances } from "@/src/utils/payment-helpers";
import { getActivePolicyAction } from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { PaymentHistoryModal } from "./ui/modals/PaymentHistorialModal";
import React, { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/badge";
import { Reservation } from "@/src/types/reservation/type.reservation";
import { formatCurrency } from "@/src/utils/currency-format";
import { Payment } from "@/src/types/payments/type.payments";
import { authClient } from "@/src/lib/auth-client";
import { useBranchStore } from "@/src/store/useBranchStore";
import { toast } from "sonner";
import { buildDeliveryTicketHtml } from "../ticket/build-delivered-ticket";
import { printTicket } from "@/src/utils/ticket/print-ticket";
import { calculateChargeableDays } from "@/src/utils/date/calculateRentalDays";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { useReservationStore } from "@/src/store/useReservationStore";
import { usePaymentStore } from "@/src/store/usePaymentStore";
import { useOperationStore } from "@/src/store/useOperationStore";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/checkbox";
import { Label } from "@/components/label";
import { RescheduleModal } from "./ui/modals/RescheduleModal";
import { CancelReservationModal } from "./ui/modals/CancelReservationModal";
import { GuaranteeSection } from "./ui/reservation/GuaranteeSection";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { StockAssignmentWidget } from "./ui/widget/StockAssignmentWidget";
import { AttributeType } from "@/src/types/attributes/type.attribute-type";
import { AttributeValue } from "@/src/types/attributes/type.attribute-value";
import {
  convertReservationAction,
  cancelReservationAction,
  rescheduleReservationAction,
} from "@/src/app/(tenant)/tenant/actions/reservation.actions";
import { registerPaymentAction } from "@/src/app/(tenant)/tenant/actions/payment.actions";

export function DetailsReservedViewer({
  reservation: activeRes,
  attributeTypes,
  attributeValues,
  onRefresh,
}: {
  reservation?: Reservation;
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];
  onRefresh: () => void;
}) {
  const isMobile = useIsMobile();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const { products, productVariants } = useInventoryStore();
  const { reservationItems } = useReservationStore();
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

  // 2. Inicializar selección con lo que ya viene guardado
  const [selectedStocks, setSelectedStocks] = useState<Record<string, string>>(
    () => {
      const initialSelections: Record<string, string> = {};
      activeResItems.forEach((item) => {
        if (item.stockId) {
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
  const seller = currentUser;
  const { branches } = useBranchStore();

  const groupedItems = useMemo(() => {
    const groups: Record<
      string,
      { items: typeof activeResItems; totalQty: number }
    > = {};

    activeResItems.forEach((item) => {
      const key = `${item.productId}-${item.variantId}`;
      if (!groups[key]) {
        groups[key] = { items: [], totalQty: 0 };
      }
      groups[key].items.push(item);
      groups[key].totalQty += item.quantity;
    });

    return Object.values(groups);
  }, [activeResItems]);

  const [allPaymentsForThisOp, setAllPaymentsForThisOp] = useState<any[]>([]);
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);

  useEffect(() => {
    async function fetchPolicy() {
      const res = await getActivePolicyAction();
      if (res.success && res.data) {
        setPolicy(res.data);
      }
    }
    fetchPolicy();
  }, []);

  useEffect(() => {
    setAllPaymentsForThisOp(
      globalPayments.filter(
        (p) => String(p.operationId) === String(operation?.id),
      ),
    );
  }, [globalPayments, operation?.id]);

  const durationInDays = useMemo(() => {
    if (!activeRes || activeRes.operationType !== "alquiler") return 1;
    
    return calculateChargeableDays(
      activeRes.startDate,
      activeRes.endDate,
      policy?.rentals
    );
  }, [activeRes, policy]);

  const totalCalculated = useMemo(() => {
    return activeResItems.reduce(
      (acc, item) =>
        acc +
        Number(item.priceAtMoment) *
          Number(item.quantity) *
          (activeRes?.operationType === "alquiler" ? durationInDays : 1),
      0,
    );
  }, [activeResItems, activeRes?.operationType, durationInDays]);

  const { totalPaid, balance, isCredit, creditAmount } = getOperationBalances(
    activeRes?.operationId || "",
    allPaymentsForThisOp,
    totalCalculated,
  );

  const totalUnitsNeeded = activeResItems.reduce(
    (acc, item) => acc + item.quantity,
    0,
  );
  const totalUnitsAssigned = Object.keys(selectedStocks).length;
  const allItemsAssigned = totalUnitsAssigned >= totalUnitsNeeded;

  const isReadyToDeliver =
    (balance === 0 || isCredit) &&
    checklist.limpieza &&
    (activeRes?.operationType === "venta" ? true : checklist.garantia) && 
    allItemsAssigned;

  const handleDeliver = async (deliverImmediately: boolean) => {
    if (!activeRes) return;
    if (!isReadyToDeliver) {
      return toast.error(
        "Faltan requisitos para la entrega (Pagos, Checklist o Stock)",
      );
    }

    try {
      const result = await convertReservationAction({
        reservation: activeRes as Reservation,
        reservationItems: activeResItems,
        selectedStocks,
        sellerId: currentUser?.id || "",
        totalCalculated,
        downPayment: 0,
        totalPaid,
        isCredit,
        guarantee: { type: guaranteeType, value: guarantee },
        notes: "Conversión desde reserva",
        shouldDeliverImmediately: deliverImmediately,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setChecklist({ limpieza: false, garantia: false });
      setIsDrawerOpen(false);
      onRefresh();

      const ticketHtml = buildDeliveryTicketHtml(
        seller as { id: string; name?: string },
        activeRes as Reservation,
        currentClient!,
        activeResItems.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            ...item,
            productName: product?.name || "Producto",
          };
        }),
        guaranteeType,
        guarantee,
      );
      printTicket(ticketHtml);

      toast.success(
        activeRes.operationType === "venta"
          ? "¡Venta finalizada!"
          : "¡Alquiler entregado!",
      );
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error al procesar la operación";
      toast.error(errorMessage);
    }
  };

  const handleAddPayment = async (data: { amount: number; paymentMethod: string }): Promise<Payment> => {
    try {
      const result = await registerPaymentAction({
        operationId: operation?.id || "",
        amount: data.amount,
        method: data.paymentMethod as PaymentMethodType,
        userId: currentUser?.id || "",
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onRefresh();
      toast.success("Pago registrado correctamente");
      return result.data as Payment;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al registrar pago";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleConfirmReschedule = async (newStartDate: Date, newEndDate: Date) => {
    if (!activeRes) return;
    try {
      const result = await rescheduleReservationAction(activeRes.id, newStartDate, newEndDate);
      if (!result.success) throw new Error(result.error);
      
      toast.success("Reserva reagendada");
      onRefresh();
      setIsRescheduleOpen(false);
      setIsDrawerOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error al reagendar";
      toast.error(errorMessage);
    }
  };

  const handleConfirmCancel = async (refundMethod: "refund" | "credit") => {
    if (!activeRes) return;
    try {
      const result = await cancelReservationAction(activeRes.id, "Cancelado por el usuario", refundMethod);
      if (!result.success) throw new Error(result.error);
      
      toast.success("Reserva anulada");
      onRefresh();
      setIsCancelOpen(false);
      setIsDrawerOpen(false);
    } catch (error: unknown) {
      console.error("Error al anular reserva:", error);
      const errorMessage = error instanceof Error ? error.message : "No se pudo anular la reserva";
      toast.error(errorMessage);
    }
  };

  const sedeName =
    branches.find((b) => b.id === activeRes?.branchId)?.name ||
    "Sede central";

  const cliente = customers.find((c) => c.id === activeRes?.customerId);

  return (
    <>
      <Drawer
        direction={isMobile ? "bottom" : "right"}
        open={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        dismissible={!isCancelOpen && !isRescheduleOpen && !isHistoryOpen}
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
              <Badge className="w-fit bg-card text-amber-400 border- text-sm">
                Sede: {sedeName}
              </Badge>
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-2 space-y-6 overflow-y-auto">
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

              <div className="pt-2 border-t border-dashed flex justify-between text-[10px] text-muted-foreground">
                <span>Valor total del servicio:</span>
                <span className="font-bold">
                  {formatCurrency(totalCalculated)}
                </span>
              </div>
            </div>

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

            <div className="flex flex-col gap-4">
              {groupedItems.map((group) => {
                const refItem = group.items[0];
                const prod = products.find(
                  (p) => String(p.id) === String(refItem.productId),
                );
                const isSerial = prod?.is_serial ?? true;

                const allInitialSelections = group.items.flatMap((i) => {
                  if (i.stockId) return Array(i.quantity).fill(i.stockId);
                  return [];
                });

                const variant = productVariants.find(
                  (v) => String(v.id) === String(refItem.variantId),
                );

                const getAttributeDisplay = (key: string) => {
                  const normalizedKey = key.toLowerCase();
                  const matchingType = attributeTypes.find(
                    (t) =>
                      t.name.toLowerCase() === normalizedKey ||
                      t.code.toLowerCase() === normalizedKey,
                  );

                  const attrNameMatch =
                    matchingType?.name.toLowerCase() || normalizedKey;
                  const variantAttrKeys = Object.keys(
                    variant?.attributes || {},
                  );
                  const actualKey = variantAttrKeys.find(
                    (k) => k.toLowerCase() === attrNameMatch,
                  );

                  const rawValue = actualKey
                    ? variant?.attributes?.[actualKey]
                    : undefined;

                  if (!rawValue) return null;

                  const matchingValue = attributeValues.find(
                    (v: AttributeValue) => {
                      if (
                        matchingType &&
                        v.attributeTypeId !== matchingType.id
                      )
                        return false;
                      return (
                        v.id === rawValue ||
                        v.value.toLowerCase() ===
                          String(rawValue).toLowerCase() ||
                        v.code.toLowerCase() === String(rawValue).toLowerCase()
                      );
                    },
                  );

                  return matchingValue?.value || String(rawValue);
                };

                const sizeName =
                  getAttributeDisplay("size") ||
                  getAttributeDisplay("talla") ||
                  "Única";
                const colorName = getAttributeDisplay("color") || "Único";

                return (
                  <div
                    key={`${refItem.id}-group`}
                    className="p-3 border rounded-xl bg-card shadow-sm"
                  >
                    <div className="flex mb-3 items-start gap-3">
                      <div className="flex-1 pl-3">
                        <p className="text-sm font-bold">{prod?.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">
                            {sizeName}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {colorName}
                          </Badge>
                          {group.totalQty > 1 && (
                            <Badge className="text-[10px] bg-orange-100 text-orange-700">
                              x{group.totalQty} Total
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <StockAssignmentWidget
                      productId={refItem.productId}
                      variantId={refItem.variantId}
                      quantity={group.totalQty}
                      operationType={activeRes?.operationType || "alquiler"}
                      dateRange={{
                        from: activeRes?.startDate || new Date(),
                        to: activeRes?.endDate || new Date(),
                      }}
                      currentBranchId={activeRes?.branchId || ""}
                      isSerial={isSerial}
                      initialSelections={allInitialSelections}
                      readOnly={allInitialSelections.length > 0}
                      onAssignmentChange={(selectedIds: string[]) => {
                        setSelectedStocks((prev) => {
                          const newState = { ...prev };
                          let idIndex = 0;

                          group.items.forEach((item) => {
                            for (let q = 0; q < item.quantity; q++) {
                              const assignedId = selectedIds[idIndex];
                              if (assignedId) {
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

            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                Checklist de salida
              </h4>
              <div className="space-y-2">
                <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <FieldGroup>
                    <Field orientation="horizontal">
                      <Checkbox
                        id="limpieza-check"
                        checked={checklist.limpieza}
                        onCheckedChange={(checked) =>
                          setChecklist({
                            ...checklist,
                            limpieza: checked as boolean,
                          })
                        }
                      />
                      <Label
                        htmlFor="limpieza-check"
                        className="text-[11px] font-medium text-blue-400"
                      >
                        El producto esta revisado y desinfectado
                      </Label>
                    </Field>
                  </FieldGroup>
                </Label>

                <Label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
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
                        htmlFor="garantia-check"
                        className="text-[11px] font-medium text-blue-400"
                      >
                        DNI o Garantía física en resguardo
                      </Label>
                    </Field>
                  </FieldGroup>
                </Label>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t bg-muted/20">
            <div className="flex flex-col gap-2">
              <Button
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
                <HugeiconsIcon icon={CheckmarkBadge03Icon} strokeWidth={2} />
                {balance > 0 && !isCredit
                  ? `FALTA COBRO: ${formatCurrency(balance)}`
                  : !isReadyToDeliver
                    ? "COMPLETE EL CHECKLIST"
                    : activeRes?.operationType === "venta"
                      ? "FINALIZAR VENTA Y ENTREGAR"
                      : "CONFIRMAR ENTREGA Y SALIDA"}
              </Button>

              {activeRes?.operationType === "venta" && (
                <Button
                  disabled={!isReadyToDeliver}
                  onClick={() => {
                    handleDeliver(false);
                  }}
                  className="w-full bg-amber-400 text-white hover:bg-amber-500 py-5"
                >
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
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
        customerMode={operation?.customerMode || "general"}
      />

      <PaymentHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        payments={allPaymentsForThisOp}
        operationId={operation?.id || 0}
        totalOperation={totalCalculated}
        calculatedBalance={balance}
        calculatedIsCredit={isCredit}
        clientBalance={cliente?.walletBalance ?? 0}
        onAddPayment={handleAddPayment}
        customerName={cliente?.firstName + " " + cliente?.lastName}
      />
    </>
  );
}
