import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error('No DB URL');
  return neon(process.env.DATABASE_URL);
}

export async function POST(req: Request) {
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
  try {
    const sql = getDb();
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Липсва ID.' }, { status: 400 });
    await sql`DELETE FROM rubric_criteria WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
