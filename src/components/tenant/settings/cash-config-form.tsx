"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CreditCardIcon,
  Money01Icon,
  Cash02Icon,
  SmartPhone01Icon,
  BankIcon,
  Money02Icon,
  MoreOrLessIcon,
  CashierIcon,
} from "@hugeicons/core-free-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";
import {
  getTenantPaymentMethodsAction,
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
} from "@/src/app/(tenant)/tenant/actions/payment-method.actions";
import { toast } from "sonner";

const cashFormSchema = z.object({
  openingCashRequired: z.boolean(),
  requireClosingReport: z.boolean(),
  allowNegativeCash: z.boolean(),
});

type CashFormValues = z.infer<typeof cashFormSchema>;

interface CashConfigFormProps {
  config: TenantConfig;
  onChange: (values: Partial<TenantConfig["cash"]>) => void;
}

const PAYMENT_METHOD_INFO = {
  cash: {
    label: "Efectivo",
    icon: Cash02Icon,
    description: "Pagos en billetes y monedas",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  digital: {
    label: "Digital",
    icon: SmartPhone01Icon,
    description: "Yape, Plin y otras billeteras",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  card: {
    label: "Tarjeta",
    icon: CreditCardIcon,
    description: "Visa, Mastercard, etc.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  transfer: {
    label: "Transferencia",
    icon: BankIcon,
    description: "Transferencias bancarias",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  check: {
    label: "Cheque",
    icon: Money02Icon,
    description: "Pagos con cheque bancario",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
  },
  other: {
    label: "Otro",
    icon: MoreOrLessIcon,
    description: "Otros medios de pago",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-900/30",
  },
} as const;

// Modal para agregar/editar método de pago
function PaymentMethodModal({
  open,
  onOpenChange,
  method,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: PaymentMethod | null;
  onSave: (method: PaymentMethod) => void;
}) {
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({});

  useEffect(() => {
    if (open) {
      setFormData(
        method || {
          name: "",
          type: "digital",
          active: true,
          allowsChange: false,
          requiresPin: false,
        },
      );
    }
  }, [open, method]);

  const handleSubmit = () => {
    if (!formData.name) return;

    const newMethod: PaymentMethod = {
      id: method?.id || "",
      name: formData.name,
      type: (formData.type as any) || "digital",
      active: formData.active ?? true,
      allowsChange: formData.allowsChange ?? false,
      requiresPin: formData.requiresPin ?? false,
    };

    onSave(newMethod);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {method ? "Editar método de pago" : "Agregar método de pago"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Ej: Yape, Visa, Efectivo..."
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {formData.type === "digital" && (
              <p className="text-[10px] text-blue-500 font-medium animate-pulse">
                Sugerencia: Yape, Plin, Luquita
              </p>
            )}
            {formData.type === "card" && (
              <p className="text-[10px] text-purple-500 font-medium animate-pulse">
                Sugerencia: Visa, Mastercard, AMEX
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={formData.type || "digital"}
              onValueChange={(value) =>
                setFormData({ ...formData, type: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_INFO).map(([type, info]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={info.icon} className="w-4 h-4" />
                      <div>
                        <p className="font-medium text-xs">{info.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">Activo</p>
              <p className="text-xs text-muted-foreground">
                El método estará disponible en caja
              </p>
            </div>
            <Switch
              checked={formData.active ?? true}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
          </div>

          {formData.type === "cash" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Permite cambio</p>
                <p className="text-xs text-muted-foreground">
                  Se puede dar vuelto en efectivo
                </p>
              </div>
              <Switch
                checked={formData.allowsChange ?? false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, allowsChange: checked })
                }
              />
            </div>
          )}

          {(formData.type === "card" || formData.type === "digital") && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Requerir PIN</p>
                <p className="text-xs text-muted-foreground">
                  Solicitar autorización para este método
                </p>
              </div>
              <Switch
                checked={formData.requiresPin ?? false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, requiresPin: checked })
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {method ? "Guardar cambios" : "Agregar método"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Tabla de métodos de pago
function PaymentMethodsTable({
  methods,
  onToggleActive,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleChange,
}: {
  methods: PaymentMethod[];
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, requiresPin: boolean) => void;
  onToggleChange: (id: string, allowsChange: boolean) => void;
}) {
  const getTypeBadge = (type: string) => {
    const info =
      PAYMENT_METHOD_INFO[type as keyof typeof PAYMENT_METHOD_INFO] ||
      PAYMENT_METHOD_INFO.other;
    return (
      <Badge
        variant="outline"
        className={`${info.bg} ${info.color} border-transparent`}
      >
        <HugeiconsIcon icon={info.icon} className="w-3.5 h-3.5 mr-1" />
        {info.label}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Método</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Vuelto</TableHead>
            <TableHead>PIN</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.map((method) => (
            <TableRow key={method.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${(PAYMENT_METHOD_INFO[method.type as keyof typeof PAYMENT_METHOD_INFO] || PAYMENT_METHOD_INFO.other).bg}`}
                  >
                    <HugeiconsIcon
                      icon={
                        (
                          PAYMENT_METHOD_INFO[
                            method.type as keyof typeof PAYMENT_METHOD_INFO
                          ] || PAYMENT_METHOD_INFO.other
                        ).icon
                      }
                      className={`w-4 h-4 ${(PAYMENT_METHOD_INFO[method.type as keyof typeof PAYMENT_METHOD_INFO] || PAYMENT_METHOD_INFO.other).color}`}
                    />
                  </div>
                  {method.name}
                </div>
              </TableCell>
              <TableCell>{getTypeBadge(method.type)}</TableCell>
              <TableCell>
                <Switch
                  checked={method.active}
                  onCheckedChange={(checked) =>
                    onToggleActive(method.id, checked)
                  }
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={method.allowsChange}
                  onCheckedChange={(checked) =>
                    onToggleChange(method.id, checked)
                  }
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={method.requiresPin}
                  onCheckedChange={(checked) => onTogglePin(method.id, checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(method)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(method.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {methods.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No hay métodos de pago configurados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function CashConfigForm({ config, onChange }: CashConfigFormProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );

  const loadMethods = useCallback(async () => {
    setIsLoadingMethods(true);
    try {
      const res = await getTenantPaymentMethodsAction();
      if (res.success && res.data) {
        setPaymentMethods(res.data);
      } else {
        toast.error(res.error || "No se pudieron cargar los métodos de pago");
      }
    } catch (error) {
      toast.error("Error al cargar métodos de pago");
      console.log("Error", error)
    } finally {
      setIsLoadingMethods(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const handleSaveMethod = async (method: PaymentMethod) => {
    const isNew = !method.id;

    try {
      if (isNew) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...data } = method;
        const res = await createPaymentMethodAction(data);
        if (res.success) {
          toast.success("Método de pago creado");
        } else {
          toast.error("Error al crear: " + res.error);
        }
      } else {
        const res = await updatePaymentMethodAction(method.id, method);
        if (res.success) {
          toast.success("Método de pago actualizado");
        } else {
          toast.error("Error al actualizar: " + res.error);
        }
      }
      loadMethods();
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este método de pago?",
      )
    )
      return;

    try {
      const res = await deletePaymentMethodAction(id);
      if (res.success) {
        toast.success("Método de pago eliminado");
        loadMethods();
      } else {
        toast.error("Error al eliminar: " + res.error);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const res = await updatePaymentMethodAction(id, { active });
      if (res.success) {
        setPaymentMethods((prev) =>
          prev.map((m) => (m.id === id ? { ...m, active } : m)),
        );
      }
    } catch (error) {
      toast.error("No se pudo cambiar el estado");
    }
  };

  const handleTogglePin = async (id: string, requiresPin: boolean) => {
    try {
      const res = await updatePaymentMethodAction(id, { requiresPin });
      if (res.success) {
        setPaymentMethods((prev) =>
          prev.map((m) => (m.id === id ? { ...m, requiresPin } : m)),
        );
      }
    } catch (error) {
      toast.error("No se pudo cambiar el PIN");
    }
  };

  const handleToggleChange = async (id: string, allowsChange: boolean) => {
    try {
      const res = await updatePaymentMethodAction(id, { allowsChange });
      if (res.success) {
        setPaymentMethods((prev) =>
          prev.map((m) => (m.id === id ? { ...m, allowsChange } : m)),
        );
      }
    } catch (error) {
      toast.error("No se pudo cambiar el permiso de cambio");
    }
  };

  const form = useForm<CashFormValues>({
    resolver: zodResolver(cashFormSchema),
    defaultValues: {
      openingCashRequired: config.cash.openingCashRequired,
      requireClosingReport: config.cash.requireClosingReport,
      allowNegativeCash: config.cash.allowNegativeCash,
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center mt-3 justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Configuración de Caja
              </CardTitle>
              <CardDescription>
                Administra los métodos de pago y políticas de flujo de caja
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingMethod(null);
                setIsModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Método
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Métodos de cobro disponibles</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      Estos métodos aparecerán como opciones al momento de
                      realizar una venta o alquiler.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {isLoadingMethods ? (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/30">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600 mb-2"></div>
                <p className="text-xs text-muted-foreground">
                  Sincronizando con base de datos...
                </p>
              </div>
            ) : (
              <PaymentMethodsTable
                methods={paymentMethods}
                onEdit={(m) => {
                  setEditingMethod(m);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteMethod}
                onToggleActive={handleToggleActive}
                onTogglePin={handleTogglePin}
                onToggleChange={handleToggleChange}
              />
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <HugeiconsIcon icon={Money01Icon} className="w-5 h-5" />
              Reglas operativas de caja
            </h3>

            <Form {...form}>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="openingCashRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel>Apertura obligatoria</FormLabel>
                        <FormDescription className="text-[10px]">
                          Reportar saldo inicial cada día
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(v) => {
                            field.onChange(v);
                            onChange({ openingCashRequired: v });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requireClosingReport"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel>Cierre detallado</FormLabel>
                        <FormDescription className="text-[10px]">
                          Exigir balance al finalizar turno
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(v) => {
                            field.onChange(v);
                            onChange({ requireClosingReport: v });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowNegativeCash"
                  render={({ field }) => (
                    <FormItem className="flex mb-3 flex-row items-center justify-between rounded-xl border p-4 bg-muted/10">
                      <div className="space-y-0.5">
                        <FormLabel>Saldo negativo</FormLabel>
                        <FormDescription className="text-[10px]">
                          Permitir egresos superiores al saldo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(v) => {
                            field.onChange(v);
                            onChange({ allowNegativeCash: v });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>

      <PaymentMethodModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveMethod}
        method={editingMethod}
      />
    </>
  );
}
