import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { PackageCheck, HandCoins, IdCard, Gem, Gift, Watch } from "lucide-react";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType"; 

interface GuaranteeSectionProps {
  guarantee: string;
  setGuarantee: (v: string) => void;
  guaranteeType: GuaranteeType;
  setGuaranteeType: (v: GuaranteeType) => void;
}

export function GuaranteeSection({
  guarantee,
  setGuarantee,
  guaranteeType,
  setGuaranteeType,
}: GuaranteeSectionProps) {

  console.log("guaranteeType",guaranteeType)
  console.log("guarantee",guarantee)
  return (
    <div className="space-y-2 border-t pt-2">
      <div className="flex justify-between items-center">
        <Label className="text-[10px] font-bold uppercase  flex items-center gap-1">
          <PackageCheck className="w-3 h-3" /> Garantía
        </Label>

        <Select value={guaranteeType} onValueChange={setGuaranteeType}>
          <SelectTrigger className="h-7 w-fit text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dinero">
              <HandCoins className="w-3 h-3 mr-1 inline" /> Dinero
            </SelectItem>
            <SelectItem value="dni">
              <IdCard className="w-3 h-3 mr-1 inline" /> DNI
            </SelectItem>
            <SelectItem value="joyas">
              <Gem className="w-3 h-3 mr-1 inline" /> Joyas
            </SelectItem>
            <SelectItem value="reloj">
              <Watch className="w-3 h-3 mr-1 inline" /> Reloj
            </SelectItem>
            <SelectItem value="otros">
              <Gift className="w-3 h-3 mr-1 inline" /> Otros
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {guaranteeType === "dinero" ? (
        <div className="relative">
          <span className="absolute left-2.5 top-2 text-xs font-bold">
            S/.
          </span>
          <Input
            className="pl-8 h-8 text-xs"
            placeholder="Monto garantía"
            value={guarantee}
            onChange={(e) => setGuarantee(e.target.value)}
          />
        </div>
      ) : (
        <Input
          className="h-8 text-xs"
          placeholder="Descripción del objeto..."
          value={guarantee}
          onChange={(e) => setGuarantee(e.target.value)}
        />
      )}
    </div>
  );
}
