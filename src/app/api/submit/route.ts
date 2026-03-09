import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { juryId, juryName, teamId, teamName, scores, totalScore, comments } = body;

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Липсва конфигурация на базата данни.' }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Fallback if juryId is missing but we have it passed or have juryName
    const effectiveJuryId = juryId || juryName;

    // First try to update an existing evaluation for this jury and team
    const updateResult = await sql`
      UPDATE evaluations
      SET 
        scores = ${JSON.stringify(scores)},
        total_score = ${totalScore},
        comments = ${comments || null},
        jury_name = ${juryName},
        team_name = ${teamName}
      WHERE (jury_id = ${effectiveJuryId} OR (jury_id IS NULL AND jury_name = ${juryName})) 
        AND team_id = ${teamId}
      RETURNING id
    `;

    // If no row was updated, it means this is a new evaluation, so we insert
    if (updateResult.length === 0) {
      await sql`
        INSERT INTO evaluations (jury_id, jury_name, team_id, team_name, scores, total_score, comments)
        VALUES (
          ${effectiveJuryId},
          ${juryName},
          ${teamId},
          ${teamName},
          ${JSON.stringify(scores)},
          ${totalScore},
          ${comments || null}
        )
      `;
    }

    return NextResponse.json({ success: true, message: 'Оценката е записана успешно.' });
  } catch (error: any) {
    console.error('Submit API Error:', error);
    return NextResponse.json(
      { error: 'Неуспешно записване на оценката.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const juryId = searchParams.get('juryId');
    const teamId = searchParams.get('teamId');

    if (!juryId || !teamId) {
      return NextResponse.json({ error: 'Missing juryId or teamId' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const evaluation = await sql`
      SELECT scores, comments 
      FROM evaluations 
      WHERE jury_id = ${juryId} AND team_id = ${teamId}
      LIMIT 1
    `;

    if (evaluation.length === 0) {
      return NextResponse.json({ evaluation: null });
    }

    return NextResponse.json({ evaluation: evaluation[0] });
  } catch (error: any) {
    console.error('Fetch Evaluation Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation' },
      { status: 500 }
    );
  }
}
