// components/tenant-config/cash-config-form.tsx
"use client";

import { useState } from "react";
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
import { HelpCircle, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { CashierIcon, Money01Icon } from "@hugeicons/core-free-icons";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

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
  const [formData, setFormData] = useState<Partial<PaymentMethod>>(
    method || {
      name: "",
      type: "digital",
      active: true,
      allowsChange: false,
      requiresPin: false,
    }
  );

  const handleSubmit = () => {
    if (!formData.name) return;

    const newMethod: PaymentMethod = {
      id: method?.id || crypto.randomUUID(),
      name: formData.name,
      type: formData.type as any || "digital",
      active: formData.active ?? true,
      allowsChange: formData.allowsChange ?? false,
      requiresPin: formData.requiresPin ?? false,
      icon: getIconForType(formData.type as string),
    };

    onSave(newMethod);
    onOpenChange(false);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "cash": return "💰";
      case "digital": return "📱";
      case "card": return "💳";
      case "transfer": return "🏦";
      default: return "💵";
    }
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">💵 Efectivo</SelectItem>
                <SelectItem value="digital">📱 Digital (Yape, Plin)</SelectItem>
                <SelectItem value="card">💳 Tarjeta</SelectItem>
                <SelectItem value="transfer">🏦 Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium">Activo</p>
              <p className="text-sm text-muted-foreground">
                El método estará disponible en caja
              </p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          {formData.type === "cash" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Permite cambio</p>
                <p className="text-sm text-muted-foreground">
                  Se puede dar vuelto en efectivo
                </p>
              </div>
              <Switch
                checked={formData.allowsChange}
                onCheckedChange={(checked) => setFormData({ ...formData, allowsChange: checked })}
              />
            </div>
          )}

          {(formData.type === "card" || formData.type === "digital") && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Requerir PIN</p>
                <p className="text-sm text-muted-foreground">
                  Solicitar autorización para este método
                </p>
              </div>
              <Switch
                checked={formData.requiresPin}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresPin: checked })}
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
}: {
  methods: PaymentMethod[];
  onToggleActive: (id: string, active: boolean) => void;
  onEdit: (method: PaymentMethod) => void;
  onDelete: (id: string) => void;
}) {
  const getTypeBadge = (type: string) => {
    const variants = {
      cash: { label: "Efectivo", icon: "💰", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
      digital: { label: "Digital", icon: "📱", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      card: { label: "Tarjeta", icon: "💳", className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
      transfer: { label: "Transferencia", icon: "🏦", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
    };
    const info = variants[type as keyof typeof variants] || variants.digital;
    return (
      <Badge variant="outline" className={info.className}>
        {info.icon} {info.label}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Método</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Permite cambio</TableHead>
            <TableHead>Requiere PIN</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {methods.map((method) => (
            <TableRow key={method.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{method.icon}</span>
                  {method.name}
                </div>
              </TableCell>
              <TableCell>{getTypeBadge(method.type)}</TableCell>
              <TableCell>
                <Switch
                  checked={method.active}
                  onCheckedChange={(checked) => onToggleActive(method.id, checked)}
                />
              </TableCell>
              <TableCell>
                {method.allowsChange ? (
                  <Badge variant="default" className="bg-green-500">Sí</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </TableCell>
              <TableCell>
                {method.requiresPin ? (
                  <Badge variant="default" className="bg-amber-500">PIN</Badge>
                ) : (
                  <Badge variant="secondary">-</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(method)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(method.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {methods.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(
    config.cash.paymentMethods
  );
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);

  const form = useForm<CashFormValues>({
    resolver: zodResolver(cashFormSchema),
    defaultValues: {
      openingCashRequired: config.cash.openingCashRequired,
      requireClosingReport: config.cash.requireClosingReport,
      allowNegativeCash: config.cash.allowNegativeCash,
    },
  });

  const handleToggleActive = (id: string, active: boolean) => {
    const updated = paymentMethods.map(m =>
      m.id === id ? { ...m, active } : m
    );
    setPaymentMethods(updated);
    onChange({ paymentMethods: updated });
  };

  const handleSaveMethod = (method: PaymentMethod) => {
    let updated;
    if (editingMethod) {
      updated = paymentMethods.map(m => m.id === method.id ? method : m);
    } else {
      updated = [...paymentMethods, method];
    }
    setPaymentMethods(updated);
    onChange({ paymentMethods: updated });
    setEditingMethod(null);
  };

  const handleDeleteMethod = (id: string) => {
    const updated = paymentMethods.filter(m => m.id !== id);
    setPaymentMethods(updated);
    onChange({ paymentMethods: updated });
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowModal(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={CashierIcon} />
              <CardTitle>Configuración de Caja</CardTitle>
            </div>
          </div>
          <CardDescription>
            Administra los métodos de pago y configuración de caja
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Métodos de pago */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <span>💳</span>
                Métodos de pago
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Métodos disponibles para cobros en caja</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <Button onClick={() => {
                setEditingMethod(null);
                setShowModal(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar método
              </Button>
            </div>

            <PaymentMethodsTable
              methods={paymentMethods}
              onToggleActive={handleToggleActive}
              onEdit={handleEditMethod}
              onDelete={handleDeleteMethod}
            />
          </div>

          <Separator />

          {/* Configuración general de caja */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <HugeiconsIcon icon={Money01Icon} />
              Configuración general
            </h3>

            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="openingCashRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requerir apertura de caja</FormLabel>
                        <FormDescription>
                          Obligar a registrar monto inicial al abrir caja
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            onChange({ openingCashRequired: checked });
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Requerir cierre de caja</FormLabel>
                        <FormDescription>
                          Obligar a generar reporte al cerrar caja
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            onChange({ requireClosingReport: checked });
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Permitir caja negativa</FormLabel>
                        <FormDescription>
                          Permitir que el saldo de caja sea negativo
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            onChange({ allowNegativeCash: checked });
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <Separator />

          {/* Resumen */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Métodos activos</p>
                <p className="text-2xl font-bold">
                  {paymentMethods.filter(m => m.active).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Requieren PIN</p>
                <p className="text-2xl font-bold">
                  {paymentMethods.filter(m => m.requiresPin).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Permiten cambio</p>
                <p className="text-2xl font-bold">
                  {paymentMethods.filter(m => m.allowsChange).length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaymentMethodModal
        open={showModal}
        onOpenChange={setShowModal}
        method={editingMethod}
        onSave={handleSaveMethod}
      />
    </>
  );
}