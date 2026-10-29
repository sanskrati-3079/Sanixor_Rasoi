import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return (
    <footer className="glass-strong mt-24 border-x-0 border-b-0">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.4fr] md:items-start lg:px-8">
        <div className="flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="font-display text-lg font-semibold">Sanixor Rasoi</p>
            <p className="text-ink-muted text-sm">
              Ghar ka khana, from whatever you have.
            </p>
          </div>
        </div>
        <div className="text-ink-muted space-y-3 text-sm md:text-right">
          <p>
            Recipes are AI-generated or shared by home cooks — please check for
            allergies, cross-contamination and food safety.
          </p>
          <p>© Sanixor AI</p>
        </div>
      </div>
    </footer>
  );
}
