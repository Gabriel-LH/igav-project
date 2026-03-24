"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/badge";
import { Switch } from "@/components/ui/switch";
import { Promotion } from "@/src/types/promotion/type.promotion";
import { togglePromotionAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PromotionListProps {
  initialPromotions: Promotion[];
}

export function PromotionList({ initialPromotions }: PromotionListProps) {
  const [promotions, setPromotions] = useState(initialPromotions);

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await togglePromotionAction(id, isActive);
      if (res.success) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isActive } : p)),
        );
        toast.success(`Promoción ${isActive ? "activada" : "desactivada"}`);
      } else {
        toast.error(res.error || "Error al cambiar estado");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
            <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Alcance</TableHead>
          <TableHead>Vigencia</TableHead>
          <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                No hay promociones configuradas.
              </TableCell>
            </TableRow>
          ) : (
            promotions.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell className="font-medium">{promo.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {promo.type === "percentage" ? "Porcentaje" : 
                     promo.type === "fixed_amount" ? "Monto Fijo" : "Combo/Bundle"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {promo.type === "percentage" ? `${promo.value}%` : 
                   promo.type === "fixed_amount" ? `S/ ${promo.value}` : "-"}
                </TableCell>
                <TableCell className="capitalize">{promo.scope.replace("_", " ")}</TableCell>
                <TableCell>
                  <div className="text-xs">
                    {format(new Date(promo.startDate), "dd MMM yyyy", { locale: es })}
                    {promo.endDate && ` - ${format(new Date(promo.endDate), "dd MMM yyyy", { locale: es })}`}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={promo.isActive}
                    onCheckedChange={(checked) => handleToggle(promo.id, checked)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
