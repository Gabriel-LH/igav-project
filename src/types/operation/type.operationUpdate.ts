import z from "zod";

export const operationUpdateSchema = z.object({
  status: z.enum(["pendiente", "en_progreso", "completado", "cancelado"]).optional(),
  paymentStatus: z.enum(["pendiente", "parcial", "pagado"]).optional(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
});

export type OperationUpdate = z.infer<typeof operationUpdateSchema>;

// Este esquema es para actualizaciones parciales.

// Aquí no necesitas incluir los pagos ni la relación con Payment, porque cuando actualizas una operación normalmente solo cambias:

// status

// paymentStatus

// updatedAt y updatedBy

// La relación con pagos se maneja aparte, en la lógica de negocio:

// Si se agrega un pago, se recalcula paymentStatus de la operación.

// Si se reembolsa un pago, también se recalcula.

// La separación hace tu sistema más limpio y evita dependencias circulares. La UI o servicios pueden unir los datos (OperationWithDetails) cuando lo necesiten, pero internamente los esquemas siguen separados.