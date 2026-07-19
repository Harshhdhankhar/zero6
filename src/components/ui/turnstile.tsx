"use client";

import { useEffect, useRef } from "react";
import { isCaptchaEnabled, getSiteKey } from "@/lib/captcha";

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function Turnstile({ onVerify, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isCaptchaEnabled()) return;

    const siteKey = getSiteKey();
    if (!siteKey) return;

    let script: HTMLScriptElement | null = null;

    function renderWidget() {
      if (!containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        "expired-callback": onExpire,
        theme: "dark",
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [onVerify, onExpire]);

  if (!isCaptchaEnabled()) return null;

  return <div ref={containerRef} className="cf-turnstile" />;
}
