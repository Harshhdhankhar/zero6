const rateMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitMiddleware(
  userId: string,
  route: string,
  limit?: number,
  windowMs?: number
) {
  const key = `${userId}:${route}`;
  const result = rateLimit(key, limit, windowMs);
  return result;
}
