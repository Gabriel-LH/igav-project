"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { DEFAULT_LAUNCH_HOURS } from "@/src/lib/tenant-defaults";
import {
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";


export function BusinessHoursEditor() {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "openHours.schedule",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h3 className="text-sm font-medium">Horario Semanal</h3>
        {fields.length === 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
          >
            Generar horario estándar
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center p-2 rounded-lg border bg-muted/30"
          >
            <div className="w-24">
              <span className="text-sm font-medium">
                {(field as any).day}
              </span>
            </div>

            <FormField
              control={control}
              name={`openHours.schedule.${index}.enabled`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-xs text-muted-foreground w-12">
                    {field.value ? "Abierto" : "Cerrado"}
                  </span>
                </FormItem>
              )}
            />

            <div className="flex-1 flex items-center gap-2">
              <FormField
                control={control}
                name={`openHours.schedule.${index}.open`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={!watch(`openHours.schedule.${index}.enabled`)}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <span className="text-muted-foreground">-</span>
              <FormField
                control={control}
                name={`openHours.schedule.${index}.close`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        disabled={!watch(`openHours.schedule.${index}.enabled`)}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => remove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {fields.length < 7 && fields.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full border-dashed border-2"
          onClick={() => append({ day: "Nuevo día", enabled: true, ...DEFAULT_LAUNCH_HOURS })}
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir excepción/día
        </Button>
      )}
    </div>
  );
}
