// src/components/billing/features/LimitsManager.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/badge';
import { Button } from '@/components/ui/button';
import { Info, Infinity, Lock, Save } from 'lucide-react';
import { PLAN_LIMIT_KEYS, PlanLimitKey } from '@/src/types/plan/type.planLimitKey';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LimitsManagerProps {
  limits: Partial<Record<PlanLimitKey, number>>;
  onLimitChange: (key: PlanLimitKey, value: number) => void;
  mode: 'global' | 'plan';
  planName?: string;
  title?: string;
  description?: string;
  onSave?: () => void;
}

export const LimitsManager: React.FC<LimitsManagerProps> = ({
  limits,
  onLimitChange,
  mode,
  planName,
  title,
  description,
  onSave,
}) => {
  const getLimitLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const getLimitDescription = (key: PlanLimitKey) => {
    const descriptions: Partial<Record<PlanLimitKey, string>> = {
      users: 'Número máximo de usuarios que pueden crear',
      branches: 'Sucursales o locales permitidos',
      products: 'Productos en el catálogo',
      clients: 'Clientes registrados',
      inventoryItems: 'Items en inventario',
      promotions: 'Promociones activas simultáneas',
      analytics: 'Días de historial en analytics',
      referrals: 'Referidos por mes',
      referralRewards: 'Recompensas por referidos',
      loyalty: 'Puntos de fidelización',
      subscriptions: 'Suscripciones activas',
    };
    return descriptions[key] || '';
  };

  const formatLimitValue = (value: number) => {
    if (value === -1) return 'Ilimitado';
    if (value === 0) return 'Bloqueado';
    return value.toString();
  };

  const handleInputChange = (key: PlanLimitKey, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      onLimitChange(key, numValue);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title || (mode === 'global' ? 'Límites Globales' : `Límites: ${planName}`)}
        </CardTitle>
        <CardDescription>
          {description || (mode === 'global'
            ? 'Configura los límites por defecto para todos los planes'
            : `Define los límites específicos para el plan ${planName}`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-2 gap-6">
            {PLAN_LIMIT_KEYS.map((limitKey) => {
              const limit = limits[limitKey] ?? 0;

              return (
                <div key={limitKey} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Label className="capitalize font-medium">
                        {getLimitLabel(limitKey)}
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs">{getLimitDescription(limitKey)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {limit === -1 && <Infinity className="h-4 w-4 text-green-600" />}
                    {limit === 0 && <Lock className="h-4 w-4 text-red-600" />}
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="number"
                      value={limit === -1 ? '-1' : limit}
                      onChange={(e) => handleInputChange(limitKey, e.target.value)}
                      placeholder="-1 = Ilimitado, 0 = Bloqueado"
                      className="w-full"
                    />
                    <div className="flex items-center space-x-2 text-xs">
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => onLimitChange(limitKey, -1)}
                      >
                        Ilimitado
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer hover:bg-secondary"
                        onClick={() => onLimitChange(limitKey, 0)}
                      >
                        Bloqueado
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        <div className="mt-6 pt-4 border-t flex justify-end">
          {onSave && (
            <Button onClick={onSave}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Límites
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};