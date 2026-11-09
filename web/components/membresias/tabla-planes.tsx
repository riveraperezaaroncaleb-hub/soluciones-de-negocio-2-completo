"use client";

import { useState } from "react";
import { ArrowLeft, Check, Crown, ShieldAlert } from "lucide-react";
import type { MembershipPlanId, MembershipState } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/money";
import { annualDiscount, annualPrice, planSavings, plans } from "@/lib/membership";
import { Button } from "@/components/ui/button";
import { PreferenceControls } from "@/components/preference-controls";

type TablaPlanesProps = {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  membership: MembershipState;
  visits: number;
  savings: number;
  credits: number;
  onChoose: (plan: MembershipPlanId, annual: boolean) => void;
  onCancel: () => void;
  onPause: () => void;
  onBack: () => void;
};

export function TablaPlanes({
  theme,
  onToggleTheme,
  membership,
  visits,
  savings,
  credits,
  onChoose,
  onCancel,
  onPause,
  onBack,
}: TablaPlanesProps) {
  const { locale, t } = useI18n();
  const [annual, setAnnual] = useState(membership.annual);
  const [confirming, setConfirming] = useState(false);
  const currentPlan = plans.find((plan) => plan.id === membership.plan) ?? null;

  return (
    <>
      <a href="#membership-main" className="skip-link">{t("skipToContent")}</a>
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 pt-5 sm:px-7">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-2 rounded-control text-sm font-semibold text-[var(--poste-azul)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("adminBack")}
        </button>
        <PreferenceControls theme={theme} onToggleTheme={onToggleTheme} />
      </div>

      <main id="membership-main" className="mx-auto max-w-[1200px] px-4 py-4 sm:px-7 sm:py-5">
        <header className="mb-6 max-w-2xl">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--laton)]">{t("membershipEyebrow")}</p>
          <h1 className="mb-2 text-3xl font-extrabold sm:text-4xl">{t("membershipTitle")}</h1>
          <p className="mb-0 text-sm leading-6 text-muted">{t("membershipIntro")}</p>
        </header>

        <div className="mb-5 flex flex-col justify-between gap-3 rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4 sm:flex-row sm:items-center">
        <p className="mb-0 text-sm leading-6">
          {visits > 0
            ? t("membershipPersonal", { n: visits, amount: money(savings, locale) })
            : t("membershipIntro")}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((value) => !value)}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] px-3 text-xs font-semibold"
        >
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 rounded-full transition-colors ${annual ? "bg-[var(--poste-azul)]" : "bg-[color-mix(in_srgb,var(--cromo)_40%,transparent)]"}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left] ${annual ? "left-4" : "left-0.5"}`} />
          </span>
          {t("membershipAnnual")}
          <span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold text-[var(--ok)]">
            {t("membershipAnnualSave", { percent: annualDiscount(plans[1]) })}
          </span>
        </button>
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const highlighted = plan.id === "vip";
          const isCurrent = membership.plan === plan.id;
          return (
            <article
              key={plan.id}
              className={`flex flex-col rounded-card border bg-capa p-5 ${
                highlighted
                  ? "border-[var(--laton)] shadow-[0_0_0_1px_var(--laton)] lg:-translate-y-1"
                  : "border-[color-mix(in_srgb,var(--cromo)_25%,transparent)]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="mb-0 flex items-center gap-1.5 text-xl font-bold">
                  {highlighted && <Crown className="h-5 w-5 text-[var(--laton)]" aria-hidden="true" />}
                  {t(plan.nameKey)}
                </h2>
                {highlighted && (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--laton)_16%,transparent)] px-2.5 py-1 text-[10px] font-bold text-[var(--laton)]">
                    {t("membershipRecommended")}
                  </span>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] px-2.5 py-1 text-[10px] font-bold text-[var(--ok)]">
                    {t("activePlan")}
                  </span>
                )}
                </div>

              <p className="mb-1 font-display text-4xl font-bold leading-none tabular-nums">
                {money(plan.price, locale)}
                <span className="ml-1 font-sans text-xs font-medium text-muted">{t("membershipPerMonth")}</span>
              </p>
              {annual && (
                <p className="mb-2 text-[11px] font-semibold text-[var(--ok)]">
                  {t("membershipAnnualPrice", { amount: money(annualPrice(plan), locale) })}
                  {" · "}
                  {t("membershipAnnualSave", { percent: annualDiscount(plan) })}
                </p>
              )}

              <ul className="mb-4 mt-2 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok)]" aria-hidden="true" />
                  {t("membershipVisits", { n: plan.visits })}
                </li>
                {plan.family && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok)]" aria-hidden="true" />
                    {t("membershipFamily")}
                  </li>
                )}
                <li className="flex items-start gap-2 text-muted">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  {t("membershipVsPerVisit")}
                </li>
              </ul>

              <p className="mb-4 mt-auto text-sm font-bold text-[var(--ok)]">
                {t("membershipSavings", { amount: money(planSavings(plan), locale) })}
              </p>

              <Button
                variant={isCurrent ? "outline" : highlighted ? "primary" : "default"}
                disabled={isCurrent}
                onClick={() => onChoose(plan.id, annual)}
              >
                {isCurrent ? t("membershipCurrent") : t("membershipChoose", { plan: t(plan.nameKey) })}
              </Button>
            </article>
          );
        })}
      </div>

        {currentPlan && (
        <section className="mt-6 rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="mb-1 text-base font-bold">{t("membershipCurrent")} · {t(currentPlan.nameKey)}</h2>
              <p className="mb-0 text-xs text-muted">
                {membership.pausedUntil ? t("membershipPaused") : t("membershipDemoNote")}
              </p>
            </div>
            {!confirming && (
              <Button variant="outline" onClick={() => setConfirming(true)}>
                {t("membershipCancel")}
              </Button>
            )}
          </div>

          {confirming && (
            <div className="mt-4 rounded-card border border-[color-mix(in_srgb,var(--peligro)_35%,transparent)] bg-[color-mix(in_srgb,var(--peligro)_6%,transparent)] p-4">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold">
                <ShieldAlert className="h-4 w-4 text-[var(--peligro)]" aria-hidden="true" />
                {t("membershipCancelTitle")}
              </h3>
              <p className="mb-2 text-xs text-muted">{t("membershipCancelBody")}</p>
              <ul className="mb-4 space-y-1 text-xs">
                <li>· {t("membershipLoseVisits", { n: currentPlan.visits })}</li>
                <li>· {t("membershipLoseRewards", { n: credits })}</li>
              </ul>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="outline" onClick={() => { onPause(); setConfirming(false); }}>
                  {t("membershipPause")}
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  {t("membershipKeep")}
                </Button>
                <Button variant="primary" onClick={onCancel}>
                  {t("membershipConfirmCancel")}
                </Button>
              </div>
            </div>
          )}
        </section>
        )}

        <p className="mt-5 text-xs leading-5 text-muted">{t("membershipDemoNote")}</p>
      </main>
    </>
  );
}
