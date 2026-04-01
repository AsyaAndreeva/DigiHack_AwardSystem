import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';



function genPasscode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I,O,1,0
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('No DB URL');
  return neon(process.env.DATABASE_URL);
}

function isAuthorized(req: Request): boolean {
  const adminCode = req.headers.get('x-admin-code');
  const validCode = process.env.ADMIN_CODE || process.env.NEXT_PUBLIC_ADMIN_CODE || '2026';
  return adminCode === validCode;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Моля, въведете ime на журито.' }, { status: 400 });
    const id = 'jury-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    const passcode = genPasscode();
    await sql`INSERT INTO jury_members (id, name, passcode) VALUES (${id}, ${name.trim()}, ${passcode})`;
    return NextResponse.json({ success: true, member: { id, name: name.trim(), passcode } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const { id, passcode, name } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });

    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Името не може да е празно.' }, { status: 400 });
      await sql`UPDATE jury_members SET name = ${name.trim()} WHERE id = ${id}`;
      return NextResponse.json({ success: true, name: name.trim() });
    }

    const newPasscode = passcode?.trim() || genPasscode();
    await sql`UPDATE jury_members SET passcode = ${newPasscode} WHERE id = ${id}`;
    return NextResponse.json({ success: true, passcode: newPasscode });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Deletion is disabled' }, { status: 403 });
  /*
  try {
    const sql = getDb();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    await sql`DELETE FROM evaluations WHERE jury_id = ${id}`;
    await sql`DELETE FROM jury_members WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  */
}
