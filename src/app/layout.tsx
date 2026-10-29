import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces, Noto_Sans_Devanagari } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { RecipeLanguageProvider } from "@/features/recipes/language-context";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sanixor Rasoi — What's in your kitchen today?",
  description:
    "Find practical Indian recipe ideas from ingredients already in your kitchen.",
  applicationName: "Sanixor Rasoi",
};

export const viewport: Viewport = {
  // Matches --color-canvas; metadata cannot read CSS variables.
  themeColor: "#f4f8fd",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={
        fraunces.variable + " " + dmSans.variable + " " + devanagari.variable
      }
    >
      <body>
        <RecipeLanguageProvider>
          {/* Soft colour blobs behind the frosted-glass surfaces. */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
          >
            <div className="bg-sky-deep absolute -top-40 -left-32 size-[38rem] rounded-full blur-3xl" />
            <div className="bg-curry/30 absolute top-1/3 -right-40 size-[34rem] rounded-full blur-3xl" />
            <div className="bg-denim/30 absolute -bottom-48 left-1/4 size-[40rem] rounded-full blur-3xl" />
            <div className="bg-oak absolute top-2/3 -left-24 size-[26rem] rounded-full blur-3xl" />
          </div>
          <a
            href="#main"
            className="bg-surface sr-only z-50 rounded-full px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
          >
            Skip to content
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </RecipeLanguageProvider>
      </body>
    </html>
  );
}
