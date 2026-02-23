import { Button } from "@/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/drawer";
import { Separator } from "@/components/separator";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { formatCurrency } from "@/src/utils/currency-format";
import { z } from "zod";
import { paymentTableSchema } from "../type/type.payments";

export function PaymentCellViewer({
  item,
}: {
  item: z.infer<typeof paymentTableSchema>;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.clientName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.clientName}</DrawerTitle>
          <DrawerDescription>Detalle del movimiento de pago</DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4 pb-6 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Operacion</span>
            <span className="font-medium">{item.operationType}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Registrado por</span>
            <span className="font-medium">{item.receivedBy || "-"}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-medium">{formatCurrency(item.amount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Total operacion</span>
            <span className="font-medium">{formatCurrency(item.totalAmount)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Pagado neto</span>
            <span className="font-medium">{formatCurrency(item.netPaid)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Pendiente</span>
            <span className="font-medium">{formatCurrency(item.remaining)}</span>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Metodo</span>
            <span className="font-medium uppercase">{item.method}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Estado</span>
            <span className="font-medium uppercase">{item.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Fecha</span>
            <span className="font-medium">{item.date.toLocaleDateString()}</span>
          </div>
          {item.reference ? (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Referencia</span>
              <span className="font-medium">{item.reference}</span>
            </div>
          ) : null}
          {item.notes ? (
            <div className="space-y-1">
              <div className="text-muted-foreground">Notas</div>
              <div className="rounded-md border p-2">{item.notes}</div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
