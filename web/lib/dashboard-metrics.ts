import type { Appointment, Referral } from "@/lib/data";

type DashboardFilters = {
  shopId: string | null;
  fromDate: string;
  toDate: string;
  acquisitionSpend: number | null;
  now?: Date;
};

type MonthMetric = {
  month: string;
  revenue: number;
  bookings: number;
};

export type DashboardMetrics = {
  bookings: number;
  completedBookings: number;
  revenue: number;
  activeCustomers: number;
  newCustomers: number;
  cac: number | null;
  ltv: number | null;
  ltvToCac: number | null;
  referralConversion: number | null;
  referrals: number;
  convertedReferrals: number;
  rewardedReferrals: number;
  referredBookings: number;
  monthly: MonthMetric[];
};

function customerKey(appointment: Appointment) {
  const phone = appointment.phone.replace(/\D/g, "");
  if (phone) return `${appointment.shopId}:phone:${phone}`;
  const email = appointment.email?.trim().toLocaleLowerCase("es-MX");
  return email
    ? `${appointment.shopId}:email:${email}`
    : `${appointment.shopId}:name:${appointment.customer.trim().toLocaleLowerCase("es-MX")}`;
}

function inRange(date: string, fromDate: string, toDate: string) {
  const day = date.slice(0, 10);
  return (!fromDate || day >= fromDate) && (!toDate || day <= toDate);
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

export function calculateDashboardMetrics(
  appointments: Appointment[],
  referrals: Referral[],
  filters: DashboardFilters,
): DashboardMetrics {
  const scopedAppointments = appointments.filter((appointment) =>
    !filters.shopId || appointment.shopId === filters.shopId);
  const periodAppointments = scopedAppointments.filter((appointment) =>
    inRange(appointment.date, filters.fromDate, filters.toDate));
  const completedInPeriod = periodAppointments.filter((appointment) => appointment.status === "Completada");
  const bookedCustomers = new Set(periodAppointments.map(customerKey));
  const completedRevenue = completedInPeriod.reduce((sum, appointment) => sum + appointment.amount, 0);

  const firstAppointmentByCustomer = new Map<string, string>();
  const lifetimeCompletedRevenue = new Map<string, number>();
  for (const appointment of scopedAppointments) {
    const key = customerKey(appointment);
    const currentFirst = firstAppointmentByCustomer.get(key);
    if (!currentFirst || appointment.createdAt < currentFirst) {
      firstAppointmentByCustomer.set(key, appointment.createdAt);
    }
    if (appointment.status === "Completada") {
      lifetimeCompletedRevenue.set(
        key,
        (lifetimeCompletedRevenue.get(key) || 0) + appointment.amount,
      );
    }
  }

  const newCustomers = [...firstAppointmentByCustomer.values()]
    .filter((date) => inRange(date, filters.fromDate, filters.toDate)).length;
  const payingCustomers = lifetimeCompletedRevenue.size;
  const lifetimeRevenue = [...lifetimeCompletedRevenue.values()].reduce((sum, amount) => sum + amount, 0);
  const cac = newCustomers > 0 && filters.acquisitionSpend !== null
    ? filters.acquisitionSpend / newCustomers
    : null;
  const ltv = payingCustomers > 0 ? lifetimeRevenue / payingCustomers : null;

  const scopedReferrals = referrals.filter((referral) =>
    (!filters.shopId || referral.shopId === filters.shopId)
    && inRange(referral.date, filters.fromDate, filters.toDate));
  const convertedReferrals = scopedReferrals.filter((referral) =>
    referral.status === "Completado" || referral.status === "Recompensado").length;
  const rewardedReferrals = scopedReferrals.filter((referral) =>
    referral.status === "Recompensado").length;
  const referredBookings = periodAppointments.filter((appointment) => Boolean(appointment.referralCode)).length;

  const now = filters.now || new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const months: MonthMetric[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - offset, 1);
    const key = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
    const monthAppointments = periodAppointments.filter((appointment) =>
      monthKey(appointment.date) === key);
    months.push({
      month: new Intl.DateTimeFormat("es-MX", { month: "short" }).format(monthStart),
      revenue: monthAppointments
        .filter((appointment) => appointment.status === "Completada")
        .reduce((sum, appointment) => sum + appointment.amount, 0),
      bookings: monthAppointments.length,
    });
  }

  return {
    bookings: periodAppointments.length,
    completedBookings: completedInPeriod.length,
    revenue: completedRevenue,
    activeCustomers: bookedCustomers.size,
    newCustomers,
    cac,
    ltv,
    ltvToCac: ltv !== null && cac !== null && cac > 0 ? ltv / cac : null,
    referralConversion: scopedReferrals.length
      ? convertedReferrals / scopedReferrals.length
      : null,
    referrals: scopedReferrals.length,
    convertedReferrals,
    rewardedReferrals,
    referredBookings,
    monthly: months,
  };
}
