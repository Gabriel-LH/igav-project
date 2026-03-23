import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/button";
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
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { z } from "zod";
import { clientActiveSchema } from "../type/type.active";

export function TableCellViewerActive({
  item,
}: {
  item: z.infer<typeof clientActiveSchema>;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.firstName + " " + item.lastName}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.firstName + " " + item.lastName}</DrawerTitle>
          <DrawerDescription></DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                defaultValue={item.firstName + " " + item.lastName}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="count">DNI</Label>
                <Input id="count" defaultValue={item.dni} />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Teléfono</Label>
                <Input id="income" defaultValue={item.phone.toString()} />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Email</Label>
                <Input id="income" defaultValue={item.email} />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Dirección</Label>
                <Input id="income" defaultValue={item.address} />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Saldo a Favor</Label>
                <Input
                  id="income"
                  defaultValue={item.walletBalance.toString()}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Puntos de Lealtad</Label>
                <Input
                  id="income"
                  defaultValue={item.loyaltyPoints.toString()}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Codigo de Referencia</Label>
                <Input id="income" defaultValue={item.referralCode} />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="coupon">Codigo de Cupon Activo</Label>
                <Input
                  id="coupon"
                  defaultValue={item.activeCouponCode ?? "N/A"}
                  readOnly
                  className={
                    item.activeCouponCode
                      ? "text-orange-600 font-bold"
                      : "text-muted-foreground"
                  }
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label htmlFor="income">Estado</Label>
                <Input id="income" defaultValue={item.status} />
              </div>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
