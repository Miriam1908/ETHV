-- ============================================================
-- LIKETALENT — Schema de Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Tabla: cv_analyses ──────────────────────────────────────
-- Guarda cada análisis de CV realizado por la IA
CREATE TABLE IF NOT EXISTS cv_analyses (
  id                BIGSERIAL PRIMARY KEY,
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Datos de contacto
  name              TEXT,
  email             TEXT,
  phone             TEXT,
  location          TEXT,
  linkedin          TEXT,
  github            TEXT,
  portfolio         TEXT,

  -- Posición y experiencia
  current_position  TEXT,
  company           TEXT,
  experience_years  INTEGER DEFAULT 0,

  -- Puntuaciones
  overall_score     INTEGER DEFAULT 0,
  ats_score         INTEGER DEFAULT 0,
  estimated_level   TEXT,

  -- Contenido
  summary           TEXT,
  web3_relevance    TEXT DEFAULT 'low',

  -- Arrays almacenados como JSON
  skills            JSONB,
  certifications    JSONB,
  education         JSONB,
  languages         JSONB,

  -- Respuesta completa de la IA (para auditoría)
  raw_response      JSONB
);

-- ── Tabla: auth_sessions ────────────────────────────────────
-- Guarda cada login OAuth (Google, LinkedIn, GitHub, Wallet)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  provider    TEXT NOT NULL,          -- google | linkedin | github | wallet
  email       TEXT,
  name        TEXT,
  picture     TEXT,
  identifier  TEXT                    -- wallet address o user id externo
);

-- ── Tabla: cv_improvements ──────────────────────────────────
-- Guarda cada CV ATS generado/mejorado por la IA
CREATE TABLE IF NOT EXISTS cv_improvements (
  id                   BIGSERIAL PRIMARY KEY,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  candidate_name       TEXT,
  ats_score            INTEGER DEFAULT 0,
  mode                 TEXT DEFAULT 'improve',  -- improve | tailor
  job_description      TEXT,
  match_score          INTEGER,
  professional_summary TEXT,
  contact              JSONB,
  experience           JSONB,
  skills               JSONB,
  education            JSONB,
  tips                 JSONB
);

-- ── Índices útiles ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cv_analyses_email      ON cv_analyses(email);
CREATE INDEX IF NOT EXISTS idx_cv_analyses_created_at ON cv_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_email    ON auth_sessions(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_provider ON auth_sessions(provider);

-- ── Row Level Security (RLS) ────────────────────────────────
-- Desactivado por ahora (backend usa service_role key que lo bypasea)
-- Activar y configurar políticas si se expone el frontend directamente a Supabase
ALTER TABLE cv_analyses    DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE cv_improvements DISABLE ROW LEVEL SECURITY;
