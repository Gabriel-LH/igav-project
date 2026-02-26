// src/store/useCouponStore.ts

import { create } from "zustand";
import { Coupon } from "../types/coupon/type.coupon";

interface CouponState {
  coupons: Coupon[];

  // CRUD básico
  addCoupon: (coupon: Coupon) => void;
  updateCoupon: (couponId: string, updates: Partial<Coupon>) => void;

  // Acceso
  getCouponByCode: (tenantId: string, code: string) => Coupon | undefined;
  getCouponsByClient: (tenantId: string, clientId: string) => Coupon[];

  // Estados
  markAsUsed: (couponId: string) => void;
  markAsExpired: (couponId: string) => void;

  // Limpieza (opcional)
  removeCoupon: (couponId: string) => void;
}

export const useCouponStore = create<CouponState>((set, get) => ({
  coupons: [],

  // ➕ Agregar cupón
  addCoupon: (coupon) =>
    set((state) => ({
      coupons: [...state.coupons, coupon],
    })),

  // ✏️ Actualizar cupón
  updateCoupon: (couponId, updates) =>
    set((state) => ({
      coupons: state.coupons.map((c) =>
        c.id === couponId ? { ...c, ...updates } : c
      ),
    })),

  // 🔍 Buscar por código (multitenant safe)
  getCouponByCode: (tenantId, code) =>
    get().coupons.find(
      (c) =>
        c.tenantId === tenantId &&
        c.code === code
    ),

  // 📋 Listar cupones de un cliente
  getCouponsByClient: (tenantId, clientId) =>
    get().coupons.filter(
      (c) =>
        c.tenantId === tenantId &&
        c.assignedToClientId === clientId
    ),

  // ✅ Marcar como usado
  markAsUsed: (couponId) =>
    set((state) => ({
      coupons: state.coupons.map((c) =>
        c.id === couponId
          ? {
              ...c,
              status: "used",
              usedAt: new Date(),
            }
          : c
      ),
    })),

  // ⏳ Marcar como expirado
  markAsExpired: (couponId) =>
    set((state) => ({
      coupons: state.coupons.map((c) =>
        c.id === couponId
          ? {
              ...c,
              status: "expired",
            }
          : c
      ),
    })),

  // 🗑️ Remover (solo si realmente lo necesitas)
  removeCoupon: (couponId) =>
    set((state) => ({
      coupons: state.coupons.filter((c) => c.id !== couponId),
    })),
}));