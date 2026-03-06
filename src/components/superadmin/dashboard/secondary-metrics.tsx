// src/components/dashboard/SecondaryMetrics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Clock, AlertTriangle } from 'lucide-react';

interface SecondaryMetricsProps {
  newTenants: number;
  trialUsers: number;
  pastDueSubscriptions: number;
}

export const SecondaryMetrics: React.FC<SecondaryMetricsProps> = ({
  newTenants,
  trialUsers,
  pastDueSubscriptions,
}) => {
  const metrics = [
    {
      title: "New Tenants (30d)",
      value: newTenants,
      icon: UserPlus,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Trial Users",
      value: trialUsers,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Past Due Subscriptions",
      value: pastDueSubscriptions,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div className={`rounded-lg ${metric.bgColor} p-2`}>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};