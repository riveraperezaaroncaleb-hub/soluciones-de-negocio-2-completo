export type BarberService = {
  id: string;
  shopId: string;
  shopName: string;
  neighborhood: string;
  service: string;
  category: "Corte" | "Barba" | "Combo";
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  duration: number;
  image: string;
  badge?: string;
};

export type Appointment = {
  id: string;
  customer: string;
  phone: string;
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

export type StoreData = {
  appointments: Appointment[];
  referrals: Referral[];
  referralCredits: number;
  vipActive: boolean;
  welcomeCouponUsed: boolean;
  marketingConfig: {
    newCustomerCoupon: number;
    platformCommission: number;
  };
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
    originalPrice: 25,
    rating: 4.9,
    reviews: 248,
    duration: 35,
    image: "photo-1503951914875-452162b0f3f1",
    badge: "Más vendido",
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
    originalPrice: 30,
    rating: 5.0,
    reviews: 94,
    duration: 60,
    image: "photo-1599351431202-1e0f0137899a",
    badge: "MÁS POPULAR",
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
    badge: "Barbería destacada",
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
    originalPrice: 32,
    rating: 4.8,
    reviews: 88,
    duration: 65,
    image: "photo-1621605815971-fbc98d665033",
    badge: "Oferta de hoy",
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
    originalPrice: 20,
    rating: 4.7,
    reviews: 109,
    duration: 40,
    image: "photo-1503951914875-452162b0f3f1",
    badge: "Ahorra $50",
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
    originalPrice: 10,
    rating: 4.9,
    reviews: 52,
    duration: 30,
    image: "photo-1599351431202-1e0f0137899a",
    badge: "Suscripción",
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
    amount: 250,
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
    amount: 430,
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
    amount: 210,
    status: "Pendiente",
    createdAt: "2026-11-04",
  },
];

export const revenueByMonth = [
  { month: "Jun", revenue: 42800, bookings: 172 },
  { month: "Jul", revenue: 51200, bookings: 204 },
  { month: "Ago", revenue: 47600, bookings: 192 },
  { month: "Sep", revenue: 63800, bookings: 251 },
  { month: "Oct", revenue: 71400, bookings: 286 },
  { month: "Nov", revenue: 82600, bookings: 324 },
];

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(`${date}T12:00:00`),
  );
