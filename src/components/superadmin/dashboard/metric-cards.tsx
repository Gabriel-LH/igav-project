// src/components/dashboard/MetricCards.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; 
import { TrendingUp, Users, CreditCard, AlertCircle } from 'lucide-react';

interface MetricCardsProps {
  mrr: number;
  activeTenants: number;
  activeSubscriptions: number;
  churnRate: number;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  mrr,
  activeTenants,
  activeSubscriptions,
  churnRate,
}) => {
  const metrics = [
    {
      title: "MRR",
      value: `S/ ${mrr.toLocaleString()}`,
      change: "+12.5%",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Active Tenants",
      value: activeTenants,
      change: "+5",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Active Subscriptions",
      value: activeSubscriptions,
      change: "96%",
      icon: CreditCard,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Churn Rate",
      value: `${churnRate}%`,
      change: "-0.3%",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              <p className="text-xs text-muted-foreground">
                {metric.change} vs mes anterior
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};