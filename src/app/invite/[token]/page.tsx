import { notFound, redirect } from "next/navigation";
import prisma from "@/src/lib/prisma";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import { AcceptInvitationClient } from "@/src/components/invite/AcceptInvitationClient";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
      role: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  if (!invitation) notFound();

  // Mark expired if past expiry date
  if (invitation.status === "pending" && invitation.expiresAt < new Date()) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Invitación expirada</h1>
          <p className="text-muted-foreground mt-2">
            Este enlace ya no es válido. Pide una nueva invitación.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Invitación{" "}
            {invitation.status === "accepted" ? "ya aceptada" : "revocada"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Este enlace ya no es válido.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is already logged in
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <AcceptInvitationClient
      token={token}
      tenantName={invitation.tenant.name}
      roleName={invitation.role.name}
      branchName={invitation.branch.name}
      invitedEmail={invitation.email}
      isLoggedIn={!!session?.user}
      loggedInEmail={session?.user?.email ?? undefined}
    />
  );
}
