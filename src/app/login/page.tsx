"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Sprout, Eye, EyeOff } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!configured) {
      router.push("/");
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (authError) {
      setError("Email ou mot de passe incorrect. Vérifiez votre compte administrateur Supabase.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-800 text-white">
            <Sprout className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-green-900">
              AgriElevage Tchad Pro
            </h1>
            <p className="text-sm text-amber-800">Espace Administrateur Unique — N&apos;Djamena</p>
          </div>
        </div>

        {!configured && (
          <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Mode Aperçu Local actif</p>
            <p className="mt-1 text-amber-900">
              Les clés Supabase ne sont pas encore configurées dans{" "}
              <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>.
              Vous pouvez accéder directement à l&apos;application de démonstration.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-3 w-full rounded-xl bg-amber-800 px-4 py-3 text-sm font-bold text-white hover:bg-amber-900"
            >
              Entrer en Mode Aperçu Local
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-stone-800">
              Email administrateur
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              required={configured}
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@maferme-tchad.td"
              className="mt-1.5 min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-stone-800">
              Mot de passe
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="login-password"
                name="password"
                type={showPwd ? "text" : "password"}
                required={configured}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-h-[48px] w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-pressed={showPwd}
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100"
              >
                {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-900 disabled:opacity-60"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? "Connexion..." : "Se connecter"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
