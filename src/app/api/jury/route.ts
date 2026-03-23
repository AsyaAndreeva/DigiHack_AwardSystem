import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';



export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
  const sql = neon(process.env.DATABASE_URL);
  try {
    const members = await sql`SELECT id, name, passcode FROM jury_members ORDER BY name ASC`;
    const evaluations = await sql`SELECT jury_id, scores FROM evaluations`;
    const criteriaCountRes = await sql`SELECT COUNT(id) as count FROM rubric_criteria`;
    const criteriaCount = Number(criteriaCountRes[0].count);

    const membersWithCount = members.map((m: any) => {
      const juryEvals = evaluations.filter((e: any) => e.jury_id === m.id);
      const completedCount = juryEvals.filter((e: any) => {
         const scoresCount = e.scores ? Object.keys(e.scores).length : 0;
         return scoresCount === criteriaCount;
      }).length;
      return {
         ...m,
         evaluations_count: completedCount
      };
    });

    return NextResponse.json({ members: membersWithCount });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
