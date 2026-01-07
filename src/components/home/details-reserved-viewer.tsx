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
import { productSchema } from "./type.product";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  InformationCircleIcon,
  PackageIcon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import {
  OPERATIONS_MOCK,
  PAYMENTS_MOCK,
  RESERVATIONS_MOCK,
} from "@/src/util/mocks";
import { PaymentHistoryModal } from "./ui/PaymentHistorialModal";
import { useState } from "react";

export function DetailsReservedViewer({
  item,
}: {
  item: z.infer<typeof productSchema>;
}) {
  const isMobile = useIsMobile();

  // 2. Estado para el Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const reservation = RESERVATIONS_MOCK.find((r) => r.productId === item.id);

  // 3. Obtener la operación principal
  const operation = OPERATIONS_MOCK.find(
    (op) => op.productId === item.id && op.type === "reserva"
  );

  // 4. Filtrar pagos reales del historial usando el ID de la operación
  const payments = PAYMENTS_MOCK.filter((p) => p.operationId === operation?.id);

  const totalAbonado = payments.reduce((acc, p) => acc + p.amount, 0);
  const pendiente = (reservation?.totalAmount || 0) - totalAbonado;
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
                <HugeiconsIcon icon={Calendar03Icon} size={20} />
                <DrawerTitle>Reserva Pendiente de Entrega</DrawerTitle>
              </div>
            </div>
            <DrawerDescription>
              Preparar activo para la fecha de retiro.
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 space-y-6 overflow-y-auto">
            {/* 1. EL "CUÁNDO" - Prioridad #1 para el atendedor */}
            <div className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Agenda de Retiro
                </span>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="text-center flex-1">
                  <p className="text-2xl font-black">
                    {reservation?.startDate.getDate()}
                  </p>
                  <p className="text-[10px] uppercase font-medium">
                    Enero 2026
                  </p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div className="flex-2 pl-6">
                  <p className="text-sm font-bold">Retiro programado</p>
                  <p className="text-xs text-muted-foreground">
                    Hora sugerida: 09:00 AM
                  </p>
                </div>
              </div>
            </div>

            {/* 2. ESTADO FINANCIERO (La Seña) */}
            <div className="p-4 border rounded-xl bg-card space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Estado Financiero
                </h4>
                {/* BOTÓN HACIA EL MODAL */}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600 font-bold"
                  onClick={() => setIsHistoryOpen(true)} // Abrir el modal
                >
                  Ver historial completo
                </Button>
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-emerald-600">
                    ${totalAbonado}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Total abonado
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    ${pendiente}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    Saldo pendiente
                  </p>
                </div>
              </div>
            </div>
            {/* 3. DATOS DEL CLIENTE */}
            <div className="p-4 border rounded-xl bg-card space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Cliente
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-blue-600"
                >
                  Ver ficha
                </Button>
              </div>
              <p className="font-bold text-lg">{reservation?.customerName}</p>
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HugeiconsIcon icon={Layers01Icon} size={14} /> Cant:{" "}
                  {reservation?.details.quantity}
                </span>
                {reservation?.details.size && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HugeiconsIcon icon={InformationCircleIcon} size={14} />{" "}
                    Talla: {reservation?.details.size}
                  </span>
                )}
              </div>
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
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    Limpieza y desinfección verificada
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">
                    Accesorios completos (cables/manuales)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* ACCIONES DE RESERVA */}
          <DrawerFooter className="border-t bg-muted/20 grid grid-cols-2 gap-3">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold col-span-2 py-6 text-lg">
              <HugeiconsIcon icon={PackageIcon} className="mr-2" size={20} />
              ENTREGAR AHORA
            </Button>
            <Button variant="outline" className="w-full">
              Reagendar
            </Button>
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 border-destructive/20"
            >
              Anular Reserva
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* 5. EL MODAL (Fuera del Drawer para evitar conflictos de z-index) */}
      <PaymentHistoryModal
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
        payments={payments}
        totalOperation={reservation?.totalAmount || 0}
      />
    </>
  );
}
