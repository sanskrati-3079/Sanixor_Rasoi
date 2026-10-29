import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BrandMark } from "./brand-mark";
import { HeaderNav } from "./header-nav";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="glass-strong sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-2 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-full pr-2"
          aria-label="Sanixor Rasoi home"
        >
          <BrandMark className="size-9 sm:size-10" />
          <span className="font-display text-[1.15rem] leading-none font-semibold tracking-tight sm:text-xl">
            Sanixor <span className="text-accent-strong">Rasoi</span>
          </span>
        </Link>
        <HeaderNav username={user?.username ?? null} />
      </div>
    </header>
  );
}
