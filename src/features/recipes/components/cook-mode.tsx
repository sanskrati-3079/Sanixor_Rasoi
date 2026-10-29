"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatQuantity } from "../display";
import type { RecipeViewModel } from "../view-model";

type CookModeProps = {
  recipe: RecipeViewModel;
  onClose: () => void;
};

function formatClock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + String(s).padStart(2, "0");
}

/**
 * Full-screen, one-step-at-a-time cooking view with a per-step timer.
 * Keeps the screen awake where the browser allows it.
 */
export function CookMode({ recipe, onClose }: CookModeProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [timer, setTimer] = useState<{
    step: number;
    remaining: number;
    running: boolean;
    done?: boolean;
  } | null>(null);
  const steps = recipe.instructions;
  const finished = index >= steps.length;
  const current = steps[Math.min(index, steps.length - 1)];
  const stepTimer = timer?.step === index ? timer : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();

    let lock: WakeLockSentinel | undefined;
    navigator.wakeLock
      ?.request("screen")
      .then((sentinel) => (lock = sentinel))
      .catch(() => {});
    return () => {
      void lock?.release().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!timer?.running) return;
    const id = window.setInterval(() => {
      setTimer((t) => {
        if (!t || !t.running) return t;
        if (t.remaining <= 1) {
          return { ...t, remaining: 0, running: false, done: true };
        }
        return { ...t, remaining: t.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timer?.running]);

  const doneStep = timer?.done ? timer.step : null;
  const announcement =
    doneStep === null ? "" : "Timer done for step " + (doneStep + 1) + ".";
  useEffect(() => {
    if (doneStep !== null) navigator.vibrate?.([200, 100, 200]);
  }, [doneStep]);

  function go(next: number) {
    setIndex(Math.max(0, Math.min(steps.length, next)));
  }

  function startTimer() {
    if (stepTimer && stepTimer.remaining > 0) {
      setTimer({ ...stepTimer, running: !stepTimer.running });
    } else {
      setTimer({
        step: index,
        remaining: current.durationMinutes * 60,
        running: true,
      });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cook-mode-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLInputElement) return;
        if (event.key === "ArrowRight") go(index + 1);
        if (event.key === "ArrowLeft") go(index - 1);
      }}
      className="bg-canvas text-ink backdrop:bg-ink/60 m-0 h-dvh max-h-none w-full max-w-none p-0"
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-accent-strong text-xs font-semibold tracking-[0.12em] uppercase">
              Cook mode
            </p>
            <h2
              id="cook-mode-title"
              lang={recipe.lang}
              className="font-display truncate text-xl font-semibold"
            >
              {recipe.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="bg-surface shadow-card hover:bg-sky grid size-11 shrink-0 place-items-center rounded-full"
            aria-label="Exit cook mode"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div
          className="bg-sky mt-4 h-2 overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Recipe progress"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={Math.min(index, steps.length)}
        >
          <div
            className="bg-denim h-full rounded-full transition-[width] duration-300"
            style={{
              width: (Math.min(index, steps.length) / steps.length) * 100 + "%",
            }}
          />
        </div>

        <details className="rounded-field bg-surface shadow-card mt-4 px-4 py-2">
          <summary className="min-h-11 cursor-pointer py-2.5 font-semibold">
            Ingredients ({recipe.ingredients.length})
          </summary>
          <ul
            className="grid gap-1 pb-3 text-sm sm:grid-cols-2"
            lang={recipe.lang}
          >
            {recipe.ingredients.map((item, i) => (
              <li key={item.name + i}>
                <span className="font-semibold tabular-nums">
                  {item.quantity !== null && formatQuantity(item.quantity)}{" "}
                  {item.unit}
                </span>{" "}
                {item.name}
              </li>
            ))}
          </ul>
        </details>

        <div
          className="flex flex-1 flex-col justify-center py-8"
          aria-live="polite"
        >
          {finished ? (
            <div className="text-center">
              <p className="text-6xl" aria-hidden="true">
                🍽️
              </p>
              <p className="font-display mt-4 text-4xl font-semibold">
                Khana taiyaar hai!
              </p>
              <p className="text-ink-muted mt-2 text-lg">
                Your food is ready. Enjoy your meal.
              </p>
            </div>
          ) : (
            <>
              <p className="font-display text-accent-strong text-lg font-semibold">
                Step {index + 1} of {steps.length}
              </p>
              <p
                lang={recipe.lang}
                className="font-display mt-3 text-[1.75rem] leading-snug sm:text-[2.25rem]"
              >
                {current.text}
              </p>

              {current.durationMinutes > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="bg-surface font-display shadow-card inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-2xl font-semibold tabular-nums">
                    <Timer className="text-denim size-5" aria-hidden="true" />
                    {formatClock(
                      stepTimer
                        ? stepTimer.remaining
                        : current.durationMinutes * 60,
                    )}
                  </span>
                  <Button variant="secondary" onClick={startTimer}>
                    {stepTimer?.running ? (
                      <>
                        <Pause className="size-4" aria-hidden="true" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-4" aria-hidden="true" />
                        {stepTimer && stepTimer.remaining > 0
                          ? "Resume"
                          : "Start timer"}
                      </>
                    )}
                  </Button>
                  {stepTimer && (
                    <Button variant="ghost" onClick={() => setTimer(null)}>
                      <RotateCcw className="size-4" aria-hidden="true" /> Reset
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
          <p className="sr-only" role="status">
            {announcement}
          </p>
          {announcement && (
            <p aria-hidden="true" className="text-success mt-4 font-semibold">
              ⏰ {announcement}
            </p>
          )}
        </div>

        <div className="border-line flex items-center justify-between gap-3 border-t pt-4 pb-2">
          <Button
            variant="secondary"
            onClick={() => go(index - 1)}
            disabled={index === 0}
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back
          </Button>
          {finished ? (
            <Button onClick={() => dialogRef.current?.close()}>Finish</Button>
          ) : (
            <Button onClick={() => go(index + 1)}>
              {index === steps.length - 1 ? "Done" : "Next step"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
