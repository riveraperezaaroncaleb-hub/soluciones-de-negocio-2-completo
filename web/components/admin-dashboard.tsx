"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Filter,
  Gift,
  Moon,
  Scissors,
  Settings2,
  Sun,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Appointment, Referral } from "@/lib/data";
import { formatDate, formatMoney, revenueByMonth } from "@/lib/data";
import { Button } from "@/components/ui/button";

type AdminDashboardProps = {
  appointments: Appointment[];
  referrals: Referral[];
  config: { newCustomerCoupon: number; platformCommission: number };
  onSaveConfig: (config: { newCustomerCoupon: number; platformCommission: number }) => void;
  onExit: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

const shopOptions = ["Todas las barberías", "Casa Navaja", "Norte Studio", "Barrio Sur Barbería"];
const statusClass: Record<Referral["status"], string> = {
  Pendiente: "bg-amber-50 text-amber-700",
  Completado: "bg-blue-50 text-blue-700",
  Recompensado: "bg-green-50 text-green-700",
};

export function AdminDashboard({ appointments, referrals, config, onSaveConfig, onExit, theme, onToggleTheme }: AdminDashboardProps) {
  const [shop, setShop] = useState(shopOptions[0]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reward, setReward] = useState(String(config.newCustomerCoupon));
  const [commission, setCommission] = useState(String(config.platformCommission));
  const [saved, setSaved] = useState(false);
  const [configError, setConfigError] = useState("");

  const filteredReferrals = useMemo(() => referrals.filter((referral) => {
    const shopMatches = shop === shopOptions[0] || referral.shopName === shop;
    const fromMatches = !fromDate || referral.date >= fromDate;
    const toMatches = !toDate || referral.date <= toDate;
    return shopMatches && fromMatches && toMatches;
  }), [fromDate, referrals, shop, toDate]);

  const filteredAppointments = useMemo(() => appointments.filter((appointment) =>
    shop === shopOptions[0] || appointment.shopName === shop), [appointments, shop]);
  const rewarded = filteredReferrals.filter((referral) => referral.status === "Recompensado").length;
  const conversion = filteredReferrals.length
    ? Math.round((rewarded / filteredReferrals.length) * 100)
    : 0;
  const conversionLabel = filteredReferrals.length ? `${conversion}%` : "68%";
  const sqlRevenue = filteredAppointments.reduce((total, appointment) => total + appointment.amount, 0) + 128450;
  const totalBookings = 2860 + filteredAppointments.length;

  const metrics = [
    { title: "Reservas totales", value: totalBookings.toLocaleString("es-MX"), delta: "+12.8%", icon: CalendarDays, tone: "bg-blue-50 text-blue-700", up: true },
    { title: "Conversión de referidos", value: conversionLabel, delta: "+4.2%", icon: Gift, tone: "bg-orange-50 text-copper", up: true },
    { title: "Ingresos registrados", value: formatMoney(sqlRevenue), delta: "+18.6%", icon: CircleDollarSign, tone: "bg-green-50 text-leaf", up: true },
    { title: "Clientes activos", value: "1,284", delta: "+7.3%", icon: Users, tone: "bg-purple-50 text-purple-700", up: true },
  ];

  return (
    <div data-theme={theme} className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-[#0b0f17] text-white`}>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-7">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-black text-lime">a.</span><div><div className="text-sm font-extrabold">Agendo Pro <span className="ml-1 rounded bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-lime">Admin</span></div><div className="text-[10px] text-muted">Panel de crecimiento</div></div></div>
          <div className="flex items-center gap-2"><button onClick={onToggleTheme} aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} title="Cambiar tema" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200">{theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}</button><Button variant="outline" size="sm" onClick={onExit}>Volver a la tienda</Button><div className="hidden h-9 w-9 items-center justify-center rounded-full bg-lime/50 text-xs font-extrabold text-leaf sm:flex">AG</div></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-leaf">Jueves, 6 de noviembre de 2026</p><h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Vista general</h1><p className="mb-0 text-sm text-muted">Lo que está pasando en tu marketplace hoy.</p></div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs"><CalendarDays className="h-4 w-4 text-muted" /><span>Últimos 30 días</span><ChevronDown className="h-3.5 w-3.5 text-muted" /></div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => <article key={metric.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between"><span className="text-xs font-medium text-muted">{metric.title}</span><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}><metric.icon className="h-4 w-4" /></span></div>
            <div className="flex items-end justify-between gap-2"><strong className="text-2xl font-extrabold tracking-tight">{metric.value}</strong><span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-2 py-1 text-[10px] font-bold text-leaf"><ArrowUpRight className="h-3 w-3" />{metric.delta}</span></div>
            <p className="mb-0 mt-1 text-[10px] text-muted">vs. periodo anterior</p>
          </article>)}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(270px,.8fr)]">
          <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-2"><div><h2 className="mb-1 text-base font-extrabold">Rendimiento mensual</h2><p className="mb-0 text-xs text-muted">Ingresos y reservas de todas las barberías</p></div><button className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold">2026 <ChevronDown className="ml-2 inline h-3 w-3" /></button></div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMonth} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#eef0ec" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#748078", fontSize: 11 }} />
                  <YAxis yAxisId="money" axisLine={false} tickLine={false} tick={{ fill: "#748078", fontSize: 10 }} tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`} />
                  <YAxis yAxisId="bookings" orientation="right" hide />
                  <Tooltip formatter={(value, name) => [name === "revenue" ? formatMoney(Number(value)) : value, name === "revenue" ? "Ingresos" : "Reservas"]} contentStyle={{ borderRadius: 12, border: "1px solid #e8ebe6", fontSize: 12 }} />
                  <Bar yAxisId="money" dataKey="revenue" name="Ingresos" fill="#33533b" radius={[5, 5, 0, 0]} maxBarSize={34} />
                  <Bar yAxisId="bookings" dataKey="bookings" name="Reservas" fill="#d8ee9b" radius={[5, 5, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex items-center justify-center gap-5 text-[10px] text-muted"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-leaf" />Ingresos</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-lime" />Reservas</span></div>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="mb-5"><h2 className="mb-1 text-base font-extrabold">Embudo de referidos</h2><p className="mb-0 text-xs text-muted">De compartir a recibir recompensa</p></div>
            <div className="space-y-4">
              {[
                ["Links compartidos", 100, "2,410", "bg-ink"],
                ["Visitas a landing", 76, "1,832", "bg-leaf"],
                ["Reservas completadas", 48, "1,157", "bg-[#789451]"],
                ["Cortes recompensados", 32, "772", "bg-copper"],
              ].map(([label, percent, count, color]) => <div key={label}>
                <div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{label}</span><span className="text-muted">{count} <b className="ml-1 text-ink">{percent}%</b></span></div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div>
              </div>)}
            </div>
            <div className="mt-6 rounded-xl bg-lime/30 p-3 text-xs leading-5 text-ink"><b className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-leaf" />Buen ritmo</b><br />Los referidos convierten 2.4× más que el tráfico orgánico.</div>
          </article>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:px-5">
            <div><h2 className="mb-1 text-base font-extrabold">Seguimiento de referidos</h2><p className="mb-0 text-xs text-muted">Conversiones y recompensas generadas automáticamente</p></div>
            <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1 text-[10px] text-muted"><Filter className="h-3.5 w-3.5" />Filtros:</span>
              <select aria-label="Filtrar por barbería" value={shop} onChange={(e) => setShop(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-leaf">{shopOptions.map((option) => <option key={option}>{option}</option>)}</select>
              <input aria-label="Fecha inicial" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-[132px] rounded-lg border border-gray-200 px-2 text-[10px] outline-none focus:border-leaf" />
              <input aria-label="Fecha final" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-[132px] rounded-lg border border-gray-200 px-2 text-[10px] outline-none focus:border-leaf" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[690px] text-left text-xs">
              <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-muted"><tr><th className="px-5 py-3 font-semibold">Invitador</th><th className="px-4 py-3 font-semibold">Código</th><th className="px-4 py-3 font-semibold">Barbería</th><th className="px-4 py-3 font-semibold">Fecha</th><th className="px-4 py-3 font-semibold">Estado</th><th className="px-4 py-3 font-semibold">Recompensa</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReferrals.map((referral) => <tr key={referral.id} className="hover:bg-gray-50/70"><td className="px-5 py-3.5 font-semibold">{referral.customer}</td><td className="px-4 py-3.5 font-mono text-[10px]">{referral.code}</td><td className="px-4 py-3.5">{referral.shopName}</td><td className="px-4 py-3.5 text-muted">{formatDate(referral.date)}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass[referral.status]}`}>{referral.status}</span></td><td className="px-4 py-3.5 font-semibold">{referral.reward}</td></tr>)}
                {!filteredReferrals.length && <tr><td className="px-5 py-8 text-center text-muted" colSpan={6}>No hay referidos para estos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-5 py-3 text-[10px] text-muted">Mostrando {filteredReferrals.length} de {referrals.length} referidos · Reservas recientes: {filteredAppointments.length}</div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 text-leaf"><Scissors className="h-4 w-4" /></span><div><h2 className="mb-0 text-sm font-extrabold">Actividad reciente</h2><p className="mb-0 text-[10px] text-muted">Últimas reservas capturadas</p></div></div>
            <div className="divide-y divide-gray-100">
              {filteredAppointments.slice(0, 4).map((appointment) => <div key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0"><div className="truncate text-xs font-bold">{appointment.customer}</div><div className="truncate text-[10px] text-muted">{appointment.service} · {appointment.shopName}</div></div><div className="shrink-0 text-right"><div className="text-xs font-extrabold">{formatMoney(appointment.amount)}</div><div className="text-[10px] text-muted">{appointment.time} · {appointment.status}</div></div>
              </div>)}
            </div>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-copper"><Settings2 className="h-4 w-4" /></span><div><h2 className="mb-0 text-sm font-extrabold">Ofertas y comisiones</h2><p className="mb-0 text-[10px] text-muted">Control de campañas del marketplace</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">Cupón primera reserva (USD)<input type="number" min="0" value={reward} onChange={(e) => setReward(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-leaf" /></label>
              <label className="text-xs font-semibold">Comisión de Agendo (%)<input type="number" min="0" max="100" value={commission} onChange={(e) => setCommission(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-leaf" /></label>
            </div>
            {configError && <p role="alert" className="mb-0 mt-3 text-xs font-medium text-red-600">{configError}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="mb-0 max-w-lg text-[10px] leading-4 text-muted">Los cambios se guardan en la demo local. Antes de cobrar comisiones, configura las reglas comerciales en tu backend.</p><Button size="sm" variant="primary" onClick={() => {
              const nextDiscount = Number(reward);
              const nextCommission = Number(commission);
              if (!Number.isFinite(nextDiscount) || nextDiscount < 0 || !Number.isFinite(nextCommission) || nextCommission < 0 || nextCommission > 100) {
                setConfigError("Ingresa un descuento mayor o igual a 0 y una comisión entre 0 y 100.");
                return;
              }
              setConfigError("");
              onSaveConfig({ newCustomerCoupon: nextDiscount, platformCommission: nextCommission });
              setSaved(true);
              window.setTimeout(() => setSaved(false), 2000);
            }}>{saved ? <CheckCircle2 className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}{saved ? "Guardado" : "Guardar cambios"}</Button></div>
          </article>
        </section>
        <div className="flex items-center justify-end gap-1 text-[10px] text-muted"><ArrowDownRight className="h-3 w-3" /> Datos demo, no representan cobros procesados.</div>
      </main>
    </div>
  );
}
