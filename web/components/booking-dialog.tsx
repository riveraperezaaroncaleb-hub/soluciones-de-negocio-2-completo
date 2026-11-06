"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Clock3, Gift, Instagram, Minus, Plus, Scissors, Sparkles, Users, X } from "lucide-react";
import type { BarberService } from "@/lib/data";
import { formatMoney } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { handleDialogKeyboard } from "@/lib/keyboard";

type BookingDialogProps = {
  item: BarberService;
  referralCode: string;
  referralLink: string;
  couponActive: boolean;
  couponAmount: number;
  onClose: () => void;
  onShare: () => void;
  onInstagram: () => void;
  onConfirm: (booking: {
    customer: string;
    phone: string;
    date: string;
    time: string;
    addOn: boolean;
    total: number;
  }) => void;
};

const dates = Array.from({ length: 5 }, (_, i) => {
  const day = new Date();
  day.setDate(day.getDate() + i + 1);
  return day;
});
const times = ["09:30", "10:30", "11:30", "12:30", "14:00", "15:30", "17:00"];

export function BookingDialog({ item, referralCode, referralLink, couponActive, couponAmount, onClose, onShare, onInstagram, onConfirm }: BookingDialogProps) {
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(dates[0].toISOString().slice(0, 10));
  const [time, setTime] = useState(times[2]);
  const [addOn, setAddOn] = useState(false);
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const [error, setError] = useState("");
  const total = useMemo(() => item.price + (addOn ? 3 : 0), [item.price, addOn]);
  const activeReferral = referralCode.trim().toUpperCase();
  const discount = couponActive ? couponAmount : 0;

  const confirm = (event: React.FormEvent) => {
    event.preventDefault();
    if (customer.trim().length < 2 || phone.replace(/\D/g, "").length < 10) {
      setError("Ingresa tu nombre y un teléfono de 10 dígitos para confirmar.");
      return;
    }
    onConfirm({ customer: customer.trim(), phone: phone.trim(), date, time, addOn, total: Math.max(0, total - discount) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="booking-title" onKeyDown={(event) => handleDialogKeyboard(event, onClose)} className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-blue-300">Reserva segura · 2 minutos</p><h2 id="booking-title" className="mb-0 text-xl font-extrabold">Agenda tu visita</h2></div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-2 text-muted hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={confirm} className="space-y-5 p-5 sm:p-7">
          <div className="rounded-2xl border border-blue-400/25 bg-blue-500/10 p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs"><b className="inline-flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-blue-300" />Tu progreso VIP</b><span className="font-bold text-blue-300">{customer.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 ? "¡Listo para desbloquear!" : "2 de 3 pasos"}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-blue-400 transition-all ${customer.trim().length > 1 && phone.replace(/\D/g, "").length >= 10 ? "w-full" : "w-2/3"}`} /></div>
            <p className="mb-0 mt-2 text-[10px] text-gray-300">Estás a 1 paso de desbloquear tu tratamiento facial de bienvenida.</p>
          </div>

          <div className="flex gap-3 rounded-2xl bg-canvas p-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime/60 text-leaf"><Scissors className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{item.service}</div><div className="text-xs text-muted">{item.shopName} · {item.duration} min</div></div>
            <b className="text-sm">{formatMoney(item.price)}</b>
          </div>

          <section>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><CalendarDays className="h-4 w-4" /> Elige día</label>
            <div className="grid grid-cols-5 gap-2">
              {dates.map((day) => {
                const key = day.toISOString().slice(0, 10);
                const selected = date === key;
                return <button type="button" key={key} onClick={() => setDate(key)} className={`rounded-xl border p-2 text-center ${selected ? "border-leaf bg-leaf text-white" : "border-gray-200 hover:border-leaf"}`}>
                  <span className="block text-[10px] uppercase">{new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(day).replace(".", "")}</span>
                  <b className="text-base">{day.getDate()}</b>
                </button>;
              })}
            </div>
          </section>

          <section>
            <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><Clock3 className="h-4 w-4" /> Horarios disponibles</label>
            <div className="grid grid-cols-4 gap-2">
              {times.map((slot) => <button type="button" key={slot} onClick={() => setTime(slot)} className={`rounded-lg border px-2 py-2 text-xs font-semibold ${time === slot ? "border-leaf bg-green-50 text-leaf" : "border-gray-200 hover:border-leaf"}`}>{slot}</button>)}
            </div>
          </section>

          {!upsellDismissed && <section className={`rounded-2xl border p-4 transition ${addOn ? "border-emerald-400/40 bg-emerald-400/10" : "border-amber-400/30 bg-amber-400/5"}`}>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><Sparkles className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><div className="text-sm font-bold">¡Espera! Completa tu ritual premium</div><p className="mb-0 mt-1 text-xs leading-5 text-gray-300">Lavado capilar profundo + pomada de peinado por <b className="text-amber-300">{formatMoney(3)}</b> <span className="text-gray-500 line-through">{formatMoney(10)}</span>.</p></div>
              <button type="button" onClick={() => setUpsellDismissed(true)} aria-label="Descartar extra" className="rounded-lg p-1 text-muted hover:bg-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant={addOn ? "primary" : "copper"} onClick={() => setAddOn(!addOn)}>
                {addOn ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {addOn ? "Extra agregado" : "Agregar por $3"}
              </Button>
              {addOn && <Button type="button" size="sm" variant="ghost" onClick={() => setAddOn(false)}><Minus className="h-4 w-4" /> Quitar</Button>}
            </div>
          </section>}

          {couponActive && <div className="flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs leading-5 text-white"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" /><span>Cupón de bienvenida aplicado: ahorras <b className="text-amber-300">{formatMoney(discount)}</b> en tu primera reserva.</span></div>}
          {activeReferral && <div className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs leading-5"><Gift className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /><span>Link de invitación <b>{activeReferral}</b> aplicado. Si completas la cita hoy, tu amigo recibe un corte gratis de demo.</span></div>}

          <section className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Users className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><b className="block text-sm">¿Quieres este corte GRATIS?</b><p className="mb-2 mt-1 text-xs leading-5 text-gray-300">Comparte tu link único con 2 amigos. Si uno agenda hoy, tu cita actual queda 100% bonificada como recompensa demo.</p><code className="block truncate text-[10px] text-emerald-300">{referralLink}</code></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="lime" onClick={onShare}><Users className="h-4 w-4" />Compartir por WhatsApp</Button>
              <Button type="button" size="sm" variant="outline" onClick={onInstagram}><Instagram className="h-4 w-4" />Instagram Stories</Button>
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold">Tu nombre<input autoFocus required minLength={2} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Ej. Juan Pérez" autoComplete="name" className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-green-100" /></label>
            <label className="text-xs font-semibold">WhatsApp<input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="55 1234 5678" autoComplete="tel" className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-green-100" /></label>
          </div>
          {error && <p role="alert" className="mb-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-3 flex justify-between text-xs text-muted"><span>{item.service}{addOn ? " + Lavado premium" : ""}</span><span>{formatMoney(total)}</span></div>
            {discount > 0 && <div className="mb-3 flex justify-between text-xs font-semibold text-emerald-300"><span>Cupón de bienvenida</span><span>−{formatMoney(discount)}</span></div>}
            <div className="mb-4 flex justify-between text-base font-extrabold"><span>Total a pagar en barbería</span><span>{formatMoney(Math.max(0, total - discount))}</span></div>
            <Button type="submit" size="lg" variant="copper" className="w-full">Reservar cita ahora · descuento aplicado <Check className="h-4 w-4" /></Button>
            <p className="mb-0 mt-2 text-center text-[10px] text-gray-400">No se realiza ningún cobro en línea en esta demo.</p>
          </div>
        </form>
      </div>
    </div>
  );
}
