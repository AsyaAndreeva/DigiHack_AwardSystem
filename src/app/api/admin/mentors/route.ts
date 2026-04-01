import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { nanoid } from 'nanoid';

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "2026";

function checkAdmin(req: Request) {
    const code = req.headers.get('x-admin-code');
    return code === ADMIN_CODE;
}

// GET /api/admin/mentors - Load all mentors
export async function GET(req: Request) {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
    const sql = neon(process.env.DATABASE_URL);

    try {
        const mentors = await sql`SELECT * FROM mentors ORDER BY name ASC`;
        return NextResponse.json({ success: true, mentors });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// POST /api/admin/mentors - Create new mentor
export async function POST(req: Request) {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
    const sql = neon(process.env.DATABASE_URL);

    try {
        const { name } = await req.json();
        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

        const passcode = nanoid(5).toUpperCase(); // Consistent with setup script MNT... style but using nanoid
        const rows = await sql`
            INSERT INTO mentors (name, passcode) 
            VALUES (${name}, ${passcode}) 
            RETURNING *
        `;
        return NextResponse.json({ success: true, mentor: rows[0] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// PATCH /api/admin/mentors - Update mentor
export async function PATCH(req: Request) {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
    const sql = neon(process.env.DATABASE_URL);

    try {
        const { id, name, passcode } = await req.json();
        
        let rows;
        if (name !== undefined) {
            rows = await sql`UPDATE mentors SET name = ${name} WHERE id = ${id} RETURNING *`;
        } else if (passcode !== undefined) {
            const newCode = passcode || nanoid(5).toUpperCase();
            rows = await sql`UPDATE mentors SET passcode = ${newCode} WHERE id = ${id} RETURNING *`;
        } else {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        if (rows.length === 0) return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
        return NextResponse.json({ success: true, mentor: rows[0] });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// DELETE /api/admin/mentors - Delete mentor
export async function DELETE(req: Request) {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Deletion is disabled' }, { status: 403 });
    /*
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'No DB URL' }, { status: 500 });
    const sql = neon(process.env.DATABASE_URL);

    try {
        const { id } = await req.json();
        
        // Also delete feedback for this mentor to avoid orphan rows?
        // Actually the setup script had REFERENCES ... ON DELETE CASCADE would be better
        // But for now we just delete.
        await sql`DELETE FROM mentor_feedback WHERE mentor_id = ${id}`;
        const result = await sql`DELETE FROM mentors WHERE id = ${id}`;
        
        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
    */
}
