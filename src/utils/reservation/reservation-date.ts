import { addDays, startOfDay } from "date-fns";
import { BusinessRules } from "@/src/types/bussines-rules/bussines-rules"; 
import { getEstimatedTransferTime } from "../transfer/get-estimated-transfer-time";

export const getMinReservationDate = (
  originBranchId: string, 
  currentBranchId: string, 
  rules: BusinessRules
) => {
  const today = startOfDay(new Date());
  
  // Si el stock es local, podría estar disponible mañana (o hoy mismo)
  if (originBranchId === currentBranchId) return addDays(today, 1); 

  // Si es remoto, buscamos el tiempo en la matriz
  const transferDays = getEstimatedTransferTime(originBranchId, currentBranchId, rules);
  
  // Retornamos Hoy + Días de traslado + 1 día de margen para preparación
  return addDays(today, transferDays + 1);
};