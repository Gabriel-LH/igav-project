// import { auth } from "@/src/lib/auth";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
import { Toaster } from "sonner";

export default async function SuperadminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
