// import z from "zod";
// import { Product } from "./type.product";

// export const stockSchema = z.object({
//   id: z.string(),
//   productId: z.string(),
//   size: z.string(),
//   color: z.string(),
//   colorHex: z.string(),
//   branchId: z.string(), // La sucursal donde está
//   quantity: z.number().min(0),

//   // CONTROL DE OPERACIÓN (Sobrescribe al producto si es necesario)
//   isForRent: z.boolean(), // ¿Esta unidad específica se puede alquilar?
//   isForSale: z.boolean(), // Quizás este ya está muy usado y solo lo dejamos para alquiler

//   // HISTORIAL INDIVIDUAL (Solo posible si el ítem es único)
//   usageCount: z.number().min(0), // Cuántas veces se ha alquilado
//   lastMaintenance: z.string().optional(),

//   // Estos campos están bien aquí porque definen el estado de la prenda física
//   condition: z.enum(["Nuevo", "Usado", "Vintage"]),
//   status: z.enum([
//     "disponible",
//     "en_mantenimiento",
//     "alquilado", // Alquiler activo (fuera de tienda)
//     "reservado", // Tiene un adelanto, pero no se ha procesado venta/alquiler aún
//     "vendido_pendiente_entrega", // PAGADO, pero físicamente en la tienda (Estante de recojo)
//     "en_lavanderia",
//     "baja",
//     "agotado",
//     "vendido",
//   ]),
//   damageNotes: z.string().optional(),
//   updatedAt: z.date(),
// });

// export type Stock = z.infer<typeof stockSchema>;

// export type ProductWithStock = Product & {
//   inventory: Stock[];
// };
