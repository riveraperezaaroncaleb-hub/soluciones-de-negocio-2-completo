"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Crown,
  Gift,
  Heart,
  Home,
  Instagram,
  MapPin,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { AdminDashboard } from "@/components/admin-dashboard";
import { BookingDialog } from "@/components/booking-dialog";
import { ChatWidget } from "@/components/chat/chat-widget";
import { HeroTurno } from "@/components/marketplace/hero-turno";
import { MarketingSidebar } from "@/components/marketing-sidebar";
import { ServiceCard } from "@/components/service-card";
import { TablaPlanes } from "@/components/membresias/tabla-planes";
import { Button } from "@/components/ui/button";
import type { AddOnSelection } from "@/components/checkout/modal-upsell";
import { findNextSlot } from "@/lib/availability";
import {
  createDemoOffer,
  defaultMarketingConfig,
  initialAppointments,
  initialReferrals,
  normalizeStoreData,
  services,
  type Appointment,
  type BarberService,
  type MembershipPlanId,
  type Referral,
  type StoreData,
} from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { handleDialogKeyboard } from "@/lib/keyboard";
import { formatClock, formatDateLong, formatDateShort, money } from "@/lib/money";
import { personalizedVipSavings } from "@/lib/membership";

const STORAGE_KEY = "agendo-pro-store-v1";
const REFERRAL_CODE_KEY = "agendo-pro-referral-code-v1";
const DEFAULT_REFERRAL_CODE = "JUAN-SHARE-123";
const THEME_STORAGE_KEY = "agendo-pro-theme-v1";

const categories = ["Todo", "Corte", "Barba", "Combo"] as const;
type Category = (typeof categories)[number];
type Sort = "recommended" | "price" | "rating";
type View = "marketplace" | "memberships" | "admin";
type ToastMessage = { title: string; detail: string; tone?: "success" | "error" } | null;

type BookingPayload = {
  customer: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  addons: AddOnSelection;
  total: number;
};

const demoData: StoreData = {
  appointments: initialAppointments,
  referrals: initialReferrals,
  referralCredits: 0,
  vipActive: false,
  welcomeCouponUsed: false,
  favoriteServiceId: "navaja-corte",
  offer: null,
  membership: { plan: null, annual: false, pausedUntil: null },
  marketingConfig: { ...defaultMarketingConfig, acquisitionSpend: 12 },
};

export function AgendoPro() {
  const { locale, setLocale, t } = useI18n();
  const [store, setStore] = useState<StoreData>(demoData);
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("marketplace");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("Todo");
  const [sort, setSort] = useState<Sort>("recommended");
  const [cartService, setCartService] = useState<BarberService | null>(null);
  const [incomingReferral, setIncomingReferral] = useState("");
  const [referralCode, setReferralCode] = useState(DEFAULT_REFERRAL_CODE);
  const [referralLink, setReferralLink] = useState(`https://agendo.pro/?ref=${DEFAULT_REFERRAL_CODE}`);
  const [toast, setToast] = useState<ToastMessage>(null);
  const [bookingsOpen, setBookingsOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const showMessage = useCallback((title: string, detail: string, tone: "success" | "error" = "success") => {
    setToast({ title, detail, tone });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    let nextStore = demoData;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = normalizeStoreData(JSON.parse(saved));
        if (parsed) nextStore = parsed;
      }
    } catch (error) {
      console.error("No se pudieron leer los datos demo guardados:", error);
      showMessage(tRef.current("toastStorageErrorTitle"), tRef.current("toastStorageErrorDetail"), "error");
    }
    setStore({ ...nextStore, offer: nextStore.offer ?? createDemoOffer() });

    try {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      else setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch (error) {
      console.error("No se pudo leer la preferencia de tema:", error);
    }

    let codeForAccount = window.localStorage.getItem(REFERRAL_CODE_KEY);
    if (!codeForAccount) {
      codeForAccount = DEFAULT_REFERRAL_CODE;
      window.localStorage.setItem(REFERRAL_CODE_KEY, codeForAccount);
    }
    setReferralCode(codeForAccount);

    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref")?.trim().toUpperCase() || "";
    if (/^[A-Z0-9][A-Z0-9-]{2,63}$/.test(code) && code !== codeForAccount) {
      setIncomingReferral(code);
      showMessage(tRef.current("toastReferralTitle"), tRef.current("toastReferralDetail"), "success");
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
      showMessage(tRef.current("toastSaveErrorTitle"), tRef.current("toastSaveErrorDetail"), "error");
    }
  }, [hydrated, showMessage, store]);

  const nextSlot = useMemo(
    () => findNextSlot(services, store.favoriteServiceId),
    [store.favoriteServiceId],
  );

  const offerService = useMemo(
    () => (store.offer ? services.find((service) => service.id === store.offer?.serviceId) ?? null : null),
    [store.offer],
  );

  const filteredServices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale);
    const result = services.filter((item) => {
      const matchesCategory = category === "Todo" || item.category === category;
      const text = `${item.service} ${item.shopName} ${item.neighborhood} ${item.category}`.toLocaleLowerCase(locale);
      return matchesCategory && (!query || text.includes(query));
    });
    if (sort === "price") result.sort((a, b) => a.price - b.price);
    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [category, locale, search, sort]);

  const ownCompleted = useMemo(() => {
    const code = referralCode.trim().toUpperCase();
    return store.referrals.filter((referral) => referral.code === code && referral.status !== "Pendiente").length;
  }, [referralCode, store.referrals]);

  const personalized = useMemo(
    () => personalizedVipSavings(store.appointments),
    [store.appointments],
  );

  const openBooking = (item: BarberService) => setCartService(item);
  const closeBooking = () => setCartService(null);

  const pickCategory = (next: Category) => {
    setCategory(next);
    setMobileMenu(false);
    document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFavorite = (id: string) => {
    setStore((current) => ({
      ...current,
      favoriteServiceId: current.favoriteServiceId === id ? "" : id,
    }));
  };

  const confirmBooking = (booking: BookingPayload) => {
    if (!cartService) return;
    const addOnLabels = [
      booking.addons.wash ? t("upsellWash") : null,
      booking.addons.pomade ? t("upsellPomade") : null,
    ].filter(Boolean);
    const appointment: Appointment = {
      id: `AG-${Date.now().toString().slice(-6)}`,
      customer: booking.customer,
      phone: booking.phone,
      email: booking.email,
      shopId: cartService.shopId,
      shopName: cartService.shopName,
      service: [cartService.service, ...addOnLabels].join(" + "),
      date: booking.date,
      time: booking.time,
      amount: booking.total,
      status: "Confirmada",
      referralCode: incomingReferral || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setStore((current) => {
      const offer = current.offer && current.offer.serviceId === cartService.id
        ? { ...current.offer, remaining: Math.max(0, current.offer.remaining - 1) }
        : current.offer;
      return {
        ...current,
        appointments: [appointment, ...current.appointments],
        offer,
        welcomeCouponUsed: true,
      };
    });

    setCartService(null);
    setIncomingReferral("");
    setBookingSuccess(appointment);
    const params = new URLSearchParams(window.location.search);
    params.delete("ref");
    const remainingQuery = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${remainingQuery ? `?${remainingQuery}` : ""}`);
  };

  const simulateFriendReferral = () => {
    if (!bookingSuccess) return;
    const completedAt = new Date().toISOString().slice(0, 10);
    const code = referralCode.trim().toUpperCase();
    const referredAppointment: Appointment = {
      id: `AG-${Date.now().toString().slice(-6)}`,
      customer: "Invitado demo",
      phone: `demo-${Date.now()}`,
      shopId: bookingSuccess.shopId,
      shopName: bookingSuccess.shopName,
      service: bookingSuccess.service,
      date: completedAt,
      time: bookingSuccess.time,
      amount: bookingSuccess.amount,
      status: "Completada",
      referralCode: code,
      createdAt: completedAt,
    };
    const conversion: Referral = {
      id: `ref-${Date.now()}`,
      customer: "Invitado demo",
      code,
      shopId: referredAppointment.shopId,
      shopName: referredAppointment.shopName,
      date: completedAt,
      status: "Recompensado",
      reward: t("posteRewardReady"),
    };
    setStore((current) => ({
      ...current,
      appointments: [referredAppointment, ...current.appointments],
      referrals: [conversion, ...current.referrals],
      referralCredits: current.referralCredits + 1,
    }));
    showMessage(t("toastSeedTitle"), t("toastSeedDetail"), "success");
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      showMessage(t("toastCopiedTitle"), t("toastCopiedDetail"));
    } catch (error) {
      console.error("No se pudo copiar el link de referido:", error);
      showMessage(t("toastCopyErrorTitle"), t("toastCopyErrorDetail"), "error");
    }
  };

  const shareReferral = () => {
    const message = encodeURIComponent(`${t("bookingShareTitle")}: ${referralLink}`);
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
  };

  const shareInstagram = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("brand"),
          text: t("bookingShareTitle"),
          url: referralLink,
        });
        return;
      }
      await navigator.clipboard.writeText(referralLink);
      showMessage(t("toastCopiedTitle"), t("toastCopiedDetail"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("No se pudo compartir el link:", error);
      showMessage(t("toastCopyErrorTitle"), t("toastCopyErrorDetail"), "error");
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
      showMessage(t("toastThemeErrorTitle"), t("toastThemeErrorDetail"), "error");
    }
  };

  const redeemFreeCut = () => {
    if (store.referralCredits <= 0) {
      showMessage(t("toastRedeemEmptyTitle"), t("toastRedeemEmptyDetail"), "error");
      return;
    }
    setStore((current) => ({
      ...current,
      referralCredits: Math.max(0, current.referralCredits - 1),
    }));
    showMessage(t("toastRedeemTitle"), t("toastRedeemDetail"));
  };

  const chooseMembership = (plan: MembershipPlanId, annual: boolean) => {
    setStore((current) => ({
      ...current,
      vipActive: true,
      membership: { plan, annual, pausedUntil: null },
    }));
    showMessage(t("toastVipTitle"), t("toastVipDetail"));
  };

  const cancelMembership = () => {
    setStore((current) => ({
      ...current,
      vipActive: false,
      membership: { plan: null, annual: false, pausedUntil: null },
    }));
    showMessage(t("toastMembershipCancelledTitle"), t("toastMembershipCancelledDetail"));
  };

  const pauseMembership = () => {
    const pausedUntil = new Date();
    pausedUntil.setMonth(pausedUntil.getMonth() + 1);
    setStore((current) => ({
      ...current,
      membership: { ...current.membership, pausedUntil: pausedUntil.toISOString().slice(0, 10) },
    }));
    showMessage(t("toastMembershipPausedTitle"), t("toastMembershipPausedDetail"));
  };

  const bookingStatus = (status: Appointment["status"]) =>
    status === "Completada"
      ? t("statusCompletado")
      : status === "Pendiente"
        ? t("statusPendiente")
        : t("statusConfirmada");

  const toastNode = toast && (
    <div
      role="status"
      className={`fixed bottom-20 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-card border bg-capa p-4 text-tinta shadow-modal sm:bottom-5 ${
        toast.tone === "error"
          ? "border-[color-mix(in_srgb,var(--peligro)_35%,transparent)]"
          : "border-[color-mix(in_srgb,var(--ok)_35%,transparent)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          toast.tone === "error"
            ? "bg-[color-mix(in_srgb,var(--peligro)_12%,transparent)] text-[var(--peligro)]"
            : "bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-[var(--ok)]"
        }`}>
          {toast.tone === "error" ? <X className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
        </span>
        <div className="flex-1">
          <b className="block text-sm">{toast.title}</b>
          <span className="text-xs text-muted">{toast.detail}</span>
        </div>
        <button
          type="button"
          aria-label={t("toastClose")}
          onClick={() => setToast(null)}
          className="flex h-11 w-11 items-center justify-center text-muted"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  if (view === "admin") {
    return (
      <AdminDashboard
        appointments={store.appointments}
        referrals={store.referrals}
        config={store.marketingConfig}
        onSaveConfig={(config) => setStore((current) => ({ ...current, marketingConfig: config }))}
        onExit={() => setView("marketplace")}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (view === "memberships") {
    return (
      <div data-theme={theme} className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-[var(--azulejo)] text-[var(--tinta)]`}>
        <TablaPlanes
          membership={store.membership}
          visits={personalized.visits}
          savings={personalized.savings}
          credits={store.referralCredits}
          onChoose={chooseMembership}
          onCancel={cancelMembership}
          onPause={pauseMembership}
          onBack={() => setView("marketplace")}
        />
        {toastNode}
        <ChatWidget />
      </div>
    );
  }

  return (
    <div data-theme={theme} className={`${theme === "dark" ? "theme-dark" : "theme-light"} min-h-screen bg-[var(--azulejo)] text-[var(--tinta)]`}>
      <a href="#main-content" className="skip-link">{t("skipToContent")}</a>

      <header className="sticky top-0 z-30 border-b border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-3 sm:gap-4 sm:px-7">
          <button
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label={mobileMenu ? t("menuClose") : t("menuOpen")}
            aria-expanded={mobileMenu}
            className="flex h-11 w-11 items-center justify-center rounded-control hover:bg-canvas lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex shrink-0 items-center gap-2 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-control bg-[var(--tinta)] font-display text-xl font-bold text-[var(--azulejo)]">a.</span>
            <span className="hidden sm:block">
              <b className="block text-base font-extrabold leading-4">{t("brand")}</b>
              <small className="text-[9px] font-semibold uppercase tracking-[0.17em] text-muted">{t("brandTagline")}</small>
            </span>
          </button>

          <button type="button" className="hidden shrink-0 items-center gap-1 rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] px-3 py-2 text-left text-[10px] leading-4 xl:flex">
            <MapPin className="h-4 w-4 text-[var(--poste-azul)]" aria-hidden="true" />
            <span>
              <span className="block text-muted">{t("locationLabel")}</span>
              <b>{t("locationValue")}</b>
            </span>
            <ChevronDown className="h-3 w-3 text-muted" aria-hidden="true" />
          </button>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex min-w-0 flex-1"
          >
            <div className="flex w-full overflow-hidden rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa focus-within:border-[var(--poste-azul)]">
              <div className="hidden items-center gap-1 border-r border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] bg-canvas px-3 text-[10px] font-semibold text-muted lg:flex">
                {t("allCategories")}
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              </div>
              <input
                id="market-search"
                aria-label={t("searchLabel")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-xs outline-none sm:text-sm"
              />
              <button type="submit" aria-label={t("searchLabel")} className="flex w-11 items-center justify-center bg-[var(--poste-azul)] text-white">
                <Search className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={() => setLocale(locale === "es-MX" ? "en-US" : "es-MX")}
            aria-label={t("localeToggle")}
            title={t("localeToggle")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] text-[10px] font-bold hover:bg-canvas"
          >
            {locale === "es-MX" ? "EN" : "ES"}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? t("themeToLight") : t("themeToDark")}
            title={theme === "dark" ? t("themeToLight") : t("themeToDark")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] hover:bg-canvas"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>

          <button
            type="button"
            onClick={() => setView("memberships")}
            className="hidden items-center gap-2 rounded-control px-2 py-2 text-left hover:bg-canvas md:flex"
          >
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <span>
              <small className="block text-[9px] text-muted">{t("account")}</small>
              <b className="text-xs">{store.membership.plan ? t("vipActiveLabel") : t("myAccount")}</b>
            </span>
            <ChevronDown className="h-3 w-3 text-muted" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => cartService
              ? openBooking(cartService)
              : showMessage(t("toastCartEmptyTitle"), t("toastCartEmptyDetail"), "error")}
            aria-label={t("cartOpen")}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-control hover:bg-canvas"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            {cartService && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--poste-rojo)] text-[9px] font-bold text-white">1</span>
            )}
          </button>

          <Button size="sm" variant="outline" className="hidden lg:inline-flex" onClick={() => setView("admin")}>
            {t("navAdmin")}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <nav className="hidden border-t border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] bg-capa lg:block">
          <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-7 py-2 text-[11px] font-semibold text-muted">
            <button type="button" onClick={() => pickCategory("Todo")} className="inline-flex items-center gap-1 text-tinta">
              <Menu className="h-4 w-4" aria-hidden="true" />
              {t("allCategories")}
            </button>
            <button type="button" onClick={() => { setCategory("Todo"); setSearch(""); }}>{t("navHome")}</button>
            <button type="button" onClick={() => pickCategory("Corte")}>{t("categoryHaircut")}</button>
            <button type="button" onClick={() => pickCategory("Barba")}>{t("categoryBeard")}</button>
            <button type="button" onClick={() => pickCategory("Combo")}>{t("categoryCombo")}</button>
            <button type="button" onClick={() => setView("memberships")}>{t("navMemberships")}</button>
            <button type="button" onClick={shareReferral} className="ml-auto inline-flex items-center gap-1 text-[var(--poste-azul)]">
              <Gift className="h-3.5 w-3.5" aria-hidden="true" />
              {t("navInvite")}
            </button>
          </div>
        </nav>

        {mobileMenu && (
          <div className="border-t border-[color-mix(in_srgb,var(--cromo)_20%,transparent)] bg-capa px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-2 text-left text-xs font-semibold">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pickCategory(item)}
                  className="min-h-11 rounded-control bg-canvas p-3"
                >
                  {item === "Todo" ? t("allCategories") : item === "Corte" ? t("categoryHaircut") : item === "Barba" ? t("categoryBeard") : t("categoryCombo")}
                </button>
              ))}
              <button type="button" onClick={() => { setView("admin"); setMobileMenu(false); }} className="min-h-11 rounded-control bg-[var(--tinta)] p-3 text-[var(--azulejo)]">
                {t("navAdmin")} ↗
              </button>
              <button type="button" onClick={() => { setView("memberships"); setMobileMenu(false); }} className="min-h-11 rounded-control bg-[color-mix(in_srgb,var(--laton)_16%,transparent)] p-3 text-[var(--laton)]">
                {t("navMemberships")}
              </button>
              <button type="button" onClick={() => { shareReferral(); setMobileMenu(false); }} className="col-span-2 min-h-11 rounded-control bg-[var(--poste-azul)] p-3 text-white">
                {t("navInvite")}
              </button>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" className="mx-auto max-w-[1440px] px-3 pb-28 sm:px-7 sm:pb-12">
        <HeroTurno
          service={nextSlot?.service ?? null}
          slot={nextSlot?.slot ?? null}
          onBook={() => { if (nextSlot) openBooking(nextSlot.service); }}
          onMore={() => document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" })}
          onNotify={() => showMessage(t("toastNotifyTitle"), t("toastNotifyDetail"))}
        />

        <section id="reservas" className="mt-6 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="mb-1 text-xs font-semibold text-[var(--poste-azul)]">{t("serviceSectionEyebrow")}</p>
                <h2 className="mb-1 text-xl font-extrabold tracking-tight sm:text-2xl">{t("serviceSectionTitle")}</h2>
                <p className="mb-0 text-sm text-muted">{t("serviceCount", { n: filteredServices.length })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted">
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("sortLabel")}:
                </div>
                <select
                  aria-label={t("sortLabel")}
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                  className="h-9 rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa px-2 text-[10px] font-semibold outline-none focus:border-[var(--poste-azul)]"
                >
                  <option value="recommended">{t("sortRecommended")}</option>
                  <option value="price">{t("sortPrice")}</option>
                  <option value="rating">{t("sortRating")}</option>
                </select>
              </div>
            </div>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${
                    category === item
                      ? "border-[var(--tinta)] bg-[var(--tinta)] text-[var(--azulejo)]"
                      : "border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa text-muted hover:border-[var(--poste-azul)]"
                  }`}
                >
                  {item === "Todo" ? t("categoryAll") : item === "Corte" ? t("categoryHaircut") : item === "Barba" ? t("categoryBeard") : t("categoryCombo")}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredServices.map((item) => {
                const favorite = store.favoriteServiceId === item.id;
                return (
                  <div key={item.id} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(item.id)}
                      aria-label={favorite ? t("favoriteRemove") : t("favoriteAdd")}
                      aria-pressed={favorite}
                      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-capa/90 text-muted shadow-sm hover:text-[var(--poste-rojo)]"
                    >
                      <Heart className={`h-4 w-4 ${favorite ? "fill-[var(--poste-rojo)] text-[var(--poste-rojo)]" : ""}`} aria-hidden="true" />
                    </button>
                    <ServiceCard item={item} onBook={openBooking} />
                  </div>
                );
              })}
              {!filteredServices.length && (
                <div className="col-span-full rounded-card border border-dashed border-[color-mix(in_srgb,var(--cromo)_35%,transparent)] bg-capa p-10 text-center">
                  <CircleHelp className="mx-auto mb-2 h-6 w-6 text-muted" aria-hidden="true" />
                  <p className="mb-1 text-sm font-bold">{t("filterEmptyTitle")}</p>
                  <p className="mb-0 text-xs text-muted">{t("filterEmptyDetail")}</p>
                </div>
              )}
            </div>

            <section className="mt-8 rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-5 sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="max-w-xl">
                  <div className="mb-2 inline-flex min-h-11 items-center gap-2 rounded-control bg-[color-mix(in_srgb,var(--laton)_10%,transparent)] px-3 text-xs font-semibold text-[var(--laton)]">
                    <Crown className="h-4 w-4" aria-hidden="true" />
                    {t("navMemberships")}
                  </div>
                  <h2 className="mb-2 text-xl font-extrabold">{t("vipTitle")}</h2>
                  <p className="mb-0 text-sm leading-6 text-muted">{t("membershipIntro")}</p>
                </div>
                <Button variant="outline" onClick={() => setView("memberships")}>
                  {t("vipCta")}
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </section>
          </div>

          <div className="min-w-0">
            <MarketingSidebar
              referralLink={referralLink}
              credits={store.referralCredits}
              completedCount={ownCompleted}
              savings={personalized.savings}
              vipActive={Boolean(store.membership.plan)}
              offer={store.offer}
              onVIP={() => setView("memberships")}
              onCopy={copyReferralLink}
              onShare={shareReferral}
              onRedeem={redeemFreeCut}
              onBookOffer={() => {
                if (offerService) openBooking(offerService);
                else document.getElementById("reservas")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-7">
          <span><b className="text-tinta">{t("brand")}</b> · {t("brandTagline")}</span>
          <span>
            {t("footerNote")} · <button type="button" onClick={() => setView("admin")} className="min-h-11 font-semibold text-[var(--poste-azul)] hover:underline">{t("footerAdmin")} ↗</button>
          </span>
        </div>
      </footer>

      <nav aria-label={t("navHome")} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 backdrop-blur lg:hidden">
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold">
          <Home className="h-5 w-5" aria-hidden="true" />
          {t("navHome")}
        </button>
        <button type="button" onClick={() => { document.getElementById("market-search")?.focus(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold">
          <Search className="h-5 w-5" aria-hidden="true" />
          {t("navSearch")}
        </button>
        <button type="button" onClick={() => setBookingsOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold">
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          {t("navAppointments")}
        </button>
        <button type="button" onClick={() => setView("memberships")} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold">
          <UserRound className="h-5 w-5" aria-hidden="true" />
          {t("navProfile")}
        </button>
      </nav>

      {cartService && (
        <BookingDialog
          item={cartService}
          referralCode={incomingReferral}
          couponActive={!store.welcomeCouponUsed}
          couponAmount={store.marketingConfig.newCustomerCoupon}
          onClose={closeBooking}
          onConfirm={confirmBooking}
        />
      )}

      {bookingSuccess && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingSuccess(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
            onKeyDown={(event) => handleDialogKeyboard(event, () => setBookingSuccess(null))}
            className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-sheet border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa p-6 text-tinta shadow-modal sm:p-8"
          >
            <button
              type="button"
              aria-label={t("menuClose")}
              onClick={() => setBookingSuccess(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-canvas"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-[color-mix(in_srgb,var(--ok)_12%,transparent)] text-[var(--ok)]">
              <Check className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mb-1 text-xs font-semibold text-[var(--ok)]">{t("bookingSuccessTitle")} · {bookingSuccess.id}</p>
            <h2 id="success-title" className="mb-2 text-2xl font-extrabold">
              {t("bookingSuccessBody", {
                day: formatDateLong(bookingSuccess.date, locale),
                time: formatClock(bookingSuccess.time, locale),
              })}
            </h2>
            <p className="mb-4 text-sm leading-6 text-muted">
              {t("bookingSuccessNote", {
                id: bookingSuccess.id,
                shop: bookingSuccess.shopName,
                amount: money(bookingSuccess.amount, locale),
              })}
            </p>

            <div className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-canvas p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-extrabold">
                <Gift className="h-4 w-4 text-[var(--poste-rojo)]" aria-hidden="true" />
                {t("bookingShareTitle")}
              </div>
              <p className="mb-3 text-xs leading-5 text-muted">
                {t("bookingShareBody", { amount: money(store.marketingConfig.newCustomerCoupon, locale) })}
              </p>
              <code className="block min-h-11 truncate rounded-control border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa px-3 py-3 text-xs text-muted">{referralLink}</code>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="primary" onClick={shareReferral}>
                  <span aria-hidden="true">◉</span> WhatsApp
                </Button>
                <Button size="sm" variant="outline" onClick={shareInstagram}>
                  <Instagram className="h-4 w-4" aria-hidden="true" />
                  {t("posteShare")}
                </Button>
              </div>
              <Button className="mt-3 w-full" size="sm" variant="outline" onClick={simulateFriendReferral}>
                {t("successSimulate")}
              </Button>
              <p className="mb-0 mt-2 text-[10px] leading-4 text-muted">{t("successSimulateNote")}</p>
            </div>

            <Button variant="primary" className="mt-4 w-full" onClick={() => setBookingSuccess(null)}>
              {t("bookingDone")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {bookingsOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setBookingsOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bookings-title"
            onKeyDown={(event) => handleDialogKeyboard(event, () => setBookingsOpen(false))}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-sheet bg-capa p-5 text-tinta sm:rounded-sheet"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 id="bookings-title" className="mb-1 text-lg font-bold">{t("navAppointments")}</h2>
                <p className="mb-0 text-xs text-muted">{t("appointmentsSubtitle")}</p>
              </div>
              <button
                type="button"
                aria-label={t("menuClose")}
                onClick={() => setBookingsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-control hover:bg-canvas"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {store.appointments.length ? (
              <div className="divide-y divide-[color-mix(in_srgb,var(--cromo)_20%,transparent)]">
                {store.appointments.slice(0, 8).map((appointment) => (
                  <article key={appointment.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <h3 className="mb-1 text-sm font-semibold">{appointment.service}</h3>
                      <p className="mb-0 text-xs text-muted">
                        {appointment.shopName} · {formatDateShort(appointment.date, locale)} · {formatClock(appointment.time, locale)}
                      </p>
                      <p className="mb-0 mt-1 text-xs text-muted">{bookingStatus(appointment.status)}</p>
                    </div>
                    <b className="shrink-0 text-sm tabular-nums">{money(appointment.amount, locale)}</b>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-card bg-canvas p-4">
                <b className="text-sm">{t("appointmentsEmptyTitle")}</b>
                <p className="mb-0 mt-1 text-xs text-muted">{t("appointmentsEmptyDetail")}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {toastNode}
      <ChatWidget />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("navHome")}
        className="fixed bottom-24 right-4 z-20 hidden h-10 w-10 items-center justify-center rounded-full bg-capa text-tinta shadow-modal hover:bg-canvas sm:flex"
      >
        <ArrowDown className="h-4 w-4 rotate-180" aria-hidden="true" />
      </button>
    </div>
  );
}
