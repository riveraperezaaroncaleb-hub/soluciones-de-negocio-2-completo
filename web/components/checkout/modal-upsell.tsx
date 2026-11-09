"use client";

import { useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { handleDialogKeyboard } from "@/lib/keyboard";

export type AddOnSelection = { wash: boolean; pomade: boolean };

export const ADD_ON_PRICE = { wash: 4, pomade: 6 };

type ModalUpsellProps = {
  onAdd: (selection: AddOnSelection) => void;
  onSkip: () => void;
};

export function ModalUpsell({ onAdd, onSkip }: ModalUpsellProps) {
  const { locale, t } = useI18n();
  const [selection, setSelection] = useState<AddOnSelection>({ wash: false, pomade: false });

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onSkip();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upsell-title"
        onKeyDown={(event) => handleDialogKeyboard(event, onSkip)}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-sheet bg-capa p-5 shadow-modal sm:rounded-sheet sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--poste-azul)]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {t("demo")}
            </p>
            <h2 id="upsell-title" className="mb-1 text-xl font-bold">{t("upsellTitle")}</h2>
            <p className="mb-0 text-xs leading-5 text-muted">{t("upsellSubtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            aria-label={t("upsellNo")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-canvas"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] p-3 hover:border-[var(--poste-azul)]">
            <input
              type="checkbox"
              autoFocus
              checked={selection.wash}
              onChange={(event) => setSelection((current) => ({ ...current, wash: event.target.checked }))}
              className="mt-1 h-5 w-5 accent-[var(--poste-azul)]"
            />
            <span
              role="img"
              aria-label={t("upsellWash")}
              className="shop-image h-16 w-20 shrink-0 rounded-control"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=70)" }}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <b className="text-sm">{t("upsellWash")}</b>
                <b className="text-sm tabular-nums">+{money(ADD_ON_PRICE.wash, locale)}</b>
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">{t("upsellWashBenefit")}</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] p-3 hover:border-[var(--poste-azul)]">
            <input
              type="checkbox"
              checked={selection.pomade}
              onChange={(event) => setSelection((current) => ({ ...current, pomade: event.target.checked }))}
              className="mt-1 h-5 w-5 accent-[var(--poste-azul)]"
            />
            <span
              role="img"
              aria-label={t("upsellPomade")}
              className="shop-image h-16 w-20 shrink-0 rounded-control"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=300&q=70)" }}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <b className="text-sm">{t("upsellPomade")}</b>
                <b className="text-sm tabular-nums">+{money(ADD_ON_PRICE.pomade, locale)}</b>
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">{t("upsellPomadeBenefit")}</span>
            </span>
          </label>
        </div>

        <p className="mb-0 mt-3 text-[10px] leading-4 text-muted">{t("upsellNote")}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Button variant="primary" onClick={() => onAdd(selection)}>
            <Check className="h-4 w-4" aria-hidden="true" />
            {t("upsellAdd")}
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            {t("upsellNo")}
          </Button>
        </div>
      </div>
    </div>
  );
}
