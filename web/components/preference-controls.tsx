"use client";

import { Languages, Moon, Sun } from "lucide-react";
import type { Locale } from "@/lib/money";
import { useI18n } from "@/lib/i18n";

type PreferenceControlsProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

export function PreferenceControls({ theme, onToggleTheme }: PreferenceControlsProps) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale: Locale = locale === "es-MX" ? "en-US" : "es-MX";

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={t("preferences")}>
      <button
        type="button"
        onClick={() => setLocale(nextLocale)}
        aria-label={locale === "es-MX" ? t("switchToEnglish") : t("switchToSpanish")}
        title={locale === "es-MX" ? t("switchToEnglish") : t("switchToSpanish")}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-control border border-[color-mix(in_srgb,var(--cromo)_30%,transparent)] px-2.5 text-xs font-bold hover:bg-canvas sm:px-3"
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
        <span aria-hidden="true">{locale === "es-MX" ? "EN" : "ES"}</span>
      </button>
      <button
        type="button"
        onClick={onToggleTheme}
        aria-label={theme === "dark" ? t("themeToLight") : t("themeToDark")}
        aria-pressed={theme === "dark"}
        title={theme === "dark" ? t("themeToLight") : t("themeToDark")}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-[color-mix(in_srgb,var(--cromo)_30%,transparent)] hover:bg-canvas"
      >
        {theme === "dark"
          ? <Sun className="h-4 w-4" aria-hidden="true" />
          : <Moon className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
