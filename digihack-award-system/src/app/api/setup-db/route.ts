import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL environment variable is not set.' },
      { status: 500 }
    );
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // 1. Create the 'evaluations' table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        jury_name VARCHAR(255) NOT NULL,
        team_id VARCHAR(255) NOT NULL,
        team_name VARCHAR(255) NOT NULL,
        scores JSONB NOT NULL,
        total_score INTEGER NOT NULL,
        comments TEXT
      );
    `;

    // 2. Add 'comments' column directly if the table already existed but missed it
    try {
      await sql`ALTER TABLE evaluations ADD COLUMN comments TEXT;`;
    } catch (err: any) {
      // Ignore error if column already exists (code 42701)
      if (err.code !== '42701') console.warn("Notice on alter table evaluations:", err.message);
    }

    // 3. Create the 'team_profiles' table
    await sql`
      CREATE TABLE IF NOT EXISTS team_profiles (
        team_id VARCHAR(255) PRIMARY KEY,
        description TEXT,
        project_url VARCHAR(1024),
        presentation_url VARCHAR(1024),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful. Schema initialized completely.',
    });
  } catch (error: any) {
    console.error('Neon DB Setup Error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database.', details: error.message },
      { status: 500 }
    );
  }
}
