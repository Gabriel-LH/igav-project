import z from "zod";

export const userRoleBranchHistorySchema = z.object({
  id: z.string(),
  userId: z.string(), // Usuario afectado

  fromRole: z.string(),
  toRole: z.string(),

  fromBranchId: z.string(), // Sucursal anterior
  toBranchId: z.string(), // Nueva sucursal

  fromStatus: z.enum(["active", "inactive"]), // Estado anterior
  toStatus: z.enum(["active", "inactive"]), // Nuevo estado

  reason: z.string().optional(), // Ej: "Promoción", "Transferencia de sucursal"
  changedBy: z.string().optional(), // Quién hizo el cambio
  createdAt: z.date(), // Fecha del cambio
});

export type UserRoleBranchHistory = z.infer<typeof userRoleBranchHistorySchema>;
