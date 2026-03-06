import {
  Box,
  CalendarDays,
  CreditCard,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react";

export function Features() {
  const features = [
    {
      name: "Gestión de Inventario",
      description:
        "Controla tu stock en tiempo real, recibe alertas de bajo inventario y gestiona múltiples sucursales.",
      icon: Box,
    },
    {
      name: "Sistema de Alquileres",
      description:
        "Calendario visual de reservas, control de depósitos de garantía y seguimiento de devoluciones.",
      icon: CalendarDays,
    },
    {
      name: "Punto de Venta (POS)",
      description:
        "Vende rápido y fácil. Compatible con lectores de códigos de barras e impresoras térmicas.",
      icon: CreditCard,
    },
    {
      name: "CRM de Clientes",
      description:
        "Historial de compras y alquileres, sistema de lealtad y segmentación de clientes.",
      icon: Users,
    },
    {
      name: "Reportes y Analíticas",
      description:
        "Toma decisiones basadas en datos. Conoce tus productos más rentables y el rendimiento de tu equipo.",
      icon: LineChart,
    },
    {
      name: "Seguridad y Roles",
      description:
        "Asigna permisos específicos a tus empleados. Mantén tu información financiera segura.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="features" className="container mx-auto px-4 py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Todo lo que necesitas para crecer
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Herramientas potentes diseñadas para simplificar la operación diaria
          de tu negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="flex flex-col items-start space-y-4 p-6 rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
          >
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold">{feature.name}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
