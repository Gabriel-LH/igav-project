"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, CheckCircle2, XCircle } from "lucide-react";
import { validateAdminPinAction } from "@/src/app/(tenant)/tenant/actions/auth-pin.actions";
import { toast } from "sonner";

interface PinAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (authorizedBy: string) => void;
  title?: string;
  description?: string;
}

export function PinAuthModal({
  open,
  onOpenChange,
  onSuccess,
  title = "Autorización Requerida",
  description = "Se requiere el PIN de un administrador para continuar con esta operación.",
}: PinAuthModalProps) {
  const [pin, setPin] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (pin.length < 4) {
      setError("El PIN debe tener al menos 4 dígitos");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const res = await validateAdminPinAction(pin);
      if (res.success && res.authorizedBy) {
        toast.success(`Autorizado por ${res.authorizedBy}`);
        onSuccess(res.authorizedBy);
        onOpenChange(false);
        setPin("");
      } else {
        setError(res.error || "PIN incorrecto o sin privilegios");
        setPin("");
      }
    } catch (err) {
      setError("Error de conexión al validar el PIN");
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleValidate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-violet-500/20 shadow-2xl">
        <DialogHeader className="items-center text-center">
          <div className="bg-violet-100 dark:bg-violet-950 p-3 rounded-full mb-2">
            <Shield className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          </div>
          <DialogTitle className="text-xl font-bold uppercase tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-pin" className="text-center block font-bold text-xs uppercase text-muted-foreground">
              Ingresa el PIN de Administrador
            </Label>
            <div className="relative max-w-[200px] mx-auto">
              <Input
                id="auth-pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={pin}
                onKeyDown={handleKeyDown}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                className={`text-center text-2xl tracking-[0.5em] font-black h-14 border-2 ${
                  error ? "border-red-500 focus-visible:ring-red-500" : "border-violet-200 focus-visible:ring-violet-500"
                }`}
                placeholder="••••"
              />
              <Lock className="absolute left-3 top-4 w-5 h-5 text-muted-foreground opacity-30" />
            </div>
            {error && (
              <p className="text-xs text-red-500 text-center font-medium animate-bounce mt-2 flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isValidating}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleValidate}
            disabled={isValidating || pin.length < 4}
            className="bg-violet-600 hover:bg-violet-700 text-white w-full sm:w-auto"
          >
            {isValidating ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Autorizar
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
