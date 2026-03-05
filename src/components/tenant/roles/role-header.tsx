import { Shield, Users } from "lucide-react";

export function RoleHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
        <Shield className="w-8 h-8" />
        Roles
      </h1>
      <p className="text-muted-foreground mt-1">
        Gestiona los roles de tu equipo y sus permisos
      </p>
    </div>
  );
}
