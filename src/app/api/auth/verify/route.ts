import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// POST /api/auth/verify — verify a passcode for a team or jury member
// Body: { type: "team" | "jury", passcode: string }
// Returns { success, id, name } or { error }
export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);

  try {
    const { type, passcode } = await req.json();
    if (!passcode?.trim()) return NextResponse.json({ error: 'Моля, въведете паролата.' }, { status: 400 });

    const code = passcode.trim().toUpperCase();

    if (type === 'jury') {
      const rows = await sql`SELECT id, name FROM jury_members WHERE passcode = ${code} LIMIT 1`;
      if (rows.length === 0) return NextResponse.json({ error: 'Грешна парола. Опитайте отново.' }, { status: 401 });
      return NextResponse.json({ success: true, id: rows[0].id, name: rows[0].name });
    }

    if (type === 'team') {
      const rows = await sql`SELECT id, name FROM teams WHERE passcode = ${code} LIMIT 1`;
      if (rows.length === 0) return NextResponse.json({ error: 'Грешна парола. Опитайте отново.' }, { status: 401 });
      return NextResponse.json({ success: true, id: rows[0].id, name: rows[0].name });
    }

    return NextResponse.json({ error: 'Невалиден тип.' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
