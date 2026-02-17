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
import { Separator } from "@/components/separator";
import { Badge } from "@/components/badge";
import { ScrollArea } from "@/components/ui/scroll-area"; // Asumiendo que tienes un ScrollArea, si no usa div normal
import { IconPackage, IconReceipt2, IconRuler, IconPalette } from "@tabler/icons-react";
import { formatCurrency } from "@/src/utils/currency-format"; // Tu util de moneda

// ... (Tus imports de Chart se mantienen si quieres mostrar estadísticas globales)

export function TableCellViewerActive({ item }: { item: any }) { 
  // Nota: Usa tu tipo 'RentalTableRow' o 'rentalsActiveSchema' en lugar de 'any'
  const isMobile = useIsMobile();

  // Calculamos totales al vuelo para mostrarlos en el header del drawer
  const totalIncome = item.itemsDetail?.reduce((acc: number, i: any) => acc + (i.priceAtMoment * i.quantity), 0) || 0;

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        {/* En la tabla se ve simple: Texto + Badge si hay muchos */}
        <Button variant="link" className="text-foreground w-full justify-start px-0 text-left truncate h-auto py-1 block">
          <span className="font-medium">{item.itemsDetail?.[0]?.productName || item.product}</span>
          {item.itemsDetail && item.itemsDetail.length > 1 && (
             <Badge variant="secondary" className="ml-2 text-[10px] px-1 h-5">
                +{item.itemsDetail.length - 1}
             </Badge>
          )}
        </Button>
      </DrawerTrigger>

      {/* CONTENIDO DEL DRAWER */}
      <DrawerContent className={isMobile ? "max-h-[90vh]" : "h-full w-[450px] ml-auto rounded-none border-l"}>
        
        <DrawerHeader className="border-b pb-4">
          <DrawerTitle className="flex items-center justify-between">
             <span>Detalle de Operación</span>
             <Badge variant={item.status === 'alquilado' ? 'default' : 'secondary'}>{item.status}</Badge>
          </DrawerTitle>
          <DrawerDescription>
            ID: {item.id} • Cliente: {item.nameCustomer}
          </DrawerDescription>
        </DrawerHeader>

        {/* CUERPO SCROLEABLE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* SECCIÓN 1: LISTA DE PRODUCTOS (El reemplazo a los Inputs) */}
          <section>
             <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3 flex items-center gap-2">
                <IconPackage className="w-4 h-4" /> Productos ({item.totalItems})
             </h4>
             
             <div className="space-y-3">
                {item.itemsDetail?.map((detail: any, index: number) => (
                   <div key={index} className="flex gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                      {/* Placeholder de imagen o icono */}
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                         <IconPackage className="w-6 h-6 text-muted-foreground/50" />
                      </div>

                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start">
                            <p className="font-bold text-sm truncate pr-2">{detail.productName}</p>
                            <span className="font-mono text-sm font-bold">
                               {formatCurrency(detail.priceAtMoment * detail.quantity)}
                            </span>
                         </div>
                         
                         <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {/* Detalles de variante */}
                            <div className="flex items-center gap-1">
                               <IconRuler className="w-3 h-3" /> {detail.size || 'Unique'}
                            </div>
                            <div className="flex items-center gap-1">
                               <IconPalette className="w-3 h-3" /> {detail.color || 'N/A'}
                            </div>
                            <div className="ml-auto font-bold text-foreground bg-muted px-1.5 rounded">
                               x{detail.quantity}
                            </div>
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          </section>

          <Separator />

          {/* SECCIÓN 2: RESUMEN FINANCIERO */}
          <section className="space-y-3">
             <h4 className="text-sm font-bold uppercase text-muted-foreground flex items-center gap-2">
                <IconReceipt2 className="w-4 h-4" /> Finanzas
             </h4>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <span className="text-xs text-muted-foreground">Ingreso Total</span>
                   <div className="text-xl font-bold text-emerald-600">
                      {formatCurrency(totalIncome)}
                   </div>
                </div>
                <div className="space-y-1">
                   <span className="text-xs text-muted-foreground">Garantía ({item.gurantee_type})</span>
                   <div className="text-lg font-semibold">
                      {item.gurantee_type === 'dinero' ? formatCurrency(Number(item.gurantee_value)) : item.gurantee_value}
                   </div>
                   <Badge variant="outline" className="text-[10px]">{item.guarantee_status}</Badge>
                </div>
             </div>
          </section>

          {/* Aquí puedes dejar tu Gráfico si es relevante para ESTA orden específica,
              pero normalmente los gráficos son para Dashboards generales */}
          
        </div>

        <DrawerFooter className="border-t pt-4">
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
        
      </DrawerContent>
    </Drawer>
  );
}