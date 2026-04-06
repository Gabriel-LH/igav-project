"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateTeamMemberAction } from "@/src/app/(tenant)/tenant/actions/invitation.actions";
import type { TeamMember } from "../table/team-table";

interface EditMemberModalProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberModal({
  member,
  open,
  onOpenChange,
}: EditMemberModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(member?.name ?? "");
  const [dni, setDni] = useState(member?.dni ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!member) return;

    startTransition(async () => {
      try {
        await updateTeamMemberAction({
          membershipId: member.id,
          name,
          dni,
        });
        toast.success("Miembro actualizado correctamente.");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el miembro.",
        );
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Editar miembro
          </DialogTitle>
          <DialogDescription>
            Actualiza los datos personales que se usarán en asistencia y
            escaneo por DNI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="team-member-name">Nombre</Label>
            <Input
              id="team-member-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-member-dni">DNI</Label>
            <Input
              id="team-member-dni"
              value={dni}
              onChange={(event) =>
                setDni(event.target.value.replace(/\D/g, "").slice(0, 12))
              }
              placeholder="Numero de documento"
              inputMode="numeric"
              maxLength={12}
              required
            />
            <p className="text-xs text-muted-foreground">
              Usa el mismo número que estará codificado en el código de barras
              o QR del documento.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !member}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
