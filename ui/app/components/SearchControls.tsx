'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

interface Props {
  specialties: string[];
}

export default function SearchControls({ specialties }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page'); // reset to page 1 on filter change
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or specialty..."
        defaultValue={searchParams.get('search') ?? ''}
        onChange={(e) => update('search', e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Specialty filter */}
      <select
        defaultValue={searchParams.get('specialty') ?? ''}
        onChange={(e) => update('specialty', e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Specialties</option>
        {specialties.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Source filter */}
      <select
        defaultValue={searchParams.get('source') ?? ''}
        onChange={(e) => update('source', e.target.value)}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Sources</option>
        <option value="bddoctor_spider">Doctor Bangladesh</option>
        <option value="ibnsina_spider">Ibn Sina Trust</option>
      </select>
    </div>
  );
}
