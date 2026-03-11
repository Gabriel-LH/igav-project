import { Button } from "@/components/button";
import { Separator } from "@/components/separator";
import { SidebarTrigger } from "@/components/sidebar";
import { ModeToggle } from "./mode-toggle";

interface SiteHeaderProps {
  tenantName: string;
  logoUrl?: string;
}

export function SiteHeader({ tenantName, logoUrl = "" }: SiteHeaderProps) {
  return (
    <header className="flex h-[--header-height] shrink-0 items-center gap-2 border-b transition-[height] ease-linear">
      <div className="flex w-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 shrink-0" />

          <Separator
            orientation="vertical"
            className="mx-1.5 hidden sm:block data-[orientation=vertical]:h-4 shrink-0"
          />

          <div className="flex items-center gap-2 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-6 w-6 rounded object-cover"
              />
            ) : null}
            <h1 className="truncate text-base font-medium leading-tight">
              {tenantName}
            </h1>
          </div>
          
          
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="hidden xs:flex text-xs sm:text-sm px-2 sm:px-3" // xs = ~480px
          >
            <a
              href="https://github.com/shadcn-ui/ui/..."
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
