import { z } from "zod";

//Las cancelaciones estan sujetas a la politica del negocio


export const salesCanceledSchema = z.object({
  id: z.string(),
  branchName: z.string(), // Sucursal
  sellerName: z.string(), // Vendedor
  registerDate: z.string(), // Fecha de registro
  outDate: z.string(), // Fecha de salida
  realOutDate: z.string().optional(), // Fecha real de salida
  cancelDate: z.string(), // Fecha de cancelacion
  nameCustomer: z.string(), // Nombre del cliente
  reason: z.enum(["talla_incorrecta", "color_incorrecto", "defecto_fabrica", "arrepentimiento", "otros"]).optional(), // Motivo de la cancelacion
  action: z.string().optional(), // Accion a tomar
  returnValue: z.number().optional(), // Valor de la devolucion de dinero al cancelar, dependiendo de si se devolvio sin detalles o no
  damage: z.string().optional(), // Daño
  refundMethod: z.string().optional(), // Metodo de devolucion
  product: z.string(), // Producto
  count: z.number(), // Cantidad
  income: z.number(), // Ingreso
  status: z.string(), // Estado
});
