import { useEffect, useRef, type KeyboardEvent } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function useDialogFocus<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled) return;
    const dialog = ref.current;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE);
    if (firstFocusable) firstFocusable.focus();
    else dialog.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [enabled]);

  return ref;
}

export function handleDialogKeyboard(event: KeyboardEvent<HTMLElement>, onClose: () => void) {
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    return;
  }

  if (event.key !== "Tab") return;
  const focusable = event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE);
  const first = focusable.item(0);
  const last = focusable.item(focusable.length - 1);
  if (!first || !last) return;

  const focusIsOutside = !event.currentTarget.contains(document.activeElement);
  if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
    event.preventDefault();
    first.focus();
  }
}
