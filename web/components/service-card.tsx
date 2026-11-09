"use client";

import { CalendarCheck2, Clock3, MapPin, Star } from "lucide-react";
import type { BarberService } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { formatTime, money } from "@/lib/money";
import { Button } from "@/components/ui/button";

type ServiceCardProps = {
  item: BarberService;
  onBook: (item: BarberService) => void;
};

export function ServiceCard({ item, onBook }: ServiceCardProps) {
  const { locale, t } = useI18n();
  const price = item.offer?.price ?? item.price;
  const categoryLabel = item.category === "Corte"
    ? t("categoryHaircut")
    : item.category === "Barba"
      ? t("categoryBeard")
      : t("categoryCombo");

  const availability = item.nextSlot
    ? item.nextSlot.dayOffset === 0
      ? t("todayAt", { time: formatTime(item.nextSlot, locale) })
      : t("tomorrowAt", { time: formatTime(item.nextSlot, locale) })
    : t("noSlots");

  const isAvailableToday = item.nextSlot?.dayOffset === 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa transition-colors hover:border-[var(--poste-azul)]">
      <div
        role="img"
        aria-label={`${item.service} · ${item.shopName}`}
        className="shop-image relative aspect-[4/3]"
        style={{
          backgroundImage: `linear-gradient(180deg,rgba(8,15,26,.04),rgba(8,15,26,.52)),url(https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=900&q=80)`,
        }}
      >
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-capa px-3 py-1 text-[11px] font-bold text-tinta">
            {item.badge}
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-[#0b0f17]/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
          {categoryLabel}
        </span>
        {item.offer && (
          <span className="absolute bottom-3 right-3 rounded-full bg-[var(--poste-rojo)] px-2.5 py-1 text-[10px] font-bold text-white">
            {t("demo")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 truncate text-xs font-semibold text-[var(--poste-azul)]">{item.shopName}</p>
            <h3 className="mb-0 text-base font-bold leading-tight tracking-tight">{item.service}</h3>
          </div>
          <div
            className="flex shrink-0 items-center gap-1 text-xs font-bold"
            aria-label={t("ratingAria", { rating: item.rating.toFixed(1), reviews: item.reviews })}
          >
            <Star className="h-3.5 w-3.5 fill-[var(--laton)] text-[var(--laton)]" aria-hidden="true" />
            {item.rating.toFixed(1)}
          </div>
        </div>

        <p className="line-clamp-2 mb-2 mt-1 min-h-10 text-xs leading-5 text-muted">{item.description}</p>

        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{item.neighborhood}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" aria-hidden="true" />{item.duration} min</span>
          <span>{t("reviewsSuffix", { n: item.reviews })}</span>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isAvailableToday
                ? "bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] text-[var(--ok)]"
                : "bg-canvas text-muted"
            }`}
          >
            <Clock3 className="h-3 w-3" aria-hidden="true" />
            {availability}
          </span>
          {item.weeklyBookings !== undefined && (
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[10px] font-semibold text-muted">
              <CalendarCheck2 className="h-3 w-3" aria-hidden="true" />
              {t("weeklyBookings", { n: item.weeklyBookings })}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] pt-3">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold leading-none tabular-nums">{money(price, locale)}</span>
              {item.offer && (
                <span className="text-[11px] text-muted line-through tabular-nums">{money(item.price, locale)}</span>
              )}
            </div>
            {item.offer && <div className="mt-0.5 text-[10px] font-semibold text-[var(--poste-rojo)]">{t("beforePrice")}</div>}
          </div>
          <Button
            size="sm"
            variant={item.offer ? "outline" : "default"}
            aria-label={`${item.offer ? t("viewOffer") : t("book")} · ${item.service} · ${item.shopName}`}
            onClick={() => onBook(item)}
          >
            {item.offer ? t("viewOffer") : t("book")}
          </Button>
        </div>
      </div>
    </article>
  );
}
