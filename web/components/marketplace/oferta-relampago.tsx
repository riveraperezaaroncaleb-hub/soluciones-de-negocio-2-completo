"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame, Timer } from "lucide-react";
import type { StoreOffer } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { formatCountdown, money } from "@/lib/money";
import { PosteProgreso } from "@/components/poste/poste-progreso";
import { Button } from "@/components/ui/button";

type OfertaRelampagoProps = {
  offer: StoreOffer | null;
  onBook: () => void;
};

export function OfertaRelampago({ offer, onBook }: OfertaRelampagoProps) {
  const { locale, t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const announced = useRef({ ten: false, one: false });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timing = useMemo(() => {
    if (!offer) return { totalMs: 0, leftMs: 0, leftSeconds: 0, progress: 0, ended: true };
    const start = new Date(offer.startsAt).getTime();
    const end = new Date(offer.endsAt).getTime();
    const totalMs = Math.max(1, end - start);
    const leftMs = Math.max(0, end - now);
    return {
      totalMs,
      leftMs,
      leftSeconds: Math.ceil(leftMs / 1000),
      progress: Math.min(100, Math.max(0, (leftMs / totalMs) * 100)),
      ended: leftMs <= 0,
    };
  }, [now, offer]);

  const soldOut = !offer || offer.remaining <= 0;
  const ended = !offer || timing.ended;

  useEffect(() => {
    if (!offer || timing.ended) return;
    if (!announced.current.ten && timing.leftMs <= 10 * 60 * 1000 && timing.leftMs > 60 * 1000) {
      announced.current.ten = true;
      setAnnouncement(t("offerAnnounce10"));
    }
    if (!announced.current.one && timing.leftMs <= 60 * 1000) {
      announced.current.one = true;
      setAnnouncement(t("offerAnnounce1"));
    }
  }, [offer, t, timing.ended, timing.leftMs]);

  useEffect(() => {
    if (!announcement) return;
    const timeout = window.setTimeout(() => setAnnouncement(""), 8000);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  if (!offer) return null;

  const endsAtLabel = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(offer.endsAt));

  return (
    <section
      aria-label={t("offerTitle")}
      className="overflow-hidden rounded-card border border-[color-mix(in_srgb,var(--poste-rojo)_32%,transparent)] bg-capa"
    >
      <div className="border-b border-[color-mix(in_srgb,var(--cromo)_22%,transparent)] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="mb-0 flex items-center gap-2 text-sm font-bold">
            <Flame className="h-4 w-4 text-[var(--poste-rojo)]" aria-hidden="true" />
            {t("offerTitle")}
          </h2>
          <span className="rounded-full bg-[var(--poste-azul)] px-2 py-0.5 text-[10px] font-bold text-white">
            {t("demo")}
          </span>
        </div>

        <p className="mb-1 text-sm font-bold">{offer.title}</p>
        <p className="mb-3 text-xs leading-5 text-muted">{offer.description}</p>

        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
            {ended ? t("offerEnded") : t("offerTimeLeft")}
          </span>
          <span className="text-[10px] text-muted">{t("offerEndsAt", { time: endsAtLabel })}</span>
        </div>

        <p
          role="timer"
          aria-label={`${t("offerTimeLeft")}: ${formatCountdown(timing.leftSeconds)}`}
          className={`mb-3 font-display text-[2.75rem] font-bold leading-none tabular-nums ${ended ? "text-muted" : "text-[var(--poste-rojo)]"}`}
        >
          {formatCountdown(timing.leftSeconds)}
        </p>

        <PosteProgreso
          valor={Math.round(timing.progress)}
          meta={100}
          etiqueta={t("offerTimeLeft")}
          variante="oferta"
          ariaValuetext={formatCountdown(timing.leftSeconds)}
          activo={!ended && timing.progress > 0}
          className="mb-2"
        />

        <p className={`mb-0 text-xs font-semibold ${soldOut ? "text-[var(--peligro)]" : "text-[var(--alerta)]"}`}>
          {soldOut
            ? t("offerEnded")
            : t("offerRemaining", { n: offer.remaining, total: offer.inventoryLimit })}
        </p>
        <p className="mb-0 mt-1 text-[10px] text-muted">{t("offerInventory")}</p>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <span className="font-display text-2xl font-bold tabular-nums">{money(offer.price, locale)}</span>
          <span className="text-xs text-muted line-through tabular-nums">{money(offer.anchorPrice, locale)}</span>
          <span className="text-[10px] font-semibold text-muted">{t("beforePrice")}</span>
        </div>
        <Button
          variant="outline"
          className="w-full border-[var(--poste-azul)] text-[var(--poste-azul)]"
          onClick={onBook}
          disabled={soldOut || ended}
        >
          {soldOut || ended ? t("offerEnded") : t("offerCta")}
        </Button>
        <p className="mb-0 mt-2 text-[10px] leading-4 text-muted">{t("offerDemo")}</p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
    </section>
  );
}
