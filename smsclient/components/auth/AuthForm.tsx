"use client";

import { EmailPendingModal } from "@/components/auth/EmailPendingModal";
import {
  getLoginValidationErrors,
  mapAuthErrorToFrench,
  isEmailNotConfirmedError,
} from "@/lib/auth/authErrors";
import { getEmailRedirectTo } from "@/lib/auth/siteUrl";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateSignupEmail,
  validateSignupPassword,
} from "@/lib/auth/validation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

const inputErrorCls = `${inputCls} border-rose-300 focus:border-rose-500 focus:ring-rose-500/20`;

type Props = { mode: "login" | "signup" };

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [emailUnconfirmedOpen, setEmailUnconfirmedOpen] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendIsError, setResendIsError] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError(
        "Supabase n’est pas configuré dans ce déploiement (variables manquantes au build)."
      );
      return;
    }
    setError(null);
    setEmailError(null);
    setPasswordError(null);
    setResendMessage(null);
    setResendIsError(false);
    const trimmedEmail = email.trim();

    if (mode === "signup") {
      const pe = validateSignupPassword(password);
      const ee = validateSignupEmail(email);
      setPasswordError(pe);
      setEmailError(ee);
      if (pe || ee) {
        return;
      }
    } else {
      const { emailError: loginEmailError, passwordError: loginPasswordError } =
        getLoginValidationErrors(email, password);
      setEmailError(loginEmailError);
      setPasswordError(loginPasswordError);
      if (loginEmailError || loginPasswordError) {
        return;
      }
    }

    setPending(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: getEmailRedirectTo(),
          },
        });
        if (err) {
          setError(mapAuthErrorToFrench(err));
          return;
        }
        if (data.session) {
          router.replace("/");
          router.refresh();
        } else {
          setSignupEmailSent(true);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (err) {
          if (isEmailNotConfirmedError(err)) {
            setEmailUnconfirmedOpen(true);
            return;
          }
          setError(mapAuthErrorToFrench(err));
          return;
        }
        if (data.user && !data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          setEmailUnconfirmedOpen(true);
          return;
        }
        router.replace("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(mapAuthErrorToFrench(err));
    } finally {
      setPending(false);
    }
  }

  async function onResendConfirmation() {
    if (!isSupabaseConfigured()) {
      return;
    }
    setResendPending(true);
    setResendMessage(null);
    setResendIsError(false);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: getEmailRedirectTo() },
    });
    setResendPending(false);
    if (err) {
      setResendIsError(true);
      setResendMessage(mapAuthErrorToFrench(err));
    } else {
      setResendIsError(false);
      setResendMessage("E-mail de confirmation renvoyé. Vérifie ta boîte.");
    }
  }

  const configured = isSupabaseConfigured();
  const passwordMin = mode === "signup" ? PASSWORD_MIN_LENGTH : 6;
  const passwordMax = mode === "signup" ? PASSWORD_MAX_LENGTH : undefined;

  if (signupEmailSent && mode === "signup") {
    return (
      <div
        className="mx-auto w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
        data-cy="authForm-signupCheckEmail"
      >
        <h1 className="text-2xl font-black text-slate-900">
          Vérifie ta boîte mail
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Si cette adresse n’était pas déjà inscrite, nous t’avons envoyé un
          lien pour confirmer ton e-mail. Clique dessus pour activer ton compte,
          puis connecte-toi.
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {email.trim()}
        </p>
        <p className="mt-6 text-center text-sm text-slate-600">
          <Link href="/auth/login" className="font-bold text-blue-600">
            Aller à la connexion
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[400px] rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        {!configured && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm leading-relaxed text-amber-950">
            <strong className="block font-black">
              Configuration manquante
            </strong>
            Le site a été construit sans les clés Supabase. Ajoute les secrets{" "}
            <code className="rounded bg-amber-100/80 px-1 text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            et{" "}
            <code className="rounded bg-amber-100/80 px-1 text-xs">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            dans GitHub → Settings → Secrets → Actions, puis relance le
            déploiement. Les variables{" "}
            <code className="text-xs">NEXT_PUBLIC_*</code> sont figées au moment
            du <code className="text-xs">npm run build</code>, pas à l’ouverture
            de la page.
          </div>
        )}
        <h1 className="text-2xl font-black text-slate-900">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "login"
            ? "Connecte-toi avec ton email Supabase."
            : "Inscris-toi pour accéder au prototype."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="text-xs font-bold text-slate-600">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) {
                  setEmailError(null);
                }
              }}
              className={emailError ? inputErrorCls : inputCls}
            />
            {emailError && (
              <p className="mt-1.5 text-xs text-rose-700">{emailError}</p>
            )}
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
              minLength={passwordMin}
              maxLength={passwordMax}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) {
                  setPasswordError(null);
                }
              }}
              className={passwordError ? inputErrorCls : inputCls}
            />
            {mode === "signup" && (
              <p className="mt-1.5 text-xs text-slate-500">
                {PASSWORD_MIN_LENGTH} caractères min., au moins une lettre et un
                chiffre (max. {PASSWORD_MAX_LENGTH} caractères).
              </p>
            )}
            {passwordError && (
              <p className="mt-1.5 text-xs text-rose-700">{passwordError}</p>
            )}
          </div>

          {error && (
            <p
              className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
              data-cy="authForm-error"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !configured}
            className="w-full rounded-xl bg-gradient-to-br from-[#4a86ff] to-[#2f6fed] py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(47,111,237,0.25)] disabled:opacity-60"
            data-cy="authForm-submit"
          >
            {pending ? "…" : mode === "login" ? "Se connecter" : "S'inscrire"}
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

      <EmailPendingModal
        open={emailUnconfirmedOpen}
        onClose={() => {
          setEmailUnconfirmedOpen(false);
        }}
        email={email.trim() || null}
        onResend={onResendConfirmation}
        resendPending={resendPending}
        resendMessage={resendMessage}
        resendIsError={resendIsError}
        variant="dialog"
      />
    </>
  );
}
