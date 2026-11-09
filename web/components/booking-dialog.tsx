"use client";

import { useMemo, useRef, useState } from "react";
import { CalendarDays, Check, Clock3, Gift, Scissors, Sparkles, X } from "lucide-react";
import type { BarberService } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { formatDateLong, money } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { handleDialogKeyboard, useDialogFocus } from "@/lib/keyboard";
import { ADD_ON_PRICE, ModalUpsell, type AddOnSelection } from "@/components/checkout/modal-upsell";

type BookingConfirmation = {
  customer: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  addons: AddOnSelection;
  total: number;
};

type BookingDialogProps = {
  item: BarberService;
  referralCode: string;
  couponActive: boolean;
  couponAmount: number;
  onClose: () => void;
  onConfirm: (booking: BookingConfirmation) => void;
};

const BASE_TIMES = ["09:30", "10:30", "11:30", "12:30", "14:00", "15:30", "17:00"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatLocalTime(time: string, locale: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
}

export function BookingDialog({
  item,
  referralCode,
  couponActive,
  couponAmount,
  onClose,
  onConfirm,
}: BookingDialogProps) {
  const { locale, t } = useI18n();
  const dates = useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const day = new Date();
    day.setHours(12, 0, 0, 0);
    day.setDate(day.getDate() + index);
    return day;
  }), []);

  const defaultDate = dates[item.nextSlot?.dayOffset ?? 0] ?? dates[0];
  const defaultTime = item.nextSlot?.time ?? BASE_TIMES[2];
  const times = useMemo(() => (
    BASE_TIMES.includes(defaultTime) ? BASE_TIMES : [defaultTime, ...BASE_TIMES]
  ), [defaultTime]);

  const [step, setStep] = useState<1 | 2>(1);
  const [customer, setCustomer] = useState("");
  const [contact, setContact] = useState("");
  const [date, setDate] = useState(dateKey(defaultDate));
  const [time, setTime] = useState(defaultTime);
  const [addons, setAddons] = useState<AddOnSelection>({ wash: false, pomade: false });
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [upsellSeen, setUpsellSeen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({});
  const continueRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const dialogRef = useDialogFocus<HTMLDivElement>();

  const basePrice = item.offer?.price ?? item.price;
  const addOnTotal = (addons.wash ? ADD_ON_PRICE.wash : 0) + (addons.pomade ? ADD_ON_PRICE.pomade : 0);
  const discount = couponActive ? couponAmount : 0;
  const total = Math.max(0, basePrice + addOnTotal - discount);
  const activeReferral = referralCode.trim().toUpperCase();

  const stepLabels = [t("bookingStep1"), t("bookingStep2"), t("bookingStep3")];
  const currentStep = step;

  const proceedToConfirm = () => {
    setUpsellOpen(false);
    setUpsellSeen(true);
    setStep(2);
    window.requestAnimationFrame(() => nameRef.current?.focus());
  };

  const handleContinue = () => {
    if (!upsellSeen) {
      setUpsellOpen(true);
      return;
    }
    proceedToConfirm();
  };

  const confirm = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: { name?: string; contact?: string } = {};
    if (customer.trim().length < 2) nextErrors.name = t("bookingErrorName");
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
    const isPhone = contact.replace(/\D/g, "").length >= 10;
    if (!isEmail && !isPhone) nextErrors.contact = t("bookingErrorContact");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onConfirm({
      customer: customer.trim(),
      phone: isPhone ? contact.trim() : "",
      email: isEmail ? contact.trim() : undefined,
      date,
      time,
      addons,
      total,
    });
  };

  const serviceAddOns = [
    addons.wash ? t("upsellWash") : null,
    addons.pomade ? t("upsellPomade") : null,
  ].filter(Boolean).join(" + ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={(event) => handleDialogKeyboard(event, onClose)}
        className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-sheet bg-capa shadow-modal sm:rounded-sheet"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[color-mix(in_srgb,var(--cromo)_22%,transparent)] bg-capa/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--poste-azul)]">{t("bookingEyebrow")}</p>
            <h2 id="booking-title" className="mb-0 text-xl font-bold">{t("bookingTitle")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("menuClose")}
            className="flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-canvas"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-[color-mix(in_srgb,var(--cromo)_22%,transparent)] px-5 py-3 sm:px-7">
          <ol className="flex items-center gap-2 text-[10px] font-semibold" aria-label={t("bookingEyebrow")}>
            {stepLabels.map((label, index) => {
              const number = index + 1;
              const state = number < currentStep ? "done" : number === currentStep ? "current" : "todo";
              return (
                <li key={label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
                    state === "current"
                      ? "border-[var(--poste-azul)] bg-[var(--poste-azul)] text-white"
                      : state === "done"
                        ? "border-[var(--ok)] bg-[color-mix(in_srgb,var(--ok)_16%,transparent)] text-[var(--ok)]"
                        : "border-[color-mix(in_srgb,var(--cromo)_35%,transparent)] text-muted"
                  }`}>
                    {state === "done" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : number}
                  </span>
                  <span className={state === "current" ? "text-tinta" : "text-muted"}>{label}</span>
                  {index < stepLabels.length - 1 && <span className="h-px w-4 bg-[color-mix(in_srgb,var(--cromo)_35%,transparent)]" aria-hidden="true" />}
                </li>
              );
            })}
          </ol>
        </div>

        <form onSubmit={confirm} className="space-y-5 p-5 sm:p-7">
          <div className="flex gap-3 rounded-card bg-canvas p-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-capa text-[var(--poste-azul)]">
              <Scissors className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{item.service}</div>
              <div className="text-xs text-muted">
                {t("bookingServiceSummary", { service: item.service, shop: item.shopName, duration: item.duration })}
              </div>
            </div>
            <b className="text-sm tabular-nums">{money(basePrice, locale)}</b>
          </div>

          {step === 1 ? (
            <>
              <section>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-muted">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {t("bookingChooseDay")}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {dates.map((day) => {
                    const key = dateKey(day);
                    const selected = date === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setDate(key)}
                        aria-pressed={selected}
                        className={`min-h-11 rounded-control border p-2 text-center ${
                          selected
                            ? "border-[var(--poste-azul)] bg-[var(--poste-azul)] text-white"
                            : "border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] hover:border-[var(--poste-azul)]"
                        }`}
                      >
                        <span className="block text-[10px] uppercase">
                          {new Intl.DateTimeFormat(locale, { weekday: "short" }).format(day).replace(".", "")}
                        </span>
                        <b className="text-base tabular-nums">{day.getDate()}</b>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <p className="mb-2 flex items-center gap-2 text-xs font-bold text-muted">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {t("bookingChooseTime")}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {times.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setTime(slot)}
                      aria-pressed={time === slot}
                      className={`min-h-11 rounded-control border px-2 py-2 text-xs font-semibold ${
                        time === slot
                          ? "border-[var(--poste-azul)] bg-[color-mix(in_srgb,var(--poste-azul)_10%,transparent)] text-[var(--poste-azul)]"
                          : "border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] hover:border-[var(--poste-azul)]"
                      }`}
                    >
                      {formatLocalTime(slot, locale)}
                    </button>
                  ))}
                </div>
              </section>

              <div className="border-t border-[color-mix(in_srgb,var(--cromo)_22%,transparent)] pt-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted">{t("bookingTotal")}</span>
                  <b className="tabular-nums">{money(total, locale)}</b>
                </div>
                <Button ref={continueRef} type="button" size="lg" variant="primary" className="w-full" onClick={handleContinue}>
                  {t("bookingContinue")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="mb-0 text-sm font-bold">{t("bookingContactTitle")}</h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="min-h-11 rounded-control px-1 text-xs font-semibold text-[var(--poste-azul)] underline-offset-4 hover:underline"
                  >
                    {t("bookingBack")}
                  </button>
                </div>

                <div>
                  <label htmlFor="booking-name" className="text-sm font-semibold">{t("bookingName")}</label>
                  <input
                    ref={nameRef}
                    id="booking-name"
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                    placeholder={t("bookingNamePlaceholder")}
                    autoComplete="name"
                    required
                    minLength={2}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "booking-name-error" : undefined}
                    className="mt-1.5 h-11 w-full rounded-control border border-[color-mix(in_srgb,var(--cromo)_30%,transparent)] bg-capa px-3 text-sm outline-none focus:border-[var(--poste-azul)]"
                  />
                  {errors.name && <p id="booking-name-error" className="mb-0 mt-1 text-xs font-medium text-[var(--peligro)]">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="booking-contact" className="text-sm font-semibold">{t("bookingContact")}</label>
                  <input
                    id="booking-contact"
                    type="text"
                    inputMode="text"
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    placeholder={t("bookingContactPlaceholder")}
                    autoComplete="email"
                    required
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? "booking-contact-error" : undefined}
                    className="mt-1.5 h-11 w-full rounded-control border border-[color-mix(in_srgb,var(--cromo)_30%,transparent)] bg-capa px-3 text-sm outline-none focus:border-[var(--poste-azul)]"
                  />
                  {errors.contact && <p id="booking-contact-error" className="mb-0 mt-1 text-xs font-medium text-[var(--peligro)]">{errors.contact}</p>}
                </div>
              </section>

              <section className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="h-4 w-4 text-[var(--poste-azul)]" aria-hidden="true" />
                  {t("bookingSummary")}
                </h3>
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{t("bookingStep1")}</dt>
                    <dd className="mb-0 text-right font-semibold">
                      {formatDateLong(date, locale)} · {formatLocalTime(time, locale)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted">{item.service}</dt>
                    <dd className="mb-0 text-right tabular-nums">{money(basePrice, locale)}</dd>
                  </div>
                  {serviceAddOns && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">{serviceAddOns}</dt>
                      <dd className="mb-0 text-right tabular-nums">+{money(addOnTotal, locale)}</dd>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between gap-3 text-[var(--ok)]">
                      <dt>{t("bookingCoupon")}</dt>
                      <dd className="mb-0 text-right tabular-nums">−{money(discount, locale)}</dd>
                    </div>
                  )}
                </dl>

                {activeReferral && (
                  <p className="mb-0 mt-3 flex items-start gap-2 rounded-control bg-canvas p-2 text-[10px] leading-4 text-muted">
                    <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--poste-azul)]" aria-hidden="true" />
                    {t("bookingReferral", { code: activeReferral })}
                  </p>
                )}
              </section>

              <div className="rounded-card border border-[color-mix(in_srgb,var(--cromo)_25%,transparent)] p-4">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <span className="text-sm font-semibold">{t("bookingTotal")}</span>
                  <b className="font-display text-2xl leading-none tabular-nums">{money(total, locale)}</b>
                </div>
                <Button type="submit" size="lg" variant="primary" className="w-full">
                  {t("bookingConfirm")}
                  <Check className="h-4 w-4" aria-hidden="true" />
                </Button>
                <p className="mb-0 mt-2 text-center text-[10px] text-muted">{t("bookingNoCharge")}</p>
              </div>
            </>
          )}
        </form>
      </div>

      {upsellOpen && (
        <ModalUpsell
          onAdd={(selection) => {
            setAddons(selection);
            proceedToConfirm();
          }}
          onSkip={() => {
            setAddons({ wash: false, pomade: false });
            proceedToConfirm();
          }}
        />
      )}
    </div>
  );
}
