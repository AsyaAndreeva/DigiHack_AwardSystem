import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// GET /api/mentor/feedback?mentorId=...&teamId=...
// OR /api/mentor/feedback?teamId=...
export async function GET(req: Request) {
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
    const sql = neon(process.env.DATABASE_URL);
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');
    const teamId = searchParams.get('teamId');

    try {
        if (mentorId && teamId) {
            // Load specific feedback for evaluation page
            const rows = await sql`
                SELECT * FROM mentor_feedback 
                WHERE mentor_id = ${mentorId} AND team_id = ${teamId} 
                LIMIT 1
            `;
            return NextResponse.json({ feedback: rows[0] || null });
        } else if (mentorId) {
            // Load all feedback for a mentor (dashboard)
            const rows = await sql`
                SELECT team_id FROM mentor_feedback 
                WHERE mentor_id = ${mentorId}
            `;
            return NextResponse.json({ feedback: rows });
        } else if (teamId) {
            // Load all feedback for a team (team dashboard view)
            const rows = await sql`
                SELECT f.comment, f.created_at, m.name as mentor_name 
                FROM mentor_feedback f
                JOIN mentors m ON f.mentor_id = m.id
                WHERE f.team_id = ${teamId}
                ORDER BY f.created_at DESC
            `;
            return NextResponse.json({ feedback: rows });
        }

        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST /api/mentor/feedback
export async function POST(req: Request) {
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
    const sql = neon(process.env.DATABASE_URL);

    try {
        const { mentorId, teamId, comment } = await req.json();

        if (!mentorId || !teamId) {
            return NextResponse.json({ error: 'Missing mentorId or teamId' }, { status: 400 });
        }

        // Upsert feedback
        await sql`
            INSERT INTO mentor_feedback (mentor_id, team_id, comment)
            VALUES (${mentorId}, ${teamId}, ${comment})
            ON CONFLICT (mentor_id, team_id) 
            DO UPDATE SET 
                comment = EXCLUDED.comment,
                created_at = CURRENT_TIMESTAMP
        `;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
