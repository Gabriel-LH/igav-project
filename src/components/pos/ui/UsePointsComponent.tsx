import { Button } from "@/components/button";

export const UsePointsComponent = ({
    usePoints,
    setUsePoints,
    availablePoints,
    pointValueInMoney,
}: {
    usePoints: boolean;
    setUsePoints: (usePoints: boolean) => void;
    availablePoints: number;
    pointValueInMoney: number;
}) => {
  return (
    <div>
      <div
        className={`p-3 rounded-md border flex items-center justify-between mt-2 mb-4 transition-colors ${
          usePoints
            ? "bg-amber-50 border-amber-300"
            : "bg-muted/50 border-border"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${usePoints ? "bg-amber-100 text-amber-600" : "bg-background text-muted-foreground border"}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
              className="w-4 h-4"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold leading-none mb-1">
              Puntos Acumulados: {availablePoints}
            </p>
            <p className="text-[11px] text-muted-foreground leading-none">
              Equivale a S/{" "}
              {(availablePoints * pointValueInMoney).toFixed(2)} de descuento
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant={usePoints ? "default" : "outline"}
          className={
            usePoints
              ? "bg-amber-500 hover:bg-amber-600 text-white h-8 text-xs"
              : "h-8 text-xs"
          }
          onClick={() => setUsePoints(!usePoints)}
        >
          {usePoints ? "Quitar" : "Canjear"}
        </Button>
      </div>
    </div>
  );
};