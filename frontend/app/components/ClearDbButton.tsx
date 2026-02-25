'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const BACKEND_URL = process.env.NEXT_PUBLIC_DOCTOR_SCRAPER_URL ?? '';

type State = 'idle' | 'confirm' | 'loading' | 'done' | 'error';

export default function ClearDbButton() {
  const [state, setState] = useState<State>('idle');
  const [deleted, setDeleted] = useState(0);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleConfirm() {
    setState('loading');
    try {
      const res = await fetch(`${BACKEND_URL}/api/db/clear`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Unknown error');
      setDeleted(json.deleted);
      setState('done');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState('error');
    }
  }

  if (state === 'confirm') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 font-medium">Delete all doctors?</span>
        <button
          onClick={handleConfirm}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Yes, delete all
        </button>
        <button
          onClick={() => setState('idle')}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return <span className="text-sm text-gray-400 animate-pulse">Deleting…</span>;
  }

  if (state === 'done') {
    return (
      <span className="text-sm text-green-600 font-medium">
        ✓ Deleted {deleted.toLocaleString()} records
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="text-sm text-red-500" title={error}>
        ✗ Error — {error}
      </span>
    );
  }

  return (
    <button
      onClick={() => setState('confirm')}
      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
    >
      🗑 Clear DB
    </button>
  );
}
