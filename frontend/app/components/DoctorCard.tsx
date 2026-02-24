interface Doctor {
  id: number;
  name: string;
  specialty: string | null;
  url: string;
  image_url: string | null;
  raw_data: string | null;
  source: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  bddoctor_spider: 'Doctor Bangladesh',
  ibnsina_spider:  'Ibn Sina Trust',
};

export default function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="flex items-center justify-center bg-gray-50 h-40">
        {doctor.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doctor.image_url}
            alt={doctor.name ?? 'Doctor'}
            className="h-full w-full object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/placeholder-doctor.svg';
            }}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-3xl font-bold">
            {(doctor.name ?? 'D')[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 p-4 flex-1">
        <h2 className="text-base font-semibold text-gray-900 leading-tight">
          {doctor.name ?? 'Unknown'}
        </h2>
        {doctor.specialty && (
          <p className="text-sm text-blue-600 font-medium">{doctor.specialty}</p>
        )}
        {doctor.raw_data && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-3">{doctor.raw_data}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {doctor.source ? (SOURCE_LABELS[doctor.source] ?? doctor.source) : 'Unknown'}
          </span>
          {doctor.url && (
            <a
              href={doctor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline"
            >
              View profile →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
