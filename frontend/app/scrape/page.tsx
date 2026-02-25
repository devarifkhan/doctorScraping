'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Status = 'idle' | 'running' | 'done' | 'error';

const BACKEND_URL = process.env.NEXT_PUBLIC_DOCTOR_SCRAPER_URL ?? '';

const SPIDERS = [
  { value: 'all',              label: 'Both sites (recommended)' },
  { value: 'bddoctor_spider',  label: 'Doctor Bangladesh only'   },
  { value: 'ibnsina_spider',   label: 'Ibn Sina Trust only'      },
];

export default function ScrapePage() {
  const [spider,       setSpider]       = useState('all');
  const [maxItems,     setMaxItems]     = useState('');
  const [status,       setStatus]       = useState<Status>('idle');
  const [logs,         setLogs]         = useState<string[]>([]);
  const [scrapedCount, setScrapedCount] = useState(0);
  const logBoxRef      = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll log box to bottom on new messages
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  function startScraping() {
    if (status === 'running') return;

    setLogs([]);
    setScrapedCount(0);
    setStatus('running');

    const params = new URLSearchParams({ spider });
    if (maxItems && parseInt(maxItems) > 0) params.set('max_pages', maxItems);
    const url = `${BACKEND_URL}/api/scrape/stream?${params}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const msg: string = event.data;

      if (msg === '[DONE] All scrapers finished.') {
        setStatus('done');
        setLogs((prev) => [...prev, msg]);
        es.close();
        return;
      }

      if (msg.startsWith('[ERROR]')) {
        setStatus('error');
      }

      if (msg.includes('Scraped doctor:')) {
        setScrapedCount((prev) => prev + 1);
      }

      setLogs((prev) => [...prev, msg]);
    };

    es.onerror = () => {
      setStatus('error');
      setLogs((prev) => [...prev, '[CONNECTION ERROR] Lost connection to the scraper server.']);
      es.close();
    };
  }

  function stopScraping() {
    eventSourceRef.current?.close();
    setStatus('idle');
    setLogs((prev) => [...prev, '— Scraping stopped by user.']);
  }

  const statusColors: Record<Status, string> = {
    idle:    'bg-gray-400',
    running: 'bg-yellow-400 animate-pulse',
    done:    'bg-green-500',
    error:   'bg-red-500',
  };
  const statusLabels: Record<Status, string> = {
    idle:    'Idle',
    running: 'Scraping…',
    done:    'Done',
    error:   'Error',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scraper Control</h1>
            <p className="text-sm text-gray-500 mt-1">
              Trigger a live scrape and watch the output in real-time
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline"
          >
            ← View Directory
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 space-y-6">

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
          {/* Spider selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select spider
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              {SPIDERS.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm
                    ${spider === s.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                >
                  <input
                    type="radio"
                    name="spider"
                    value={s.value}
                    checked={spider === s.value}
                    onChange={() => setSpider(s.value)}
                    className="accent-blue-600"
                    disabled={status === 'running'}
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {/* Max items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max items <span className="text-gray-400 font-normal">(leave blank for unlimited)</span>
            </label>
            <div className="flex items-center gap-3">
              {['', '100', '500', '1000', '3000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={status === 'running'}
                  onClick={() => setMaxItems(preset)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors
                    ${maxItems === preset
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'}`}
                >
                  {preset === '' ? 'Unlimited' : preset}
                </button>
              ))}
              <input
                type="number"
                min="1"
                placeholder="custom"
                value={maxItems}
                disabled={status === 'running'}
                onChange={(e) => setMaxItems(e.target.value)}
                className="w-24 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700
                           focus:outline-none focus:border-blue-400 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Action buttons + status */}
          <div className="flex items-center gap-4">
            <button
              onClick={startScraping}
              disabled={status === 'running'}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ▶ Start Scraping
            </button>

            {status === 'running' && (
              <button
                onClick={stopScraping}
                className="px-6 py-2.5 rounded-lg bg-red-100 text-red-700 text-sm font-semibold
                           hover:bg-red-200 transition-colors border border-red-200"
              >
                ■ Stop
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <span className={`h-2.5 w-2.5 rounded-full ${statusColors[status]}`} />
              <span className="text-sm text-gray-600">{statusLabels[status]}</span>
            </div>
          </div>
        </div>

        {/* Progress */}
        {(status === 'running' || (status === 'done' && scrapedCount > 0)) && (() => {
          const total = maxItems ? parseInt(maxItems) : 0;
          const pct   = total > 0 ? Math.min(Math.round((scrapedCount / total) * 100), 100) : null;
          return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {scrapedCount.toLocaleString()} item{scrapedCount !== 1 ? 's' : ''} scraped
                </span>
                {total > 0 ? (
                  <span className="text-gray-500">
                    {scrapedCount.toLocaleString()} / {total.toLocaleString()} &nbsp;({pct}%)
                  </span>
                ) : (
                  <span className="text-gray-400 text-xs">unlimited — no target set</span>
                )}
              </div>
              {total > 0 && (
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* Live log terminal */}
        <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg">
          {/* Terminal title bar */}
          <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="h-3 w-3 rounded-full bg-yellow-400" />
            <span className="h-3 w-3 rounded-full bg-green-500" />
            <span className="ml-3 text-xs text-gray-400 font-mono">scrapy output</span>
          </div>

          {/* Log output */}
          <div
            ref={logBoxRef}
            className="bg-gray-950 text-green-400 font-mono text-xs p-4 h-[60vh] overflow-y-auto leading-relaxed"
          >
            {logs.length === 0 ? (
              <span className="text-gray-600">
                {status === 'idle'
                  ? '$ waiting for scrape to start...'
                  : '$ connecting...'}
              </span>
            ) : (
              logs.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('[ERROR]') || line.startsWith('✗')
                      ? 'text-red-400'
                      : line.startsWith('✓') || line.startsWith('[DONE]')
                      ? 'text-green-300 font-semibold'
                      : line.startsWith('▶')
                      ? 'text-yellow-300 font-semibold mt-2'
                      : 'text-green-400'
                  }
                >
                  {line}
                </div>
              ))
            )}
            {status === 'running' && (
              <span className="text-green-400 animate-pulse">█</span>
            )}
          </div>
        </div>

        {status === 'done' && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            Scraping complete. <Link href="/" className="font-semibold underline">View the updated directory →</Link>
          </div>
        )}
      </main>
    </div>
  );
}
