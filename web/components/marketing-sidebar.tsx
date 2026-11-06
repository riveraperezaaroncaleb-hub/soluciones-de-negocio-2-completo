"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Clock3, Copy, Gift, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/data";

type MarketingSidebarProps = {
  referralLink: string;
  credits: number;
  onVIP: () => void;
  onCopy: () => void;
  onInstagram: () => void;
};

export function MarketingSidebar({ referralLink, credits, onVIP, onCopy, onInstagram }: MarketingSidebarProps) {
  const [seconds, setSeconds] = useState(9 * 60 + 59);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`Reserva tu corte con mi link. Si agendas hoy, yo gano un corte gratis: ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const hh = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-2xl bg-ink text-white shadow-soft">
        <div className="relative p-5">
          <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full bg-lime/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime text-ink"><Gift className="h-5 w-5" /></div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">Invita y gana</span>
          </div>
          <h2 className="relative mb-2 mt-4 text-xl font-extrabold leading-tight">Invita a 2 amigos.<br /><span className="text-emerald-300">Gana un corte gratis.</span></h2>
          <p className="relative mb-4 text-xs leading-5 text-gray-300">Si uno agenda hoy con tu link, simularemos tu recompensa de un corte gratis.</p>
          <div className="relative mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-400">Tu enlace personal</div>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate text-xs text-emerald-300">{referralLink}</code>
              <button onClick={copy} aria-label="Copiar link de referido" className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-white">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-2">
            <Button size="sm" variant="lime" onClick={shareWhatsApp}><MessageCircle className="h-4 w-4" /> WhatsApp</Button>
            <Button size="sm" variant="outline" onClick={onInstagram}><ArrowUpRight className="h-4 w-4" /> Instagram</Button>
          </div>
          <div className="relative mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <span className="text-gray-300">Cortes gratis demo</span>
            <b className="rounded-full bg-lime px-2.5 py-1 text-ink">{credits}</b>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-400/30 bg-[#171923] p-5 text-white">
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-300"><Sparkles className="h-4 w-4" /> Oferta relámpago</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-1 text-[10px] font-bold text-amber-300"><Clock3 className="h-3 w-3" /> {hh}:{mm}:{ss}</span>
        </div>
        <div className="mb-3 flex items-end gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/15 text-2xl">✂</div>
          <div><h3 className="mb-0.5 text-sm font-bold">Combo Premium</h3><p className="mb-0 text-[11px] text-gray-400">Corte + barba + toalla caliente</p></div>
        </div>
        <div className="mb-1 flex items-center gap-2"><b className="text-xl">{formatMoney(18)}</b><span className="text-xs text-gray-400 line-through">{formatMoney(30)}</span><span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">AHORRA 40%</span></div>
        <p className="mb-3 text-[10px] text-gray-400">Precio individual de referencia: {formatMoney(25)} · Oferta demo</p>
        <a href="#reservas" className="flex items-center justify-between rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#0b0f17] no-underline hover:bg-amber-300">Reservar combo <ArrowUpRight className="h-4 w-4" /></a>
      </section>

      <section className="rounded-2xl border border-blue-400/20 bg-[#121a27] p-5 text-white shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">♛</span>
          <span className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-bold text-blue-300">SOLO 3 CUPOS · DEMO</span>
        </div>
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Retención que sí conviene</p>
        <h3 className="mb-1 text-lg font-extrabold">VIP Club ilimitado</h3>
        <div className="mb-2 flex items-baseline gap-2"><span className="text-xl font-extrabold">{formatMoney(39)}<small className="text-xs font-medium text-gray-400"> / mes</small></span><span className="text-xs text-gray-500 line-through">{formatMoney(59)}</span></div>
        <p className="mb-4 text-xs leading-5 text-gray-300">Cortes ilimitados y horarios prioritarios los sábados. Plan demo.</p>
        <Button className="w-full" variant="primary" onClick={onVIP}>Unirme al VIP Club <ArrowUpRight className="h-4 w-4" /></Button>
        <p className="mb-0 mt-2 text-center text-[10px] text-muted">Suscripción demo · sin cobro real</p>
      </section>
    </aside>
  );
}
