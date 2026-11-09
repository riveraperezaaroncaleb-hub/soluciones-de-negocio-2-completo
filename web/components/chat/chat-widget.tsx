"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MessageCircle, Send, ShieldCheck, X } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n";

type ChatMessage = { id: number; role: "user" | "bot"; text: string };

const SENSITIVE = /(?:\d[ -]*?){13,19}|\bcvv\b|\bcvc\b|c[oó]digo de seguridad|contrase(?:ñ|n)a|password|\brfc\b|\bcurp\b|\bnss\b|datos fiscales/i;

function maskSensitive(text: string) {
  return text
    .replace(/(?:\d[ -]*?){13,19}/g, (match) => "•".repeat(match.replace(/\D/g, "").length))
    .replace(/\b\d{3,}\b/g, (match) => "•".repeat(match.length));
}

const CHIPS: { key: MessageKey; answer: MessageKey; match: RegExp }[] = [
  { key: "chatChipReferral", answer: "chatAnswerReferral", match: /referid|invit|enlace|ref=/i },
  { key: "chatChipVip", answer: "chatAnswerVip", match: /vip|membres|plan|precio/i },
  { key: "chatChipChange", answer: "chatAnswerChange", match: /cambiar|mover|reagendar|cita/i },
  { key: "chatChipHours", answer: "chatAnswerHours", match: /horari|turno|reserv|disponib/i },
];

export function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const push = (role: ChatMessage["role"], text: string) => {
    setMessages((current) => [...current, { id: Date.now() + current.length, role, text }]);
  };

  const answerFor = (text: string) => {
    const chip = CHIPS.find((item) => item.match.test(text));
    return t(chip?.answer ?? "chatFallback");
  };

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;

    if (SENSITIVE.test(value)) {
      push("user", maskSensitive(value).replace(/[^\s•]/g, "•"));
      push("bot", t("chatSensitive"));
      setInput("");
      return;
    }

    push("user", value);
    push("bot", answerFor(value));
    setInput("");
  };

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => bubbleRef.current?.focus());
  };

  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-5 sm:right-5">
      {open && (
        <section
          role="dialog"
          aria-label={t("chatTitle")}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          }}
          className="mb-3 flex h-[min(30rem,calc(100vh-8rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-sheet border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] bg-capa shadow-modal"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--cromo)_22%,transparent)] p-4">
            <div>
              <h2 className="mb-0 text-sm font-bold">{t("chatTitle")}</h2>
              <p className="mb-0 text-xs text-muted">{t("chatSubtitle")}</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label={t("chatClose")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control hover:bg-canvas"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
            <p className="mb-0 max-w-[34ch] rounded-card rounded-tl-sm bg-canvas p-3 text-xs leading-5">
              {t("chatSubtitle")}
            </p>

            {messages.map((message) => (
              <p
                key={message.id}
                className={`mb-0 max-w-[85%] rounded-card p-3 text-xs leading-5 ${
                  message.role === "user"
                    ? "ml-auto rounded-tr-sm bg-[var(--poste-azul)] text-white"
                    : "rounded-tl-sm bg-canvas"
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>

          <div className="border-t border-[color-mix(in_srgb,var(--cromo)_22%,transparent)] p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {CHIPS.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => send(t(chip.key))}
                  className="min-h-9 rounded-full border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] px-2.5 py-1 text-[10px] font-semibold hover:border-[var(--poste-azul)]"
                >
                  {t(chip.key)}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor={`${id}-input`} className="sr-only">{t("chatPlaceholder")}</label>
              <input
                ref={inputRef}
                id={`${id}-input`}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t("chatPlaceholder")}
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-control border border-[color-mix(in_srgb,var(--cromo)_30%,transparent)] bg-capa px-3 text-xs outline-none focus:border-[var(--poste-azul)]"
              />
              <button
                type="submit"
                aria-label={t("chatSend")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-[var(--poste-azul)] text-white"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>

            <p className="mb-0 mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-muted">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("chatSecurity")}
            </p>
            <p className="mb-0 mt-1 text-[9px] text-muted">{t("chatDemoNote")}</p>
          </div>
        </section>
      )}

      <button
        ref={bubbleRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? t("chatClose") : t("chatOpen")}
        aria-expanded={open}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--poste-azul)] text-white shadow-modal"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </button>
    </div>
  );
}
