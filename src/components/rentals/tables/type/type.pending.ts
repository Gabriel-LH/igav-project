import { z } from "zod";

export const rentalsPendingSchema = z.object({
    id: z.string(),
    branchName: z.string(), // Sucursal 
    sellerName: z.string(), // Vendedor 
    outDate: z.string(),
    expectedReturnDate: z.string(),
    nameCustomer: z.string(), // Nombre del cliente 
    product: z.string(), // Producto 
    rent_unit: z.string(), // Evento o dia 
    count: z.number(), // Cantidad 
    income: z.number(), // Ingreso 
    gurantee_type: z.string(), // Garantia 
    gurantee_value: z.string(), // Garantia 
    guarantee_status: z.string(), // Estado de garantia
    status: z.string(), // Estado 
});
