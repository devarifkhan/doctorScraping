-- Run this once on your Neon PostgreSQL database to create the doctors table.
-- The scraper also creates this table automatically on first run.

CREATE TABLE IF NOT EXISTS doctors (
    id         SERIAL PRIMARY KEY,
    name       TEXT,
    specialty  TEXT,
    url        TEXT UNIQUE,
    image_url  TEXT,
    raw_data   TEXT,
    source     TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast search by name and specialty
CREATE INDEX IF NOT EXISTS idx_doctors_name      ON doctors (name);
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors (specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_source    ON doctors (source);
