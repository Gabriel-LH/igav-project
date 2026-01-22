import z from "zod";

export const guaranteeSchema = z.object({
  id: z.string(),
  operationId: z.number(), // Conecta con la venta/alquiler
  branchId: z.string(), // Dónde está físicamente el objeto/dinero
  
  type: z.enum(["dinero", "dni", "joyas", "reloj", "otros", "no_aplica"]),
  
  // Si es efectivo, el monto. Si es objeto, el valor estimado.
  value: z.number().min(0), 
  
  // Descripción: "DNI original de Juan Pérez" o "Reloj marca X"
  description: z.string(), 
  
  status: z.enum([
    "pendiente",    // Aún no la entrega
    "custodia",     // La tiene el local
    "devuelta",     // Se le regresó al cliente
    "retenida"      // Hubo daños y no se devuelve
  ]),
  
  receivedById: z.string(), // Usuario que recibió
  returnedById: z.string().optional(), // Usuario que devolvió
  
  createdAt: z.date(),
  returnedAt: z.date().optional(),
});

export type Guarantee = z.infer<typeof guaranteeSchema>;