// src/components/dashboard/PlansDistribution.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plan } from '@/src/types/plan/planSchema'; 
import { TenantSubscription } from '@/src/types/tenant/tenantSuscription'; 

interface PlansDistributionProps {
  plans: Plan[];
  subscriptions: TenantSubscription[];
  activeSubscriptions: number;
}

export const PlansDistribution: React.FC<PlansDistributionProps> = ({
  plans,
  subscriptions,
  activeSubscriptions,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Planes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {plans.filter(p => p.isActive).map(plan => {
            const count = subscriptions.filter(
              s => s.planId === plan.id && s.status === 'active'
            ).length;
            const percentage = activeSubscriptions > 0 
              ? (count / activeSubscriptions) * 100 
              : 0;

            return (
              <div key={plan.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-muted-foreground">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};