import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);
  try {
    const criteria = await sql`
      SELECT id, category, description, criterion, max_score, scoring_guide, order_idx
      FROM rubric_criteria
      ORDER BY order_idx ASC
    `;
    return NextResponse.json({ criteria });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
