"use client";

import { ArrowRight, Bell, Check, Clock3, MapPin, Scissors, Star } from "lucide-react";
import type { AvailableService } from "@/lib/availability";
import { useI18n } from "@/lib/i18n";
import type { Slot } from "@/lib/money";
import { formatTime, money } from "@/lib/money";
import { Button } from "@/components/ui/button";

type HeroTurnoProps = {
  service: AvailableService | null;
  slot: Slot | null;
  onBook: () => void;
  onMore: () => void;
  onNotify: () => void;
};

export function HeroTurno({ service, slot, onBook, onMore, onNotify }: HeroTurnoProps) {
  const { locale, t } = useI18n();
  const isTomorrow = slot?.dayOffset === 1;
  const dayLabel = isTomorrow ? t("heroTomorrow") : t("heroToday");
  const price = service ? (service.offer?.price ?? service.price) : null;

  return (
    <section className="hero-panel relative mt-4 overflow-hidden rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] sm:mt-6">
      <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_.9fr] lg:p-11">
        <div className="min-w-0">
          <div className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa/80 px-3 text-xs font-semibold">
            <Clock3 className="h-4 w-4 text-[var(--poste-azul)]" aria-hidden="true" />
            {t("heroEyebrow")}
            <span className="rounded-full bg-[var(--poste-azul)] px-2 py-0.5 text-[10px] font-bold text-white">
              {t("demo")}
            </span>
          </div>

          <h1 className="mb-3 max-w-[15ch] text-[2.75rem] font-extrabold leading-[0.98] sm:text-[3.75rem]">
            {t("heroTitle")}
          </h1>

          {slot && service ? (
            <p className="mb-4 max-w-md text-base leading-6 text-muted">
              {isTomorrow ? t("heroNoToday") : t("heroDemoNote")}
            </p>
          ) : (
            <p className="mb-4 max-w-md text-base leading-6 text-muted">{t("heroNoToday")}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="lg" onClick={onBook} disabled={!service}>
              {t("heroBookNow")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button variant="outline" size="lg" onClick={onMore}>
              {t("heroMore")}
            </Button>
          </div>

          {isTomorrow && (
            <button
              type="button"
              onClick={onNotify}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-control px-1 text-sm font-semibold text-[var(--poste-azul)] underline-offset-4 hover:underline"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {t("heroNotify")}
            </button>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-[var(--ok)]" aria-hidden="true" />
              {t("bookingNoCharge")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Scissors className="h-4 w-4 text-[var(--poste-azul)]" aria-hidden="true" />
              {t("heroLive")}
            </span>
          </div>
        </div>

        <div className="relative min-w-0">
          {slot && service ? (
            <div className="rounded-sheet border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-5 sm:p-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--poste-azul)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--ok)]" aria-hidden="true" />
                  {dayLabel}
                </span>
                <span className="rounded-full bg-canvas px-2.5 py-1 text-[10px] font-semibold text-muted">
                  {t("heroLive")}
                </span>
              </div>

              <p className="mb-1 font-display text-[3.75rem] font-bold leading-none tabular-nums">
                {formatTime(slot, locale)}
              </p>

              <p className="mb-3 text-sm font-semibold text-muted">
                {t("heroWith", { shop: service.shopName })}
              </p>

              <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {service.neighborhood}
                </span>
                <span
                  className="inline-flex items-center gap-1 font-semibold"
                  aria-label={t("ratingAria", { rating: service.rating.toFixed(1), reviews: service.reviews })}
                >
                  <Star className="h-3.5 w-3.5 fill-[var(--laton)] text-[var(--laton)]" aria-hidden="true" />
                  {service.rating.toFixed(1)} ({service.reviews})
                </span>
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] pt-3">
                <div>
                  <p className="mb-0 text-xs text-muted">{service.service}</p>
                  <p className="mb-0 text-sm font-bold">
                    {t("heroBarber", { name: service.favoriteBarber ?? "—" })}
                  </p>
                </div>
                {price !== null && (
                  <div className="text-right">
                    {service.offer && (
                      <p className="mb-0 text-[11px] text-muted line-through tabular-nums">
                        {money(service.offer.anchorPrice, locale)}
                      </p>
                    )}
                    <p className="mb-0 font-display text-2xl font-bold leading-none tabular-nums">
                      {t("heroFrom", { amount: money(price, locale) })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-sheet border border-dashed border-[color-mix(in_srgb,var(--cromo)_35%,transparent)] bg-capa p-6 text-center">
              <Clock3 className="mb-2 h-7 w-7 text-muted" aria-hidden="true" />
              <p className="mb-1 text-sm font-bold">{t("noSlots")}</p>
              <p className="mb-0 max-w-[28ch] text-xs leading-5 text-muted">{t("heroNoToday")}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
