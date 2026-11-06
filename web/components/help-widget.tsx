"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

const answers: Record<string, string> = {
  "¿Cómo funciona el referido?": "Comparte tu enlace. En esta demo, el crédito se registra cuando se simula que la persona invitada completó su cita.",
  "¿Cuánto cuesta VIP?": "El precio de muestra es de USD 39 al mes. No se procesa ningún pago y puedes cerrar este panel cuando quieras.",
  "Cambiar mi cita": "Esta demo guarda las citas en tu navegador. Contacta directamente a la barbería para confirmar un cambio real.",
};

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-5 sm:right-5">
      {open && <section role="dialog" aria-label="Ayuda de Agendo Pro" className="mb-3 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-gray-200 bg-white p-4 text-ink">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div><h2 className="mb-0 text-sm font-bold">¿En qué te ayudo?</h2><p className="mb-0 text-xs text-muted">Elige un tema para ver una respuesta.</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar ayuda" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-canvas"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-2">
          {Object.keys(answers).map((question) => <button key={question} type="button" onClick={() => setAnswer(answers[question])} className="min-h-11 rounded-lg border border-gray-200 px-3 py-2 text-left text-xs font-medium hover:bg-canvas">{question}</button>)}
        </div>
        {answer && <p role="status" className="mb-0 mt-3 rounded-lg bg-canvas p-3 text-xs leading-5">{answer}</p>}
        <p className="mb-0 mt-3 border-t border-gray-100 pt-3 text-[10px] leading-4 text-muted">Nunca compartas contraseñas, tarjetas ni datos fiscales aquí. Este panel no envía ni guarda mensajes.</p>
      </section>}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"} aria-expanded={open} className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--poste-azul)] text-white">
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
