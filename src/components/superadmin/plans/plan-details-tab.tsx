// src/components/billing/plans/PlanDetailsTabs.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Check,
  X,
  Edit,
  Save,
} from 'lucide-react';
import { Plan } from '@/src/types/plan/planSchema';
import { PLAN_FEATURE_KEYS, PlanFeatureKey } from '@/src/types/plan/planFeature';
import { PLAN_LIMIT_KEYS, PlanLimitKey } from '@/src/types/plan/type.planLimitKey';

// Mocks
import { PLAN_FEATURES_MOCK } from '@/src/mocks/mock.planFeature'; 
import { PLAN_LIMITS_MOCK } from '@/src/mocks/mock.planLimit'; 
import { TENTANT_SUBSCRIPTIONS_MOCK } from "@/src/mocks/mock.tenantSuscription";
import { MOCK_TENANT } from "@/src/mocks/mock.tenant";

interface PlanDetailsTabsProps {
  plan: Plan;
  onBack: () => void;
}

export const PlanDetailsTabs: React.FC<PlanDetailsTabsProps> = ({
  plan,
  onBack,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState(plan);
  const [editedFeatures, setEditedFeatures] = useState<Set<PlanFeatureKey>>(new Set());
  const [editedLimits, setEditedLimits] = useState<Partial<Record<PlanLimitKey, number>>>({});

  // Cargar features y límites del plan
  useEffect(() => {
    // Cargar features
    const planFeatures = PLAN_FEATURES_MOCK
      .filter(f => f.planId === plan.id)
      .map(f => f.featureKey);
    setEditedFeatures(new Set(planFeatures));

    // Cargar límites
    const planLimits = PLAN_LIMITS_MOCK
      .filter(l => l.planId === plan.id)
      .reduce((acc, curr) => ({
        ...acc,
        [curr.limitKey]: curr.limit,
      }), {});
    setEditedLimits(planLimits);
  }, [plan]);

  // Obtener tenants que usan este plan
  const tenantsUsingPlan = TENTANT_SUBSCRIPTIONS_MOCK
    .filter(sub => sub.planId === plan.id)
    .map(sub => {
      const tenant = MOCK_TENANT.find(t => t.id === sub.tenantId);
      return tenant ? { ...tenant, subscription: sub } : null;
    })
    .filter(Boolean);

  const handleSave = () => {
    // Aquí iría la llamada a la API
    console.log('Guardar cambios:', { 
      plan: editedPlan, 
      features: Array.from(editedFeatures), 
      limits: editedLimits 
    });
    setIsEditing(false);
  };

  const toggleFeature = (feature: PlanFeatureKey) => {
    const newFeatures = new Set(editedFeatures);
    if (newFeatures.has(feature)) {
      newFeatures.delete(feature);
    } else {
      newFeatures.add(feature);
    }
    setEditedFeatures(newFeatures);
  };

  const updateLimit = (key: PlanLimitKey, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      setEditedLimits(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const handlePlanChange = (field: keyof Plan, value: any) => {
    setEditedPlan(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-4">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a lista
          </Button>
          <h3 className="text-2xl font-semibold">{plan.name}</h3>
          <Badge variant={plan.isActive ? 'success' : 'secondary'}>
            {plan.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Plan
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de detalle */}
      <Tabs defaultValue="features" className="space-y-4">
        <TabsList>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="tenants">Tenants using</TabsTrigger>
        </TabsList>

        {/* Tab Features */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Características del Plan</CardTitle>
              <CardDescription>
                Módulos y funcionalidades incluidas en este plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PLAN_FEATURE_KEYS.map((featureKey) => {
                  const hasFeature = editedFeatures.has(featureKey);
                  const featureLabel = featureKey
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());

                  return (
                    <div
                      key={featureKey}
                      className={`flex items-center space-x-2 p-3 rounded-lg border ${
                        hasFeature ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      {isEditing ? (
                        <Checkbox
                          id={`feature-${featureKey}`}
                          checked={hasFeature}
                          onCheckedChange={() => toggleFeature(featureKey)}
                        />
                      ) : (
                        <div className={`p-1 rounded-full ${hasFeature ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {hasFeature ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      )}
                      <Label
                        htmlFor={`feature-${featureKey}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {featureLabel}
                      </Label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Limits */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Límites del Plan</CardTitle>
              <CardDescription>
                Restricciones y límites por módulo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {PLAN_LIMIT_KEYS.map((limitKey) => {
                  const limit = editedLimits[limitKey] ?? 0;
                  const limitLabel = limitKey
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase());

                  return (
                    <div key={limitKey} className="space-y-2">
                      <Label className="capitalize">{limitLabel}</Label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={limit === -1 ? '-1' : limit}
                          onChange={(e) => updateLimit(limitKey, e.target.value)}
                          placeholder="-1 = Ilimitado, 0 = Bloqueado"
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${Math.min((limit / 100) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {limit === -1 ? '∞' : limit}
                          </span>
                        </div>
                      )}
                      {!isEditing && limit === -1 && (
                        <p className="text-xs text-muted-foreground">Ilimitado</p>
                      )}
                      {!isEditing && limit === 0 && (
                        <p className="text-xs text-muted-foreground">Bloqueado</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Tenants Using */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Tenants usando este plan</CardTitle>
              <CardDescription>
                {tenantsUsingPlan.length} tenants tienen suscripciones activas en este plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tenantsUsingPlan.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Suscripción</TableHead>
                        <TableHead>Ciclo</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead>Próximo pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenantsUsingPlan.map((item) => (
                        <TableRow key={item?.id}>
                          <TableCell className="font-medium">{item?.name}</TableCell>
                          <TableCell>
                            <Badge variant={item?.status === 'active' ? 'success' : 'destructive'}>
                              {item?.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              item?.subscription?.status === 'active' ? 'success' : 
                              item?.subscription?.status === 'trial' ? 'warning' : 
                              'destructive'
                            }>
                              {item?.subscription?.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {item?.subscription?.billingCycle}
                          </TableCell>
                          <TableCell>
                            {item?.subscription?.startedAt.toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {item?.subscription?.currentPeriodEnd.toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tenants usando este plan actualmente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Información adicional del plan */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Precio Mensual</p>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedPlan.priceMonthly}
                  onChange={(e) => handlePlanChange('priceMonthly', parseFloat(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <p className="text-2xl font-bold">S/ {plan.priceMonthly}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Precio Anual</p>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedPlan.priceYearly || 0}
                  onChange={(e) => handlePlanChange('priceYearly', parseFloat(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <>
                  <p className="text-2xl font-bold">S/ {plan.priceYearly}</p>
                  {plan.priceYearly && (
                    <p className="text-xs text-green-600">
                      Ahorro: S/ {plan.priceMonthly * 12 - plan.priceYearly}
                    </p>
                  )}
                </>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Días de Prueba</p>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedPlan.trialDays || 0}
                  onChange={(e) => handlePlanChange('trialDays', parseInt(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <p className="text-2xl font-bold">{plan.trialDays || 0}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Orden</p>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedPlan.sortOrder}
                  onChange={(e) => handlePlanChange('sortOrder', parseInt(e.target.value))}
                  className="mt-1"
                />
              ) : (
                <p className="text-2xl font-bold">{plan.sortOrder}</p>
              )}
            </div>
          </div>
          {plan.description && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-sm text-muted-foreground">Descripción</p>
                {isEditing ? (
                  <Input
                    value={editedPlan.description || ''}
                    onChange={(e) => handlePlanChange('description', e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{plan.description}</p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};