import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);
  try {
    const members = await sql`
      SELECT j.id, j.name, j.passcode, COUNT(e.id) as evaluations_count
      FROM jury_members j
      LEFT JOIN evaluations e ON j.id = e.jury_id
      GROUP BY j.id, j.name, j.passcode
      ORDER BY j.name ASC
    `;
    return NextResponse.json({ members });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
