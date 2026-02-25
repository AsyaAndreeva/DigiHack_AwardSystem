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

    await sql`
      INSERT INTO evaluations (jury_id, jury_name, team_id, team_name, scores, total_score, comments)
      VALUES (
        ${juryId || juryName},
        ${juryName},
        ${teamId},
        ${teamName},
        ${JSON.stringify(scores)},
        ${totalScore},
        ${comments || null}
      )
    `;

    return NextResponse.json({ success: true, message: 'Оценката е записана успешно.' });
  } catch (error: any) {
    console.error('Submit API Error:', error);
    return NextResponse.json(
      { error: 'Неуспешно записване на оценката.' },
      { status: 500 }
    );
  }
}
