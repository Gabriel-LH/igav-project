import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { RotateCcw, Save } from "lucide-react";

interface PolicyHeaderProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  handleCancel: () => void;
  handleSave: () => void;
}

export function PolicyHeader({
  hasUnsavedChanges,
  isSaving,
  handleCancel,
  handleSave,
}: PolicyHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HugeiconsIcon icon={File02Icon} className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Configuración de Políticas</h2>
            <p className="text-sm text-muted-foreground">
              Define las reglas de negocio globales para el tenant
            </p>
          </div>
        </div>
        {hasUnsavedChanges && (
          <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                "Guardando..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
