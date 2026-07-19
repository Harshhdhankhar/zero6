"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* --------------------------------- Context -------------------------------- */

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | undefined>(
  undefined
);

function useDialogContext() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used within <Dialog />");
  return ctx;
}

/* --------------------------------- Dialog --------------------------------- */

export interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

function Dialog({ children, open, onOpenChange, defaultOpen = false }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isOpen = open ?? internalOpen;

  const setOpen = React.useCallback(
    (v: boolean) => {
      if (open === undefined) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [open, onOpenChange]
  );

  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

/* ----------------------------- DialogTrigger ----------------------------- */

export interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ onClick, ...props }, ref) => {
    const { setOpen } = useDialogContext();

    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          setOpen(true);
          onClick?.(e);
        }}
        {...props}
      />
    );
  }
);
DialogTrigger.displayName = "DialogTrigger";

/* ----------------------------- DialogOverlay ----------------------------- */

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = "DialogOverlay";

/* ----------------------------- DialogContent ----------------------------- */

export interface DialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useDialogContext();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (!open) return;

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };

      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }, [open, setOpen]);

    if (!mounted || !open) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
        {/* Content */}
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 rounded-2xl border bg-background p-6 shadow-lg",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
            "duration-200",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>,
      document.body
    );
  }
);
DialogContent.displayName = "DialogContent";

/* ----------------------------- DialogHeader ------------------------------ */

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

/* ------------------------------ DialogTitle ------------------------------ */

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

/* --------------------------- DialogDescription --------------------------- */

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

/* ----------------------------- DialogFooter ------------------------------ */

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

/* ------------------------------ DialogClose ------------------------------ */

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ onClick, ...props }, ref) => {
  const { setOpen } = useDialogContext();

  return (
    <button
      ref={ref}
      type="button"
      onClick={(e) => {
        setOpen(false);
        onClick?.(e);
      }}
      {...props}
    />
  );
});
DialogClose.displayName = "DialogClose";

export {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
