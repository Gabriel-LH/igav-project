import z from "zod";

export const RolePermissionSchema = z.object({
  roleId: z.string(),
  permissionId: z.string(),
});

export type RolePermission = z.infer<typeof RolePermissionSchema>;
