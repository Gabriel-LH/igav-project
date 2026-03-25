import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save } from "lucide-react";

interface SettingsHeaderProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  handleCancel: () => void;
  handleSave: () => void;
}

export function SettingsHeader({
  hasUnsavedChanges,
  isSaving,
  handleCancel,
  handleSave,
}: SettingsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HugeiconsIcon
              icon={Settings01Icon}
              className="w-6 h-6 text-primary"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Configuración del Sistema
            </h1>
            <p className="text-muted-foreground">
              Gestiona los parámetros fiscales, precios y reglas de caja de tu
              negocio.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
  );
}
