"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { Check, Copy, Gift, MessageCircle, Scissors, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/data";

type MarketingSidebarProps = {
  referralLink: string;
  credits: number;
  completedCount: number;
  onVIP: () => void;
  onCopy: () => void;
  onShare: () => void;
  onInstagram: () => void;
};

export function MarketingSidebar({ referralLink, credits, completedCount, onVIP, onCopy, onShare, onInstagram }: MarketingSidebarProps) {
  const [copied, setCopied] = useState(false);
  const progress = Math.min(completedCount, 3);
  const progressLabel = `Citas de amigos completadas: ${progress} de 3`;

  const copy = () => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside aria-label="Ofertas y recompensas" className="space-y-4 lg:sticky lg:top-24">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-[var(--poste-rojo)]" /> Oferta de demostración</div>
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-[var(--poste-azul)]"><Scissors className="h-5 w-5" /></span>
            <div className="min-w-0"><h2 className="mb-0 text-sm font-bold">Combo Premium</h2><p className="mb-0 text-xs text-muted">Corte + barba + toalla caliente</p></div>
          </div>
          <div className="flex items-baseline gap-2"><b className="text-xl tabular-nums">{formatMoney(18)}</b><span className="text-xs text-muted">precio de muestra</span></div>
          <p className="mb-0 mt-1 text-[11px] text-muted">Precios y disponibilidad de ejemplo; confirma el total antes de reservar.</p>
        </div>
        <a href="#reservas" className="flex min-h-11 items-center justify-between px-4 text-sm font-bold text-[var(--poste-azul)] hover:bg-canvas">Ver servicios y horarios <span aria-hidden="true">→</span></a>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="mb-0 flex items-center gap-2 text-sm font-bold"><Gift className="h-4 w-4 text-[var(--poste-rojo)]" /> Tu poste de referidos</h2>
          <span className="rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold">{credits} créditos demo</span>
        </div>
        <p className="mb-3 text-xs leading-5 text-muted">Comparte tu enlace. El crédito se valida al completar la cita; esta demo no confirma citas reales.</p>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={3}
          aria-label={progressLabel}
          aria-valuetext={progressLabel}
          className="poste mb-2 h-3 overflow-hidden rounded-full"
          data-activo={progress > 0 && progress < 2}
          style={{ "--p": `${(progress / 3) * 100}%` } as CSSProperties & { "--p": string }}
        />
        <p className="mb-3 text-xs font-semibold">{progressLabel}</p>
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-gray-200 p-2">
          <code className="min-w-0 flex-1 truncate text-xs text-muted">{referralLink}</code>
          <button onClick={copy} aria-label={copied ? "Enlace copiado" : "Copiar enlace de referido"} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-canvas">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button size="sm" variant="primary" onClick={onShare}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
          <Button size="sm" variant="outline" onClick={onInstagram}>Compartir enlace</Button>
        </div>
      </section>

      <section className="rounded-xl border border-[color-mix(in_srgb,var(--laton)_45%,transparent)] bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="mb-0 text-sm font-bold text-[var(--laton)]">Pase VIP</h2>
          <span className="text-[11px] font-semibold text-muted">Membresía demo</span>
        </div>
        <p className="mb-2 text-xs leading-5 text-muted">Compara el costo mensual con la frecuencia de tus visitas antes de suscribirte.</p>
        <p className="mb-3 text-lg font-bold tabular-nums">{formatMoney(39)}<span className="ml-1 text-xs font-normal text-muted">/ mes · ejemplo</span></p>
        <Button className="w-full" variant="outline" onClick={onVIP}>Ver qué incluye</Button>
        <p className="mb-0 mt-2 text-[10px] text-muted">Sin cobros recurrentes en esta demo.</p>
      </section>
    </aside>
  );
}
