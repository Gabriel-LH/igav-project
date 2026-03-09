"use server";

import prisma from "@/src/lib/prisma";

type LoginRouteKind = "tenant" | "superadmin";

export async function validateLoginRouteRoleAction(
  emailInput: string,
  route: LoginRouteKind,
) {

  

  const email = (emailInput || "").trim().toLowerCase();
  if (!email) {
    return {
      allowed: false,
      message: "El correo es requerido.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { globalRole: true },
  });

  // Do not reveal if the account exists; let normal sign-in handle that.
  if (!user) {
    return { allowed: true };
  }

  if (route === "superadmin" && user.globalRole !== "SUPER_ADMIN") {
    return {
      allowed: false,
      message: "No puedes iniciar sesión en esta ruta.",
    };
  }

  if (route === "tenant" && user.globalRole === "SUPER_ADMIN") {
    return {
      allowed: false,
      message: "El superadmin debe iniciar sesión en el portal de superadmin",
    };
  }

  return { allowed: true };
}
