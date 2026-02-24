// src/types/rental/type.rentalItem.ts
import z from "zod";
import { rentalItemStatusHistorySchema } from "./rentalItemStatusHistory";

export const rentalItemSchema = z.object({
  id: z.string(),
  rentalId: z.string(), // Conecta con el Alquiler (Cabecera)
  operationId: z.string(), // Conecta con el pago/garantía

  // --- IDENTIFICACIÓN ---
  productId: z.string(), // Modelo del vestido
  stockId: z.string(), // PRENDA FÍSICA ESPECÍFICA (Obligatorio aquí)

  // --- SNAPSHOT DEL MOMENTO ---
  // Guardamos esto por si el producto cambia en el catálogo
  sizeId: z.string(),
  colorId: z.string(),
  priceAtMoment: z.number(),
  quantity: z.number().default(1),

  // --- ESTADO FÍSICO AL SALIR/ENTRAR ---
  conditionOut: z.string(), // Ej: "Perfecto estado, con ganchos"
  conditionIn: z.string().optional(), // Se llena al retornar

  isDamaged: z.boolean().default(false),
  damageNotes: z.string().optional(),
  // Importante SRP: no guardar montos de daños/penalidades en el item.
  // Esos cargos viven exclusivamente en rentalCharge.

  discountAmount: z.number().default(0), // Dinero descontado (ej: 20)
  discountReason: z.string().optional(), // Ej: "Pack Terno Ejecutivo", "Promo Verano"
  bundleId: z.string().optional(), // ID temporal para agrupar visualmente en el recibo (ej: "pack-uuid-123")
  promotionId: z.string().optional(),

  productName: z.string().optional(),
  variantCode: z.string().optional(), // Para saber qué talla/color era
  serialCode: z.string().optional(), // Para saber qué QR fue (si aplica)
  isSerial: z.boolean().optional(),

  notes: z.string().optional(),
  listPrice: z.number(),
  // El status del item dentro del proceso de alquiler
  itemStatus: z.enum([
    "alquilado",
    "devuelto",
    "en_lavanderia",
    "en_mantenimiento",
    "baja",
  ]),
});

export type RentalItem = z.infer<typeof rentalItemSchema>;

export const rentalItemWithHistorySchema = rentalItemSchema.extend({
  statusHistory: z.array(rentalItemStatusHistorySchema),
});
