"use client";

import { useEffect, useState } from "react";
import { Shield, Key, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clearUserPinAction,
  getUserPinStatusAction,
  setUserPinAction,
} from "@/src/app/(tenant)/tenant/actions/auth-pin.actions";

export function UserPinForm() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [hasPinConfigured, setHasPinConfigured] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      setLoadingStatus(true);
      try {
        const res = await getUserPinStatusAction();
        if (res.success && res.data) {
          setHasPinConfigured(res.data.hasPinConfigured);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStatus(false);
      }
    }

    loadStatus();
  }, []);

  const handleSave = async () => {
    if (pin.length < 4 || pin.length > 6) {
      toast.error("El PIN debe tener entre 4 y 6 digitos");
      return;
    }

    if (pin !== confirmPin) {
      toast.error("Los PINs no coinciden");
      return;
    }

    setSaving(true);
    try {
      const res = await setUserPinAction(pin);
      if (res.success) {
        toast.success(hasPinConfigured ? "PIN de seguridad actualizado" : "PIN de seguridad configurado");
        setPin("");
        setConfirmPin("");
        setHasPinConfigured(true);
      } else {
        toast.error(res.error || "No se pudo actualizar el PIN");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el PIN");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const res = await clearUserPinAction();
      if (res.success) {
        toast.success("PIN eliminado");
        setPin("");
        setConfirmPin("");
        setHasPinConfigured(false);
      } else {
        toast.error(res.error || "No se pudo eliminar el PIN");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el PIN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-violet-200 -space-y-4 shadow-md dark:border-violet-900/30">
      <CardHeader className="flex flex-row items-center space-y-0 px-4">
        <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-950">
          <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <CardTitle className="text-lg">PIN de Autorizacion</CardTitle>
          <CardDescription>
            Este PIN se usara para autorizar descuentos altos y operaciones sensibles.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pt-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Estado del PIN</span>
          <span className={hasPinConfigured ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>
            {loadingStatus ? "Cargando..." : hasPinConfigured ? "Configurado" : "No configurado"}
          </span>
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/20 dark:text-blue-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Por seguridad, el PIN no se muestra. Solo puedes configurarlo, cambiarlo o eliminarlo.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-pin">
              {hasPinConfigured ? "Nuevo PIN (4-6 digitos)" : "PIN (4-6 digitos)"}
            </Label>
            <div className="relative">
              <Input
                id="new-pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Ej: 1234"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2 text-muted-foreground hover:text-foreground"
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-pin">Confirmar PIN</Label>
            <Input
              id="confirm-pin"
              type={showPin ? "text" : "password"}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Ej: 1234"
            />
          </div>
        </div>

        <div className="mb-3 flex justify-end gap-2 pt-2">
          {hasPinConfigured && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={saving || loadingStatus}
            >
              Eliminar PIN
            </Button>
          )}
          <Button
            variant="default"
            onClick={handleSave}
            disabled={saving || loadingStatus || !pin || pin !== confirmPin || pin.length < 4}
            className="bg-violet-600 text-white hover:bg-violet-700"
          >
            <Key className="mr-2 h-4 w-4" />
            {saving ? "Guardando..." : hasPinConfigured ? "Actualizar PIN" : "Establecer PIN"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
