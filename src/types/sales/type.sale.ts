import z from "zod";
import { saleItemSchema } from "./type.saleItem";
import { saleItemStatusHistorySchema } from "./saleItemStatusHistory";
import { saleChargeSchema } from "./saleCharge";

// Schema base (sin refinamentos) para poder usar .extend()
const saleBaseObject = z.object({
  id: z.string(),
  tenantId: z.string(),
  operationId: z.string(), // Conecta con la transaccion financiera
  customerMode: z.enum(["registered", "general"]).default("registered"),
  // "" representa venta con cliente general (sin cliente registrado)
  customerId: z.string().default(""),
  branchId: z.string(),
  sellerId: z.string(),
  reservationId: z.string().optional(), // Opcional: si viene de una reserva
  totalAmount: z.number(),
  saleDate: z.date(),

  // Financieros
  subTotal: z.number().optional(), // Suma de precios de lista (bruto)
  totalDiscount: z.number().default(0),

  status: z.enum([
    "pendiente_pago",
    "reservado",
    "vendido_pendiente_entrega",
    "vendido",
    "cancelado",
    "baja",
    "devuelto",
  ]),
  notes: z.string().optional(),
  createdAt: z.date(),
  createdBy: z.string().optional(),

  // Fechas logisticas
  outDate: z.date().optional(),
  realOutDate: z.date().optional(),
  canceledAt: z.date().optional(),
  returnedAt: z.date().optional(),

  // Resumen acumulado de reembolsos reales (refund payments), no cargos.
  amountRefunded: z.number().default(0),

  updatedAt: z.date(),
  updatedBy: z.string().optional(),
  deletedAt: z.date().optional(),
});

// Schema con validaciones de negocio (solo se usa en creacion/parseo)
export const saleSchema = saleBaseObject.superRefine((data, ctx) => {
  const hasCustomer = data.customerId.trim().length > 0;

  if (data.customerMode === "registered" && !hasCustomer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customerId"],
      message: "En ventas con cliente registrado, customerId es obligatorio.",
    });
  }

  if (data.customerMode === "general" && hasCustomer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customerId"],
      message: "En cliente general, customerId debe venir vacio.",
    });
  }

  // Si viene de reserva, debe conservar cliente identificado
  if (data.reservationId && !hasCustomer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customerId"],
      message: "Si la venta viene de reserva, customerId es obligatorio.",
    });
  }
});

export type Sale = z.infer<typeof saleSchema>;

// Extendemos desde el objeto base (sin superRefine) para agregar relaciones
export const saleWithItemsSchema = saleBaseObject.extend({
  items: z.array(saleItemSchema),
  // Fuente unica de cargos post-venta (restocking_fee, damage, admin_fee, etc).
  charges: z.array(saleChargeSchema),
});

export const saleItemWithHistorySchema = saleItemSchema.extend({
  statusHistory: z.array(saleItemStatusHistorySchema),
});
export type SaleItemWithHistory = z.infer<typeof saleItemWithHistorySchema>;

export type SaleWithItems = z.infer<typeof saleWithItemsSchema>;
