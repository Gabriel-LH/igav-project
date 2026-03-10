// src/components/signup/signup_form.tsx
"use client";

import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, LoaderIcon } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LockPasswordIcon,
  Mail01Icon,
  User03Icon,
  ViewOffIcon,
  ViewIcon,
  Building03Icon,
  City03Icon,
  StoreLocation02Icon,
  SmartPhone03Icon,
  World,
  Network,
  InternetIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useMemo, useState } from "react";
// import { signUpEmail } from "@/src/lib/auth-client";
import { toast } from "sonner";
// import { useRegisterStore } from "@/src/store/login/login-store";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import {
  signInEmail,
  signUpEmail,
  sendVerificationOtp,
} from "@/src/lib/auth-client";
import { useVerifyStore } from "@/src/store/tenant/verify-email/verify-store";
import { useRegisterStore } from "@/src/store/tenant/login/login-store";
import {
  checkTenantSlugAvailabilityPublicAction,
  createTenantFromSignupAction,
  markUserEmailVerifiedAction,
} from "@/src/app/(auth)/auth/new-account/actions";
// import { useVerifyStore } from "@/src/store/verify-email/verify-store";

export function SignupForm() {
  type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registered, setRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugTouched, setSlugTouched] = useState(false);

  const [isActive, setIsActive] = useState("account");

  const router = useRouter();
  const otpEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_OTP === "true";
  const searchParams = useSearchParams();
  const selectedPlanId = searchParams.get("planId") || undefined;
  const selectedPlanName = searchParams.get("planName") || undefined;
  const selectedTrialDays = Number(searchParams.get("trialDays") || "7");

  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const registerStore = useRegisterStore();

  const emailStore = useVerifyStore();

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

  const suggestedSlug = useMemo(() => slugify(branchName), [branchName]);

  useEffect(() => {
    const normalized = slugify(slug);
    if (!normalized) {
      setSlugStatus("idle");
      return;
    }
    if (!slugTouched) return;

    setSlugStatus("checking");
    const timeoutId = setTimeout(async () => {
      try {
        const result =
          await checkTenantSlugAvailabilityPublicAction(normalized);
        setSlugStatus(result.available ? "available" : "taken");
      } catch {
        setSlugStatus("error");
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [slug, slugTouched]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(suggestedSlug || "");
      if (!suggestedSlug) setSlugStatus("idle");
    }
  }, [suggestedSlug, slugTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // evita doble click

    const normalizedSlug = slugify(slug);
    if (!normalizedSlug) {
      toast.error("El slug es requerido.");
      return;
    }

    if (!selectedPlanId) {
      toast.error("Debes seleccionar un plan para continuar.");
      return;
    }

    // Validación rápida en cliente
    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres", {
        style: { backgroundColor: "rgba(255, 0, 0, 0.2)" },
      });
      return;
    }
    if (!pattern.test(email)) {
      toast.error("Combina entre simbolos, letras y números", {
        style: { backgroundColor: "rgba(255, 0, 0, 0.2)" },
      });
      return;
    }
    if (!branchName.trim() || !city.trim() || !location.trim()) {
      toast.error("Completa los datos de la sucursal.");
      return;
    }

    setIsLoading(true);

    try {
      const availability =
        await checkTenantSlugAvailabilityPublicAction(normalizedSlug);
      if (!availability.available) {
        setSlugStatus("taken");
        toast.error("El slug ya existe. Elige otro.");
        return;
      }

      const ownerName = `${name} ${lastName}`.trim();
      const tenantName = branchName.trim() || ownerName || name.trim();

      await signUpEmail({
        name: ownerName || name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      if (!otpEnabled) {
        await markUserEmailVerifiedAction(email.toLowerCase().trim());
        await createTenantFromSignupAction({
          tenantName,
          slug: normalizedSlug,
          ownerName: ownerName || name.trim(),
          ownerEmail: email.toLowerCase().trim(),
          branchName: branchName.trim(),
          city: city.trim(),
          address: location.trim(),
          phone: phone.trim(),
          planId: selectedPlanId,
          trialDays: Number.isFinite(selectedTrialDays)
            ? selectedTrialDays
            : undefined,
        });

        const { error } = await signInEmail({
          email: email.toLowerCase().trim(),
          password,
          callbackURL: "/tenant/home",
        });
        if (error) throw error;

        router.replace("/tenant/home");
        router.refresh();
        return;
      }

      await sendVerificationOtp(email.toLowerCase().trim());

      registerStore.setCredentials(email.toLowerCase().trim(), password);
      registerStore.setPendingTenant({
        tenantName,
        slug: normalizedSlug,
        ownerName: ownerName || name.trim(),
        ownerEmail: email.toLowerCase().trim(),
        branchName: branchName.trim(),
        city: city.trim(),
        address: location.trim(),
        phone: phone.trim(),
        planId: selectedPlanId,
        trialDays: Number.isFinite(selectedTrialDays)
          ? selectedTrialDays
          : undefined,
      });
      emailStore.setEmailVerify(email.toLowerCase().trim());
      setRegistered(true);
    } catch (err) {
      const error = err as Error;
      const message = error.message.includes("already exists")
        ? "Este correo ya está registrado"
        : "Error al crear la cuenta";

      toast.error(message, {
        style: { backgroundColor: "rgba(255, 0, 0, 0.2)" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (registered && email) {
      router.push("/auth/verify-email");
    }
  }, [registered, email, router]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 border rounded-lg backdrop-blur-lg py-4">
        <div className=" flex flex-col text-center mb-6">
          <span className={`text-2xl font-bold italic tracking-widest`}>
            CREA TU CUENTA
          </span>
          <span className=" text-slate-400">
            Únete para empezar a gestionar.
          </span>
          {selectedPlanId ? (
            <span className="text-sm mt-2 text-green-700">
              Plan seleccionado{selectedPlanName ? `: ${selectedPlanName}` : ""}{" "}
              — Prueba gratis de {selectedTrialDays || 7} días.
            </span>
          ) : (
            <span className="text-sm mt-2 text-red-600">
              Selecciona un plan para continuar.
            </span>
          )}
        </div>

        <div>
          <Tabs value={isActive} onValueChange={setIsActive}>
            <div className="flex w-full justify-center mb-5">
              <TabsList className="bg-accent/40">
                <TabsTrigger value="account">
                  <HugeiconsIcon icon={User03Icon} strokeWidth={2} />
                  Usted
                </TabsTrigger>
                <TabsTrigger value="bussines">
                  <HugeiconsIcon icon={Building03Icon} />
                  Sucursal
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex flex-col gap-4">
              <TabsContent className="flex flex-col gap-3" value="bussines">
                <div>
                  <FieldLabel htmlFor="branchName">
                    Nombre de la sucursal/negocio
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="branchName"
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Ingrese el nombre"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={Building03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="slug">
                    Slug sugerido (editable)
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="slug"
                      name="slug"
                      required
                      placeholder="la_poderosa"
                      value={slug}
                      className={
                        slugStatus === "taken" || slugStatus === "error"
                          ? "border-red-500 pl-10 focus-visible:ring-red-500"
                          : slugStatus === "available"
                            ? "border-green-600 pl-10 focus-visible:ring-green-600"
                            : "pl-10"
                      }
                      onChange={(e) => {
                        setSlugTouched(true);
                        setSlug(e.target.value);
                      }}
                      onBlur={() => {
                        if (slug) setSlug(slugify(slug));
                      }}
                    />
                    <HugeiconsIcon
                      icon={InternetIcon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>

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

                <div>
                  <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                  <div className="relative">
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ingrese la ciudad"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={City03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </div>

                {/* === CAMPO: CORREO ELECTRÓNICO === */}
                <div>
                  <FieldLabel htmlFor="location">Ubicación</FieldLabel>
                  <div className="relative">
                    <Input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Ingrese la ubicación"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={StoreLocation02Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="phone">Telefono</FieldLabel>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ingrese el numero de telefono"
                      required
                      className="pl-10 pr-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={SmartPhone03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent className="flex flex-col gap-3" value="account">
                <div>
                  <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ingrese su nombre"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={User03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="lastName">Apellido completo</FieldLabel>
                  <div className="relative">
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ingrese sus apellido"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={User03Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 "
                    />
                  </div>
                </div>

                {/* === CAMPO: CORREO ELECTRÓNICO === */}
                <div>
                  <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@ejemplo.com"
                      required
                      className="pl-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <FieldLabel htmlFor="confirm-password">Contraseña</FieldLabel>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="●●●●●●●●"
                      required
                      className="pl-10 pr-10 text-sm"
                    />
                    <HugeiconsIcon
                      icon={LockPasswordIcon}
                      strokeWidth={2}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3  focus:outline-none"
                    >
                      {showPassword ? (
                        <HugeiconsIcon
                          icon={ViewOffIcon}
                          strokeWidth={2}
                          className="h-4 w-4 "
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={ViewIcon}
                          strokeWidth={2}
                          className="h-5 w-5"
                        />
                      )}
                    </button>
                  </div>
                </div>
              </TabsContent>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoaderIcon
                      role="status"
                      aria-label="Loading"
                      // Usamos 'text-white' o el color adecuado si el botón no lo hereda
                      className="size-4 animate-spin"
                    />
                    {/* El texto va inmediatamente después del icono dentro del span */}
                    <span>Creando cuenta...</span>
                  </span>
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <FieldDescription className="text-center">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href={"/auth/login"}
                  className="text-primary hover:underline font-medium"
                >
                  Ingresar
                </Link>
              </FieldDescription>
            </div>
          </Tabs>
        </div>
      </div>
    </form>
  );
}
