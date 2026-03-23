import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { calculateLeaderboard, EvaluationRaw } from '../../../lib/scoring';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: Request) {
  // Secure server-side verification so the password is never in the client JS bundle
  const { password } = await req.json();
  const validPassword = process.env.RESULTS_PASSWORD || 'Jury2026!';
  if (password === validPassword) {
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: 'Грешна парола.' }, { status: 401 });
}

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
    
    const criteriaRes = await sql`SELECT id, category FROM rubric_criteria`;
    const criteriaCount = criteriaRes.length;
    const criteriaMap = new Map<string, string>();
    criteriaRes.forEach(c => criteriaMap.set(c.id.toString(), c.category));

    // Fetch raw evaluations directly, joining tables to get current names
    const allEvaluations = await sql`
      SELECT 
        e.team_id,
        t.name AS team_name,
        j.name AS jury_name,
        e.scores,
        e.comments
      FROM evaluations e
      JOIN teams t ON e.team_id = t.id
      JOIN jury_members j ON e.jury_id = j.id
    `;

    const rawEvaluations = allEvaluations
      .filter((e: any) => {
        const scoresCount = e.scores ? Object.keys(e.scores).length : 0;
        return scoresCount === criteriaCount;
      })
      .map((e: any) => {
        // Always recompute total_score server-side from the scores JSON
        // This ensures the result is accurate even if the stored column is stale
        const scoresMap = e.scores as Record<string, number>;
        const computedTotal = Object.values(scoresMap).reduce(
          (sum, s) => sum + (Number(s) || 0),
          0
        );
        
        const aggregated: Record<string, number> = {};
        for (const [critId, score] of Object.entries(scoresMap)) {
            const cat = criteriaMap.get(critId.toString()) || `Критерий ${critId}`;
            aggregated[cat] = (aggregated[cat] || 0) + (Number(score) || 0);
        }
        
        const categoryScores = Object.entries(aggregated).map(([category, score]) => ({
            category,
            score
        }));

        return {
          team_id: e.team_id,
          team_name: e.team_name,
          jury_name: e.jury_name,
          total_score: computedTotal,
          comments: e.comments,
          categories: categoryScores,
        };
      });

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
