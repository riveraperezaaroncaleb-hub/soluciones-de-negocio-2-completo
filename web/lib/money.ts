export type Locale = "es-MX" | "en-US";

export const SHOP_TIME_ZONE = "America/Mexico_City";

export const money = (value: number, locale: Locale = "es-MX") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);

export type Slot = { dayOffset: 0 | 1; time: string };

export function slotToDate(slot: Slot, now = new Date()) {
  const [hours, minutes] = slot.time.split(":").map(Number);
  const date = new Date(now);
  date.setDate(date.getDate() + slot.dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function formatTime(slot: Slot, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SHOP_TIME_ZONE,
  }).format(slotToDate(slot));
}

export function formatClock(time: string, locale: Locale) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export function formatSlotLabel(slot: Slot, locale: Locale) {
  const day = slot.dayOffset === 0
    ? (locale === "es-MX" ? "Hoy" : "Today")
    : (locale === "es-MX" ? "Mañana" : "Tomorrow");
  return `${day} ${formatTime(slot, locale)}`;
}

export function formatDateLong(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: SHOP_TIME_ZONE,
  }).format(new Date(`${date}T12:00:00`));
}

export function formatDateShort(date: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: SHOP_TIME_ZONE,
  }).format(new Date(`${date}T12:00:00`));
}

export function formatMonth(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { month: "short", timeZone: SHOP_TIME_ZONE }).format(date);
}

export function formatCountdown(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}
