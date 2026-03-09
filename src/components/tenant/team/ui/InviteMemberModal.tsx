// components/team/InviteMemberModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Mail,
  Building2,
  Shield,
  Send,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createInvitationAction } from "@/src/app/(tenant)/tenant/actions/invitation.actions";
import { useRouter } from "next/navigation";

interface InviteMemberModalProps {
  branches: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string; description: string | null }>;
}

export function InviteMemberModal({ branches, roles }: InviteMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createInvitationAction({ email, roleId, branchId });
      setInviteLink(result.inviteLink);
      toast.success("¡Invitación creada!");
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al crear la invitación";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      // reset on close
      setEmail("");
      setRoleId("");
      setBranchId("");
      setInviteLink(null);
      setCopied(false);
    }
    setOpen(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Invitar trabajador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitar nuevo miembro
          </DialogTitle>
          <DialogDescription>
            Genera un enlace de invitación para que un trabajador se una a tu
            equipo.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          /* ── Estado: invitación creada → mostrar el link ── */
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-300">
              Invitación creada para <strong>{email}</strong>. Comparte este
              enlace con el trabajador:
            </div>
            <div className="flex gap-2 items-center">
              <Input
                readOnly
                value={inviteLink}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <CheckCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              El enlace expira en 7 días. El trabajador deberá iniciar sesión o
              registrarse para aceptar la invitación.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setInviteLink(null)}>
                Invitar otro
              </Button>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </div>
          </div>
        ) : (
          /* ── Estado normal: formulario de invitación ── */
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="inv-email" className="flex items-center gap-1">
                Correo electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inv-email"
                type="email"
                placeholder="trabajador@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Rol <span className="text-red-500">*</span>
              </Label>
              <Select value={roleId} onValueChange={setRoleId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex flex-col">
                        <span className="font-medium capitalize">
                          {role.name}
                        </span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sucursal */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Sucursal por defecto <span className="text-red-500">*</span>
              </Label>
              <Select value={branchId} onValueChange={setBranchId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="gap-2"
                disabled={!email || !roleId || !branchId || isLoading}
              >
                <Send className="w-4 h-4" />
                {isLoading ? "Creando..." : "Generar enlace"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
