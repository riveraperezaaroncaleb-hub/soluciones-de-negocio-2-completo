"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type PosteProgresoProps = {
  valor: number;
  meta: number;
  etiqueta: string;
  variante: "referido" | "membresia" | "oferta";
  ariaValuetext?: string;
  activo?: boolean;
  className?: string;
};

export function PosteProgreso({
  valor,
  meta,
  etiqueta,
  variante,
  ariaValuetext,
  activo,
  className,
}: PosteProgresoProps) {
  const safeMeta = Math.max(1, meta);
  const safeValue = Math.min(Math.max(valor, 0), safeMeta);
  const percent = (safeValue / safeMeta) * 100;
  const complete = safeValue >= safeMeta;

  return (
    <div
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMeta}
      aria-label={etiqueta}
      aria-valuetext={ariaValuetext ?? `${safeValue} / ${safeMeta}`}
      data-variante={variante}
      data-activo={activo ?? (!complete && safeValue > 0)}
      data-complete={complete}
      className={cn("poste h-3 overflow-hidden rounded-full", className)}
      style={{ "--p": `${percent}%` } as CSSProperties & { "--p": string }}
    />
  );
}
