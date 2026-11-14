"use client";

import { createContext, useContext, type ReactNode } from "react";
import { defaultSettings, type StoreSettings } from "@/lib/settings";

const SettingsContext = createContext<StoreSettings>(defaultSettings);

/** Entrega ao lado cliente as configurações que o servidor leu (os componentes de servidor usam getSettings direto). */
export function SettingsProvider({ value, children }: { value: StoreSettings; children: ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = (): StoreSettings => useContext(SettingsContext);
