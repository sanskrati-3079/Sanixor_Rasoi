"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Languages, LogOut, Menu, UserRound, X } from "lucide-react";
import { languageOptions } from "@/features/recipes/display";
import { useRecipeLanguage } from "@/features/recipes/language-context";

const links = [
  { href: "/", label: "Home" },
  { href: "/book", label: "Recipe book" },
  { href: "/book/new", label: "Add recipe" },
  { href: "/#how-it-works", label: "How it works" },
];

const linkClass =
  "inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium transition-colors duration-200 hover:bg-sky hover:text-ink";

export function HeaderNav({ username }: { username: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const open = menuPath === pathname;
  const [language] = useRecipeLanguage();
  const current = languageOptions.find((o) => o.value === language)!;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : !href.includes("#") &&
        pathname.startsWith(href) &&
        (href !== "/book" || !pathname.startsWith("/book/new"));

  const navLinks = links.map((link) => (
    <li key={link.href}>
      <Link
        href={link.href}
        aria-current={isActive(link.href) ? "page" : undefined}
        className={clsx(
          linkClass,
          isActive(link.href)
            ? "bg-sky text-ink font-semibold"
            : "text-ink-muted",
        )}
      >
        {link.label}
      </Link>
    </li>
  ));

  const account = username ? (
    <div className="flex items-center gap-1">
      <span className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold">
        <UserRound className="text-denim size-4" aria-hidden="true" />
        <span className="sr-only">Signed in as </span>@{username}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className={clsx(linkClass, "text-ink-muted")}
      >
        <LogOut className="mr-1.5 size-4" aria-hidden="true" />
        Sign out
      </button>
    </div>
  ) : (
    <Link href="/login" className={clsx(linkClass, "text-denim font-semibold")}>
      Sign in
    </Link>
  );

  const badge = (
    <span className="border-line-strong bg-surface text-ink inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold tracking-wide">
      <Languages className="size-4" aria-hidden="true" />
      <span className="sr-only">Recipe language: {current.label}</span>
      <span aria-hidden="true">{current.short}</span>
    </span>
  );

  return (
    <>
      <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
        <ul className="flex items-center gap-1">{navLinks}</ul>
        <span className="bg-line mx-1 h-6 w-px" aria-hidden="true" />
        {account}
        {badge}
      </nav>

      <div className="flex items-center gap-2 lg:hidden">
        {badge}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setMenuPath(open ? null : pathname)}
          className="border-line-strong bg-surface grid size-11 place-items-center rounded-full border"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Main"
        hidden={!open}
        className="glass-strong absolute inset-x-0 top-full border-x-0 px-4 pt-2 pb-4 lg:hidden"
      >
        <ul className="grid gap-1">{navLinks}</ul>
        <div className="border-line mt-2 border-t pt-2">{account}</div>
      </nav>
    </>
  );
}
