"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { promotionSchema, Promotion } from "@/src/types/promotion/type.promotion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createPromotionAction } from "@/src/app/(tenant)/tenant/actions/promotion.actions";
import { toast } from "sonner";
import { useState } from "react";

interface PromotionFormProps {
  onSuccess: () => void;
}

export function PromotionForm({ onSuccess }: PromotionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: "",
      type: "percentage",
      scope: "global",
      value: 0,
      appliesTo: ["venta"],
      isExclusive: true,
      startDate: new Date(),
      isActive: true,
      combinable: true,
      requiresCode: false,
      singleUsePerCustomer: false,
      usageType: "automatic",
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await createPromotionAction(data);
      if (res.success) {
        toast.success("Promoción creada correctamente");
        onSuccess();
      } else {
        toast.error(res.error || "Error al crear promoción");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Promoción</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Descuento de Verano" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Descuento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed_amount">Monto Fijo (S/)</SelectItem>
                    <SelectItem value="bundle">Combo / Paquete</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scope"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alcance</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Alcance de la promoción" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="global">Todo el catálogo</SelectItem>
                  <SelectItem value="category">Categoría específica</SelectItem>
                  <SelectItem value="product_specific">Productos específicos</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="appliesTo"
          render={() => (
            <FormItem>
              <FormLabel>Aplica para:</FormLabel>
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="appliesTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value.includes("venta")}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, "venta"])
                              : field.onChange(field.value.filter((val: string) => val !== "venta"))
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Ventas</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appliesTo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value.includes("alquiler")}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, "alquiler"])
                              : field.onChange(field.value.filter((val: string) => val !== "alquiler"))
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Alquileres</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="isExclusive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Exclusiva</FormLabel>
                  <FormDescription>No se acumula con otras.</FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Crear Promoción"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
