import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/features/recipe-book/components/auth-form";
import { safeNextPath } from "@/features/recipe-book/navigation";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an account — Sanixor Rasoi",
};

type PageProps = { searchParams: Promise<{ next?: string }> };

export default async function SignupPage({ searchParams }: PageProps) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentUser()) redirect(next);
  return <AuthForm mode="signup" next={next} />;
}
