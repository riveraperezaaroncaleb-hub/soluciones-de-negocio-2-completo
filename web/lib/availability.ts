import type { BarberService } from "@/lib/data";
import type { Slot } from "@/lib/money";
import { slotToDate } from "@/lib/money";

export type AvailableService = BarberService & { nextSlot: Slot };

export function hasSlot(service: BarberService): service is AvailableService {
  return Boolean(service.nextSlot);
}

export function findNextSlot(list: BarberService[], favoriteServiceId: string, now = new Date()) {
  const available = list.filter(hasSlot);
  if (!available.length) return null;

  const sorted = [...available].sort((a, b) =>
    slotToDate(a.nextSlot, now).getTime() - slotToDate(b.nextSlot, now).getTime());

  const favorite = available.find((service) => service.id === favoriteServiceId);
  const earliest = sorted[0];

  if (favorite && favorite.nextSlot.dayOffset === 0 && earliest.nextSlot.dayOffset === 0) {
    return { service: favorite, slot: favorite.nextSlot };
  }

  return { service: earliest, slot: earliest.nextSlot };
}

export function todaySlots(list: BarberService[]) {
  return list.filter((service) => service.nextSlot?.dayOffset === 0);
}
