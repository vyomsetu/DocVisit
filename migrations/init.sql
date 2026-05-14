-- DocVisit database schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- provides gen_random_uuid()

-- ── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE specialty_type AS ENUM (
  'general',
  'diabetes',
  'cardiology',
  'paediatrics',
  'orthopaedics'
);

CREATE TYPE booking_type AS ENUM ('home_visit', 'call');

CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- ── Doctors ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doctors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT        NOT NULL,
  phone            TEXT        NOT NULL UNIQUE,
  specialty        specialty_type NOT NULL,
  home_visit_price NUMERIC(10, 2) NOT NULL CHECK (home_visit_price >= 0),
  call_price       NUMERIC(10, 2) NOT NULL CHECK (call_price >= 0),
  avg_rating       NUMERIC(3, 2)  NOT NULL DEFAULT 0.00,
  rating_count     INTEGER        NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors (specialty);

-- ── Patients ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL UNIQUE,
  address    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Bookings ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bookings (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       UUID           NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  doctor_id        UUID           NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
  booking_type     booking_type   NOT NULL,
  status           booking_status NOT NULL DEFAULT 'pending',
  scheduled_at     TIMESTAMPTZ    NOT NULL,
  patient_address  TEXT,          -- required for home_visit, populated at booking time
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_patient  ON bookings (patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_doctor   ON bookings (doctor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status   ON bookings (status);

-- ── Ratings ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ratings (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID        NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
  patient_id UUID        NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
  doctor_id  UUID        NOT NULL REFERENCES doctors (id) ON DELETE CASCADE,
  stars      SMALLINT    NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ratings_doctor ON ratings (doctor_id);
