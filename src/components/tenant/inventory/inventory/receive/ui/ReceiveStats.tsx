// src/components/inventory/assignment/AssignmentStats.tsx
import React from "react";
import { Card } from "@/components/card";
import { Package, CheckCircle, AlertCircle, Truck } from "lucide-react";

interface ReceiveStatsProps {
  totalExpected: number;
  scannedCount: number;
  pendingCount: number;
}

export const ReceiveStats: React.FC<ReceiveStatsProps> = ({
  totalExpected,
  scannedCount,
  pendingCount,
}) => {
  const progress = totalExpected > 0 ? (scannedCount / totalExpected) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase">
                Esperados
              </p>
              <p className="text-2xl font-black text-blue-700">
                {totalExpected}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-bold uppercase">
                Escaneados
              </p>
              <p className="text-2xl font-black text-green-700">
                {scannedCount}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 font-bold uppercase">
                Faltantes
              </p>
              <p className="text-2xl font-black text-orange-700">
                {pendingCount}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-bold uppercase">
                En Tránsito
              </p>
              <p className="text-2xl font-black text-purple-700">
                {totalExpected - scannedCount}
              </p>
            </div>
            <Truck className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Progreso de Recepción</span>
          <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
