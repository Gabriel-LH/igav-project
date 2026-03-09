import z from "zod";
import { paymentSchema } from "../payments/type.payments";

// Que se debia y que se pago para esa operacion
export const operationSchema = z
  .object({
    id: z.string(),
    referenceCode: z.string(),
    branchId: z.string(),
    sellerId: z.string(),
    type: z.enum(["alquiler", "venta", "reserva"]),
    customerMode: z.enum(["registered", "general"]).default("registered"),
    // "" representa cliente general en ventas rapidas
    customerId: z.string().default(""),
    status: z.enum(["pendiente", "en_progreso", "completado", "cancelado"]),
    paymentStatus: z.enum(["pendiente", "parcial", "pagado"]),
    subtotal: z.number().min(0).optional(),
    discountAmount: z.number().min(0).optional(),
    totalAmount: z.number().min(0),
    date: z.date(),
    createdAt: z.date(),
  })
  .superRefine((data, ctx) => {
    const hasCustomer = data.customerId.trim().length > 0;
    const requiresCustomer = data.type === "alquiler" || data.type === "reserva";

    if (requiresCustomer && !hasCustomer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message:
          "En alquiler/reserva, customerId es obligatorio y no puede ser cliente general.",
      });
    }

    if (requiresCustomer && data.customerMode === "general") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerMode"],
        message:
          "customerMode=general solo aplica para ventas rapidas, no para alquiler/reserva.",
      });
    }

    if (data.type === "venta" && data.customerMode === "registered" && !hasCustomer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message:
          "En ventas con cliente registrado, customerId es obligatorio.",
      });
    }

    if (data.type === "venta" && data.customerMode === "general" && hasCustomer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerId"],
        message: "En venta de cliente general, customerId debe venir vacio.",
      });
    }
  });

export type Operation = z.infer<typeof operationSchema>;

export const operationWithDetailsSchema = operationSchema.and(
  z.object({
    payments: z.array(paymentSchema),
    calculated: z.object({
      totalPaid: z.number(),
      remainingBalance: z.number(),
    }),
  }),
);

export type OperationWithDetails = z.infer<typeof operationWithDetailsSchema>;
