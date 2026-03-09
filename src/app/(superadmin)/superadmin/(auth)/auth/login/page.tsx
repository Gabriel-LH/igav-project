import { LoginForm } from "@/src/components/superadmin/auth/login/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6  md:p-10">
      <div className="flex px-2 w-full max-w-sm flex-col gap-6">
        <LoginForm />
      </div>
    </div>
  );
}
