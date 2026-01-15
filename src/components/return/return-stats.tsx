// Componente sugerido: HomeStats.tsx
import { AlertCircleIcon, ContainerTruck02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ReturnStats({ reservations, overdue }: { reservations: any[]; overdue: any[] }) {
  const today = new Date().setHours(0,0,0,0);

  // Devoluciones esperadas para hoy
  const returnsToday = reservations.filter(r => 
    r.status === "entregado" && new Date(r.endDate).setHours(0,0,0,0) === today
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard 
        label="Retornos para Hoy" 
        value={returnsToday} 
        icon={ContainerTruck02Icon} 
        color="text-emerald-600"  
      />
      <StatCard 
        label="Retornos Vencidos" 
        value={overdue.length} 
        icon={AlertCircleIcon} 
        color="text-red-600" 
      />
    </div>  
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`px-4 py-2 rounded-2xl border flex items-center gap-4`}>
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