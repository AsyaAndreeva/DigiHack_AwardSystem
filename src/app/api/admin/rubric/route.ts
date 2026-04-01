import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('No DB URL');
  return neon(process.env.DATABASE_URL);
}

function isAuthorized(req: Request): boolean {
  const adminCode = req.headers.get('x-admin-code');
  const validCode = process.env.ADMIN_CODE || process.env.NEXT_PUBLIC_ADMIN_CODE || '2026';
  return adminCode === validCode;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const { category, description, criterion, max_score, scoring_guide, order_idx } = await req.json();
    if (!category?.trim() || !criterion?.trim() || max_score == null) {
      return NextResponse.json({ error: 'Липсват задължителни полета.' }, { status: 400 });
    }
    const result = await sql`
      INSERT INTO rubric_criteria (category, description, criterion, max_score, scoring_guide, order_idx)
      VALUES (${category.trim()}, ${description?.trim() || ''}, ${criterion.trim()}, ${parseInt(max_score)}, ${scoring_guide || ''}, ${order_idx ?? 99})
      RETURNING id
    `;
    return NextResponse.json({ success: true, id: result[0].id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const sql = getDb();
    const { id, category, description, criterion, max_score, scoring_guide, order_idx } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    await sql`
      UPDATE rubric_criteria
      SET category = ${category}, description = ${description || ''}, criterion = ${criterion}, max_score = ${parseInt(max_score)},
          scoring_guide = ${scoring_guide || ''}, order_idx = ${order_idx ?? 99}
      WHERE id = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Deletion is disabled' }, { status: 403 });
  /*
  try {
    const sql = getDb();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    await sql`DELETE FROM rubric_criteria WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
  */
}
