import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function DELETE(req: Request) {
  const adminCode = req.headers.get('x-admin-code');
  const validCode = process.env.ADMIN_CODE || process.env.NEXT_PUBLIC_ADMIN_CODE || 'digihack2026';
  if (adminCode !== validCode) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);
  try {
    await sql`DELETE FROM evaluations`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
