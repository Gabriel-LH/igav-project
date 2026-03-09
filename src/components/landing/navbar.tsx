import { Button } from "@/components/ui/button";
import { ModeToggle } from "../tenant/header/mode-toggle";
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl tracking-tight">IGAV</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Características
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Precios
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <div className="hidden sm:flex gap-2">
            <Button variant="ghost">
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button>
              <Link href="/#pricing">Empezar Gratis</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
