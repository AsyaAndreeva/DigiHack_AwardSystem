import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { juryName, teamName, scores, totalScore, comments } = body;

    // We can infer team_id based on a slugified version of teamName, or just pass it in body.
    // We already have `teamName` directly. We'll simply safely slugify it for an ID if needed, 
    // or just use the name as ID for now.
    const teamId = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (!process.env.DATABASE_URL) {
      console.error('Missing DATABASE_URL in environment.');
      return NextResponse.json(
        { error: 'Server configuration error. Missing database connection.' },
        { status: 500 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);

    // Insert the evaluation record
    await sql`
      INSERT INTO evaluations (jury_name, team_id, team_name, scores, total_score, comments)
      VALUES (
        ${juryName}, 
        ${teamId}, 
        ${teamName}, 
        ${JSON.stringify(scores)}, 
        ${totalScore},
        ${comments || null}
      )
    `;

    return NextResponse.json({ success: true, message: 'Evaluation saved successfully.' });
  } catch (error: any) {
    console.error('Neon DB API Error:', error);
    return NextResponse.json(
      { error: 'Failed to submit evaluation to database.' },
      { status: 500 }
    );
  }
}
