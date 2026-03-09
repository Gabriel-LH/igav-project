import { CreateTenantModal } from "./create-tenant-modal";

export function TenantHeader() {
  return (
    <div className="flex flex-row justify-between items-start gap-1">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">
          Gestionar tenants, ver detalles y realizar acciones rápidas y
          eficientes
        </p>
      </div>
      <CreateTenantModal />
    </div>
  );
}
