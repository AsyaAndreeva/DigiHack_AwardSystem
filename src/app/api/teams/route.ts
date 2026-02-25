import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);
  try {
    const teams = await sql`SELECT id, name, passcode FROM teams ORDER BY name ASC`;
    return NextResponse.json({ teams });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
