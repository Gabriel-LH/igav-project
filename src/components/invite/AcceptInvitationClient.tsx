"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { acceptInvitationAction } from "@/src/app/invite/[token]/actions";
import { Building2, Shield, UserCheck } from "lucide-react";

interface Props {
  token: string;
  tenantName: string;
  roleName: string;
  branchName: string;
  invitedEmail: string;
  isLoggedIn: boolean;
  loggedInEmail?: string;
}

export function AcceptInvitationClient({
  token,
  tenantName,
  roleName,
  branchName,
  invitedEmail,
  isLoggedIn,
  loggedInEmail,
}: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptInvitationAction(token);
      toast.success("¡Bienvenido al equipo!");
      router.replace("/tenant/home");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al aceptar la invitación",
      );
      setAccepting(false);
    }
  };

  const emailMismatch =
    isLoggedIn && loggedInEmail && loggedInEmail !== invitedEmail;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Card */}
        <div className="border rounded-xl p-6 shadow-sm space-y-5 bg-background">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Invitación al equipo</h1>
            <p className="text-muted-foreground text-sm">
              Has sido invitado a unirte a <strong>{tenantName}</strong>
            </p>
          </div>

          {/* Invitation details */}
          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                <span className="text-muted-foreground">Empresa: </span>
                <strong>{tenantName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                <span className="text-muted-foreground">Rol: </span>
                <strong className="capitalize">{roleName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>
                <span className="text-muted-foreground">Sucursal: </span>
                <strong>{branchName}</strong>
              </span>
            </div>
          </div>

          {/* Email mismatch warning */}
          {emailMismatch && (
            <div className="text-sm p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              ⚠️ Esta invitación es para <strong>{invitedEmail}</strong>, pero
              has iniciado sesión como <strong>{loggedInEmail}</strong>. Puede
              que no funcione correctamente.
            </div>
          )}

          {/* Actions */}
          {isLoggedIn ? (
            <div className="space-y-3">
              <Button
                className="w-full gap-2"
                onClick={handleAccept}
                disabled={accepting}
              >
                <UserCheck className="w-4 h-4" />
                {accepting ? "Aceptando..." : "Aceptar invitación"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Sesión activa como: {loggedInEmail}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Necesitas iniciar sesión para aceptar la invitación.
              </p>
              <Button
                className="w-full"
                onClick={() =>
                  router.push(
                    `/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`,
                  )
                }
              >
                Iniciar sesión
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.push(
                    `/auth/new-account?email=${encodeURIComponent(invitedEmail)}&redirect=${encodeURIComponent(`/invite/${token}`)}`,
                  )
                }
              >
                Crear cuenta nueva
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
