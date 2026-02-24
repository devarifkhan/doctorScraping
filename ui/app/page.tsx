import { neon } from '@neondatabase/serverless';
import { Suspense } from 'react';
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
  const sql = neon(process.env.DATABASE_URL!);

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
  const { doctors, total, page, totalPages, specialties } = await fetchDoctors(params);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">Doctor Directory Bangladesh</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total.toLocaleString()} doctors from Doctor Bangladesh &amp; Ibn Sina Trust
          </p>
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
