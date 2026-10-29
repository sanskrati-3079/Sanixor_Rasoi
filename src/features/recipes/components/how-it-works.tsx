import { ChefHat, ShoppingBasket, SlidersHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    icon: ShoppingBasket,
    title: "Add ingredients",
    text: "Type or tap what's in your fridge and pantry — even just two or three things.",
  },
  {
    icon: SlidersHorizontal,
    title: "Pick preferences",
    text: "Choose your diet, spice level, time and language. Hindi and Hinglish work too.",
  },
  {
    icon: ChefHat,
    title: "Cook step by step",
    text: "Open a recipe, tick off ingredients and follow clear, numbered steps.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      className="scroll-mt-24"
    >
      <SectionHeading
        id="how-it-works-title"
        eyebrow="How it works"
        title="From your shelf to your plate in three steps"
        align="center"
      />
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Card className="h-full">
              <div className="flex items-center gap-3">
                <span className="bg-sky text-denim grid size-12 place-items-center rounded-full">
                  <step.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="font-display text-accent-strong text-sm font-semibold">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="font-display mt-4 text-xl font-semibold">
                {step.title}
              </h3>
              <p className="text-ink-muted mt-2">{step.text}</p>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}
