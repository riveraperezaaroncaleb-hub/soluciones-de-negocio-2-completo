"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  Check,
  ChevronDown,
  CircleHelp,
  Gift,
  Heart,
  Instagram,
  MapPin,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BookingDialog } from "@/components/booking-dialog";
import { MarketingSidebar } from "@/components/marketing-sidebar";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { handleDialogKeyboard } from "@/lib/keyboard";
import {
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
  marketingConfig: { newCustomerCoupon: 5, platformCommission: 8 },
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
  const [mobileMenu, setMobileMenu] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [couponSeconds, setCouponSeconds] = useState(9 * 60 + 59);
  const [socialProofVisible, setSocialProofVisible] = useState(false);
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
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isStoreData(parsed)) setStore(parsed);
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
    const timer = window.setInterval(() => setCouponSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setSocialProofVisible(true), 2500);
    const cycle = window.setInterval(() => {
      setSocialProofVisible(true);
      window.setTimeout(() => setSocialProofVisible(false), 7000);
    }, 24000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearInterval(cycle);
    };
  }, []);

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
      welcomeCouponUsed: current.welcomeCouponUsed || (couponSeconds > 0),
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
    const message = encodeURIComponent(`Reserva tu corte con mi link. Si agendas hoy, yo gano un corte gratis: ${referralLink}`);
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

  const couponTime = `${String(Math.floor(couponSeconds / 60)).padStart(2, "0")}:${String(couponSeconds % 60).padStart(2, "0")}`;

  const toggleFavorite = (id: string) => {
    setFavorites((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  const enrollVip = () => {
    setStore((current) => ({ ...current, vipActive: true }));
    setVipOpen(false);
    showMessage("¡Pase VIP activado!", "Tu plan demo quedó registrado. No se realizó ningún cobro.");
  };

  const simulateFriendReferral = () => {
    if (!bookingSuccess || referralShares < 2 || bookingSuccess.amount === 0) return;
    const referralCode = new URL(referralLink).searchParams.get("ref") || DEFAULT_REFERRAL_CODE;
    const freeBooking = { ...bookingSuccess, amount: 0 };
    const conversion: Referral = {
      id: `ref-${Date.now()}`,
      customer: "Amigo invitado (demo)",
      code: referralCode,
      shopId: bookingSuccess.shopId,
      shopName: bookingSuccess.shopName,
      date: new Date().toISOString().slice(0, 10),
      status: "Recompensado",
      reward: "Cita actual bonificada",
    };
    setStore((current) => ({
      ...current,
      appointments: current.appointments.map((appointment) =>
        appointment.id === bookingSuccess.id ? freeBooking : appointment),
      referrals: [conversion, ...current.referrals],
      referralCredits: current.referralCredits + 1,
    }));
    setBookingSuccess(freeBooking);
    showMessage("¡Corte gratis desbloqueado!", "La cita quedó bonificada en esta simulación. No se realizó ningún cobro ni reembolso.");
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
    <div data-theme={theme} className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-[#0b0f17] text-white`}>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-gradient-to-r from-[#5e1918] via-[#8b3c18] to-[#5e1918] px-3 py-2.5 text-center text-[10px] font-semibold text-white sm:text-xs">
        <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-amber-300" />
        <span>{store.welcomeCouponUsed ? "Tu cupón de bienvenida ya fue utilizado." : <>¡Atención! Tu cupón demo de <b className="text-amber-300">{formatMoney(store.marketingConfig.newCustomerCoupon)}</b> en tu primera reserva vence en</>}</span>
        <span role="timer" aria-label={store.welcomeCouponUsed ? "Cupón utilizado" : `Cupón vence en ${couponTime}`} className="rounded-md border border-amber-300/40 bg-black/20 px-2 py-0.5 font-mono font-extrabold text-amber-300">{store.welcomeCouponUsed ? "USADO" : couponSeconds > 0 ? couponTime : "00:00"}</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/80">{store.welcomeCouponUsed ? "GRACIAS" : couponSeconds > 0 ? "DEMO" : "Cupón demo expirado"}</span>
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
              <input aria-label="Buscar servicios o barberías" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Busca un corte, barba o barbería..." className="min-w-0 flex-1 px-3 py-2.5 text-xs outline-none sm:text-sm" />
              <button type="submit" aria-label="Buscar" className="flex w-11 items-center justify-center bg-leaf text-white hover:bg-[#26442e]"><Search className="h-4 w-4" /></button>
            </div>
          </form>
          <button onClick={toggleTheme} aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} title={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-100">{theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-ink" />}</button>
          <button onClick={() => setVipOpen(true)} className="hidden items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-gray-50 md:flex"><UserRound className="h-5 w-5" /><span><small className="block text-[9px] text-muted">Hola, Juan</small><b className="text-xs">{store.vipActive ? "Pase VIP activo" : "Mi cuenta"}</b></span><ChevronDown className="h-3 w-3 text-muted" /></button>
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

      <main className="mx-auto max-w-[1440px] px-3 pb-12 sm:px-7">
        <section className="hero-panel relative mt-4 overflow-hidden rounded-3xl border border-blue-400/20 sm:mt-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_45%,rgba(59,130,246,.2),transparent_38%)]" />
          <div className="relative grid min-h-[330px] items-center gap-5 p-5 sm:min-h-[380px] sm:p-9 lg:grid-cols-[1.1fr_.9fr] lg:px-14">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-300"><ShieldCheck className="h-3.5 w-3.5" /> Reserva segura · Paga en barbería</div>
              <h1 className="mb-3 text-3xl font-black leading-[1.03] tracking-tight sm:text-5xl">Sube de nivel tu imagen.<br /><span className="text-blue-400">Garantiza tu lugar</span> sin filas.</h1>
              <p className="mb-5 max-w-md text-xs leading-5 text-gray-300 sm:text-sm sm:leading-6">Únete al VIP Club o reserva tu cita hoy con beneficio exclusivo. Tu primera reserva incluye un cupón demo de {formatMoney(store.marketingConfig.newCustomerCoupon)}.</p>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1.5 text-[10px] font-bold text-amber-300"><Star className="h-3 w-3 fill-amber-300" /> 4.9/5 · +1,200 reseñas de ejemplo</span>
                <span className="rounded-full bg-white/5 px-2 py-1.5 text-[9px] text-gray-400">Datos de demostración, no reseñas verificadas</span>
              </div>
              <div className="flex flex-wrap gap-2"><Button variant="default" className="cta-glow h-12 bg-[#3B82F6] px-5 font-extrabold text-white hover:bg-blue-500" onClick={() => document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" })}>Reservar Cita Ahora (Descuento Aplicado) <ArrowRight className="h-4 w-4" /></Button><Button variant="outline" onClick={() => setVipOpen(true)}><Gift className="h-4 w-4 text-amber-300" /> Explorar VIP Club</Button></div>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-medium text-gray-300 sm:gap-5"><span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-300" /> Confirmación inmediata</span><span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-emerald-300" /> Sin pago anticipado</span></div>
            </div>
            <div className="hidden h-full min-h-[230px] items-center justify-center lg:flex">
              <div className="relative h-[260px] w-full max-w-[480px]">
                <div className="shop-image absolute right-0 top-0 h-[235px] w-[79%] rounded-3xl border border-white/10 shadow-soft" style={{ backgroundImage: "linear-gradient(180deg,rgba(11,15,23,.02),rgba(11,15,23,.25)),url(https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=85)" }} />
                <div className="absolute bottom-0 left-0 rounded-2xl border border-white/10 bg-[#151b27]/95 p-4 shadow-soft">
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-bold text-blue-300"><span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500/20">✂</span> BARBERÍA DESTACADA · DEMO</div>
                  <div className="text-sm font-extrabold">Casa Navaja · Roma Norte</div><div className="mt-1 flex items-center gap-1 text-[10px] text-gray-300"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.9 · 1,200 reseñas de ejemplo · Desde {formatMoney(15)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 sm:mt-5 sm:px-5">
          <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Gift className="h-4 w-4" /></span><div><b className="block text-xs sm:text-sm">Comparte tu link con 2 amigos. El corte puede ir por la casa.</b><span className="text-[10px] text-gray-400 sm:text-xs">Si uno agenda hoy, se registra un corte gratis para ti · Recompensa simulada.</span></div></div>
          <button onClick={shareReferral} className="shrink-0 rounded-lg bg-[#3B82F6] px-3 py-2 text-[10px] font-bold text-white hover:bg-blue-500 sm:px-4 sm:text-xs">Compartir link ↗</button>
        </div>

        <section id="reservas" className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-blue-300">Marketplace de barberías</p><h2 className="mb-1 text-xl font-extrabold tracking-tight sm:text-2xl">Servicios & ofertas</h2><p className="mb-0 text-xs text-gray-400">Precios especiales en tu primera visita · {filteredServices.length} resultados demo</p></div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted"><SlidersHorizontal className="h-3.5 w-3.5" />Ordenar:</div>
                <select aria-label="Ordenar servicios" value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-[10px] font-semibold outline-none focus:border-leaf"><option>Recomendados</option><option>Precio más bajo</option><option>Mejor valorados</option></select>
              </div>
            </div>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-[10px] font-bold transition ${category === item ? "border-ink bg-ink text-white" : "border-gray-200 bg-white text-gray-600 hover:border-leaf"}`}>{item === "Todo" ? "Todo" : item === "Combo" ? "Combos y ofertas" : item}</button>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((item) => <div key={item.id} className="relative">
                <button onClick={() => toggleFavorite(item.id)} aria-label={favorites.includes(item.id) ? "Quitar de favoritos" : "Guardar en favoritos"} className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-gray-500 shadow-sm hover:text-red-500"><Heart className={`h-4 w-4 ${favorites.includes(item.id) ? "fill-red-500 text-red-500" : ""}`} /></button>
                <ServiceCard item={item} onBook={openBooking} />
              </div>)}
              {!filteredServices.length && <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center"><CircleHelp className="mx-auto mb-2 h-6 w-6 text-muted" /><p className="mb-1 text-sm font-bold">No encontramos servicios</p><p className="mb-0 text-xs text-muted">Prueba con otro término o categoría.</p></div>}
            </div>
            <section className="mt-6 overflow-hidden rounded-2xl border border-blue-400/20 bg-[#111827] p-5 text-white sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="max-w-lg"><div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-[10px] font-bold text-blue-300"><BadgePercent className="h-3.5 w-3.5" /> VIP CLUB · 3 CUPOS DEMO</div><h2 className="mb-2 text-xl font-extrabold">Cortes ilimitados. Sábados sin espera.</h2><p className="mb-0 text-xs leading-5 text-gray-300">Paga por cita {formatMoney(15)}–{formatMoney(25)} o únete al VIP Club por {formatMoney(39)}/mes.</p></div><Button variant="default" className="bg-[#3B82F6] hover:bg-blue-500" onClick={() => setVipOpen(true)}>Ver membresía · {formatMoney(39)}/mes <ArrowUpRight className="h-4 w-4" /></Button></div>
            </section>
          </div>
          <div className="min-w-0"><MarketingSidebar referralLink={referralLink} credits={store.referralCredits} onVIP={() => setVipOpen(true)} onCopy={copyReferralLink} onInstagram={shareInstagram} /></div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-5 text-[10px] text-muted sm:flex-row sm:px-7"><span><b className="text-ink">agendo pro</b> · Una buena barbería se siente.</span><span>Prototipo interactivo · Sin cobros reales · <button onClick={() => setView("admin")} className="font-semibold text-leaf hover:underline">Panel de administrador ↗</button></span></div>
      </footer>

      {selected && cartService && <BookingDialog
        item={cartService}
        referralCode={incomingReferral}
        referralLink={referralLink}
        couponActive={couponSeconds > 0 && !store.welcomeCouponUsed}
        couponAmount={store.marketingConfig.newCustomerCoupon}
        onClose={closeBooking}
        onShare={shareReferral}
        onInstagram={shareInstagram}
        onConfirm={confirmBooking}
      />}
      {bookingSuccess && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingSuccess(null); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="success-title" onKeyDown={(event) => handleDialogKeyboard(event, () => setBookingSuccess(null))} className="relative w-full max-w-md rounded-3xl border border-emerald-400/25 bg-[#111925] p-6 text-white shadow-2xl sm:p-8">
          <button aria-label="Cerrar confirmación de reserva" onClick={() => setBookingSuccess(null)} className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-white/10"><X className="h-4 w-4" /></button>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Check className="h-6 w-6" /></div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.17em] text-emerald-300">Reserva demo confirmada · {bookingSuccess.id}</p>
          <h2 id="success-title" className="mb-2 text-2xl font-extrabold">¡Listo, {bookingSuccess.customer}!</h2>
          <p className="mb-4 text-sm leading-6 text-gray-300">{bookingSuccess.service} en {bookingSuccess.shopName}. Total con cupón: <b className="text-amber-300">{formatMoney(bookingSuccess.amount)}</b>. No se realizó ningún cobro.</p>
          <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-extrabold text-amber-300"><Gift className="h-4 w-4" />¿Quieres este corte GRATIS?</div>
            <p className="mb-3 text-xs leading-5 text-gray-300">Comparte tu link único con 2 amigos. Si uno agenda hoy, tu corte actual queda 100% gratis como recompensa demo; no se procesa ningún pago ni reembolso real.</p>
            <div className="mb-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full bg-emerald-400 transition-all ${referralShares >= 2 ? "w-full" : referralShares === 1 ? "w-1/2" : "w-0"}`} /></div><span className="text-[10px] font-bold text-emerald-300">{referralShares}/2</span></div>
            <code className="block truncate rounded-lg bg-black/30 px-3 py-2 text-[10px] text-emerald-300">{referralLink}</code>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="lime" onClick={shareReferral}><span aria-hidden="true">◉</span> WhatsApp</Button>
              <Button size="sm" variant="outline" onClick={shareInstagram}><Instagram className="h-4 w-4" /> Instagram Stories</Button>
            </div>
            <Button className="mt-3 w-full" size="sm" variant="default" disabled={referralShares < 2 || bookingSuccess.amount === 0} onClick={simulateFriendReferral}>
              {bookingSuccess.amount === 0 ? "Corte gratis activado" : referralShares < 2 ? `Comparte con 2 amigos · ${referralShares}/2` : "Simular reserva de un amigo hoy"}
            </Button>
            <p className="mb-0 mt-2 text-center text-[9px] text-gray-500">Botón de prueba: en producción esta acción ocurre al confirmar una cita real.</p>
          </div>
          <Button variant="primary" className="mt-4 w-full" onClick={() => setBookingSuccess(null)}>Continuar <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>}
      {vipOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setVipOpen(false); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="vip-title" onKeyDown={(event) => handleDialogKeyboard(event, () => setVipOpen(false))} className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <button aria-label="Cerrar" onClick={() => setVipOpen(false)} className="absolute right-4 top-4 rounded-lg p-2 text-muted hover:bg-gray-100"><X className="h-4 w-4" /></button>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-2xl text-blue-300">♛</div>
          <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.17em] text-blue-300">Solo 3 cupos disponibles · demo</p><h2 id="vip-title" className="mb-2 text-2xl font-extrabold">VIP Club ilimitado</h2>
          <p className="mb-5 text-sm leading-6 text-gray-300">Garantiza tu horario los sábados sin esperar y disfruta cortes ilimitados por {formatMoney(39)}/mes. Cupos y plan son simulados.</p>
          <div className="mb-5 rounded-2xl bg-canvas p-4"><div className="flex items-end justify-between"><span className="text-xs text-muted">Suscripción mensual</span><b className="text-2xl">{formatMoney(39)}<small className="text-xs font-medium text-muted"> / mes</small></b></div><div className="mt-1 flex items-center justify-between text-[10px] text-muted"><span>Precio individual de referencia</span><span className="line-through">{formatMoney(25)} por corte</span></div><ul className="mb-0 mt-3 space-y-2 text-xs"><li className="flex gap-2"><Check className="h-4 w-4 text-emerald-300" />Cortes ilimitados en Casa Navaja</li><li className="flex gap-2"><Check className="h-4 w-4 text-blue-300" />Horario prioritario los sábados</li><li className="flex gap-2"><Check className="h-4 w-4 text-blue-300" />Cancela cuando quieras (simulado)</li></ul></div>
          <Button variant="default" className="w-full bg-[#3B82F6] hover:bg-blue-500" disabled={store.vipActive} onClick={enrollVip}>{store.vipActive ? "Pase VIP activo (demo)" : "Unirme al VIP Club · $39/mes"} <ArrowRight className="h-4 w-4" /></Button>
          <p className="mb-0 mt-3 text-center text-[10px] text-gray-400">Esta demo no almacena datos de pago ni genera cargos.</p>
        </div>
      </div>}
      {socialProofVisible && <div role="status" aria-live="polite" className="fixed bottom-4 left-3 z-40 flex max-w-[calc(100%-1.5rem)] items-start gap-3 rounded-2xl border border-blue-400/25 bg-[#111925] p-3 pr-9 text-white shadow-2xl sm:bottom-5 sm:left-5 sm:max-w-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-300"><Check className="h-4 w-4" /></span>
        <div className="min-w-0"><span className="mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-blue-300">Actividad social · simulación</span><p className="mb-0 text-[11px] leading-4"><b>Carlos M. (demo)</b> acaba de reservar su Combo VIP hace 3 minutos.</p></div>
        <button aria-label="Cerrar aviso de actividad" onClick={() => setSocialProofVisible(false)} className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
      </div>}
      {toast && <div role="status" className={`fixed bottom-4 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border p-4 shadow-2xl ${toast.tone === "error" ? "border-red-400/30 bg-[#111925]" : "border-emerald-400/30 bg-[#111925]"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toast.tone === "error" ? "bg-red-500/10 text-red-400" : "bg-emerald-400/10 text-emerald-300"}`}>{toast.tone === "error" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}</span><div className="flex-1"><b className="block text-sm">{toast.title}</b><span className="text-xs text-gray-300">{toast.detail}</span></div><button aria-label="Cerrar notificación" onClick={() => setToast(null)} className="text-gray-400"><X className="h-4 w-4" /></button></div></div>}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba" className="fixed bottom-5 right-4 z-20 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-soft hover:bg-lime sm:flex"><ArrowDown className="h-4 w-4 rotate-180" /></button>
    </div>
  );
}
