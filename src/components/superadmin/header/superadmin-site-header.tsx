import { Separator } from "@/components/separator";
import { SidebarTrigger } from "@/components/sidebar";
import { ModeToggle } from "../../tenant/header/mode-toggle";

export function SuperAdminSiteHeader() {
  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[height] ease-linear">
      <div className="flex w-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 shrink-0" />

          <Separator
            orientation="vertical"
            className="mx-1.5 hidden sm:block data-[orientation=vertical]:h-4 shrink-0"
          />

          <div>
            <h1 className="truncate text-base font-medium leading-tight">
              Centro de administración del sistema
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
