import { Users } from "lucide-react";

export function TeamHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Users className="w-8 h-8" />
        Equipo
      </h1>
      <p className="text-muted-foreground mt-1">
        Gestiona los miembros de tu equipo y sus permisos
      </p>
    </div>
  );
}
