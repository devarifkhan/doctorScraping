import postgres from 'postgres';
import { NextRequest, NextResponse } from 'next/server';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const search    = searchParams.get('search')    ?? '';
  const specialty = searchParams.get('specialty') ?? '';
  const source    = searchParams.get('source')    ?? '';
  const page      = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const offset    = (page - 1) * PAGE_SIZE;

  const sql = postgres(process.env.DOCTOR_DB_URL!, { ssl: 'require', prepare: false });

  const searchPat   = `%${search}%`;
  const specialtyPat = `%${specialty}%`;

  const [rows, countRows, specialties] = await Promise.all([
    sql`
      SELECT id, name, specialty, url, image_url, raw_data, source, created_at
      FROM doctors
      WHERE (${search} = '' OR name ILIKE ${searchPat} OR specialty ILIKE ${searchPat})
        AND (${specialty} = '' OR specialty ILIKE ${specialtyPat})
        AND (${source} = '' OR source = ${source})
      ORDER BY id
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) AS total FROM doctors
      WHERE (${search} = '' OR name ILIKE ${searchPat} OR specialty ILIKE ${searchPat})
        AND (${specialty} = '' OR specialty ILIKE ${specialtyPat})
        AND (${source} = '' OR source = ${source})
    `,
    sql`SELECT DISTINCT specialty FROM doctors WHERE specialty IS NOT NULL ORDER BY specialty`,
  ]);

  await sql.end();

  const total = parseInt((countRows[0] as { total: string }).total, 10);

  return NextResponse.json({
    doctors:    rows,
    total,
    page,
    pageSize:   PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
    specialties: (specialties as { specialty: string }[]).map((r) => r.specialty),
  });
}
