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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  CheckmarkBadge03Icon,
  CalendarAdd01Icon,
  CalendarRemove01Icon,
} from "@hugeicons/core-free-icons";
import { OPERATIONS_MOCK } from "@/src/mocks/mock.operation";
import { PAYMENTS_MOCK } from "@/src/mocks/mock.payment";
import { CLIENTS_MOCK } from "@/src/mocks/mock.client";
import {
  getOperationBalances,
} from "@/src/utils/payment-helpers";
import { PaymentHistoryModal } from "./ui/modals/PaymentHistorialModal";
import { useState } from "react";
import { Badge } from "@/components/badge";
import { MOCK_GUARANTEE } from "@/src/mocks/mock.guarantee";
import { reservationSchema } from "@/src/types/reservation/type.reservation";
import { MOCK_RESERVATION_ITEM } from "@/src/mocks/mock.reservationItem";
import { BRANCH_MOCKS } from "@/src/mocks/mock.branch";
import { formatCurrency } from "@/src/utils/currency-format";
import { PRODUCTS_MOCK } from "@/src/mocks/mocks.product";
import { Payment } from "@/src/types/payments/type.payments";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { toast } from "sonner";
import { buildDeliveryTicketHtml } from "../ticket/build-delivered-ticket";
import { printTicket } from "@/src/utils/ticket/print-ticket";

export function DetailsReservedViewer({
  reservation: activeRes,
  onDeliver,
}: {
  reservation?: z.infer<typeof reservationSchema>;
  onDeliver: () => void;
}) {
  const isMobile = useIsMobile();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const currentUser = USER_MOCK[0];

  // Creamos el estado con los pagos iniciales
  const [payments, setPayments] = useState(PAYMENTS_MOCK);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [checklist, setChecklist] = useState({
    limpieza: false,
    garantia: false,
  });

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
  };
  // 4. Función para agregar un pago (esta se la pasaremos al modal)
  const handleAddPayment = (data: any): Payment => {
    const newPayment: Payment = {
      id: `PAY-${Date.now()}`,
      operationId: operation?.id || 0,
      ...data,
      receivedById: currentUser.id,
      receivedByName: currentUser.name,
    };

    setPayments((prev) => [...prev, newPayment]);
    return newPayment; // 👈 CLAVE
  };

  // 1. Buscamos la operación vinculada
  const operation = OPERATIONS_MOCK.find(
    (op) => op.reservationId === activeRes?.id
  );

  // Modificamos el filtro para que use el 'useState' en lugar del mock estático
  const allPayments = payments.filter((p) => p.operationId === operation?.id);

  // 3. LA FUENTE DE VERDAD: Usamos el helper para todo
  const { totalCalculated, totalPaid, balance, isCredit, creditAmount } =
    getOperationBalances(activeRes?.id || "", allPayments);

  // 4. Garantía
  const guaranteeRecord = MOCK_GUARANTEE.find(
    (g) => g.operationId === operation?.id
  );

  const canDeliver = balance <= 0 && checklist.limpieza && checklist.garantia;

  const isReadyToDeliver =
    (balance === 0 || isCredit) && checklist.limpieza && checklist.garantia;

  const handleDeliver = async () => {
    if (!canDeliver) return;

    const currentClient = CLIENTS_MOCK.find(
      (c) => c.id === activeRes?.customerId
    );

    // 1. Mostramos un toast simple de carga o éxito inmediato
    const toastId = toast.loading("Procesando entrega e impresión...");

    try {
      const currentItems = MOCK_RESERVATION_ITEM.filter(
        (item) => item.reservationId === activeRes?.id
      );

      const ticketHtml = buildDeliveryTicketHtml(
        activeRes,
        currentClient!,
        currentItems,
        guaranteeRecord
      );

      //Logica de negocio
      console.log("Cambiando estado de reserva a: ENTREGADO");
      onDeliver();

      // 2. Cerramos el drawer y limpiamos checks ANTES de imprimir
      // Esto asegura que la UI principal ya esté reseteada al volver
      setChecklist({ limpieza: false, garantia: false });
      setIsDrawerOpen(false);

      // 3. Imprimimos (Esta parte bloquea el hilo)
      await printTicket(ticketHtml);

      // 4. AL VOLVER: Cambiamos el toast a éxito y lo programamos para morir
      toast.success("Entrega realizada correctamente", {
        id: toastId, // Reemplaza el de carga
      });
    } catch (error) {
      toast.error("Error al procesar la entrega", { id: toastId });
    }
  };

  // 5. Items y Sede
  const activeResItems = MOCK_RESERVATION_ITEM.filter(
    (ri) => ri.reservationId === activeRes?.id
  );
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
                  Ver historial ({allPayments.length})
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

            {/* NUEVO: GARANTÍA (Agregado debajo de datos de cliente) */}
            {/* SECCIÓN DE GARANTÍA ACTUALIZADA */}
            <div
              className={`px-4 py-3 border rounded-xl flex justify-between items-center ${
                guaranteeRecord // 👈 Cambiamos: Si existe el registro, ya hay una garantía
                  ? "border-muted"
                  : "border-destructive/20 bg-destructive/5"
              }`}
            >
              <div>
                <p className="text-[10px] uppercase font-black text-blue-700 tracking-tighter">
                  Garantía en Custodia
                </p>
                <p className="text-sm font-bold">
                  {guaranteeRecord // 👈 Si existe el registro...
                    ? guaranteeRecord.type === "efectivo"
                      ? formatCurrency(guaranteeRecord.value) // Muestra $ si es efectivo
                      : guaranteeRecord.description // Muestra "DNI", "Pasaporte", etc.
                    : "FALTA GARANTÍA"}
                </p>

                {/* Mostramos el estado solo si existe el registro */}
                {guaranteeRecord && (
                  <p className="text-[10px] text-blue-600/70 italic">
                    Estado: {guaranteeRecord.status || "Recibido"}
                  </p>
                )}
              </div>

              <HugeiconsIcon
                icon={CheckmarkBadge03Icon}
                className={
                  guaranteeRecord ? "text-blue-500" : "text-destructive/30"
                }
              />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground">
                Artículos en esta reserva ({activeResItems.length})
              </span>
              <div className="space-y-2">
                {activeResItems.map((item) => {
                  const prod = PRODUCTS_MOCK.find(
                    (p) => p.id.toString() === item.productId
                  );
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border rounded-xl bg-muted/20"
                    >
                      <div className="h-12 w-10 bg-white border rounded overflow-hidden">
                        <img
                          src={prod?.image}
                          className="object-cover h-full w-full"
                        />
                      </div>
                      <div className="flex-1">
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
                  );
                })}
              </div>
            </div>

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

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    id="limpieza-check" // Agregado
                    className="rounded border-gray-300 text-primary w-4 h-4"
                    checked={checklist.limpieza}
                    onChange={(e) =>
                      setChecklist({ ...checklist, limpieza: e.target.checked })
                    }
                  />
                  <span className="text-sm">
                    Limpieza y desinfección verificada
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    id="garantia-check" // Agregado
                    className="rounded border-gray-300 text-primary w-4 h-4"
                    checked={checklist.garantia}
                    onChange={(e) =>
                      setChecklist({ ...checklist, garantia: e.target.checked })
                    }
                  />
                  <span className="text-sm font-semibold">
                    DNI o Garantía física en resguardo
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t bg-muted/20">
            <Button
              // El botón se deshabilita si NO está listo para entregar
              disabled={!isReadyToDeliver}
              onClick={() => {
                handleDeliver();
              }}
              className={`w-full text-white font-bold py-6 text-md shadow-lg transition-all ${
                isReadyToDeliver
                  ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                  : "bg-slate-400 cursor-not-allowed opacity-70"
              }`}
            >
              <HugeiconsIcon
                icon={CheckmarkBadge03Icon}
                strokeWidth={3}
                className="mr-2"
              />
              {balance > 0 && !isCredit
                ? `FALTA COBRO: ${formatCurrency(balance)}`
                : !isReadyToDeliver
                ? "COMPLETE EL CHECKLIST"
                : "CONFIRMAR ENTREGA Y SALIDA"}
            </Button>
            <div className="flex justify-between gap-2 w-full ">
              <Button variant="outline" className="w-1/2">
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
              >
                <HugeiconsIcon
                  icon={CalendarRemove01Icon}
                  strokeWidth={2.2}
                  className="mr-1"
                />
                Anular
              </Button>
            </div>
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
