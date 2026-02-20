import z from "zod";
import { guaranteeStatusHistorySchema } from "./type.guaranteeStatusHistory";

export const guaranteeSchema = z.object({
  id: z.string(),
  operationId: z.string(), // Conecta con la venta/alquiler
  branchId: z.string(), // Dónde está físicamente el objeto/dinero

  type: z.enum([
    "dinero",
    "dni",
    "joyas",
    "reloj",
    "otros",
    "no_aplica",
    "por_cobrar",
  ]),

  // Si es dinero, el monto. Si es objeto, el valor estimado.
  value: z.union([z.number(), z.string()]),

  // Descripción: "DNI original de Juan Pérez" o "Reloj marca X"
  description: z.string(),

  status: z.enum([
    "pendiente", // Aún no la entrega
    "liberada", // Se pone cuando se anula un alquiler
    "custodia", // La tiene el local
    "devuelta", // Se le regresó al cliente
    "retenida", // Hubo daños y no se devuelve
  ]),

  receivedById: z.string(), // Usuario que recibió
  returnedById: z.string().optional(), // Usuario que devolvió

  createdAt: z.date(),
  returnedAt: z.date().optional(),

  createdBy: z.string().optional(),
  updatedAt: z.date().optional(),
  updatedBy: z.string().optional(),
});

export type Guarantee = z.infer<typeof guaranteeSchema>;

export const guaranteeWithHistorySchema = guaranteeSchema.extend({
  statusHistory: z.array(guaranteeStatusHistorySchema),
});
export type GuaranteeWithHistory = z.infer<typeof guaranteeWithHistorySchema>;
