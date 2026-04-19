"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

type Props = { mode: "login" | "signup" };

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
          },
        });
        if (err) throw err;
        router.replace("/");
        router.refresh();
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.replace("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <h1 className="text-2xl font-black text-slate-900">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {mode === "login"
          ? "Connecte-toi avec ton email Supabase."
          : "Inscris-toi pour accéder au prototype."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="text-xs font-bold text-slate-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="text-xs font-bold text-slate-600"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,111,237,0.25)] disabled:opacity-60"
        >
          {pending
            ? "…"
            : mode === "login"
              ? "Se connecter"
              : "S'inscrire"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {mode === "login" ? (
          <>
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" className="font-bold text-blue-600">
              S&apos;inscrire
            </Link>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <Link href="/auth/login" className="font-bold text-blue-600">
              Se connecter
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
