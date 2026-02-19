// src/services/loyalty/manageLoyaltyPoints.ts
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useLoyaltyStore } from "@/src/store/useLoyaltyStore";
import { LoyaltyTransactionType } from "@/src/utils/status-type/LoyaltyTransactionType"; 

interface LoyaltyInput {
    clientId: string;
    points: number; // Siempre positivo, la lógica decide si suma o resta según el tipo
    type: LoyaltyTransactionType;
    operationId?: string;
    description?: string;
}

export const manageLoyaltyPoints = ({ 
    clientId, 
    points, 
    type, 
    operationId, 
    description 
}: LoyaltyInput) => {
    
    // 1. Obtener cliente actual para validaciones
    const customer = useCustomerStore.getState().getCustomerById(clientId);
    if (!customer) return; // O lanzar error

    // 2. Determinar si SUMA o RESTA según el tipo
    let finalPointsChange = points;
    
    if (type === "redeemed") {
        // Validación de negocio: No puede canjear más de lo que tiene
        if ((customer.loyaltyPoints || 0) < points) {
            throw new Error("Puntos insuficientes para realizar el canje.");
        }
        finalPointsChange = -points; // Convertimos a negativo para restar
    }

    // 3. Crear registro en el Historial (Ledger)
    useLoyaltyStore.getState().addEntry({
        id: `LOY-${crypto.randomUUID().slice(0, 8)}`,
        clientId,
        amount: finalPointsChange, // Guardamos +100 o -50
        type,
        operationId,
        description: description || getTypeDescription(type, points),
        createdAt: new Date(),
    });

    // 4. Actualizar el Snapshot del Cliente (Saldo actual)
    const currentPoints = customer.loyaltyPoints || 0;
    
    useCustomerStore.getState().updateCustomer(clientId, {
        loyaltyPoints: currentPoints + finalPointsChange
    });

    console.log(`Loyalty: ${type} ${points} pts. Nuevo saldo: ${currentPoints + finalPointsChange}`);
};

// Helper para descripciones automáticas
// Helper para descripciones automáticas más detalladas
function getTypeDescription(type: LoyaltyTransactionType, points: number): string {
    switch (type) {
        case "earned_purchase": 
            return `Ganaste ${points} pts por tu compra`;
            
        case "redeemed": 
            return `Canjeaste ${points} pts en descuento`;
            
        case "bonus_referral": 
            return `Recibiste un bono de ${points} pts por referir a un amigo`;
            
        case "manual_adjustment":
            // Si es ajuste, depende si sumamos o restamos (opcional)
            return `Ajuste administrativo de ${points} pts`;
            
        default: 
            return `Movimiento de ${points} pts`;
    }
}