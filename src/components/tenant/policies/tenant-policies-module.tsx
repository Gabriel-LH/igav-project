// components/tenant-policies/TenantPoliciesModule.tsx (verifica esta parte)
'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Save, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { SalesPoliciesTab } from './sales-policy-tab';
import { RentalsPoliciesTab } from './rentals-policy-tab';
import { ReservationsPoliciesTab } from './reservation-policy-tab';
import { InventoryPoliciesTab } from './inventory-policy-tab';
import { FinancialPoliciesTab } from './financials-policy-tab';
import { SecurityPoliciesTab } from './security-policy-tab';
import { MOCK_TENANT_POLICIES } from '@/src/mocks/mock.tenantPolicies'; 
import { tenantPoliciesSchema, type TenantPolicies } from '@/src/types/tenant/type.tenantPolicies';

export function TenantPoliciesModule() {
  const [activeTab, setActiveTab] = useState('sales');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [highImpactChanges, setHighImpactChanges] = useState<string[]>([]);
  const [originalPolicies, setOriginalPolicies] = useState<TenantPolicies>(MOCK_TENANT_POLICIES);

  // Crear el formulario principal con opciones para evitar re-renders
  const methods = useForm<TenantPolicies>({
    resolver: zodResolver(tenantPoliciesSchema),
    defaultValues: originalPolicies,
    mode: 'onChange', // Cambiar a onChange para mejor rendimiento
  });

  const { watch, reset, formState } = methods;
  const currentPolicies = watch();

  // Usar useEffect con dependencias específicas
  useEffect(() => {
    const changed = JSON.stringify(currentPolicies) !== JSON.stringify(originalPolicies);
    setHasUnsavedChanges(changed);

    // Detectar cambios de alto impacto
    const impacts: string[] = [];
    if (currentPolicies.rentals?.autoMarkAsLate !== originalPolicies.rentals?.autoMarkAsLate) {
      impacts.push('Marcado automático de atrasados');
    }
    if (currentPolicies.inventory?.autoBlockStockIfReserved !== originalPolicies.inventory?.autoBlockStockIfReserved) {
      impacts.push('Bloqueo automático de stock reservado');
    }
    if (currentPolicies.financial?.autoApplyChargesOnDamage !== originalPolicies.financial?.autoApplyChargesOnDamage) {
      impacts.push('Cargos automáticos por daño');
    }
    setHighImpactChanges(impacts);
  }, [
    currentPolicies.rentals?.autoMarkAsLate,
    currentPolicies.inventory?.autoBlockStockIfReserved,
    currentPolicies.financial?.autoApplyChargesOnDamage,
    originalPolicies
  ]);

  const handleSave = async () => {
    console.log('Guardando políticas:', currentPolicies);
    setOriginalPolicies(currentPolicies);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    reset(originalPolicies);
    setHasUnsavedChanges(false);
  };

  return (
    <FormProvider {...methods}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-end items-start">
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Alerta de cambios de alto impacto */}
        {highImpactChanges.length > 0 && hasUnsavedChanges && (
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Cambios de alto impacto detectados</AlertTitle>
            <AlertDescription>
              Las siguientes modificaciones afectan procesos automatizados:
              <ul className="list-disc ml-6 mt-2">
                {highImpactChanges.map((change, i) => (
                  <li key={i}>{change}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs principales */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-4xl grid-cols-6">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <span>💰</span>
              Ventas
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex items-center gap-2">
              <span>📦</span>
              Alquileres
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <span>📅</span>
              Reservas
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <span>📊</span>
              Inventario
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <span>💵</span>
              Financiero
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <span>🔒</span>
              Seguridad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesPoliciesTab />
          </TabsContent>

          <TabsContent value="rentals">
            <RentalsPoliciesTab />
          </TabsContent>

          <TabsContent value="reservations">
            <ReservationsPoliciesTab />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryPoliciesTab />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialPoliciesTab />
          </TabsContent>

          <TabsContent value="security">
            <SecurityPoliciesTab />
          </TabsContent>
        </Tabs>

        {/* Footer informativo */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-4">
          <Info className="h-4 w-4" />
          <span>Los cambios en políticas tienen efecto inmediato en el comportamiento del sistema</span>
        </div>
      </div>
    </FormProvider>
  );
}