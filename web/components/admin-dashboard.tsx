"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CircleHelp,
  Download,
  Filter,
  Gift,
  Scissors,
  Settings2,
  Target,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Appointment, Referral } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/money";
import { calculateDashboardMetrics } from "@/lib/dashboard-metrics";
import { Button } from "@/components/ui/button";
import { PreferenceControls } from "@/components/preference-controls";

type AdminDashboardProps = {
  appointments: Appointment[];
  referrals: Referral[];
  config: { newCustomerCoupon: number; platformCommission: number; acquisitionSpend: number | null };
  onSaveConfig: (config: { newCustomerCoupon: number; platformCommission: number; acquisitionSpend: number | null }) => void;
  onExit: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
};

const SHOPS = [
  { id: "casa-navaja", label: "Casa Navaja" },
  { id: "norte-studio", label: "Norte Studio" },
  { id: "barrio-sur", label: "Barrio Sur Barbería" },
];

const CHANNELS = [
  { name: "Instagram", factor: 1.25 },
  { name: "Referidos", factor: 0.4 },
  { name: "Google", factor: 0.95 },
  { name: "Walk-in", factor: 0.2 },
];

export function AdminDashboard({
  appointments,
  referrals,
  config,
  onSaveConfig,
  onExit,
  theme,
  onToggleTheme,
}: AdminDashboardProps) {
  const { locale, t } = useI18n();
  const [shopId, setShopId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reward, setReward] = useState(String(config.newCustomerCoupon));
  const [commission, setCommission] = useState(String(config.platformCommission));
  const [acquisitionSpend, setAcquisitionSpend] = useState(config.acquisitionSpend === null ? "" : String(config.acquisitionSpend));
  const [saved, setSaved] = useState(false);
  const [configError, setConfigError] = useState("");

  const [simPrice, setSimPrice] = useState(39);
  const [simReferral, setSimReferral] = useState(24);
  const [simCac, setSimCac] = useState(config.acquisitionSpend ?? 8);
  const simulation = useMemo(() => ({ price: simPrice, referral: simReferral, cac: simCac }), [simCac, simPrice, simReferral]);
  const deferred = useDeferredValue(simulation);

  const metrics = useMemo(() => calculateDashboardMetrics(appointments, referrals, {
    shopId: shopId || null,
    fromDate,
    toDate,
    acquisitionSpend: acquisitionSpend.trim() ? Number(acquisitionSpend) : null,
    locale,
  }), [acquisitionSpend, appointments, fromDate, locale, referrals, shopId, toDate]);

  const filteredAppointments = useMemo(() => appointments.filter((appointment) =>
    (!shopId || appointment.shopId === shopId)
      && (!fromDate || appointment.date >= fromDate)
      && (!toDate || appointment.date <= toDate)), [appointments, fromDate, shopId, toDate]);

  const chartData = useMemo(() => metrics.monthly.map((month) => {
    const memberRate = 0.16 + (deferred.referral / 100) * 0.55;
    const members = Math.max(1, Math.round(month.bookings * memberRate));
    return {
      month: month.month,
      bookings: month.bookings,
      revenue: month.revenue,
      mrr: members * deferred.price,
      cac: Math.max(0, deferred.cac * (1 - deferred.referral / 250)),
    };
  }), [deferred, metrics.monthly]);

  const channelData = useMemo(() => CHANNELS.map((channel) => ({
    name: channel.name,
    cac: Math.round(deferred.cac * channel.factor * 10) / 10,
  })), [deferred.cac]);

  const ltv = metrics.ltv ?? (metrics.revenue > 0 ? metrics.revenue / Math.max(1, metrics.activeCustomers) : 72);
  const ratio = deferred.cac > 0 ? ltv / deferred.cac : null;
  const monthlyMargin = deferred.price * 0.6;
  const payback = monthlyMargin > 0 ? deferred.cac / monthlyMargin : null;

  const health = ratio === null
    ? { label: t("adminHealthUnknown"), tone: "text-muted", icon: CircleHelp }
    : ratio < 1
      ? { label: t("adminHealthLoss"), tone: "text-[var(--peligro)]", icon: XCircle }
      : ratio < 3
        ? { label: t("adminHealthImprove"), tone: "text-[var(--alerta)]", icon: AlertTriangle }
        : { label: t("adminHealthHealthy"), tone: "text-[var(--ok)]", icon: CheckCircle2 };
  const HealthIcon = health.icon;

  const kpis = [
    { title: t("adminKpiBookings"), value: metrics.bookings.toLocaleString(locale), detail: `${metrics.completedBookings} · ${t("statusCompletado")}`, icon: CalendarDays },
    { title: t("adminKpiConversion"), value: metrics.referralConversion === null ? "—" : `${(metrics.referralConversion * 100).toFixed(1)}%`, detail: `${metrics.convertedReferrals} / ${metrics.referrals}`, icon: Gift },
    { title: t("adminKpiRevenue"), value: money(metrics.revenue, locale), detail: t("adminTableRevenue"), icon: CircleDollarSign },
    { title: t("adminKpiActive"), value: metrics.activeCustomers.toLocaleString(locale), detail: t("adminPeriod"), icon: Users },
    { title: t("adminKpiCac"), value: metrics.cac === null ? "—" : money(metrics.cac, locale), detail: t("adminSpend"), icon: Target },
    { title: t("adminKpiLtv"), value: metrics.ltv === null ? "—" : money(metrics.ltv, locale), detail: t("adminTableRevenue"), icon: Scissors },
  ];

  const appointmentStatus = (status: Appointment["status"]) =>
    status === "Completada"
      ? t("statusCompletado")
      : status === "Pendiente"
        ? t("statusPendiente")
        : t("statusConfirmada");

  const downloadCsv = () => {
    const rows = [
      [t("adminTableMonth"), t("adminTableBookings"), t("adminTableRevenue"), t("adminTableCac"), t("adminTableMrr")],
      ...chartData.map((row) => [
        row.month,
        String(row.bookings),
        String(row.revenue),
        row.cac.toFixed(2),
        String(row.mrr),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "agendo-unit-economics.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const funnel = [
    { label: t("adminReferralRegistered"), count: metrics.referrals, color: "bg-[var(--tinta)]" },
    { label: t("adminReferralBooked"), count: metrics.referredBookings, color: "bg-[var(--poste-azul)]" },
    { label: t("adminReferralConverted"), count: metrics.convertedReferrals, color: "bg-[var(--ok)]" },
    { label: t("adminReferralRewarded"), count: metrics.rewardedReferrals, color: "bg-[var(--laton)]" },
  ];

  return (
    <div data-theme={theme} className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-[var(--azulejo)] text-[var(--tinta)]`}>
      <a href="#dashboard-main" className="skip-link">{t("skipToContent")}</a>
      <header className="sticky top-0 z-30 border-b border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-[var(--tinta)] font-display text-xl font-bold text-[var(--azulejo)]">a.</span>
            <div>
              <div className="flex items-center gap-2 text-sm font-bold">
                {t("brand")}
                <span className="rounded bg-[var(--tinta)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--azulejo)]">{t("adminTitle")}</span>
              </div>
              <div className="text-[10px] text-muted">{t("adminSubtitle")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PreferenceControls theme={theme} onToggleTheme={onToggleTheme} />
            <Button variant="outline" size="sm" onClick={onExit}>{t("adminBack")}</Button>
          </div>
        </div>
      </header>

      <main id="dashboard-main" className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-7 sm:py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--poste-azul)]">
              {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date())}
            </p>
            <h1 className="mb-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("adminTitle")}</h1>
            <p className="mb-0 max-w-2xl text-sm text-muted">{t("adminSubtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa px-3 py-2 text-xs">
            <Filter className="h-4 w-4 text-muted" aria-hidden="true" />
            <label className="sr-only" htmlFor="dashboard-from">{t("adminFrom")}</label>
            <input id="dashboard-from" aria-label={t("adminFrom")} type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="bg-transparent outline-none" />
            <span className="text-muted">—</span>
            <label className="sr-only" htmlFor="dashboard-to">{t("adminTo")}</label>
            <input id="dashboard-to" aria-label={t("adminTo")} type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="bg-transparent outline-none" />
            <select aria-label={t("adminFilters")} value={shopId} onChange={(event) => setShopId(event.target.value)} className="max-w-[170px] bg-transparent outline-none">
              <option value="">{t("adminAllShops")}</option>
              {SHOPS.map((shop) => <option key={shop.id} value={shop.id}>{shop.label}</option>)}
            </select>
          </div>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label={t("adminTitle")}>
          {kpis.map((metric) => (
            <article key={metric.title} className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted">{metric.title}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-control bg-canvas text-[var(--poste-azul)]">
                  <metric.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <strong className="font-display text-3xl font-bold leading-none tabular-nums">{metric.value}</strong>
              <p className="mb-0 mt-1 text-[10px] text-muted">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
          <article className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="mb-1 text-base font-bold">{t("adminMrrCac")}</h2>
                <p className="mb-0 text-xs text-muted">{t("adminChartNote")}</p>
              </div>
              <Button size="sm" variant="outline" onClick={downloadCsv}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {t("adminDownload")}
              </Button>
            </div>

            <div className="h-[260px] w-full" role="img" aria-label={`${t("adminMrrCac")}. ${t("adminChartNote")}`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="var(--cromo)" strokeOpacity={0.22} strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--cromo)", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--cromo)", fontSize: 10 }} tickFormatter={(value: number) => money(value, locale)} />
                  <Tooltip
                    formatter={(value) => money(Number(value), locale)}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--cromo)", backgroundColor: "var(--capa)", color: "var(--tinta)", fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="mrr" name={t("adminTableMrr")} stroke="var(--poste-azul)" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cac" name={t("adminTableCac")} stroke="var(--poste-rojo)" strokeWidth={2.5} strokeDasharray="7 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-5 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5 bg-[var(--poste-azul)]" aria-hidden="true" />
                {t("adminTableMrr")}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-0.5 w-5 border-t-2 border-dashed border-[var(--poste-rojo)]" aria-hidden="true" />
                {t("adminTableCac")}
              </span>
            </div>

            <details className="mt-4 rounded-control border border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] p-3">
              <summary className="cursor-pointer text-xs font-semibold">{t("adminTableToggle")}</summary>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wide text-muted">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">{t("adminTableMonth")}</th>
                      <th className="py-2 pr-3 font-semibold">{t("adminTableBookings")}</th>
                      <th className="py-2 pr-3 font-semibold">{t("adminTableMrr")}</th>
                      <th className="py-2 font-semibold">{t("adminTableCac")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color-mix(in_srgb,var(--cromo)_20%,transparent)]">
                    {chartData.map((row) => (
                      <tr key={row.month}>
                        <td className="py-2 pr-3 font-semibold">{row.month}</td>
                        <td className="py-2 pr-3 tabular-nums">{row.bookings}</td>
                        <td className="py-2 pr-3 tabular-nums">{money(row.mrr, locale)}</td>
                        <td className="py-2 tabular-nums">{money(row.cac, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </article>

          <article className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-5 sm:p-6">
            <h2 className="mb-1 text-base font-bold">{t("adminHealth")}</h2>
            <p className="mb-4 text-xs text-muted">{t("adminSimNote")}</p>

            <p className={`mb-1 font-display text-5xl font-bold leading-none tabular-nums ${health.tone}`}>
              {ratio === null ? "—" : ratio.toFixed(1)}
            </p>
            <p className={`mb-3 inline-flex items-center gap-1.5 text-sm font-bold ${health.tone}`}>
              <HealthIcon className="h-4 w-4" aria-hidden="true" />
              {health.label}
            </p>

            <dl className="space-y-2 border-t border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] pt-3 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">LTV</dt>
                <dd className="mb-0 font-semibold tabular-nums">{money(ltv, locale)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">CAC</dt>
                <dd className="mb-0 font-semibold tabular-nums">{money(deferred.cac, locale)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">{t("adminPayback")}</dt>
                <dd className="mb-0 font-semibold tabular-nums">
                  {payback === null ? "—" : t("adminPaybackValue", { months: payback.toFixed(1) })}
                </dd>
              </div>
            </dl>
            <p className="mb-0 mt-3 text-[10px] leading-4 text-muted">
              {t("adminPaybackNote", { margin: money(monthlyMargin, locale) })}
            </p>
            {ratio === null && <p className="mb-0 mt-2 text-[10px] leading-4 text-muted">{t("adminHealthHint")}</p>}
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4 sm:p-6">
            <h2 className="mb-1 text-base font-bold">{t("adminCacChannel")}</h2>
            <p className="mb-4 text-xs text-muted">{t("adminSimNote")}</p>
            <div className="h-[230px] w-full" role="img" aria-label={t("adminCacChannel")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData} layout="vertical" margin={{ top: 4, right: 18, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="var(--cromo)" strokeOpacity={0.2} strokeDasharray="4 4" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--cromo)", fontSize: 10 }} tickFormatter={(value: number) => money(value, locale)} />
                  <YAxis type="category" dataKey="name" width={82} axisLine={false} tickLine={false} tick={{ fill: "var(--cromo)", fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => money(Number(value), locale)}
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--cromo)", backgroundColor: "var(--capa)", color: "var(--tinta)", fontSize: 12 }}
                  />
                  <Bar dataKey="cac" name={t("adminTableCac")} fill="var(--poste-azul)" radius={[0, 4, 4, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="mb-1 text-base font-bold">{t("adminSimulator")}</h2>
                <p className="mb-0 text-xs text-muted">{t("adminSimNote")}</p>
              </div>
              <span className="rounded-full bg-[var(--poste-azul)] px-2 py-0.5 text-[10px] font-bold text-white">{t("demo")}</span>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-semibold">
                <span className="mb-1 flex items-center justify-between gap-2">
                  {t("adminSimPrice")}
                  <b className="tabular-nums">{money(simPrice, locale)}</b>
                </span>
                <input type="range" min={19} max={79} step={1} value={simPrice} onChange={(event) => setSimPrice(Number(event.target.value))} className="h-6 w-full" aria-label={t("adminSimPrice")} />
              </label>
              <label className="block text-xs font-semibold">
                <span className="mb-1 flex items-center justify-between gap-2">
                  {t("adminSimReferral")}
                  <b className="tabular-nums">{simReferral}%</b>
                </span>
                <input type="range" min={0} max={60} step={1} value={simReferral} onChange={(event) => setSimReferral(Number(event.target.value))} className="h-6 w-full" aria-label={t("adminSimReferral")} />
              </label>
              <label className="block text-xs font-semibold">
                <span className="mb-1 flex items-center justify-between gap-2">
                  {t("adminSimCac")}
                  <b className="tabular-nums">{money(simCac, locale)}</b>
                </span>
                <input type="range" min={1} max={40} step={1} value={simCac} onChange={(event) => setSimCac(Number(event.target.value))} className="h-6 w-full" aria-label={t("adminSimCac")} />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] pt-3 text-xs">
              <div>
                <p className="mb-0 text-muted">{t("adminMrrCac")}</p>
                <p className="mb-0 font-display text-xl font-bold tabular-nums">{money(chartData.at(-1)?.mrr ?? 0, locale)}</p>
              </div>
              <div>
                <p className="mb-0 text-muted">{t("adminHealth")}</p>
                <p className={`mb-0 font-display text-xl font-bold tabular-nums ${health.tone}`}>{ratio === null ? "—" : `${ratio.toFixed(1)}×`}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <article className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-5">
            <h2 className="mb-1 text-base font-bold">{t("adminReferralFunnel")}</h2>
            <p className="mb-4 text-xs text-muted">{t("adminSimNote")}</p>
            <div className="space-y-4">
              {funnel.map((step) => {
                const percent = metrics.referrals ? Math.round((step.count / metrics.referrals) * 100) : 0;
                return (
                  <div key={step.label}>
                    <div className="mb-1.5 flex justify-between gap-2 text-xs">
                      <span className="font-semibold">{step.label}</span>
                      <span className="text-muted">{step.count} <b className="ml-1 text-[var(--tinta)]">{percent}%</b></span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-canvas">
                      <div className={`h-full rounded-full ${step.color}`} style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-control bg-canvas text-[var(--poste-azul)]">
                <Settings2 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="mb-0 text-sm font-bold">{t("adminConfig")}</h2>
                <p className="mb-0 text-[10px] text-muted">{t("adminConfigNote")}</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">
                {t("adminCoupon")}
                <input type="number" min="0" value={reward} onChange={(event) => setReward(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] px-3 outline-none focus:border-[var(--poste-azul)]" />
              </label>
              <label className="text-xs font-semibold">
                {t("adminCommission")}
                <input type="number" min="0" max="100" value={commission} onChange={(event) => setCommission(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] px-3 outline-none focus:border-[var(--poste-azul)]" />
              </label>
              <label className="text-xs font-semibold sm:col-span-2">
                {t("adminSpend")}
                <input type="number" min="0" step="0.01" value={acquisitionSpend} onChange={(event) => setAcquisitionSpend(event.target.value)} className="mt-1.5 h-10 w-full rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] px-3 outline-none focus:border-[var(--poste-azul)]" />
              </label>
            </div>
            {configError && <p role="alert" className="mb-0 mt-3 text-xs font-medium text-[var(--peligro)]">{configError}</p>}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="mb-0 max-w-lg text-[10px] leading-4 text-muted">{t("adminConfigNote")}</p>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  const nextDiscount = Number(reward);
                  const nextCommission = Number(commission);
                  const nextAcquisitionSpend = Number(acquisitionSpend);
                  const validSpend = acquisitionSpend.trim() === "" || (Number.isFinite(nextAcquisitionSpend) && nextAcquisitionSpend >= 0);
                  if (!Number.isFinite(nextDiscount) || nextDiscount < 0 || !Number.isFinite(nextCommission) || nextCommission < 0 || nextCommission > 100 || !validSpend) {
                    setConfigError(t("adminConfigError"));
                    return;
                  }
                  setConfigError("");
                  onSaveConfig({
                    newCustomerCoupon: nextDiscount,
                    platformCommission: nextCommission,
                    acquisitionSpend: acquisitionSpend.trim() ? nextAcquisitionSpend : null,
                  });
                  setSaved(true);
                  window.setTimeout(() => setSaved(false), 2000);
                }}
              >
                {saved ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Settings2 className="h-4 w-4" aria-hidden="true" />}
                {saved ? t("adminSaved") : t("adminSave")}
              </Button>
            </div>
          </article>
        </section>

        <section className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="mb-0 text-sm font-bold">{t("adminRecent")}</h2>
              <p className="mb-0 text-[10px] text-muted">{t("adminRecentDetail")}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-muted">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              {shopId ? SHOPS.find((shop) => shop.id === shopId)?.label : t("adminAllShops")}
            </span>
          </div>
          <div className="divide-y divide-[color-mix(in_srgb,var(--cromo)_20%,transparent)]">
            {filteredAppointments.slice(0, 5).map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold">{appointment.customer}</div>
                  <div className="truncate text-[10px] text-muted">{appointment.service} · {appointment.shopName}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-extrabold tabular-nums">{money(appointment.amount, locale)}</div>
                  <div className="text-[10px] text-muted">{appointment.time} · {appointmentStatus(appointment.status)}</div>
                </div>
              </div>
            ))}
            {!filteredAppointments.length && <p className="mb-0 py-6 text-center text-xs text-muted">{t("adminNoData")}</p>}
          </div>
        </section>

        <p className="text-right text-[10px] leading-4 text-muted">{t("adminConfigNote")} {t("adminSimNote")}</p>
      </main>
    </div>
  );
}
