import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-12">
      <AuthForm mode="login" />
    </div>
  );
}
