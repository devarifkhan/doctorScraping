# Doctor Directory Bangladesh

A production-grade web scraper that collects doctor profiles from two major Bangladesh medical directories and displays them in a searchable, filterable web UI.

**Data sources:**
- [Doctor Bangladesh](https://www.doctorbangladesh.com) — doctors in Dhaka
- [Ibn Sina Trust](https://www.ibnsinatrust.com) — national doctor database

**Stack:**
- Scraper: Python / Scrapy
- Database: Neon PostgreSQL (serverless)
- UI: Next.js 16 + Tailwind CSS (deployable to Vercel)

---

## Project Structure

```
doctorScraping/          # Scrapy scraper
  doctorScraping/
    settings.py          # Configuration (reads from .env)
    pipelines.py         # PostgreSQL pipeline
    items.py             # Data model
    spiders/
      bddoctor_spider.py # Scraper for doctorbangladesh.com
      ibnsina_spider.py  # Scraper for ibnsinatrust.com
  .env.example           # Environment variable template
  requirements.txt       # Python dependencies
  schema.sql             # Database schema

ui/                      # Next.js web UI
  app/
    page.tsx             # Main directory page
    api/doctors/         # REST API route
    components/          # SearchControls, DoctorCard, Pagination
  .env.local.example     # UI environment variable template
  vercel.json            # Vercel deployment config
```

---

## Prerequisites

- Python 3.10+
- Node.js 20+
- A [Neon](https://neon.tech) account (free tier is sufficient)

---

## 1. Database Setup

1. Create a free project on [neon.tech](https://neon.tech).
2. Copy the **Connection String** from the Neon dashboard (it looks like `postgresql://user:pass@ep-xxxx.neon.tech/neondb?sslmode=require`).
3. Run the schema to create the table (optional — the scraper does this automatically):

```bash
psql "$DATABASE_URL" -f schema.sql
```

---

## 2. Scraper Setup

```bash
# Clone and enter the project
cd doctorScraping

# Create your environment file
cp .env.example .env
# Edit .env and set DATABASE_URL to your Neon connection string

# Create a virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Run the scrapers

```bash
# Scrape Doctor Bangladesh (also outputs JSON)
scrapy crawl bddoctor_spider -o bddoctor_data.json

# Scrape Ibn Sina Trust (also outputs JSON)
scrapy crawl ibnsina_spider -o ibnsina_data.json
```

Both spiders automatically insert records into Neon PostgreSQL via the pipeline. Duplicate URLs are ignored (`ON CONFLICT DO NOTHING`).

---

## 3. UI Setup (Local)

```bash
cd ui

# Create your local environment file
cp .env.local.example .env.local
# Edit .env.local and set DATABASE_URL to your Neon connection string

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the directory.

---

## 4. Deploy UI to Vercel

1. Push the project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Set the **Root Directory** to `ui`.
4. Add the environment variable:
   - **Name:** `DATABASE_URL`
   - **Value:** your Neon connection string
5. Click **Deploy**.

Your app will be live at `https://your-project.vercel.app`.

---

## UI Features

- Full-text search by doctor name or specialty
- Filter by specialty (populated from live database)
- Filter by data source (Doctor Bangladesh / Ibn Sina Trust)
- Paginated results (20 per page)
- Responsive card layout with doctor image, specialty, and profile link
- Server-side rendering for fast initial load and SEO

---

## Environment Variables

| Variable       | Used by        | Description                        |
|----------------|----------------|------------------------------------|
| `DATABASE_URL` | Scraper + UI   | Neon PostgreSQL connection string  |

---

## Database Schema

```sql
CREATE TABLE doctors (
    id         SERIAL PRIMARY KEY,
    name       TEXT,
    specialty  TEXT,
    url        TEXT UNIQUE,       -- deduplication key
    image_url  TEXT,
    raw_data   TEXT,              -- chamber / appointment / address info
    source     TEXT,              -- spider name (bddoctor_spider / ibnsina_spider)
    created_at TIMESTAMP DEFAULT NOW()
);
```
