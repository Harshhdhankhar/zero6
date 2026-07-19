// Cloudflare Turnstile CAPTCHA integration

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export function isCaptchaEnabled(): boolean {
  return !!(TURNSTILE_SECRET && TURNSTILE_SITE_KEY);
}

export function getSiteKey(): string {
  return TURNSTILE_SITE_KEY;
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return true; // skip if not configured

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: TURNSTILE_SECRET,
          response: token,
        }),
      }
    );

    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
