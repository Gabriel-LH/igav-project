// src/components/inventory/assignment/ActivityLog.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/badge";
import { CheckCircle, AlertCircle, Clock, Package } from "lucide-react";

interface Activity {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  itemCode?: string;
  timestamp: Date;
}

interface ActivityLogProps {
  activities: Activity[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "info":
        return <Package className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Log de Actividad</span>
          <Badge variant="outline">{activities.length} eventos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(activity.timestamp)}
                    </div>
                  </div>
                  {activity.itemCode && (
                    <p className="text-xs text-muted-foreground font-mono">
                      Item: {activity.itemCode}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No hay actividad registrada
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
