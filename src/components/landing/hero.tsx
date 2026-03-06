import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function Hero() {
  return (
    <section className="container mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight lg:text-7xl">
          El sistema definitivo para <br className="hidden sm:block" />
          <span className="text-primary">alquileres y ventas</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl">
          IGAV centraliza tu inventario, clientes y facturación en una sola
          plataforma. Diseñado para negocios que venden, alquilan, o hacen ambas
          cosas.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button size="lg" className="h-12 px-8 text-base">
            Empezar Gratis <ArrowRight className=" ml-2 h-4 w-4 animate-pulse" />
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base">
            Ver Demo
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 pt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>14 días de prueba gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Sin tarjeta de crédito</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Soporte 24/7</span>
          </div>
        </div>
      </div>
    </section>
  );
}
