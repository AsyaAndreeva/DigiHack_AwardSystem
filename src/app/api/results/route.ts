import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { calculateLeaderboard, EvaluationRaw } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  // Always fetch fresh data on every request
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Server configuration error. Missing database connection.' },
      { status: 500 }
    );
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Fetch raw evaluations directly
    const rawEvaluations = await sql`
      SELECT 
        team_id,
        team_name,
        jury_name,
        total_score,
        comments
      FROM evaluations
    `;

    // Calculate leaderboard purely in TypeScript so it can be rigorously unit tested
    const leaderboard = calculateLeaderboard(rawEvaluations as unknown as EvaluationRaw[]);

    return NextResponse.json({ success: true, data: leaderboard });
  } catch (error: any) {
    console.error('Neon DB Fetch Error:', error);
    
    // If the table doesn't exist yet, return empty gracefully
    if (error.message.includes('relation "evaluations" does not exist')) {
       return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data.' },
      { status: 500 }
    );
  }
}
