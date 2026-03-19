import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const sql = neon(process.env.DATABASE_URL!);
        
        // Ensure settings table exists
        await sql`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value TEXT NOT NULL
            )
        `;

        // Fetch settings
        const result = await sql`SELECT key, value FROM settings WHERE key IN ('deadline', 'theme_color', 'theme_resources')`;
        
        let deadline = '2026-03-29T13:30:00+03:00';
        let theme_color = '#DAEA5F';
        let theme_resources = '';

        result.forEach(row => {
            if (row.key === 'deadline') deadline = row.value;
            if (row.key === 'theme_color') theme_color = row.value;
            if (row.key === 'theme_resources') theme_resources = row.value;
        });

        return NextResponse.json({ success: true, deadline, theme_color, theme_resources });
    } catch (error: any) {
        console.error('Settings GET Error:', error);
        return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
    }
}
