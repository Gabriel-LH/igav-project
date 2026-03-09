"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoaderIcon } from "lucide-react";
import { useEffect, useState } from "react";
// import { requestResetPassword } from "@/src/lib/auth-client";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ForgotPasswordModalProps {
  initialEmail: string;
}

export function ForgotPasswordModal({
  initialEmail,
}: ForgotPasswordModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Solo actualizamos el estado interno si el prop 'initialEmail' cambia
    // y si el usuario no está editando activamente el campo dentro del modal.
    if (!isEmailEditable) {
      setEmail(initialEmail);
    }
  }, [initialEmail, isEmailEditable]); // Dependencias: Si el email del padre o el estado de edición cambian

  // Función para manejar el envío
  const handleSendResetLink = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      //   await requestResetPassword(email);
      setIsOpen(false);
    } catch (error) {
      setIsOpen(false);
      toast.error(
        "Error al enviar el enlace de restablecimiento de contraseña",
        {
          style: {
            backgroundColor: "rgba(255, 0, 0, 0.2)",
          },
        },
      );
    } finally {
      // 4. Finalizar carga
      setIsLoading(false);
    }
  };

  return (
    // 1. Controlamos el estado del Dialog
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* 2. El Trigger ahora es tu texto de "Olvidaste tu contraseña" */}
      <DialogTrigger asChild>
        <p className="text-xs text-primary cursor-pointer hover:underline underline-offset-2">
          ¿Olvidaste tu contraseña?
        </p>
      </DialogTrigger>

      <>
        {/* 3. La función onCloser ya no es necesaria, usamos setIsOpen(false) */}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contraseña olvidada</DialogTitle>
            <DialogDescription>
              Enviaremos un enlace para reestablecer tu contraseña, al siguiente
              correo:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {/* 4. Input vinculado al estado 'email' */}
            <Input
              id="email"
              type="email"
              name="email"
              defaultValue={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!isEmailEditable}
              className={isEmailEditable ? "border-primary" : ""}
            />
            <div className="flex items-center space-x-2 mt-1">
              <Checkbox
                id="editEmail"
                checked={isEmailEditable}
                onCheckedChange={(checked: boolean) =>
                  setIsEmailEditable(checked)
                }
              />
              <Label
                htmlFor="editEmail"
                className="text-sm font-normal cursor-pointer"
              >
                Quiero modificar el correo
              </Label>
            </div>
          </div>
          <DialogFooter>
            {/* 5. Botón de Cancelar: usa DialogClose que ya tienes */}
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>

            {/* 6. Botón de Aceptar con estado de carga */}
            <Button
              type="submit"
              disabled={isLoading}
              onClick={handleSendResetLink}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoaderIcon className="size-4 animate-spin" />
                  Enviando...
                </span>
              ) : (
                "Enviarme"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </>
    </Dialog>
  );
}
