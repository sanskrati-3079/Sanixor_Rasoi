"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CredentialsSchema } from "../schemas";

type AuthFormProps = {
  mode: "login" | "signup";
  next: string;
};

const fieldClass =
  "min-h-12 w-full rounded-field border-2 border-line-strong bg-surface px-4 text-base focus:border-accent-strong focus:outline-none";

export function AuthForm({ mode, next }: AuthFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSignup) {
      const check = CredentialsSchema.safeParse({ username, password });
      if (!check.success) {
        setError(check.error.issues[0]?.message ?? "Check the form.");
        return;
      }
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/" + mode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).catch(() => null);
    if (response?.ok) {
      router.push(next);
      router.refresh();
      return;
    }
    const payload = (await response?.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    setBusy(false);
    setError(
      payload?.error?.message ??
        "We couldn't reach the server. Check your connection and try again.",
    );
  }

  const switchHref =
    (isSignup ? "/login" : "/signup") + "?next=" + encodeURIComponent(next);

  return (
    <main id="main" className="mx-auto max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-panel glass-strong p-6 sm:p-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-ink-muted mt-2">
          {isSignup
            ? "Share your recipes and save AI ideas to the recipe book."
            : "Sign in to add and manage your recipes."}
        </p>

        <form onSubmit={submit} noValidate className="mt-6 grid gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-semibold"
            >
              Username
            </label>
            <input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={24}
              aria-describedby={isSignup ? "username-help" : undefined}
              className={fieldClass}
            />
            {isSignup && (
              <p id="username-help" className="text-ink-muted mt-1 text-sm">
                3–24 letters, numbers or underscores. Shown on your recipes.
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={128}
              aria-describedby={isSignup ? "password-help" : undefined}
              className={fieldClass}
            />
            {isSignup && (
              <p id="password-help" className="text-ink-muted mt-1 text-sm">
                At least 8 characters.
              </p>
            )}
          </div>

          <p
            aria-live="polite"
            className={
              error
                ? "rounded-field border-danger/30 bg-danger-soft text-danger border px-4 py-3 text-[0.95rem] font-medium"
                : "sr-only"
            }
          >
            {error}
          </p>

          <Button type="submit" size="lg" fullWidth disabled={busy}>
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="text-ink-muted mt-6 text-center text-sm">
          {isSignup ? "Already have an account? " : "New here? "}
          <Link
            href={switchHref}
            className="text-accent-strong font-semibold underline-offset-4 hover:underline"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}
