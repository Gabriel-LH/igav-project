import { Tag } from "lucide-react";
import { formatCurrency } from "@/src/utils/currency-format";
import { useCouponStore } from "@/src/store/useCouponStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { Coupon } from "@/src/types/coupon/type.coupon";

interface UseCouponComponentProps {
  tenantId: string | null;
  selectedClientId?: string;
  appliedCoupon: Coupon | null;
  onApplyCoupon: (coupon: Coupon | null) => void;
}

export function UseCouponComponent({
  tenantId,
  appliedCoupon,
  onApplyCoupon,
}: UseCouponComponentProps) {
  const [code, setCode] = useState("");
  const getCouponByCode = useCouponStore((s) => s.getCouponByCode);

  const handleApply = () => {
    if (!code) return;
    if (!tenantId) {
      toast.error("No se pudo identificar la organización");
      return;
    }

    const coupon = getCouponByCode(tenantId, code.toUpperCase());
    if (!coupon) {
      toast.error("Cupón no encontrado o inválido");
      return;
    }

    if (coupon.status !== "available") {
      toast.error(
        `El cupón está ${coupon.status === "used" ? "usado" : "expirado"}`,
      );
      return;
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      toast.error("Este cupón ya expiró");
      return;
    }

    onApplyCoupon(coupon);
    toast.success("Cupón aplicado correctamente");
  };

  const handleRemove = () => {
    onApplyCoupon(null);
    setCode("");
  };

  return (
    <div className="flex flex-col  px-2 py-1 border rounded-xl">
      <div className="flex gap-4 items-center w-full">
        <div className="p-1.5 bg-yellow-100 rounded-full">
          <Tag className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] -mb-1 font-bold uppercase text-orange-500">
            Cupón de Descuento
          </span>

          {!appliedCoupon ? (
            <div className="flex w-fit gap-15 mt-1">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO"
                className="h-7 text-xs uppercase"
              />

              <Button
                onClick={handleApply}
                size="sm"
                className="h-7 text-xs shrink-0 text-white bg-orange-600 hover:bg-orange-700"
              >
                Aplicar
              </Button>
            </div>
          ) : (
            <div className="flex w-full justify-between mt-2 p-2 bg-orange-100 rounded-lg border border-orange-200">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-orange-800">
                  {appliedCoupon.code}
                </span>
                <span className="text-[10px] text-orange-600">
                  {appliedCoupon.discountType === "percentage"
                    ? `-${appliedCoupon.discountValue}%`
                    : `-${formatCurrency(appliedCoupon.discountValue)}`}
                </span>
              </div>
              <Button
                onClick={handleRemove}
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] text-orange-700 hover:bg-orange-200"
              >
                Remover
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
