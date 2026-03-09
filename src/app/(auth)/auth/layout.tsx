// import { auth } from "@/src/lib/auth";
import { Navbar } from "@/src/components/landing/navbar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function TenantAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  //   const requestHeaders = await headers();
  //   const session = await auth.api.getSession({
  //     headers: requestHeaders,
  //   });

  //   if (session?.user) redirect('/');

  return (
    <>
      <div className="absolute w-full ">
        <Navbar />
      </div>
      <main className="min-h-screen sticky z-0 top-0  bg-cover bg-center bg-no-repeat flex items-center justify-center">
        <div className="w-full">
          {children}
          <Toaster
            position="top-left"
            toastOptions={{
              style: {
                color: "white",
                backdropFilter: "blur(20px)",
                border: "none",
              },
            }}
          />
        </div>
      </main>
    </>
  );
}
