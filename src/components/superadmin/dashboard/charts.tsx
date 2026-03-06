// src/components/dashboard/Charts.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyData {
  month: string;
  revenue: number;
}

interface WeeklyData {
  week: string;
  tenants: number;
}

interface ChartsProps {
  monthlyRevenue: MonthlyData[];
  weeklyNewTenants: WeeklyData[];
}

export const Charts: React.FC<ChartsProps> = ({ monthlyRevenue, weeklyNewTenants }) => {
  const maxRevenue = Math.max(...monthlyRevenue.map(d => d.revenue));
  const maxTenants = Math.max(...weeklyNewTenants.map(d => d.tenants));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Mensuales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end justify-around">
            {monthlyRevenue.map((data, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                <div 
                  className="w-12 bg-primary rounded-t transition-all hover:bg-primary/80"
                  style={{ height: `${(data.revenue / maxRevenue) * 150}px` }}
                />
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{data.month}</p>
                  <p className="text-xs text-muted-foreground">S/ {data.revenue}k</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nuevos Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-end justify-around">
            {weeklyNewTenants.map((data, index) => (
              <div key={index} className="flex flex-col items-center w-full">
                <div 
                  className="w-12 bg-green-500 rounded-t transition-all hover:bg-green-500/80"
                  style={{ height: `${(data.tenants / maxTenants) * 150}px` }}
                />
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium">{data.week}</p>
                  <p className="text-xs text-muted-foreground">{data.tenants} tenants</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};