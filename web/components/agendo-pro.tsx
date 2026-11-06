"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  CalendarDays,
  Check,
  Clock3,
  ChevronDown,
  CircleHelp,
  Gift,
  Heart,
  Home,
  Instagram,
  MapPin,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BookingDialog } from "@/components/booking-dialog";
import { HelpWidget } from "@/components/help-widget";
import { MarketingSidebar } from "@/components/marketing-sidebar";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { handleDialogKeyboard } from "@/lib/keyboard";
import {
  formatDate,
  formatMoney,
  initialAppointments,
  initialReferrals,
  services,
  type Appointment,
  type BarberService,
  type Referral,
  type StoreData,
} from "@/lib/data";

const STORAGE_KEY = "agendo-pro-store-v1";
const REFERRAL_CODE_KEY = "agendo-pro-referral-code-v1";
const DEFAULT_REFERRAL_CODE = "JUAN-SHARE-482";
const THEME_STORAGE_KEY = "agendo-pro-theme-v1";
const categories = ["Todo", "Corte", "Barba", "Combo"] as const;
type Category = (typeof categories)[number];
type ToastMessage = { title: string; detail: string; tone?: "success" | "error" } | null;

const demoData: StoreData = {
  appointments: initialAppointments,
  referrals: initialReferrals,
  referralCredits: 2,
  vipActive: false,
  welcomeCouponUsed: false,
  marketingConfig: { newCustomerCoupon: 5, platformCommission: 8, acquisitionSpend: null },
};

function isStoreData(value: unknown): value is StoreData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoreData>;
  return Array.isArray(candidate.appointments)
    && Array.isArray(candidate.referrals)
    && typeof candidate.referralCredits === "number"
    && typeof candidate.vipActive === "boolean"
    && typeof candidate.welcomeCouponUsed === "boolean"
    && Boolean(candidate.marketingConfig)
    && typeof candidate.marketingConfig?.newCustomerCoupon === "number"
    && typeof candidate.marketingConfig?.platformCommission === "number";
}

export function AgendoPro() {
  const [store, setStore] = useState<StoreData>(demoData);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<"marketplace" | "admin">("marketplace");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Todo");
  const [sort, setSort] = useState("Recomendados");
  const [selected, setSelected] = useState<BarberService | null>(null);
  const [cartService, setCartService] = useState<BarberService | null>(null);
  const [incomingReferral, setIncomingReferral] = useState("");
  const [referralLink, setReferralLink] = useState(`https://agendo.pro/?ref=${DEFAULT_REFERRAL_CODE}`);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [vipOpen, setVipOpen] = useState(false);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [referralShares, setReferralShares] = useState(0);

  const showMessage = useCallback((title: string, detail: string, tone: "success" | "error" = "success") => {
    setToast({ title, detail, tone });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      else setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isStoreData(parsed)) {
          setStore({
            ...parsed,
            marketingConfig: {
              ...parsed.marketingConfig,
              acquisitionSpend: parsed.marketingConfig.acquisitionSpend ?? null,
            },
          });
        }
      }
    } catch (error) {
      console.error("No se pudieron leer los datos demo guardados:", error);
      showMessage("No se pudo leer el estado guardado.", "La tienda sigue funcionando con datos de muestra.", "error");
    }

    let codeForAccount = window.localStorage.getItem(REFERRAL_CODE_KEY);
    if (!codeForAccount) {
      codeForAccount = `${DEFAULT_REFERRAL_CODE.split("-").slice(0, 2).join("-")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      window.localStorage.setItem(REFERRAL_CODE_KEY, codeForAccount);
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref")?.trim().toUpperCase() || "";
    if (/^[A-Z0-9][A-Z0-9-]{2,63}$/.test(code) && code !== codeForAccount) {
      setIncomingReferral(code);
      showMessage("Link de amigo aplicado", "El cupón demo de $5 está listo; tu amigo puede ganar un corte gratis.", "success");
    }
    setReferralLink(`${window.location.origin}/?ref=${codeForAccount}`);
    setHydrated(true);
  }, [showMessage]);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("No se pudo guardar el estado demo:", error);
      showMessage("No se pudieron guardar los cambios.", "Comprueba el almacenamiento disponible en tu navegador.", "error");
    }
  }, [hydrated, showMessage, store]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es-MX");
    const result = services.filter((item) => {
      const matchesCategory = category === "Todo" || item.category === category;
      const text = `${item.service} ${item.shopName} ${item.neighborhood} ${item.category}`.toLocaleLowerCase("es-MX");
      return matchesCategory && (!query || text.includes(query));
    });
    if (sort === "Precio más bajo") result.sort((a, b) => a.price - b.price);
    if (sort === "Mejor valorados") result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [category, search, sort]);

  const openBooking = (item: BarberService) => {
    setCartService(item);
    setSelected(item);
  };

  const closeBooking = () => {
    setSelected(null);
    setCartService(null);
  };

  const confirmBooking = (booking: {
    customer: string;
    phone: string;
    email?: string;
    date: string;
    time: string;
    addOn: boolean;
    total: number;
  }) => {
    if (!cartService) return;
    const appointment: Appointment = {
      id: `AG-${Date.now().toString().slice(-6)}`,
      customer: booking.customer,
      phone: booking.phone,
      email: booking.email,
      shopId: cartService.shopId,
      shopName: cartService.shopName,
      service: `${cartService.service}${booking.addOn ? " + Lavado premium" : ""}`,
      date: booking.date,
      time: booking.time,
      amount: booking.total,
      status: "Confirmada",
      referralCode: incomingReferral || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const receivedCredits = Boolean(incomingReferral);
    let referral: Referral | null = null;
    if (receivedCredits) {
      referral = {
        id: `ref-${Date.now()}`,
        customer: `Invitación ${incomingReferral}`,
        code: incomingReferral,
        shopId: cartService.shopId,
        shopName: cartService.shopName,
        date: new Date().toISOString().slice(0, 10),
        status: "Recompensado",
        reward: "1 corte gratis",
      };
    }

    setStore((current) => ({
      ...current,
      appointments: [appointment, ...current.appointments],
      referrals: referral ? [referral, ...current.referrals] : current.referrals,
      referralCredits: current.referralCredits + (receivedCredits ? 1 : 0),
      welcomeCouponUsed: true,
    }));
    setSelected(null);
    setCartService(null);
    setIncomingReferral("");
    setBookingSuccess(appointment);
    const params = new URLSearchParams(window.location.search);
    params.delete("ref");
    const remainingQuery = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}`);
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      showMessage("Link copiado", "Compártelo con tus amigos para ganar cortes gratis.");
    } catch (error) {
      console.error("No se pudo copiar el link de referido:", error);
      showMessage("No se pudo copiar automáticamente", "Selecciona y copia el enlace desde el módulo de referidos.", "error");
    }
  };

  const shareReferral = () => {
    const message = encodeURIComponent(`Reserva tu corte con mi enlace. Si completas la cita, recibo un crédito de corte gratis: ${referralLink}`);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    setReferralShares((count) => Math.min(2, count + 1));
  };

  const shareInstagram = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Agenda tu cita en Agendo Pro",
          text: "Comparte este link con tus amigos para desbloquear un corte gratis.",
          url: referralLink,
        });
        setReferralShares((count) => Math.min(2, count + 1));
        return;
      }
      await navigator.clipboard.writeText(referralLink);
      setReferralShares((count) => Math.min(2, count + 1));
      showMessage("Link listo para Instagram", "Pégalo en tu historia de Instagram para invitar a tus amigos.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("No se pudo compartir el link por Instagram:", error);
      showMessage("No se pudo abrir la opción de compartir", "Copia el enlace y pégalo en tu historia de Instagram.", "error");
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.style.colorScheme = next;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
      console.error("No se pudo guardar la preferencia de tema:", error);
      showMessage("No se guardó el tema", "El cambio de apariencia se mantiene hasta cerrar la pestaña.", "error");
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const enrollVip = () => {
    setStore((current) => ({ ...current, vipActive: true }));
    setVipOpen(false);
    showMessage("¡Pase VIP activado!", "Tu plan demo quedó registrado. No se realizó ningún cobro.");
  };

  const simulateFriendReferral = () => {
    if (!bookingSuccess || referralShares < 2) return;
    const referralCode = new URL(referralLink).searchParams.get("ref") || DEFAULT_REFERRAL_CODE;
    const completedAt = new Date().toISOString().slice(0, 10);
    const referredAppointment: Appointment = {
      id: `AG-${Date.now().toString().slice(-6)}`,
      customer: "Amigo invitado (demo)",
      phone: `demo-${Date.now()}`,
      shopId: bookingSuccess.shopId,
      shopName: bookingSuccess.shopName,
      service: bookingSuccess.service,
      date: completedAt,
      time: bookingSuccess.time,
      amount: bookingSuccess.amount,
      status: "Completada",
      referralCode,
      createdAt: completedAt,
    };
    const conversion: Referral = {
      id: `ref-${Date.now()}`,
      customer: "Amigo invitado (demo)",
      code: referralCode,
      shopId: referredAppointment.shopId,
      shopName: referredAppointment.shopName,
      date: completedAt,
      status: "Recompensado",
      reward: "1 crédito de corte gratis",
    };
    setStore((current) => ({
      ...current,
      appointments: [referredAppointment, ...current.appointments],
      referrals: [conversion, ...current.referrals],
      referralCredits: current.referralCredits + 1,
    }));
    setReferralShares(0);
    showMessage("Crédito de corte disponible", "La cita completada del amigo se simuló y el crédito quedó registrado. No se realizó ningún cobro.");
  };

  if (view === "admin") {
    return <AdminDashboard
      appointments={store.appointments}
      referrals={store.referrals}
      config={store.marketingConfig}
      onSaveConfig={(config) => setStore((current) => ({ ...current, marketingConfig: config }))}
      onExit={() => setView("marketplace")}
      theme={theme}
      onToggleTheme={toggleTheme}
    />;
  }

  return (
    <div data-theme={theme} className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-[var(--azulejo)] text-[var(--tinta)]`}>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      <div className="flex min-h-11 flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[var(--poste-azul)] px-3 py-2 text-center text-xs font-semibold text-white">
        <Gift aria-hidden="true" className="h-4 w-4" />
        <span>{store.welcomeCouponUsed ? "Cupón demo de bienvenida utilizado." : <>Cupón demo disponible: <b>{formatMoney(store.marketingConfig.newCustomerCoupon)}</b> en tu primera reserva. No tiene temporizador.</>}</span>
        {!store.welcomeCouponUsed && <span className="rounded-full border border-white/30 px-2 py-0.5 text-[10px]">DEMO</span>}
      </div>
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-3 sm:gap-5 sm:px-7">
          <button onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menú" className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"><Menu className="h-5 w-5" /></button>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex shrink-0 items-center gap-2 text-left">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-black text-lime">a.</span>
            <span className="hidden sm:block"><b className="block text-base font-extrabold leading-4">agendo<span className="text-leaf">pro</span></b><small className="text-[9px] font-semibold tracking-[.17em] text-muted">BARBER MARKETPLACE</small></span>
          </button>
          <button className="hidden shrink-0 items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-left text-[10px] leading-4 lg:flex"><MapPin className="h-4 w-4 text-leaf" /><span><span className="block text-muted">Enviar a</span><b>Ciudad de México</b></span><ChevronDown className="h-3 w-3 text-muted" /></button>
          <form onSubmit={(event) => { event.preventDefault(); document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" }); }} className="flex min-w-0 flex-1">
            <div className="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-leaf focus-within:ring-2 focus-within:ring-green-100">
              <div className="hidden items-center border-r border-gray-100 bg-gray-50 px-3 text-[10px] font-semibold text-muted sm:flex">Servicios <ChevronDown className="ml-1 h-3 w-3" /></div>
              <input id="market-search" aria-label="Buscar servicios o barberías" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Busca un corte, barba o barbería..." className="min-w-0 flex-1 px-3 py-2.5 text-xs outline-none sm:text-sm" />
              <button type="submit" aria-label="Buscar" className="flex w-11 items-center justify-center bg-leaf text-white hover:bg-[#26442e]"><Search className="h-4 w-4" /></button>
            </div>
          </form>
          <button onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} title={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100">{theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-ink" />}</button>
          <button onClick={() => setVipOpen(true)} className="hidden items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-gray-50 md:flex"><UserRound className="h-5 w-5" /><span><small className="block text-[9px] text-muted">Tu cuenta demo</small><b className="text-xs">{store.vipActive ? "Pase VIP activo" : "Mi cuenta"}</b></span><ChevronDown className="h-3 w-3 text-muted" /></button>
          <button onClick={() => cartService ? setSelected(cartService) : showMessage("Tu carrito está vacío", "Elige un servicio y reserva en unos pocos pasos.", "error")} aria-label="Abrir carrito" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-gray-100"><ShoppingBag className="h-5 w-5" />{cartService && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-copper text-[9px] font-bold text-white">1</span>}</button>
          <Button size="sm" variant="outline" className="hidden lg:inline-flex" onClick={() => setView("admin")}>Admin <ArrowUpRight className="h-3.5 w-3.5" /></Button>
        </div>
        <nav className="hidden border-t border-gray-100 bg-white lg:block">
          <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-7 py-2 text-[11px] font-semibold text-gray-600">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="inline-flex items-center gap-1 text-ink"><Menu className="h-4 w-4" /> Todas las categorías</button>
            <button onClick={() => { setCategory("Todo"); setSearch(""); }}>Inicio</button><button onClick={() => setCategory("Corte")}>Cortes</button><button onClick={() => setCategory("Barba")}>Barba</button><button onClick={() => setCategory("Combo")}>Combos y ofertas</button>
            <button onClick={() => setVipOpen(true)}>Pase VIP</button><button onClick={shareReferral} className="ml-auto inline-flex items-center gap-1 text-copper"><Gift className="h-3.5 w-3.5" /> Invita y gana</button>
          </div>
        </nav>
        {mobileMenu && <div className="border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2 text-left text-xs font-semibold">{categories.map((item) => <button key={item} onClick={() => { setCategory(item); setMobileMenu(false); document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-lg bg-gray-50 p-3">{item === "Todo" ? "Todas las categorías" : item}</button>)}<button onClick={() => { setView("admin"); setMobileMenu(false); }} className="rounded-lg bg-ink p-3 text-white">Dashboard Admin ↗</button><button onClick={() => { setVipOpen(true); setMobileMenu(false); }} className="rounded-lg bg-lime p-3">Mi pase VIP ♛</button></div>
        </div>}
      </header>

      <main id="main-content" className="mx-auto max-w-[1440px] px-3 pb-28 sm:px-7 sm:pb-12">
        <section className="hero-panel relative mt-4 overflow-hidden rounded-xl border border-gray-200 sm:mt-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_45%,rgba(59,130,246,.2),transparent_38%)]" />
          <div className="relative grid min-h-[330px] items-center gap-5 p-5 sm:min-h-[380px] sm:p-9 lg:grid-cols-[1.1fr_.9fr] lg:px-14">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 bg-canvas px-3 text-xs font-semibold text-leaf"><ShieldCheck className="h-4 w-4" /> Horarios de muestra · Pago en barbería</div>
              <h1 className="mb-3 text-3xl font-black leading-[1.03] tracking-tight sm:text-5xl">Reserva tu próximo corte.<br /><span className="text-[var(--poste-rojo)]">Sin filas ni llamadas.</span></h1>
              <p className="mb-5 max-w-md text-base leading-6 text-muted">Explora barberías, compara servicios y elige un horario. La reserva se confirma en esta demostración local.</p>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs"><Clock3 className="h-4 w-4 text-leaf" /> Horarios y precios de ejemplo</span>
              </div>
              <div className="flex flex-wrap gap-2"><Button variant="primary" size="lg" onClick={() => document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" })}>Reservar ahora <ArrowRight className="h-4 w-4" /></Button><Button variant="outline" onClick={() => setVipOpen(true)}>Conocer Pase VIP</Button></div>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-medium text-muted sm:gap-5"><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[var(--ok)]" /> Confirmación en la demo</span><span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[var(--ok)]" /> Sin cobro en línea</span></div>
            </div>
            <div className="hidden h-full min-h-[230px] items-center justify-center lg:flex">
              <div className="relative h-[260px] w-full max-w-[480px]">
                <div className="shop-image absolute right-0 top-0 h-[235px] w-[79%] rounded-3xl border border-white/10 shadow-soft" style={{ backgroundImage: "linear-gradient(180deg,rgba(11,15,23,.02),rgba(11,15,23,.25)),url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85)" }} />
                <div className="absolute bottom-0 left-0 rounded-2xl border border-white/10 bg-[#151b27]/95 p-4 shadow-soft">
                  <div className="mb-1 flex items-center gap-2 text-xs font-bold text-leaf"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-canvas">✂</span> BARBERÍA DE EJEMPLO</div>
                  <div className="text-sm font-extrabold">Casa Navaja · Roma Norte</div><div className="mt-1 text-xs text-muted">Servicios desde {formatMoney(15)} · datos de demostración</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 sm:mt-5 sm:px-5">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-[var(--poste-azul)]"><Gift className="h-4 w-4" /></span><div><b className="block text-sm">Comparte tu enlace de referido.</b><span className="text-xs text-muted">El crédito demo se registra cuando la cita del invitado aparece como completada.</span></div></div>
          <button onClick={shareReferral} className="min-h-11 shrink-0 rounded-lg bg-[var(--poste-azul)] px-4 py-2 text-xs font-bold text-white">Compartir enlace</button>
        </div>

        <section id="reservas" className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><p className="mb-1 text-xs font-semibold text-leaf">Marketplace de barberías</p><h2 className="mb-1 text-xl font-extrabold tracking-tight sm:text-2xl">Servicios destacados</h2><p className="mb-0 text-sm text-muted">{filteredServices.length} servicios · precios y valoraciones de ejemplo</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted"><SlidersHorizontal className="h-3.5 w-3.5" />Ordenar:</div>
                <select aria-label="Ordenar servicios" value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-[10px] font-semibold outline-none focus:border-leaf"><option>Recomendados</option><option>Precio más bajo</option><option>Mejor valorados</option></select>
              </div>
            </div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${category === item ? "border-ink bg-ink text-white" : "border-gray-200 bg-white text-gray-600 hover:border-leaf"}`}>{item === "Todo" ? "Todo" : item === "Combo" ? "Combos y ofertas" : item}</button>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((item) => <div key={item.id} className="relative">
                <button onClick={() => toggleFavorite(item.id)} aria-label={favorites.includes(item.id) ? "Quitar de favoritos" : "Guardar en favoritos"} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm hover:text-red-500"><Heart className={`h-4 w-4 ${favorites.includes(item.id) ? "fill-red-500 text-red-500" : ""}`} /></button>
                <ServiceCard item={item} onBook={openBooking} />
              </div>)}
              {!filteredServices.length && <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center"><CircleHelp className="mx-auto mb-2 h-6 w-6 text-muted" /><p className="mb-1 text-sm font-bold">No encontramos servicios</p><p className="mb-0 text-xs text-muted">Prueba con otro término o categoría.</p></div>}
            </div>
            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="max-w-lg"><div className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-canvas px-3 text-xs font-semibold text-[var(--laton)]"><BadgePercent className="h-4 w-4" /> Membresía de demostración</div><h2 className="mb-2 text-xl font-extrabold">Pase VIP para visitas frecuentes</h2><p className="mb-0 text-sm leading-6 text-muted">Compara tus visitas habituales con el precio de ejemplo de {formatMoney(39)}/mes. Los beneficios y cobros no están conectados.</p></div><Button variant="outline" onClick={() => setVipOpen(true)}>Ver plan y condiciones <ArrowUpRight className="h-4 w-4" /></Button></div>
            </section>
          </div>
          <div className="min-w-0"><MarketingSidebar
            referralLink={referralLink}
            credits={store.referralCredits}
            completedCount={store.referrals.filter((referral) => referral.code === new URL(referralLink).searchParams.get("ref") && referral.status !== "Pendiente").length}
            onVIP={() => setVipOpen(true)}
            onCopy={copyReferralLink}
            onShare={shareReferral}
            onInstagram={shareInstagram}
          /></div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-7"><span><b className="text-ink">Agendo Pro</b> · Una buena barbería se siente.</span><span>Prototipo local · Sin cobros reales · <button onClick={() => setView("admin")} className="min-h-11 font-semibold text-leaf hover:underline">Panel de administrador ↗</button></span></div>
      </footer>

      <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-gray-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold"><Home className="h-5 w-5" />Inicio</button>
        <button type="button" onClick={() => { document.getElementById("market-search")?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold"><Search className="h-5 w-5" />Buscar</button>
        <button type="button" onClick={() => setBookingsOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold"><CalendarDays className="h-5 w-5" />Mis citas</button>
        <button type="button" onClick={() => setVipOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold"><UserRound className="h-5 w-5" />Perfil</button>
      </nav>

      {selected && cartService && <BookingDialog
        item={cartService}
        referralCode={incomingReferral}
        referralLink={referralLink}
        couponActive={!store.welcomeCouponUsed}
        couponAmount={store.marketingConfig.newCustomerCoupon}
        onClose={closeBooking}
        onShare={shareReferral}
        onInstagram={shareInstagram}
        onConfirm={confirmBooking}
      />}
      {bookingSuccess && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingSuccess(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="success-title" onKeyDown={(event) => handleDialogKeyboard(event, () => setBookingSuccess(null))} className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-ink shadow-2xl sm:p-8">
          <button aria-label="Cerrar confirmación de reserva" onClick={() => setBookingSuccess(null)} className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-white/10"><X className="h-4 w-4" /></button>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Check className="h-6 w-6" /></div>
          <p className="mb-1 text-xs font-semibold text-[var(--ok)]">Reserva confirmada en la demo · {bookingSuccess.id}</p>
          <h2 id="success-title" className="mb-2 text-2xl font-extrabold">¡Listo, {bookingSuccess.customer}!</h2>
          <p className="mb-4 text-sm leading-6 text-muted">{bookingSuccess.service} en {bookingSuccess.shopName}. Total demo: <b>{formatMoney(bookingSuccess.amount)}</b>. No se realizó ningún cobro.</p>
          <div className="rounded-xl border border-gray-200 bg-canvas p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-extrabold"><Gift className="h-4 w-4 text-[var(--poste-rojo)]" />Comparte tu enlace de referido</div>
            <p className="mb-3 text-xs leading-5 text-muted">Cuando la cita del invitado se complete, se registra un crédito de corte gratis para ti. Esta acción de abajo solo simula ese evento.</p>
            <code className="block min-h-11 truncate rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs text-muted">{referralLink}</code>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="primary" onClick={shareReferral}><span aria-hidden="true">◉</span> WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={shareInstagram}><Instagram className="h-4 w-4" /> Compartir</Button>
            </div>
            <Button className="mt-3 w-full" size="sm" variant="outline" disabled={referralShares < 2} onClick={simulateFriendReferral}>
              {referralShares < 2 ? `Comparte el enlace 2 veces para probar · ${referralShares}/2` : "Simular cita completada del invitado"}
            </Button>
            <p className="mb-0 mt-2 text-xs text-muted">El contador es una prueba local; no representa personas ni reservas reales.</p>
          </div>
          <Button variant="primary" className="mt-4 w-full" onClick={() => setBookingSuccess(null)}>Continuar <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>}
      {vipOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setVipOpen(false); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="vip-title" onKeyDown={(event) => handleDialogKeyboard(event, () => setVipOpen(false))} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <button aria-label="Cerrar" onClick={() => setVipOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-gray-100"><X className="h-4 w-4" /></button>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-canvas text-xl text-[var(--laton)]">♛</div>
          <p className="mb-1 text-xs font-semibold text-[var(--laton)]">Membresía de demostración</p><h2 id="vip-title" className="mb-2 text-2xl font-extrabold">Pase VIP</h2>
          <p className="mb-5 text-sm leading-6 text-muted">Precio de muestra de {formatMoney(39)}/mes. Revisa las condiciones comerciales reales antes de activar una suscripción.</p>
          <div className="mb-5 rounded-xl border border-gray-200 bg-canvas p-4"><div className="flex items-end justify-between"><span className="text-sm text-muted">Cuota mensual demo</span><b className="text-2xl tabular-nums">{formatMoney(39)}</b></div><ul className="mb-0 mt-3 space-y-2 text-sm"><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />Beneficios ilustrativos, sujetos a configuración</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />Sin guardar datos de pago</li><li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-[var(--ok)]" />Puedes cancelar la prueba en un toque</li></ul></div>
          {store.vipActive
            ? <Button variant="outline" className="w-full" onClick={() => { setStore((current) => ({ ...current, vipActive: false })); setVipOpen(false); showMessage("Prueba VIP cancelada", "No se genera ningún cobro."); }}>Cancelar membresía</Button>
            : <Button variant="primary" className="w-full" onClick={enrollVip}>Activar prueba VIP <ArrowRight className="h-4 w-4" /></Button>}
          <p className="mb-0 mt-3 text-center text-xs text-muted">La membresía no realiza cargos recurrentes en esta demo.</p>
        </div>
      </div>}
      {bookingsOpen && <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingsOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="bookings-title" onKeyDown={(event) => handleDialogKeyboard(event, () => setBookingsOpen(false))} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-xl bg-white p-5 text-ink sm:rounded-xl">
          <div className="mb-4 flex items-center justify-between"><div><h2 id="bookings-title" className="mb-1 text-lg font-bold">Mis citas</h2><p className="mb-0 text-xs text-muted">Reservas de demostración guardadas localmente.</p></div><button type="button" aria-label="Cerrar mis citas" onClick={() => setBookingsOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-canvas"><X className="h-5 w-5" /></button></div>
          {store.appointments.length ? <div className="divide-y divide-gray-100">{store.appointments.slice(0, 6).map((appointment) => <article key={appointment.id} className="flex items-start justify-between gap-3 py-3"><div><h3 className="mb-1 text-sm font-semibold">{appointment.service}</h3><p className="mb-0 text-xs text-muted">{appointment.shopName} · {formatDate(appointment.date)} · {appointment.time}</p><p className="mb-0 mt-1 text-xs text-muted">Estado: {appointment.status}</p></div><b className="shrink-0 text-sm tabular-nums">{formatMoney(appointment.amount)}</b></article>)}</div> : <div className="rounded-lg bg-canvas p-4"><b className="text-sm">Aún no tienes citas.</b><p className="mb-0 mt-1 text-xs text-muted">Reserva la primera para empezar tu poste.</p></div>}
        </section>
      </div>}
      {toast && <div role="status" className={`fixed bottom-20 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border bg-white p-4 text-ink shadow-xl sm:bottom-5 ${toast.tone === "error" ? "border-red-400/30" : "border-green-400/30"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toast.tone === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{toast.tone === "error" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</span><div className="flex-1"><b className="block text-sm">{toast.title}</b><span className="text-xs text-muted">{toast.detail}</span></div><button aria-label="Cerrar notificación" onClick={() => setToast(null)} className="flex h-11 w-11 items-center justify-center text-muted"><X className="h-4 w-4" /></button></div></div>}
      <HelpWidget />
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba" className="fixed bottom-5 right-4 z-20 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-soft hover:bg-lime sm:flex"><ArrowDown className="h-4 w-4 rotate-180" /></button>
    </div>
  );
}
