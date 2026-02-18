import { z } from "zod";

//Las devoluciones estan sujetas a la politica del negocio

export const salesReturnSchema = z.object({
  id: z.string(),
  branchName: z.string(), // Sucursal
  sellerName: z.string(), // Vendedor
  createdAt: z.string(), // Fecha de registro
  outDate: z.string(), // Fecha de salida
  realOutDate: z.string().optional(), // Fecha real de salida
  returnDate: z.string().optional(), // Fecha de devolucion
  nameCustomer: z.string(), // Nombre del cliente
  damage: z.string().optional(), //Si presenta algun daño
  damageValue: z.number().optional(), // Valor del daño
  reason: z
    .enum([
      "talla_incorrecta",
      "color_incorrecto",
      "defecto_fabrica",
      "arrepentimiento",
      "otros",
    ])
    .optional(), // Motivo de la devolucion
  action: z.string().optional(), // Accion a tomar
  returnValue: z.number().optional(), // Valor de la devolucion de dinero al devolver, dependiendo de si se devolvio sin detalles o no
  product: z.string(), // Producto
  count: z.number(), // Cantidad
  income: z.number(), // Ingreso
  status: z.string(), // Estado
  summary: z.string(),
  itemsDetail: z.array(z.any()),
  searchContent: z.string(),
});
