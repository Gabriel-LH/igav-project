// src/types/rental/type.rentalItem.ts
import z from "zod";

export const rentalItemSchema = z.object({
  id: z.string(),
  rentalId: z.string(),      // Conecta con el Alquiler (Cabecera)
  operationId: z.string(),   // Conecta con el pago/garantía
  
  // --- IDENTIFICACIÓN ---
  productId: z.string(),     // Modelo del vestido
  stockId: z.string(),       // PRENDA FÍSICA ESPECÍFICA (Obligatorio aquí)
  
  // --- SNAPSHOT DEL MOMENTO --- 
  // Guardamos esto por si el producto cambia en el catálogo
  size: z.string(),
  color: z.string(),
  priceAtMoment: z.number(), 
  quantity: z.number().default(1), 
  
  // --- ESTADO FÍSICO AL SALIR/ENTRAR ---
  conditionOut: z.string(),  // Ej: "Perfecto estado, con ganchos"
  conditionIn: z.string().optional(),   // Se llena al retornar
  
  notes: z.string().optional(),
  
  // El status del item dentro del proceso de alquiler
  itemStatus: z.enum(["alquilado", "devuelto", "en_lavanderia", "en_mantenimiento", "baja"]),
});

export type RentalItem = z.infer<typeof rentalItemSchema>;