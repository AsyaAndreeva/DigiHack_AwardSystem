import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        const body = await req.json();
        
        if (!body.deadline && !body.themeColor && !body.bgColor && body.themeResources === undefined) {
            return NextResponse.json({ success: false, error: 'Deadline, Theme Color, or Resources is required' }, { status: 400 });
        }

        // Ensure settings table exists
        await sql`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL
            )
        `;

        // Upsert the deadline and theme_color
        if (body.deadline) {
            await sql`
                INSERT INTO settings (key, value)
                VALUES ('deadline', ${body.deadline})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `;
        }
        
        if (body.themeColor) {
            await sql`
                INSERT INTO settings (key, value)
                VALUES ('theme_color', ${body.themeColor})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `;
        }

        if (body.bgColor) {
            await sql`
                INSERT INTO settings (key, value)
                VALUES ('bg_color', ${body.bgColor})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `;
        }
        if (body.themeResources !== undefined) {
            await sql`
                INSERT INTO settings (key, value)
                VALUES ('theme_resources', ${body.themeResources})
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `;
        }

        return NextResponse.json({ success: true, deadline: body.deadline, themeColor: body.themeColor, bgColor: body.bgColor, themeResources: body.themeResources });
    } catch (error: any) {
        console.error('Admin Settings POST Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
