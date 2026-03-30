"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { togglePromotionAction, deletePromotionAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Tag, ShoppingBag, Package, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PromotionForm } from "./promotion-form";

interface PromotionListProps {
  initialPromotions: Promotion[];
  categories: any[];
}

export function PromotionList({ initialPromotions, categories }: PromotionListProps) {
  const router = useRouter();
  const [promotions, setPromotions] = useState(initialPromotions);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta promoción?")) return;
    try {
      const res = await deletePromotionAction(id);
      if (res.success) {
        setPromotions((prev) => prev.filter((p) => p.id !== id));
        toast.success("Promoción eliminada");
      } else {
        toast.error(res.error || "Error al eliminar");
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
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
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
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {promo.scope === "global" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        Todo el catálogo
                      </div>
                    )}
                    {promo.scope === "category" && (
                      <div className="flex flex-wrap gap-1">
                        {promo.targetIds?.map((id) => {
                          const cat = categories.find((c) => c.id === id);
                          return (
                            <Badge key={id} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                              <Tag className="h-2 w-2 mr-1" />
                              {cat?.name || "Categoría"}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    {promo.scope === "product_specific" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <ShoppingBag className="h-3 w-3" />
                        {promo.targetIds?.length || 0} Productos
                      </div>
                    )}
                    {promo.scope === "pack" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        Combo/Bundle
                      </div>
                    )}
                  </div>
                </TableCell>
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog open={editingPromo?.id === promo.id} onOpenChange={(open) => !open && setEditingPromo(null)}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setEditingPromo(promo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Promoción: {promo.name}</DialogTitle>
                        </DialogHeader>
                        <PromotionForm 
                          initialValues={promo} 
                          onSuccess={() => {
                            setEditingPromo(null);
                            router.refresh();
                          }} 
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
