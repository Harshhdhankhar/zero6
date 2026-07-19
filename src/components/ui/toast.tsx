"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* ---------------------------------- Types --------------------------------- */

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string };

/* ------------------------------- Reducer --------------------------------- */

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case "ADD":
      return { toasts: [...state.toasts, action.toast] };
    case "REMOVE":
      return { toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

/* ----------------------------- Global Store ------------------------------ */

let globalDispatch: React.Dispatch<ToastAction> | null = null;
let toastCount = 0;

function toast(
  opts: Omit<Toast, "id"> & { id?: string }
): string {
  const id = opts.id ?? `toast-${++toastCount}-${Date.now()}`;
  const newToast: Toast = { ...opts, id };

  if (globalDispatch) {
    globalDispatch({ type: "ADD", toast: newToast });
  }

  return id;
}

/* ------------------------------ useToast Hook ----------------------------- */

function useToast() {
  return { toast };
}

/* ----------------------------- Toast Item -------------------------------- */

const variantStyles: Record<NonNullable<Toast["variant"]>, string> = {
  default: "border bg-background text-foreground",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  error:
    "border-destructive/30 bg-destructive/10 text-destructive",
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [exiting, setExiting] = React.useState(false);

  React.useEffect(() => {
    const duration = t.duration ?? 5000;
    const exitTimer = setTimeout(() => setExiting(true), duration - 300);
    const removeTimer = setTimeout(() => onDismiss(t.id), duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [t.id, t.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
        "transition-all duration-300 ease-in-out",
        exiting
          ? "opacity-0 translate-x-4 scale-95"
          : "opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-full",
        variantStyles[t.variant ?? "default"]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-1 space-y-1">
          {t.title && (
            <p className="text-sm font-semibold leading-none">{t.title}</p>
          )}
          {t.description && (
            <p className="text-sm opacity-90">{t.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setExiting(true);
            setTimeout(() => onDismiss(t.id), 300);
          }}
          className="shrink-0 rounded-md p-1 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- Toaster --------------------------------- */

function Toaster() {
  const [state, dispatch] = React.useReducer(toastReducer, { toasts: [] });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    globalDispatch = dispatch;
    setMounted(true);

    return () => {
      globalDispatch = null;
    };
  }, []);

  const handleDismiss = React.useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "24rem" }}
    >
      {state.toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
      ))}
    </div>,
    document.body
  );
}

export { Toaster, useToast, toast };
