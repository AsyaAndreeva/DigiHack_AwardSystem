import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

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
    
    // Group by team and sum their scores
    // We also want to know how many juries evaluated them
    const leaderboard = await sql`
      SELECT 
        team_id,
        team_name,
        COUNT(jury_name) as evaluations_count,
        SUM(total_score) as combined_score,
        json_agg(
          json_build_object(
            'jury_name', jury_name,
            'total_score', total_score,
            'comments', comments
          )
        ) as jury_breakdown
      FROM evaluations
      GROUP BY team_id, team_name
      ORDER BY combined_score DESC
    `;

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
