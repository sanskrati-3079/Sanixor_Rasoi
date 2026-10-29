"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { RecipeLanguage } from "./schemas";

type LanguageState = [RecipeLanguage, (language: RecipeLanguage) => void];

const LanguageContext = createContext<LanguageState | null>(null);

/** Shares the chosen recipe language between the form and the header badge. */
export function RecipeLanguageProvider({ children }: { children: ReactNode }) {
  const state = useState<RecipeLanguage>("en");
  return (
    <LanguageContext.Provider value={state}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useRecipeLanguage(): LanguageState {
  const state = useContext(LanguageContext);
  if (!state) throw new Error("useRecipeLanguage needs RecipeLanguageProvider");
  return state;
}
