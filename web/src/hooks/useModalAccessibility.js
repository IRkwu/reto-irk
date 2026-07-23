import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(root) {
  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement
  );
}

export function useModalAccessibility(open, onClose) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousFocus = document.activeElement;
    const focusTimer = window.setTimeout(() => {
      const focusable = getFocusableElements(dialogRef.current);
      (focusable[0] || dialogRef.current)?.focus?.();
    }, 0);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(dialogRef.current);

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current?.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [open]);

  return dialogRef;
}
