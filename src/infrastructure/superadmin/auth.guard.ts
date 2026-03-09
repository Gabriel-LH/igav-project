import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";

export async function requireSuperAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.globalRole !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: SuperAdmin access required");
  }

  return session.user;
}
