// src/components/tenant/settings/tenant-profile-card.tsx
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateTenantProfileAction } from "@/src/app/(tenant)/tenant/actions/tenant-profile.actions";
import Image from "next/image";

type TenantProfile = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
};

interface TenantProfileCardProps {
  tenant: TenantProfile | null;
}

export function TenantProfileCard({ tenant }: TenantProfileCardProps) {
  const [name, setName] = useState(tenant?.name || "");
  const [logoUrl, setLogoUrl] = useState(tenant?.logoUrl || "");
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      name.trim() !== (tenant?.name || "") ||
      logoUrl.trim() !== (tenant?.logoUrl || "")
    );
  }, [name, logoUrl, tenant]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateTenantProfileAction({
        name: name.trim(),
        logoUrl: logoUrl.trim() || undefined,
      });
      toast.success("Datos del negocio actualizados");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo guardar la información");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="drop-shadow-2xl">
      <CardHeader className="mt-3">
        <CardTitle>Información del negocio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full md:grid-cols-2 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tenant-name">Nombre del negocio</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del negocio"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tenant-slug">Slug</Label>
            <Input id="tenant-slug" value={tenant?.slug || ""} disabled />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tenant-logo">Logo (URL)</Label>
          <Input
            id="tenant-logo"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        {logoUrl ? (
          <div className="rounded-md border p-3">
            <Image
              src={logoUrl}
              alt="Logo del negocio"
              width={64}
              height={64}
              className="h-16 w-16 rounded object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        ) : null}

        <div className="flex justify-end mb-3">
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
