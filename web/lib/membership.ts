import type { Appointment, MembershipPlanId } from "@/lib/data";

export const AVERAGE_VISIT = 25;

export type Plan = {
  id: MembershipPlanId;
  nameKey: "planBasic" | "planVip" | "planFamily";
  price: number;
  visits: number;
  family: boolean;
};

export const plans: Plan[] = [
  { id: "basic", nameKey: "planBasic", price: 19, visits: 1, family: false },
  { id: "vip", nameKey: "planVip", price: 39, visits: 3, family: false },
  { id: "family", nameKey: "planFamily", price: 59, visits: 6, family: true },
];

export function planSavings(plan: Plan, averageVisit = AVERAGE_VISIT) {
  return Math.max(0, plan.visits * averageVisit - plan.price);
}

export function annualPrice(plan: Plan) {
  return plan.price * 10;
}

export function annualDiscount(plan: Plan) {
  return Math.round((1 - annualPrice(plan) / (plan.price * 12)) * 100);
}

export function visitsInLastDays(appointments: Appointment[], days = 60, now = new Date()) {
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  const fromKey = from.toISOString().slice(0, 10);
  return appointments.filter((appointment) =>
    appointment.status === "Completada" && appointment.date >= fromKey).length;
}

export function personalizedVipSavings(appointments: Appointment[], now = new Date()) {
  const visits = visitsInLastDays(appointments, 60, now);
  return {
    visits,
    savings: Math.max(0, visits * AVERAGE_VISIT - 39),
  };
}
