// Componente sugerido: HomeStats.tsx
import { useIsMobile } from "@/src/hooks/use-mobile";
import { PackageMoving01Icon, AlertCircleIcon, ContainerTruck02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Reservation } from "@/src/types/reservation/type.reservation";

export function HomeStats({ reservations }: { reservations: Reservation[] }) {
  const today = new Date().setHours(0,0,0,0);

  const isMobile = useIsMobile()

  // 1. Entregas para hoy
  const deliveriesToday = reservations.filter(r => 
    r.status === "confirmada" && new Date(r.startDate).setHours(0,0,0,0) === today
  ).length;

  // 2. Reservas Atrasadas (No vinieron a recoger)
  const delayedPickups = reservations.filter(r => 
    r.status === "confirmada" && new Date(r.startDate).setHours(0,0,0,0) < today
  ).length;

  // 3. Devoluciones esperadas para hoy
  const returnsToday = reservations.filter(r => 
    r.status === "convertida" && new Date(r.endDate).setHours(0,0,0,0) === today
  ).length;

  return (
    <div className="grid grid-cols-2 md:w-full w-fit md:grid-cols-3 gap-4 mb-6">
      <StatCard 
        label="Entregas para Hoy" 
        value={deliveriesToday} 
        icon={PackageMoving01Icon} 
        color="text-blue-600" 
      />
      <StatCard 
        label="Recogidas Atrasadas" 
        value={delayedPickups} 
        icon={AlertCircleIcon} 
        color="text-red-600" 
      />
      {!isMobile && (
        <StatCard 
          label="Retornos para Hoy" 
          value={returnsToday} 
          icon={ContainerTruck02Icon} 
          color="text-emerald-600" 
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`px-4 py-1 rounded-2xl border flex items-center gap-4`}>
      <div className={`p-2 rounded-lg bg-accent shadow-sm ${color}`}>
        <HugeiconsIcon icon={icon} size={20} strokeWidth={2.2} />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}