# Doctor Directory Bangladesh

A production-grade web scraper that collects doctor profiles from two major Bangladesh medical directories and displays them in a searchable, filterable web UI.

**Data sources:**

- [Doctor Bangladesh](https://www.doctorbangladesh.com) — doctors in Dhaka
- [Ibn Sina Trust](https://www.ibnsinatrust.com) — national doctor database

**Stack:**

- Scraper: Python / Scrapy → deployed on **Render**
- Database: Neon PostgreSQL (serverless)
- UI: Next.js 16 + Tailwind CSS → deployed on **Vercel**

---

## Project Structure

```
backend/                         # Python scraper + Flask API (Render)
  doctorScraping/
    settings.py                  # Config (reads from .env)
    pipelines.py                 # PostgreSQL pipeline
    items.py                     # Data model
    spiders/
      bddoctor_spider.py         # Scraper for doctorbangladesh.com
      ibnsina_spider.py          # Scraper for ibnsinatrust.com
  server.py                      # Flask API with SSE scrape endpoint
  run_scrapers.py                # Run all spiders locally
  scrapy.cfg                     # Scrapy project config
  requirements.txt               # Python dependencies
  schema.sql                     # Database schema
  .env.example                   # Environment variable template

frontend/                        # Next.js web UI (Vercel)
  app/
    page.tsx                     # Doctor directory page
    scrape/page.tsx              # Live scraper control page
    api/doctors/route.ts         # REST API route
    components/                  # SearchControls, DoctorCard, Pagination
  .env.local.example             # UI environment variable template
  vercel.json                    # Vercel deployment config

render.yaml                      # Render deployment Blueprint
README.md
```

---

## Prerequisites

- Python 3.10+
- Node.js 20+
- A [Neon](https://neon.tech) account (free tier is sufficient)

---

## 1. Database Setup

1. Create a free project on [neon.tech](https://neon.tech).
2. Copy the **Connection String** from the Neon dashboard.
3. Run the schema to create the table (optional — the scraper does this automatically):

```bash
psql "$DATABASE_URL" -f backend/schema.sql
```

---

## 2. Backend Setup (local)

```bash
cd backend

# Create your environment file
cp .env.example .env
# Edit .env and set DATABASE_URL to your Neon connection string

# Create a virtual environment and install dependencies
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Run the scrapers locally

```bash
# From inside backend/
scrapy crawl bddoctor_spider
scrapy crawl ibnsina_spider

# Or run both at once
python run_scrapers.py
```

### Run the Flask API locally

```bash
# From inside backend/
python server.py
# API available at http://localhost:5000
```

---

## 3. Frontend Setup (local)

```bash
cd frontend

# Create your local environment file
cp .env.local.example .env.local
# Set DATABASE_URL and NEXT_PUBLIC_BACKEND_URL

# Install dependencies and start dev server
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 4. Deploy Backend to Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo `devarifkhan/doctorScraping`
3. Render auto-detects `render.yaml` — confirm the settings
4. Add environment variables in the Render dashboard:
   - `DATABASE_URL` → your Neon connection string
   - `ALLOWED_ORIGINS` → your Vercel URL (e.g. `https://your-app.vercel.app`)
5. Click **Deploy** — your API URL will be `https://doctor-scraper-api.onrender.com`

---

## 5. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Set the **Root Directory** to `frontend`
3. Add environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `NEXT_PUBLIC_BACKEND_URL` → your Render API URL
4. Click **Deploy**

---

## UI Features

- Doctor directory with search, specialty filter, and pagination
- **Scraper control page** (`/scrape`) — click a button to run the scrapers live and watch the output in a real-time terminal
- Responsive card layout with doctor image, specialty, and profile link

---

## Environment Variables

| Variable                    | Used by   | Description                                    |
|-----------------------------|-----------|------------------------------------------------|
| `DATABASE_URL`              | Both      | Neon PostgreSQL connection string              |
| `NEXT_PUBLIC_BACKEND_URL`   | Frontend  | Render API URL for the scraper control page    |
| `ALLOWED_ORIGINS`           | Backend   | Comma-separated allowed origins for CORS       |

---

## Database Schema

```sql
CREATE TABLE doctors (
    id         SERIAL PRIMARY KEY,
    name       TEXT,
    specialty  TEXT,
    url        TEXT UNIQUE,
    image_url  TEXT,
    raw_data   TEXT,
    source     TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```
