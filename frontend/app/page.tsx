import { neon } from '@neondatabase/serverless';
import { Suspense } from 'react';
import Link from 'next/link';
import DoctorCard from './components/DoctorCard';
import SearchControls from './components/SearchControls';
import Pagination from './components/Pagination';

const PAGE_SIZE = 20;

interface SearchParams {
  search?:    string;
  specialty?: string;
  source?:    string;
  page?:      string;
}

interface Doctor {
  id:        number;
  name:      string;
  specialty: string | null;
  url:       string;
  image_url: string | null;
  raw_data:  string | null;
  source:    string | null;
}

async function fetchDoctors(params: SearchParams) {
  const dbUrl = process.env.DOCTOR_DB_URL;
  if (!dbUrl) throw new Error('DOCTOR_DB_URL environment variable is not set.');
  const sql = neon(dbUrl);

  const search    = params.search    ?? '';
  const specialty = params.specialty ?? '';
  const source    = params.source    ?? '';
  const page      = Math.max(1, parseInt(params.page ?? '1', 10));
  const offset    = (page - 1) * PAGE_SIZE;

  const searchPat    = `%${search}%`;
  const specialtyPat = `%${specialty}%`;

  const [rows, countRows, specialtyRows] = await Promise.all([
    sql`
      SELECT id, name, specialty, url, image_url, raw_data, source
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

  const total = parseInt((countRows[0] as { total: string }).total, 10);

  return {
    doctors:     rows as Doctor[],
    total,
    page,
    totalPages:  Math.ceil(total / PAGE_SIZE),
    specialties: (specialtyRows as { specialty: string }[]).map((r) => r.specialty),
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let data: Awaited<ReturnType<typeof fetchDoctors>>;
  try {
    data = await fetchDoctors(params);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg text-center">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Database connection error</h2>
          <p className="text-sm text-red-600 font-mono break-all">{message}</p>
          <p className="text-xs text-gray-500 mt-4">Check that DOCTOR_DB_URL is set correctly in Vercel → Settings → Environment Variables.</p>
        </div>
      </div>
    );
  }

  const { doctors, total, page, totalPages, specialties } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Directory Bangladesh</h1>
              <p className="text-sm text-gray-500 mt-1">
                {total.toLocaleString()} doctors from Doctor Bangladesh &amp; Ibn Sina Trust
              </p>
            </div>
            <Link
              href="/scrape"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              ▶ Run Scraper
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {/* Filters */}
        <Suspense>
          <SearchControls specialties={specialties} />
        </Suspense>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          Showing {doctors.length} of {total.toLocaleString()} results
        </p>

        {/* Doctor grid */}
        {doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <p className="text-lg">No doctors found.</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Suspense>
          <Pagination page={page} totalPages={totalPages} />
        </Suspense>
      </main>
    </div>
  );
}
