"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Clock,
  CookingPot,
  Flame,
  Leaf,
  Moon,
  ShoppingBasket,
  Sun,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { KitchenIllustration } from "../decor/kitchen-illustration";
import {
  BASKET_ITEMS,
  hotspotNames,
  mealForTime,
  secretOrder,
  spiceOfTheDay,
  type HotspotId,
  type SecretId,
} from "./kitchen-secrets";
import type { KitchenSceneApi } from "./kitchen-scene";

const Kitchen3D = dynamic(() => import("./kitchen-3d"), { ssr: false });

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const COARSE_POINTER = "(pointer: coarse)";

let webglSupport: boolean | undefined;
function supportsWebGL(): boolean {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas");
      webglSupport = Boolean(
        canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
      );
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}

function subscribe(onChange: () => void) {
  const queries = [REDUCED_MOTION, COARSE_POINTER].map((q) =>
    window.matchMedia(q),
  );
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () =>
    queries.forEach((query) => query.removeEventListener("change", onChange));
}

/** "3d" | "3d-touch" | "svg" — decided in the browser; the server renders the SVG. */
function useKitchenMode() {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (window.matchMedia(REDUCED_MOTION).matches || !supportsWebGL())
        return "svg";
      return window.matchMedia(COARSE_POINTER).matches ? "3d-touch" : "3d";
    },
    () => "svg",
  );
}

type KitchenHeroProps = {
  onCook: () => void;
  onAddIngredients: (items: string[]) => void;
  onQuickMeal: (minutes: number) => void;
};

/**
 * Hero visual: a three.js kitchen that assembles itself, leans toward the
 * cursor and hides a "secret" in several objects. Falls back to the static
 * SVG when WebGL is missing or the visitor prefers reduced motion; the
 * secrets dock works in both modes.
 */
export function KitchenHero({
  onCook,
  onAddIngredients,
  onQuickMeal,
}: KitchenHeroProps) {
  const router = useRouter();
  const mode = useKitchenMode();
  const apiRef = useRef<Pick<KitchenSceneApi, "trigger"> | null>(null);
  const [ready, setReady] = useState(false);
  const [secret, setSecret] = useState<SecretId | null>(null);
  const [night, setNight] = useState(false);
  const show3d = mode !== "svg";

  function openSecret(id: SecretId) {
    setSecret(id);
    apiRef.current?.trigger(id);
    if (id === "window") setNight((value) => !value);
  }

  function handleHotspot(id: HotspotId) {
    if (id === "cook") onCook();
    else if (id === "book") router.push("/book");
    else if (id === "add") router.push("/book/new");
    else openSecret(id);
  }

  const icons: Record<SecretId, ReactNode> = {
    basket: <ShoppingBasket className="size-5" aria-hidden="true" />,
    spices: <Flame className="size-5" aria-hidden="true" />,
    cooker: <CookingPot className="size-5" aria-hidden="true" />,
    clock: <Clock className="size-5" aria-hidden="true" />,
    window: night ? (
      <Moon className="size-5" aria-hidden="true" />
    ) : (
      <Sun className="size-5" aria-hidden="true" />
    ),
    tulsi: <Leaf className="size-5" aria-hidden="true" />,
  };

  return (
    <div className="mx-auto w-full max-w-[460px] lg:max-w-[600px]">
      <div className="glass rounded-panel relative aspect-[600/520] w-full overflow-hidden">
        <div
          aria-hidden={show3d && ready ? true : undefined}
          className={clsx(
            "absolute inset-0 p-2 transition-opacity duration-500",
            show3d && ready && "opacity-0",
          )}
        >
          <KitchenIllustration />
        </div>
        {show3d && (
          <div
            className={clsx(
              "absolute inset-0 transition-opacity duration-500",
              ready ? "opacity-100" : "opacity-0",
            )}
          >
            <p className="sr-only">
              Interactive 3D kitchen. Use the labelled buttons to cook, open the
              recipe book or add a recipe, and the kitchen secrets below to
              explore the rest.
            </p>
            <Kitchen3D
              orbit={mode === "3d"}
              apiRef={apiRef}
              onHotspot={handleHotspot}
              onReady={() => setReady(true)}
            />
          </div>
        )}

        {secret && (
          <SecretCard
            className="absolute inset-x-3 bottom-3 z-20 max-sm:hidden"
            secret={secret}
            night={night}
            icon={icons[secret]}
            onClose={() => setSecret(null)}
            onAddIngredients={onAddIngredients}
            onQuickMeal={onQuickMeal}
            onToggleNight={() => openSecret("window")}
            onSearch={(query) =>
              router.push("/book?q=" + encodeURIComponent(query))
            }
          />
        )}
      </div>

      {/* On phones the card sits below the kitchen instead of covering it. */}
      {secret && (
        <SecretCard
          className="mt-3 sm:hidden"
          secret={secret}
          night={night}
          icon={icons[secret]}
          onClose={() => setSecret(null)}
          onAddIngredients={onAddIngredients}
          onQuickMeal={onQuickMeal}
          onToggleNight={() => openSecret("window")}
          onSearch={(query) =>
            router.push("/book?q=" + encodeURIComponent(query))
          }
        />
      )}

      <div
        role="group"
        aria-label="Kitchen secrets"
        className="glass rounded-panel mt-3 grid grid-cols-3 gap-1 p-1.5 sm:grid-cols-6"
      >
        {secretOrder.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={secret === id}
            onClick={() => openSecret(id)}
            className={clsx(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[18px] px-1 text-xs font-semibold transition-colors duration-150",
              secret === id
                ? "bg-denim text-surface"
                : "text-ink hover:bg-surface/70",
            )}
          >
            {icons[id]}
            <span>{dockLabels[id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const dockLabels: Record<SecretId, string> = {
  basket: "Basket",
  spices: "Spices",
  cooker: "Cooker",
  clock: "Clock",
  window: "Window",
  tulsi: "Tulsi",
};

type SecretCardProps = {
  className: string;
  secret: SecretId;
  night: boolean;
  icon: ReactNode;
  onClose: () => void;
  onAddIngredients: (items: string[]) => void;
  onQuickMeal: (minutes: number) => void;
  onToggleNight: () => void;
  onSearch: (query: string) => void;
};

function SecretCard({
  className,
  secret,
  night,
  icon,
  onClose,
  onAddIngredients,
  onQuickMeal,
  onToggleNight,
  onSearch,
}: SecretCardProps) {
  let title: string;
  let body: string;
  let action: { label: string; run: () => void } | null = null;

  if (secret === "basket") {
    title = "Fresh from the basket";
    body =
      "Potato, onion and tomato — the start of countless Indian dishes. Add them to your ingredients in one tap.";
    action = {
      label: "Add to my ingredients",
      run: () => onAddIngredients(BASKET_ITEMS),
    };
  } else if (secret === "spices") {
    const spice = spiceOfTheDay();
    title = "Spice of the day: " + spice.name;
    body = spice.fact;
    const query = spice.name.split(" ")[0].toLowerCase();
    action = { label: "Recipes with " + query, run: () => onSearch(query) };
  } else if (secret === "cooker") {
    title = "Seeti guide — whistle counts";
    body =
      "Roughly: 2 whistles for rice or masoor dal, 3–4 for toor dal, 5–6 for soaked rajma or chana. Let the pressure drop on its own before opening.";
  } else if (secret === "clock") {
    const meal = mealForTime();
    title = meal.title;
    body = meal.body;
    action = {
      label: meal.actionLabel,
      run: () =>
        meal.action.type === "quick"
          ? onQuickMeal(meal.action.minutes)
          : onSearch(meal.action.query),
    };
  } else if (secret === "window") {
    title = night ? "Good evening" : "Good morning";
    body = night
      ? "The kitchen has switched to warm evening light."
      : "Daylight is back in the kitchen.";
    action = {
      label: night ? "Switch to day" : "Switch to night",
      run: onToggleNight,
    };
  } else {
    title = "Tulsi (holy basil)";
    body =
      "Many Indian homes keep a tulsi plant by the window. A few leaves often go into kadha or masala chai.";
  }

  return (
    <section
      aria-live="polite"
      aria-label={hotspotNames[secret]}
      className={clsx(
        "glass-strong animate-fade-up rounded-card p-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="bg-denim text-surface grid size-10 shrink-0 place-items-center rounded-full">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg leading-snug font-semibold">
            {title}
          </p>
          <p className="text-ink-muted mt-1 text-[0.95rem]">{body}</p>
          {action && (
            <Button size="sm" className="mt-3" onClick={action.run}>
              {action.label}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-ink-muted hover:bg-surface/70 grid size-11 shrink-0 place-items-center rounded-full"
          aria-label="Close"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
