import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// -----------------------------------------------------------
// In-memory rate limiter (per IP, per instance)
// Limits: max 5 failed attempts in a 60-second window
// After lockout: 429 Too Many Requests for 60 seconds
// -----------------------------------------------------------
interface RateEntry {
  count: number;
  firstAttempt: number;
  lockedUntil: number;
}
const rateLimitMap = new Map<string, RateEntry>();

const MAX_ATTEMPTS = 5;         // max failed tries before lockout
const WINDOW_MS    = 60_000;    // 1 minute sliding window
const LOCKOUT_MS   = 60_000;    // 1 minute lockout after MAX_ATTEMPTS

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  // If currently locked out
  if (entry && entry.lockedUntil > now) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  // If window has expired, reset
  if (entry && now - entry.firstAttempt > WINDOW_MS) {
    entry = undefined;
  }

  if (!entry) {
    entry = { count: 0, firstAttempt: now, lockedUntil: 0 };
    rateLimitMap.set(ip, entry);
  }

  return { allowed: true };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  let entry = rateLimitMap.get(ip)!;
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
}

function resetAttempts(ip: string): void {
  rateLimitMap.delete(ip);
}

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now - entry.firstAttempt > WINDOW_MS * 2 && entry.lockedUntil < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60_000);

// -----------------------------------------------------------
// POST /api/auth/verify
// Body: { type: "team" | "jury", passcode: string }
// Returns { success, id, name } or { error }
// -----------------------------------------------------------
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    const seconds = Math.ceil((retryAfterMs ?? LOCKOUT_MS) / 1000);
    return NextResponse.json(
      { error: `Твърде много неуспешни опити. Опитайте отново след ${seconds} секунди.` },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((retryAfterMs ?? LOCKOUT_MS) / 1000)),
          'X-RateLimit-Limit': String(MAX_ATTEMPTS),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);

  try {
    const { type, passcode } = await req.json();
    if (!passcode?.trim()) return NextResponse.json({ error: 'Моля, въведете паролата.' }, { status: 400 });

    const code = passcode.trim().toUpperCase();

    if (type === 'jury') {
      const rows = await sql`SELECT id, name FROM jury_members WHERE passcode = ${code} LIMIT 1`;
      if (rows.length === 0) {
        recordFailedAttempt(ip);
        return NextResponse.json({ error: 'Грешна парола. Опитайте отново.' }, { status: 401 });
      }
      resetAttempts(ip);
      return NextResponse.json({ success: true, id: rows[0].id, name: rows[0].name });
    }

    if (type === 'team') {
      const rows = await sql`SELECT id, name FROM teams WHERE passcode = ${code} LIMIT 1`;
      if (rows.length === 0) {
        recordFailedAttempt(ip);
        return NextResponse.json({ error: 'Грешна парола. Опитайте отново.' }, { status: 401 });
      }
      resetAttempts(ip);
      return NextResponse.json({ success: true, id: rows[0].id, name: rows[0].name });
    }

    return NextResponse.json({ error: 'Невалиден тип.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
