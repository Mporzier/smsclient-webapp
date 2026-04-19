import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-12">
      <AuthForm mode="signup" />
    </div>
  );
}
