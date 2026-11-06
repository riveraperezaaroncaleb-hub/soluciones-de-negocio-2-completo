"use client";

import { Clock3, MapPin, Star } from "lucide-react";
import type { BarberService } from "@/lib/data";
import { formatMoney } from "@/lib/data";
import { Button } from "@/components/ui/button";

type ServiceCardProps = {
  item: BarberService;
  onBook: (item: BarberService) => void;
};

export function ServiceCard({ item, onBook }: ServiceCardProps) {
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-[var(--poste-azul)]">
      <div
        className="shop-image relative h-40 sm:h-44"
        style={{
        backgroundImage: `linear-gradient(180deg,rgba(11,15,23,.02),rgba(11,15,23,.48)),url(https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=800&q=80)`,
        }}
      >
        {item.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-ink">
            {item.badge}
          </span>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-[#0b0f17]/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
          {item.category}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 truncate text-xs font-semibold text-leaf">{item.shopName}</p>
            <h3 className="mb-1 text-base font-bold tracking-tight">{item.service}</h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-xs font-bold">
            <Star aria-hidden="true" className="h-3.5 w-3.5 fill-[var(--laton)] text-[var(--laton)]" />
            {item.rating.toFixed(1)}
          </div>
        </div>
        <p className="line-clamp-2 mb-3 min-h-9 text-xs leading-5 text-muted">{item.description}</p>
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{item.neighborhood}</span>
          <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{item.duration} min</span>
          <span className="inline-flex items-center gap-1" aria-label={`${item.rating.toFixed(1)} de 5, ${item.reviews} reseñas de ejemplo`}><Star aria-hidden="true" className="h-3 w-3" />{item.reviews} reseñas demo</span>
        </div>
        <div className="flex items-end justify-between gap-2 border-t border-gray-100 pt-3">
          <div>
            <div className="text-lg font-extrabold tabular-nums">{formatMoney(item.price)}</div>
            <div className="text-[11px] text-muted">Precio de muestra</div>
          </div>
          <Button size="sm" variant="primary" aria-label={`Reservar ${item.service} en ${item.shopName}`} onClick={() => onBook(item)}>
            Reservar
          </Button>
        </div>
      </div>
    </article>
  );
}
