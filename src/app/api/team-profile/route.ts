import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const team_id = searchParams.get('team_id');

    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Missing database connection.' }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Fetch profile
    const profiles = await sql`
      SELECT * FROM team_profiles WHERE team_id = ${team_id} LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      profile: profiles.length > 0 ? profiles[0] : null,
    });
  } catch (error: any) {
    console.error('Neon DB Fetch Profile Error:', error);
    // Graceful fail if table doesn't exist yet
    if (error.message.includes('relation "team_profiles" does not exist')) {
      return NextResponse.json({ success: true, profile: null });
    }
    return NextResponse.json({ error: 'Failed to fetch team profile.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { team_id, description, project_url, presentation_url } = body;

    if (!team_id) {
      return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Missing database connection.' }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Upsert (Insert or Update if exists) profile
    await sql`
      INSERT INTO team_profiles (team_id, description, project_url, presentation_url, updated_at)
      VALUES (${team_id}, ${description}, ${project_url}, ${presentation_url}, CURRENT_TIMESTAMP)
      ON CONFLICT (team_id)
      DO UPDATE SET
        description = EXCLUDED.description,
        project_url = EXCLUDED.project_url,
        presentation_url = EXCLUDED.presentation_url,
        updated_at = EXCLUDED.updated_at
    `;

    return NextResponse.json({ success: true, message: 'Profile saved successfully.' });
  } catch (error: any) {
    console.error('Neon DB Update Profile Error:', error);
    return NextResponse.json({ error: 'Failed to save team profile.' }, { status: 500 });
  }
}
