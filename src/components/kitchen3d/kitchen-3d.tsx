"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { clsx } from "clsx";
import { BookOpen, ChefHat, Plus } from "lucide-react";
import { hotspotNames, type HotspotId } from "./kitchen-secrets";
import { createKitchenScene, type KitchenSceneApi } from "./kitchen-scene";

/** The three navigation hotspots get floating pins; the rest live in the dock. */
const pins: { id: HotspotId; label: string; icon: typeof ChefHat }[] = [
  { id: "cook", label: "Cook from your ingredients", icon: ChefHat },
  { id: "book", label: "Open the recipe book", icon: BookOpen },
  { id: "add", label: "Add your own recipe", icon: Plus },
];

type Kitchen3DProps = {
  orbit: boolean;
  apiRef: RefObject<Pick<KitchenSceneApi, "trigger"> | null>;
  onHotspot: (id: HotspotId) => void;
  onReady: () => void;
};

/** WebGL kitchen; loaded on demand so three.js stays out of the main bundle. */
export default function Kitchen3D({
  orbit,
  apiRef,
  onHotspot,
  onReady,
}: Kitchen3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pinRefs = useRef<Partial<Record<HotspotId, HTMLButtonElement | null>>>(
    {},
  );
  const callbacks = useRef({ onHotspot, onReady });
  const [hovered, setHovered] = useState<HotspotId | null>(null);
  const [assembled, setAssembled] = useState(false);

  useEffect(() => {
    callbacks.current = { onHotspot, onReady };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const kitchen = createKitchenScene({
      canvas,
      pins: pinRefs.current,
      orbit,
      onHotspot: (id) => callbacks.current.onHotspot(id),
      onHoverChange: setHovered,
      onAssembled: () => setAssembled(true),
    });
    apiRef.current = kitchen;
    callbacks.current.onReady();
    return () => {
      apiRef.current = null;
      kitchen.dispose();
    };
  }, [orbit, apiRef]);

  return (
    <div className="absolute inset-0 overflow-x-clip">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={clsx("size-full", orbit ? "touch-none" : "touch-pan-y")}
      />
      {pins.map(({ id, label, icon: Icon }) => {
        const active = hovered === id;
        return (
          // Compact 44px pins so they never cover each other as the camera
          // turns; the label shows as a tooltip on hover or focus.
          <button
            key={id}
            ref={(element) => {
              pinRefs.current[id] = element;
            }}
            type="button"
            tabIndex={assembled ? 0 : -1}
            onClick={() => onHotspot(id)}
            onPointerEnter={() => setHovered(id)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(id)}
            onBlur={() => setHovered(null)}
            style={{ opacity: 0 }}
            className={clsx(
              "absolute top-0 left-0 grid size-11 place-items-center rounded-full transition-[background-color,color,opacity] duration-300",
              active
                ? "border-denim-edge bg-denim text-surface shadow-card z-10 border-2"
                : "glass text-denim",
            )}
          >
            <span
              aria-hidden="true"
              className="border-denim/60 absolute inset-0 rounded-full border-2 motion-safe:[animation:ping_1s_cubic-bezier(0,0,0.2,1)_3]"
            />
            <Icon className="relative size-5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
            <span
              aria-hidden="true"
              className={clsx(
                "glass-ink pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full px-3 py-1.5 text-sm font-semibold whitespace-nowrap",
                active ? "block" : "hidden",
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
      <p
        aria-hidden="true"
        className="glass text-ink pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
      >
        {!assembled
          ? "Setting up your kitchen…"
          : hovered
            ? hotspotNames[hovered] + " — click to open"
            : orbit
              ? "Drag to look around · click anything that glows"
              : "Tap anything in the kitchen"}
      </p>
    </div>
  );
}
