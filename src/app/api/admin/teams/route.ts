import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('No DB URL');
  return neon(process.env.DATABASE_URL);
}

export async function POST(req: Request) {
  try {
    const sql = getDb();
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Моля, въведете име на отбора.' }, { status: 400 });
    const id = 'team-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    await sql`INSERT INTO teams (id, name) VALUES (${id}, ${name.trim()})`;
    return NextResponse.json({ success: true, team: { id, name: name.trim() } });
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
