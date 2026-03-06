"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, XCircle, Store, CalendarDays, Layers } from "lucide-react"

type PlanWithFeatures = {
  id: string
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  modules: { mode: "all" | "sales_only" | "rentals_only" }
  features: Record<string, boolean>
  limits: Record<string, number>
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount)
}

const formatLimit = (limit: number) => {
  return limit === -1 ? "Ilimitado" : limit.toString()
}

const plans: PlanWithFeatures[] = [
  // Sistema Completo
  {
    id: "all-starter",
    name: "Starter",
    description: "Para negocios que recién comienzan.",
    priceMonthly: 9,
    priceYearly: 90,
    modules: { mode: "all" },
    features: { analytics: false, promotions: false, referrals: false, rewards: false, loyalty: false },
    limits: { users: 2, branches: 1, products: 200, clients: 500, items: 200 },
  },
  {
    id: "all-pro",
    name: "Pro",
    description: "Para negocios en crecimiento.",
    priceMonthly: 29,
    priceYearly: 290,
    modules: { mode: "all" },
    features: { analytics: true, promotions: true, referrals: false, rewards: false, loyalty: false },
    limits: { users: 5, branches: 2, products: 1000, clients: 2000, items: 1000 },
  },
  {
    id: "all-business",
    name: "Business",
    description: "Para empresas consolidadas.",
    priceMonthly: 79,
    priceYearly: 790,
    modules: { mode: "all" },
    features: { analytics: true, promotions: true, referrals: true, rewards: false, loyalty: false },
    limits: { users: 15, branches: 5, products: -1, clients: -1, items: -1 },
  },
  {
    id: "all-enterprise",
    name: "Enterprise",
    description: "Para grandes corporaciones.",
    priceMonthly: 199,
    priceYearly: 1990,
    modules: { mode: "all" },
    features: { analytics: true, promotions: true, referrals: true, rewards: true, loyalty: true },
    limits: { users: -1, branches: -1, products: -1, clients: -1, items: -1 },
  },

  // Solo Alquiler
  {
    id: "rentals-starter",
    name: "Starter",
    description: "Para negocios que recién comienzan.",
    priceMonthly: 5,
    priceYearly: 50,
    modules: { mode: "rentals_only" },
    features: { analytics: false, promotions: false, referrals: false, rewards: false, loyalty: false },
    limits: { users: 2, branches: 1, products: 200, clients: 500, items: 200 },
  },
  {
    id: "rentals-pro",
    name: "Pro",
    description: "Para negocios en crecimiento.",
    priceMonthly: 19,
    priceYearly: 190,
    modules: { mode: "rentals_only" },
    features: { analytics: true, promotions: true, referrals: false, rewards: false, loyalty: false },
    limits: { users: 5, branches: 2, products: 1000, clients: 2000, items: 1000 },
  },
  {
    id: "rentals-business",
    name: "Business",
    description: "Para empresas consolidadas.",
    priceMonthly: 49,
    priceYearly: 490,
    modules: { mode: "rentals_only" },
    features: { analytics: true, promotions: true, referrals: true, rewards: false, loyalty: false },
    limits: { users: 15, branches: 5, products: -1, clients: -1, items: -1 },
  },
  {
    id: "rentals-enterprise",
    name: "Enterprise",
    description: "Para grandes corporaciones.",
    priceMonthly: 99,
    priceYearly: 990,
    modules: { mode: "rentals_only" },
    features: { analytics: true, promotions: true, referrals: true, rewards: true, loyalty: true },
    limits: { users: -1, branches: -1, products: -1, clients: -1, items: -1 },
  },

  // Solo Ventas
  {
    id: "sales-starter",
    name: "Starter",
    description: "Para negocios que recién comienzan.",
    priceMonthly: 5,
    priceYearly: 50,
    modules: { mode: "sales_only" },
    features: { analytics: false, promotions: false, referrals: false, rewards: false, loyalty: false },
    limits: { users: 2, branches: 1, products: 200, clients: 500, items: 200 },
  },
  {
    id: "sales-pro",
    name: "Pro",
    description: "Para negocios en crecimiento.",
    priceMonthly: 19,
    priceYearly: 190,
    modules: { mode: "sales_only" },
    features: { analytics: true, promotions: true, referrals: false, rewards: false, loyalty: false },
    limits: { users: 5, branches: 2, products: 1000, clients: 2000, items: 1000 },
  },
  {
    id: "sales-business",
    name: "Business",
    description: "Para empresas consolidadas.",
    priceMonthly: 49,
    priceYearly: 490,
    modules: { mode: "sales_only" },
    features: { analytics: true, promotions: true, referrals: true, rewards: false, loyalty: false },
    limits: { users: 15, branches: 5, products: -1, clients: -1, items: -1 },
  },
  {
    id: "sales-enterprise",
    name: "Enterprise",
    description: "Para grandes corporaciones.",
    priceMonthly: 99,
    priceYearly: 990,
    modules: { mode: "sales_only" },
    features: { analytics: true, promotions: true, referrals: true, rewards: true, loyalty: true },
    limits: { users: -1, branches: -1, products: -1, clients: -1, items: -1 },
  },
]

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [activeModule, setActiveModule] = useState<"all" | "rentals_only" | "sales_only">("all")

  const featureLabels: Record<string, string> = {
    analytics: "Analytics",
    promotions: "Promociones",
    referrals: "Referidos",
    rewards: "Recompensas",
    loyalty: "Lealtad",
  }

  const limitLabels: Record<string, string> = {
    users: "Usuarios",
    branches: "Sucursales",
    products: "Productos",
    clients: "Clientes",
    items: "Items",
  }

  const getPrice = (plan: PlanWithFeatures) => {
    return billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly
  }

  const getSavings = (plan: PlanWithFeatures) => {
    if (!plan.priceYearly) return null
    const monthlyTotal = plan.priceMonthly * 12
    const yearlyTotal = plan.priceYearly
    const savings = monthlyTotal - yearlyTotal
    return savings > 0 ? savings : null
  }

  const activePlans = plans.filter((plan) => plan.modules.mode === activeModule)

  return (
    <section id="pricing" className="container mx-auto px-4 py-24 bg-slate-50 dark:bg-slate-900/20 rounded-3xl my-12">
      <div className="text-center space-y-4 mb-12">
        <h2 className=" text-3xl md:text-5xl font-bold tracking-tight">
          Precios simples y transparentes
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elige el módulo que mejor se adapte a tu negocio. Paga solo por lo que necesitas.
        </p>
      </div>

      {/* Selector de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            activeModule === "all" 
              ? "border-primary ring-1 ring-primary shadow-md bg-primary/5 dark:bg-primary/10" 
              : "hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800/10"
          }`}
          onClick={() => setActiveModule("all")}
        >
          <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
            <div className={`p-2 rounded-lg ${activeModule === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Sistema Completo</CardTitle>
              <CardDescription>Ventas + Alquileres</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            activeModule === "rentals_only" 
              ? "border-primary ring-1 ring-primary shadow-md bg-primary/5 dark:bg-primary/10" 
              : "hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
          onClick={() => setActiveModule("rentals_only")}
        >
          <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
            <div className={`p-2 rounded-lg ${activeModule === "rentals_only" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Solo Alquileres</CardTitle>
              <CardDescription>Gestión de reservas</CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card 
          className={`cursor-pointer transition-all duration-200 ${
            activeModule === "sales_only" 
              ? "border-primary ring-1 ring-primary shadow-md bg-primary/5 dark:bg-primary/10" 
              : "hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
          onClick={() => setActiveModule("sales_only")}
        >
          <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
            <div className={`p-2 rounded-lg ${activeModule === "sales_only" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Store className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Solo Ventas</CardTitle>
              <CardDescription>Punto de venta (POS)</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="flex justify-center mb-12">
        <Tabs
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
          className="w-full max-w-md"
        >
          <TabsList className="grid w-full grid-cols-2 h-14">
            <TabsTrigger value="monthly" className="text-base">Mensual</TabsTrigger>
            <TabsTrigger value="yearly" className="text-base">
              Anual
              <Badge
                variant="outline"
                className="ml-2 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
              >
                Ahorra 20%
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {activePlans.map((plan) => {
              const isPopular = plan.name === "Pro"
              const price = getPrice(plan)
              const savings = getSavings(plan)

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-300 hover:shadow-xl ${
                    isPopular ? "border-2 border-primary shadow-lg sticky scale-105 z-10" : ""
                  }`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 text-xs uppercase tracking-wider font-semibold">
                      Más Popular
                    </Badge>
                  )}

                  <CardHeader className=" pt-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2 h-12 text-sm">{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1 space-y-3">
                    <div className="text-center">
                      <p className="text-4xl font-extrabold tracking-tight">
                        {formatCurrency(price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{billingCycle === "monthly" ? "mes" : "año"}
                        </span>
                      </p>
                      <div className="h-5 mt-1">
                        {savings && billingCycle === "yearly" && (
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">
                            Ahorras {formatCurrency(savings)} al año
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Características
                      </p>
                      {Object.entries(plan.features).map(([key, enabled]) => (
                        <div key={key} className="flex items-center gap-2 text-sm">
                          {enabled ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className={enabled ? "font-medium" : "text-muted-foreground"}>
                            {featureLabels[key]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Límites
                      </p>
                      {Object.entries(plan.limits).map(([key, limit]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {limitLabels[key]}
                          </span>
                          <span className="font-semibold">{formatLimit(limit)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 pb-6">
                    <Button
                      className="w-full text-sm font-semibold"
                      variant={isPopular ? "default" : "secondary"}
                    >
                      Elegir este plan
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}


