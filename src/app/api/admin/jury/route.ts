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
    if (!name?.trim()) return NextResponse.json({ error: 'Моля, въведете име на журито.' }, { status: 400 });
    const id = name.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    await sql`INSERT INTO jury_members (id, name) VALUES (${id}, ${name.trim()})`;
    return NextResponse.json({ success: true, member: { id, name: name.trim() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sql = getDb();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    await sql`DELETE FROM jury_members WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
