// components/branches/BranchDetails.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/badge";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  CreditCard,
  Users,
  Calendar,
  Settings,
} from "lucide-react";
import { BranchConfigModal } from "./ui/BranchConfigModal";
import type { Branch } from "@/src/types/branch/type.branch";
import type { BranchConfig } from "@/src/types/branch/type.branchConfig";
import { formatCurrency } from "@/src/utils/currency-format";

interface BranchDetailsProps {
  branch: Branch;
  config?: BranchConfig;
  metrics?: any;
  onUpdate: (branch: Branch) => void;
  onUpdateConfig: (config: BranchConfig) => void;
  onBack: () => void;
}

export function BranchDetails({
  branch,
  config,
  metrics,
  onUpdateConfig,
  onBack,
}: BranchDetailsProps) {
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
      <div className="space-y-6">
        {/* Header con información de la sucursal */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{branch.name}</h2>
                    <Badge
                      variant={
                        branch.status === "active" ? "default" : "secondary"
                      }
                    >
                      {branch.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                    {branch.isPrimary && (
                      <Badge
                        variant="default"
                        className="bg-amber-500 hover:bg-amber-600 gap-1"
                      >
                        <Star className="h-3 w-3" />
                        Principal
                      </Badge>
                    )}
                  </div>

                  <Button onClick={() => setShowConfigModal(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración de sucursal
                  </Button>
                </div>

                <div className="grid grid-cols-2 mb-3 md:grid-cols-4 gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {branch.address}, {branch.city}
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {branch.phone}
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {branch.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    {branch.timezone}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground">Código</p>
                <p className="font-mono font-medium">{branch.code}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas principales */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Caja de hoy</p>
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(metrics.currentCash)}
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Empleados</p>
                    <p className="text-2xl font-semibold">
                      {metrics.employeeCount}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Asistencias hoy
                    </p>
                    <p className="text-2xl font-semibold">
                      {metrics.todayAttendance || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Información de configuración actual (resumen) */}
        {config && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuración actual
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Horario de atención
                  </p>
                  <p className="font-medium">
                    {config.openHours.open} - {config.openHours.close}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de configuración */}
      {showConfigModal && (
        <BranchConfigModal
          branch={branch}
          config={config}
          onClose={() => setShowConfigModal(false)}
          onSave={onUpdateConfig}
        />
      )}
    </>
  );
}
