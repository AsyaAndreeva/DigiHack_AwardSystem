import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function genPasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I,O,1,0
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('No DB URL');
  return neon(process.env.DATABASE_URL);
}

export async function POST(req: Request) {
  try {
    const sql = getDb();
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Моля, въведете ime на отбора.' }, { status: 400 });
    const id = 'team-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const passcode = genPasscode();
    await sql`INSERT INTO teams (id, name, passcode) VALUES (${id}, ${name.trim()}, ${passcode})`;
    return NextResponse.json({ success: true, team: { id, name: name.trim(), passcode } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sql = getDb();
    const { id, passcode } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    const newPasscode = passcode?.trim() || genPasscode();
    await sql`UPDATE teams SET passcode = ${newPasscode} WHERE id = ${id}`;
    return NextResponse.json({ success: true, passcode: newPasscode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sql = getDb();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    await sql`DELETE FROM teams WHERE id = ${id}`;
    await sql`DELETE FROM team_profiles WHERE team_id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
