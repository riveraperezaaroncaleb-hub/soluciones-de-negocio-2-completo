"use client";

import { useState } from "react";
import { Check, Copy, Crown, Gift, MessageCircle } from "lucide-react";
import type { StoreOffer } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/money";
import { PosteProgreso } from "@/components/poste/poste-progreso";
import { OfertaRelampago } from "@/components/marketplace/oferta-relampago";
import { Button } from "@/components/ui/button";

type MarketingSidebarProps = {
  referralLink: string;
  credits: number;
  completedCount: number;
  savings: number;
  vipActive: boolean;
  offer: StoreOffer | null;
  onVIP: () => void;
  onCopy: () => void;
  onShare: () => void;
  onRedeem: () => void;
  onBookOffer: () => void;
};

export function MarketingSidebar({
  referralLink,
  credits,
  completedCount,
  savings,
  vipActive,
  offer,
  onVIP,
  onCopy,
  onShare,
  onRedeem,
  onBookOffer,
}: MarketingSidebarProps) {
  const { locale, t } = useI18n();
  const [copied, setCopied] = useState(false);
  const progress = Math.min(completedCount, 3);
  const complete = progress >= 3 && credits > 0;

  const copy = () => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside aria-label={t("posteTitle")} className="space-y-4 lg:sticky lg:top-[88px]">
      <OfertaRelampago offer={offer} onBook={onBookOffer} />

      <section className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="mb-0 flex items-center gap-2 text-sm font-bold">
            <Gift className="h-4 w-4 text-[var(--poste-rojo)]" aria-hidden="true" />
            {t("posteTitle")}
          </h2>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold">
            {t("posteCredits", { n: credits })}
          </span>
        </div>
        <p className="mb-3 text-xs leading-5 text-muted">{t("posteSubtitle")}</p>

        <PosteProgreso
          valor={progress}
          meta={3}
          etiqueta={t("posteAria", { n: progress, meta: 3 })}
          variante="referido"
          ariaValuetext={`${progress} / 3`}
          className="mb-2"
        />

        <p className="mb-3 text-xs font-semibold">
          {complete ? t("posteRewardReady") : `${progress} / 3`}
        </p>

        {complete && (
          <Button variant="primary" size="sm" className="mb-3 w-full" onClick={onRedeem}>
            {t("posteRedeem")}
          </Button>
        )}

        <div className="mb-3 flex items-center gap-2 rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] p-2">
          <code className="min-w-0 flex-1 truncate text-xs text-muted">{referralLink}</code>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? t("posteCopied") : t("posteCopy")}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-control hover:bg-canvas"
          >
            {copied ? <Check className="h-4 w-4 text-[var(--ok)]" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="sm" variant="outline" onClick={onShare}>
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {t("posteWhatsapp")}
          </Button>
          <Button size="sm" variant="ghost" onClick={onShare}>
            {t("posteShare")}
          </Button>
        </div>

        {progress === 0 && <p className="mb-0 mt-2 text-[10px] leading-4 text-muted">{t("posteZero")}</p>}
      </section>

      <section className="rounded-card border border-[color-mix(in_srgb,var(--laton)_45%,transparent)] bg-capa p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="mb-0 flex items-center gap-1.5 text-sm font-bold text-[var(--laton)]">
            <Crown className="h-4 w-4" aria-hidden="true" />
            {t("vipTitle")}
          </h2>
          <span className="text-[10px] font-semibold text-muted">
            {vipActive ? t("activePlan") : t("demo")}
          </span>
        </div>
        <p className="mb-2 text-xs leading-5 text-muted">{t("vipSubtitle")}</p>
        <p className="mb-1 font-display text-2xl font-bold leading-none tabular-nums">
          {savings > 0 ? t("vipSave", { amount: money(savings, locale) }) : t("vipNoSavings")}
        </p>
        <p className="mb-3 text-[10px] leading-4 text-muted">{t("vipDemo")}</p>
        <Button className="w-full" variant={vipActive ? "outline" : "copper"} onClick={onVIP}>
          {t("vipCta")}
        </Button>
      </section>
    </aside>
  );
}
