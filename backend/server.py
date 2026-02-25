"""
Flask web service — exposes the Scrapy scraper via HTTP + Server-Sent Events.

Endpoints:
  GET  /api/health               — health check
  GET  /api/status               — is a scrape running?
  GET  /api/scrape/stream        — start scraping and stream live logs (SSE)
      ?spider=bddoctor_spider    — scrape only doctorbangladesh.com
      ?spider=ibnsina_spider     — scrape only ibnsinatrust.com
      ?spider=all                — scrape both (default)

Deployed on Render as a Web Service.
"""

import os
import subprocess
import sys
import threading

import psycopg2
from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)

CORS(
    app,
    origins=os.environ.get('ALLOWED_ORIGINS', '*'),
    methods=['GET', 'POST', 'DELETE', 'OPTIONS'],
    allow_headers=['Content-Type'],
    supports_credentials=False,
)

# Simple in-memory lock — prevents two simultaneous scrape runs
_scrape_lock = threading.Lock()
_scraping = False


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok'})


@app.route('/api/status')
def status():
    return jsonify({'scraping': _scraping})


@app.route('/api/scrape/stream')
def scrape_stream():
    """
    Starts the chosen spider(s) in a subprocess and streams stdout/stderr
    back to the client as Server-Sent Events.
    """
    global _scraping

    if _scraping:
        def busy():
            yield 'data: [ERROR] A scrape is already running. Please wait.\n\n'
            yield 'data: [DONE]\n\n'
        return Response(busy(), mimetype='text/event-stream')

    spider = request.args.get('spider', 'all')
    if spider == 'all':
        spiders = ['bddoctor_spider', 'ibnsina_spider']
    elif spider in ('bddoctor_spider', 'ibnsina_spider'):
        spiders = [spider]
    else:
        def bad():
            yield f'data: [ERROR] Unknown spider: {spider}\n\n'
            yield 'data: [DONE]\n\n'
        return Response(bad(), mimetype='text/event-stream')

    max_pages = request.args.get('max_pages', '')

    def generate():
        global _scraping
        with _scrape_lock:
            _scraping = True
            try:
                for sp in spiders:
                    yield f'data: ▶ Starting spider: {sp}\n\n'

                    cmd = [sys.executable, '-u', '-m', 'scrapy', 'crawl', sp]
                    if max_pages.isdigit() and int(max_pages) > 0:
                        cmd += ['-s', f'CLOSESPIDER_ITEMCOUNT={max_pages}']

                    proc = subprocess.Popen(
                        cmd,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        text=True,
                        bufsize=1,
                        env={**os.environ, 'PYTHONUNBUFFERED': '1'},
                    )

                    for line in proc.stdout:
                        stripped = line.rstrip()
                        if stripped:
                            yield f'data: {stripped}\n\n'

                    proc.wait()

                    if proc.returncode == 0:
                        yield f'data: ✓ {sp} finished successfully\n\n'
                    else:
                        yield f'data: ✗ {sp} exited with code {proc.returncode}\n\n'

                yield 'data: [DONE] All scrapers finished.\n\n'
            except Exception as e:
                yield f'data: [ERROR] {e}\n\n'
                yield 'data: [DONE]\n\n'
            finally:
                _scraping = False

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',     # disable Nginx buffering on Render
        },
    )


@app.route('/api/db/clear', methods=['DELETE'])
def db_clear():
    """Delete all rows from the doctors table."""
    database_url = os.environ.get('DOCTOR_DB_URL')
    if not database_url:
        return jsonify({'error': 'Database not configured'}), 500
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute('DELETE FROM doctors')
        deleted = cur.rowcount
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'deleted': deleted})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, threaded=True)
