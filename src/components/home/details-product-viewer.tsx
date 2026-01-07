import { useIsMobile } from "@/src/hooks/use-mobile";
import { Button } from "@/components/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/chart";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Separator } from "@/components/separator";
import { z } from "zod";
import { productSchema } from "./type.product";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { IconTrendingUp } from "@tabler/icons-react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, SaleTag02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@/components/badge";

export function DetailsProductViewer({
  item,
}: {
  item: z.infer<typeof productSchema>;
}) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="secondary" className="w-full">
          Ver detalles
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Detalles de {item.name}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <Image
                src={item.image}
                alt={item.name}
                width={500}
                height={500}
              />
            </>
          )}
          <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4 text-sm">
            {/* Cabecera Principal */}
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">{item.name}</h3>
              <Badge variant="secondary" className="text-sm">
                {item.category}
              </Badge>
            </div>

            <Separator />

            <div className="grid">
              <div className="flex gap-2 w-full justify-between border rounded-lg bg-card shadow-sm p-4">
                <p className="font-semibold">Disponoble para: </p>
                <div className="flex gap-1">
                  {item.can_rent && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        <HugeiconsIcon
                          icon={Calendar03Icon}
                          strokeWidth={2.2}
                          className="w-3.5 h-3.5"
                        />
                        <span>Alquiler</span>
                      </Badge>
                    </div>
                  )}

                  {item.can_sell && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">
                        <HugeiconsIcon
                          icon={SaleTag02Icon}
                          strokeWidth={2.2}
                          className="w-3.5 h-3.5 "
                        />
                        <span>Venta</span>
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold flex items-center mb-2">
                Precios:
              </span>
              <div className="flex flex-col gap-4 bg-card p-4 border rounded-lg">
                {item.can_rent && (
                  <div className="flex w-full justify-between">
                    <span className="font-semibold">Precio de alquiler: </span>
                    <span className="font-semibold text-foreground">
                      ${item.price_rent} <span>por </span>
                      <span>{item.rent_unit}</span>
                    </span>
                  </div>
                )}

                {item.can_sell && (
                  <div className="flex w-full justify-between">
                    <span className="font-semibold">Precio de venta: </span>
                    <span className="font-semibold text-foreground">
                      ${item.price_sell}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Detalles Secundarios */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Descripción:</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex justify-between items-center h-fit p-3 rounded-lg border bg-card shadow-sm">
                  <span>{item.description}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <DrawerFooter>
          <div className="grid grid-cols-2 gap-2 w-full px-2">
            {item.can_rent && (
              <Button className=" text-white w-full bg-blue-600 hover:bg-blue-700">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2.2} className="w-3.5 h-3.5" />
                Alquilar
              </Button>
            )}

            {item.can_sell && (
              <Button className=" text-white w-full bg-orange-600 hover:bg-orange-700">
                <HugeiconsIcon icon={SaleTag02Icon} strokeWidth={2.2} className="w-3.5 h-3.5" />
                Vender
              </Button>
            )}

            <Button className=" text-white w-full bg-emerald-600 hover:bg-emerald-700 col-span-2">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2.2} className="w-3.5 h-3.5" />
              Reservar
            </Button>

            <DrawerClose asChild>
              <Button variant="outline" className="w-full col-span-2">
                Cerrar
              </Button>
            </DrawerClose>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
