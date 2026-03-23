import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';



export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);
  try {
    const teams = await sql`
      SELECT t.id, t.name, t.passcode,
             tp.description, tp.project_url, tp.presentation_url, tp.image_url, tp.links
      FROM teams t
      LEFT JOIN team_profiles tp ON t.id = tp.team_id
      ORDER BY t.name ASC
    `;
    return NextResponse.json({ teams });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
