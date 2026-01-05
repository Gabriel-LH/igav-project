import { TrendingDown, TrendingUp } from "lucide-react";

export function SortedTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {label instanceof Date ||
        (typeof label === "string" &&
          !isNaN(Date.parse(label)) &&
          label.length > 4)
          ? new Date(label).toLocaleDateString("es-ES", {
              month: "short",
              day: "numeric",
            })
          : label}
      </div>

      <div className="flex flex-col gap-1">
        {sorted.map((item: any, index: number) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              {index === 0 ? (
                <TrendingUp
                  className="rounded-full"
                  style={{ color: item.color }}
                ></TrendingUp>
              ) : (
                <TrendingDown
                  className="rounded-full"
                  style={{ color: item.color }}
                ></TrendingDown>
              )}
              <span className="capitalize">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
