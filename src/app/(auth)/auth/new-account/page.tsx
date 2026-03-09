import { SignupForm } from "@/src/components/auth/new-account/create-account-form";

export default function SignupPage() {
  return (
     <div className="flex flex-col sm:min-h-svh md:min-h-svh items-center justify-center gap-6 py-6 md:p-10">
      <div className="flex px-2 w-full max-w-sm flex-col gap-6">
        <SignupForm />
      </div>
    </div>
  )
}