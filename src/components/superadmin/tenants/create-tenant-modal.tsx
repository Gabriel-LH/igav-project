"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/button";
import { AlertCircle, CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/sheet";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import {
  checkTenantSlugAvailabilityAction,
  createTenantAction,
} from "@/src/app/(superadmin)/superadmin/actions/createTenant.action";
import { useRouter } from "next/navigation";

export function CreateTenantModal() {
  type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  const slugify = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[-\s]+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

  const suggestedSlug = useMemo(() => slugify(name), [name]);

  useEffect(() => {
    if (!open) return;

    const normalized = slugify(slug);
    if (!normalized) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkTenantSlugAvailabilityAction(normalized);
        setSlugStatus(result.available ? "available" : "taken");
      } catch {
        setSlugStatus("error");
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [slug, open]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const normalizedSlug = slugify(slug);
    const normalizedOwnerEmail = ownerEmail.trim().toLowerCase();
    if (!normalizedSlug) {
      alert("El slug es requerido.");
      setLoading(false);
      return;
    }
    if (normalizedOwnerEmail && ownerPassword.trim().length < 8) {
      alert("Si ingresas owner email, la contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const availability =
        await checkTenantSlugAvailabilityAction(normalizedSlug);
      if (!availability.available) {
        setSlugStatus("taken");
        alert("El slug ya existe. Elige otro.");
        return;
      }

      if (!formRef.current) {
        throw new Error("Form reference not found.");
      }
      const formData = new FormData(formRef.current);
      formData.set("slug", normalizedSlug);
      formData.set("ownerEmail", normalizedOwnerEmail);
      await createTenantAction(formData);
      setName("");
      setSlug("");
      setOwnerName("");
      setOwnerEmail("");
      setOwnerPassword("");
      setSlugTouched(false);
      setSlugStatus("idle");
      setOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "Error creando tenant";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear Tenant
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nuevo Tenant</SheetTitle>
          <SheetDescription>
            Crea una nueva instancia de cliente (Tenant) en el sistema.
          </SheetDescription>
        </SheetHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4 py-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Empresa</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Mi Empresa S.A."
              value={name}
              onChange={(e) => {
                const nextName = e.target.value;
                setName(nextName);
                if (!slugTouched) {
                  setSlug(slugify(nextName));
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slugSuggested">Slug sugerido</Label>
            <Input
              id="slugSuggested"
              value={suggestedSlug}
              readOnly
              placeholder="la_poderosa"
            />
            <p className="text-xs text-muted-foreground">
              Sugerencia automática desde el nombre (minúsculas + guion bajo).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug final (editable)</Label>
            <Input
              id="slug"
              name="slug"
              required
              placeholder="la_poderosa"
              value={slug}
              className={
                slugStatus === "taken" || slugStatus === "error"
                  ? "border-red-500 focus-visible:ring-red-500"
                  : slugStatus === "available"
                    ? "border-green-600 focus-visible:ring-green-600"
                    : undefined
              }
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Debe ser único. Solo letras, números y "_".
            </p>
            {slugStatus === "checking" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Validando slug...
              </p>
            )}
            {slugStatus === "available" && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Slug disponible.
              </p>
            )}
            {slugStatus === "taken" && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Slug no disponible.
              </p>
            )}
            {slugStatus === "error" && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                No se pudo validar el slug.
              </p>
            )}
          </div>
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="ownerName">Owner nombre (opcional)</Label>
            <Input
              id="ownerName"
              name="ownerName"
              placeholder="Juan Perez"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerEmail">Owner email (opcional)</Label>
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              placeholder="owner@empresa.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerPassword">Owner contraseña (opcional)</Label>
            <Input
              id="ownerPassword"
              name="ownerPassword"
              type="password"
              placeholder="Minimo 8 caracteres"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si defines email de owner, la contraseña es obligatoria. Si dejas
              vacío, el owner será el superadmin actual.
            </p>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || slugStatus === "checking" || slugStatus === "taken"}
          >
            {loading ? "Creando..." : "Crear Tenant"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
