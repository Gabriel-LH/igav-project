import z from "zod";
import { operationSchema } from "./type.operations";

export const operationUpdateSchema = z.object({
  status: z.enum(["pendiente", "en_progreso", "completado", "cancelado"]).optional(),
  paymentStatus: z.enum(["pendiente", "parcial", "pagado"]).optional(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
});

export type OperationUpdate = z.infer<typeof operationUpdateSchema>;
