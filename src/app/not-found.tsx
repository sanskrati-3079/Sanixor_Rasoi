import Link from "next/link";
import { CookingPot } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <>
      <main
        id="main"
        className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:px-8"
      >
        <h1 className="sr-only">Page not found</h1>
        <EmptyState
          illustration={
            <span className="bg-sky grid size-24 place-items-center rounded-full">
              <CookingPot className="text-accent-strong size-10" />
            </span>
          }
          title="This page wandered out of the kitchen"
          description="The link may be old or mistyped. Let's get you back to cooking."
          action={
            <Link href="/" className={buttonClasses()}>
              Back to home
            </Link>
          }
        />
      </main>
    </>
  );
}
