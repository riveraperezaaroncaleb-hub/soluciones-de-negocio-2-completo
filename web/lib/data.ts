import type { Locale, Slot } from "@/lib/money";

export type ServiceOffer = {
  id: string;
  price: number;
  anchorPrice: number;
};

export type BarberService = {
  id: string;
  shopId: string;
  shopName: string;
  neighborhood: string;
  service: string;
  category: "Corte" | "Barba" | "Combo";
  description: string;
  price: number;
  rating: number;
  reviews: number;
  duration: number;
  image: string;
  badge?: string;
  weeklyBookings?: number;
  nextSlot: Slot | null;
  offer?: ServiceOffer;
  favoriteBarber?: string;
};

export type Appointment = {
  id: string;
  customer: string;
  phone: string;
  email?: string;
  shopId: string;
  shopName: string;
  service: string;
  date: string;
  time: string;
  amount: number;
  status: "Confirmada" | "Completada" | "Pendiente";
  referralCode?: string;
  createdAt: string;
};

export type Referral = {
  id: string;
  customer: string;
  code: string;
  shopId: string;
  shopName: string;
  date: string;
  status: "Pendiente" | "Completado" | "Recompensado";
  reward: string;
};

export type StoreOffer = {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  price: number;
  anchorPrice: number;
  inventoryLimit: number;
  remaining: number;
  startsAt: string;
  endsAt: string;
  isDemo: true;
};

export type MembershipPlanId = "basic" | "vip" | "family";

export type MembershipState = {
  plan: MembershipPlanId | null;
  annual: boolean;
  pausedUntil?: string | null;
};

export type MarketingConfig = {
  newCustomerCoupon: number;
  platformCommission: number;
  acquisitionSpend: number | null;
};

export type StoreData = {
  appointments: Appointment[];
  referrals: Referral[];
  referralCredits: number;
  vipActive: boolean;
  welcomeCouponUsed: boolean;
  favoriteServiceId: string;
  offer: StoreOffer | null;
  membership: MembershipState;
  marketingConfig: MarketingConfig;
};

export const services: BarberService[] = [
  {
    id: "navaja-corte",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    neighborhood: "Roma Norte, CDMX",
    service: "Corte Clásico",
    category: "Corte",
    description: "Asesoría de estilo, corte a tijera o máquina y acabado premium.",
    price: 15,
    rating: 4.9,
    reviews: 248,
    duration: 35,
    image: "photo-1503951914875-452162b0f3f1",
    weeklyBookings: 37,
    nextSlot: { dayOffset: 0, time: "16:30" },
    favoriteBarber: "Mateo",
  },
  {
    id: "navaja-barba",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    neighborhood: "Roma Norte, CDMX",
    service: "Perfilado de barba",
    category: "Barba",
    description: "Toalla caliente, navaja tradicional y bálsamo hidratante.",
    price: 12,
    rating: 4.9,
    reviews: 126,
    duration: 25,
    image: "photo-1621605815971-fbc98d665033",
    badge: "Toalla caliente",
    weeklyBookings: 21,
    nextSlot: { dayOffset: 0, time: "18:00" },
    favoriteBarber: "Mateo",
  },
  {
    id: "navaja-combo",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    neighborhood: "Roma Norte, CDMX",
    service: "Combo Premium (Corte + Barba + Toalla Caliente)",
    category: "Combo",
    description: "El ritual completo de corte, barba y toalla caliente.",
    price: 18,
    rating: 5.0,
    reviews: 94,
    duration: 60,
    image: "photo-1599351431202-1e0f0137899a",
    weeklyBookings: 14,
    nextSlot: { dayOffset: 0, time: "17:30" },
    offer: { id: "oferta-combo", price: 18, anchorPrice: 25 },
    favoriteBarber: "Mateo",
  },
  {
    id: "norte-corte",
    shopId: "norte-studio",
    shopName: "Norte Studio",
    neighborhood: "Condesa, CDMX",
    service: "Corte de autor",
    category: "Corte",
    description: "Un corte personalizado para llevar tu estilo al siguiente nivel.",
    price: 19,
    rating: 4.8,
    reviews: 173,
    duration: 40,
    image: "photo-1599351431202-1e0f0137899a",
    weeklyBookings: 29,
    nextSlot: { dayOffset: 1, time: "10:30" },
    favoriteBarber: "Renata",
  },
  {
    id: "norte-combo",
    shopId: "norte-studio",
    shopName: "Norte Studio",
    neighborhood: "Condesa, CDMX",
    service: "Corte + barba premium",
    category: "Combo",
    description: "Diseño de barba, corte y acabado con productos premium.",
    price: 24,
    rating: 4.8,
    reviews: 88,
    duration: 65,
    image: "photo-1621605815971-fbc98d665033",
    weeklyBookings: 11,
    nextSlot: { dayOffset: 1, time: "12:00" },
    favoriteBarber: "Renata",
  },
  {
    id: "sur-barba",
    shopId: "barrio-sur",
    shopName: "Barrio Sur Barbería",
    neighborhood: "Del Valle, CDMX",
    service: "Barba y ritual",
    category: "Barba",
    description: "Relájate con vapor, toalla caliente y un perfilado preciso.",
    price: 14,
    rating: 4.7,
    reviews: 71,
    duration: 30,
    image: "photo-1622286342621-4bd786c2447c",
    weeklyBookings: 18,
    nextSlot: { dayOffset: 0, time: "19:00" },
    favoriteBarber: "Diego",
  },
  {
    id: "sur-corte",
    shopId: "barrio-sur",
    shopName: "Barrio Sur Barbería",
    neighborhood: "Del Valle, CDMX",
    service: "Corte y lavado",
    category: "Corte",
    description: "Corte fresco con lavado y masaje capilar incluido.",
    price: 15,
    rating: 4.7,
    reviews: 109,
    duration: 40,
    image: "photo-1503951914875-452162b0f3f1",
    weeklyBookings: 23,
    nextSlot: { dayOffset: 1, time: "11:00" },
    favoriteBarber: "Diego",
  },
  {
    id: "navaja-lavado",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    neighborhood: "Roma Norte, CDMX",
    service: "Lavado capilar premium",
    category: "Combo",
    description: "Lavado profundo, masaje capilar y pomada de peinado.",
    price: 3,
    rating: 4.9,
    reviews: 52,
    duration: 30,
    image: "photo-1599351431202-1e0f0137899a",
    nextSlot: null,
    favoriteBarber: "Mateo",
  },
];

export const initialReferrals: Referral[] = [
  {
    id: "ref-1001",
    customer: "Diego R.",
    code: "DIEGO-SHARE-123",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    date: "2026-11-05",
    status: "Recompensado",
    reward: "1 corte gratis",
  },
  {
    id: "ref-1002",
    customer: "Sofía M.",
    code: "SOFIA-CLIP-829",
    shopId: "norte-studio",
    shopName: "Norte Studio",
    date: "2026-11-04",
    status: "Completado",
    reward: "1 corte gratis",
  },
  {
    id: "ref-1003",
    customer: "Andrés P.",
    code: "ANDRES-STYLE-522",
    shopId: "barrio-sur",
    shopName: "Barrio Sur Barbería",
    date: "2026-11-03",
    status: "Pendiente",
    reward: "Al reservar",
  },
  {
    id: "ref-1004",
    customer: "Carlos V.",
    code: "CARLOS-BARBER",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    date: "2026-11-01",
    status: "Recompensado",
    reward: "1 corte gratis",
  },
];

export const initialAppointments: Appointment[] = [
  {
    id: "AG-2041",
    customer: "Mariana Torres",
    phone: "555 017 2291",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    service: "Corte clásico",
    date: "2026-11-06",
    time: "11:30",
    amount: 15,
    status: "Confirmada",
    createdAt: "2026-11-06",
  },
  {
    id: "AG-2040",
    customer: "Diego Ruiz",
    phone: "555 013 4472",
    shopId: "norte-studio",
    shopName: "Norte Studio",
    service: "Corte + barba premium",
    date: "2026-11-06",
    time: "12:00",
    amount: 24,
    status: "Completada",
    referralCode: "DIEGO-SHARE-123",
    createdAt: "2026-11-05",
  },
  {
    id: "AG-2039",
    customer: "Luis Hernández",
    phone: "555 011 8960",
    shopId: "barrio-sur",
    shopName: "Barrio Sur Barbería",
    service: "Barba y ritual",
    date: "2026-11-06",
    time: "13:15",
    amount: 14,
    status: "Pendiente",
    createdAt: "2026-11-04",
  },
  {
    id: "AG-2038",
    customer: "Mariana Torres",
    phone: "555 017 2291",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    service: "Combo Premium",
    date: "2026-10-22",
    time: "17:30",
    amount: 18,
    status: "Completada",
    createdAt: "2026-10-20",
  },
  {
    id: "AG-2037",
    customer: "Mariana Torres",
    phone: "555 017 2291",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    service: "Corte clásico",
    date: "2026-10-08",
    time: "16:00",
    amount: 15,
    status: "Completada",
    createdAt: "2026-10-06",
  },
  {
    id: "AG-2036",
    customer: "Mariana Torres",
    phone: "555 017 2291",
    shopId: "casa-navaja",
    shopName: "Casa Navaja",
    service: "Perfilado de barba",
    date: "2026-09-24",
    time: "18:30",
    amount: 12,
    status: "Completada",
    createdAt: "2026-09-22",
  },
];

export const DEMO_OFFER_DURATION_MS = (2 * 60 * 60 + 14 * 60 + 9) * 1000;

export function createDemoOffer(now = new Date()): StoreOffer {
  return {
    id: "oferta-combo",
    serviceId: "navaja-combo",
    title: "Corte + barba",
    description: "Combo Premium con toalla caliente",
    price: 18,
    anchorPrice: 25,
    inventoryLimit: 12,
    remaining: 2,
    startsAt: now.toISOString(),
    endsAt: new Date(now.getTime() + DEMO_OFFER_DURATION_MS).toISOString(),
    isDemo: true,
  };
}

export const defaultMarketingConfig: MarketingConfig = {
  newCustomerCoupon: 5,
  platformCommission: 8,
  acquisitionSpend: null,
};

export function isStoreOffer(value: unknown): value is StoreOffer {
  if (!value || typeof value !== "object") return false;
  const offer = value as Partial<StoreOffer>;
  return typeof offer.id === "string"
    && typeof offer.serviceId === "string"
    && typeof offer.title === "string"
    && typeof offer.price === "number"
    && typeof offer.anchorPrice === "number"
    && typeof offer.inventoryLimit === "number"
    && typeof offer.remaining === "number"
    && typeof offer.startsAt === "string"
    && typeof offer.endsAt === "string";
}

export function normalizeStoreData(value: unknown): StoreData | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<StoreData>;
  if (!Array.isArray(candidate.appointments) || !Array.isArray(candidate.referrals)) return null;

  const marketing: Partial<MarketingConfig> = candidate.marketingConfig && typeof candidate.marketingConfig === "object"
    ? candidate.marketingConfig
    : {};

  return {
    appointments: candidate.appointments,
    referrals: candidate.referrals,
    referralCredits: typeof candidate.referralCredits === "number" ? candidate.referralCredits : 0,
    vipActive: Boolean(candidate.vipActive),
    welcomeCouponUsed: Boolean(candidate.welcomeCouponUsed),
    favoriteServiceId: typeof candidate.favoriteServiceId === "string"
      ? candidate.favoriteServiceId
      : "navaja-corte",
    offer: isStoreOffer(candidate.offer) ? candidate.offer : null,
    membership: candidate.membership && typeof candidate.membership === "object"
      ? {
          plan: candidate.membership.plan === "basic" || candidate.membership.plan === "vip" || candidate.membership.plan === "family"
            ? candidate.membership.plan
            : null,
          annual: Boolean(candidate.membership.annual),
          pausedUntil: typeof candidate.membership.pausedUntil === "string" ? candidate.membership.pausedUntil : null,
        }
      : { plan: null, annual: false, pausedUntil: null },
    marketingConfig: {
      newCustomerCoupon: typeof marketing.newCustomerCoupon === "number"
        ? marketing.newCustomerCoupon
        : defaultMarketingConfig.newCustomerCoupon,
      platformCommission: typeof marketing.platformCommission === "number"
        ? marketing.platformCommission
        : defaultMarketingConfig.platformCommission,
      acquisitionSpend: typeof candidate.marketingConfig?.acquisitionSpend === "number"
        ? candidate.marketingConfig.acquisitionSpend
        : null,
    },
  };
}

export const formatMoney = (amount: number) => new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(amount);

export const formatDate = (date: string, locale: Locale = "es-MX") =>
  new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
