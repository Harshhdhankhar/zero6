import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/captcha";

export async function POST(request: Request) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const valid = await verifyTurnstileToken(token);

  if (!valid) {
    return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
