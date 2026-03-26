-- ============================================================
-- DRRC Race Management Platform
-- Initial Schema Migration
-- Created: 2026-03-26
-- ============================================================

-- 1. SCORING TEMPLATES
-- Reusable rulebook for points, prizes, and bonuses per series
CREATE TABLE scoring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  positions_that_score int DEFAULT 6,
  points_per_position jsonb NOT NULL,         -- [{position:1, points:6}, ...]
  has_first_lady boolean DEFAULT true,
  first_lady_points int DEFAULT 2,
  has_first_junior boolean DEFAULT true,
  first_junior_points int DEFAULT 2,
  primes jsonb DEFAULT '[]',                  -- [{name:"Prime", points:1, prize:20}]
  prize_per_position jsonb DEFAULT '[]',      -- [{position:1, amount:50}, ...]
  first_lady_prize decimal(10,2) DEFAULT 0,
  first_junior_prize decimal(10,2) DEFAULT 0,
  unplaced_points jsonb DEFAULT '{}',         -- {"C2": 1, "C3": 1}
  created_at timestamptz DEFAULT now()
);

-- 2. SERIES
-- A season/competition consisting of multiple races
CREATE TABLE series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year int NOT NULL,
  scoring_template_id uuid REFERENCES scoring_templates(id),
  created_at timestamptz DEFAULT now()
);

-- 3. FIXTURES
-- Individual race events within a series
CREATE TABLE fixtures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id uuid REFERENCES series(id),
  title text NOT NULL,
  date date NOT NULL,
  venue text DEFAULT 'Mondello Park',
  categories text[] DEFAULT '{C1,C2,C3}',
  status text DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','cancelled')),
  marshals_needed int DEFAULT 0,
  scoring_template_id uuid REFERENCES scoring_templates(id), -- overrides series default
  created_at timestamptz DEFAULT now()
);

-- 4. RIDERS
-- Imported from Event Master, upserted before each race
CREATE TABLE riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  team text,
  category text,
  email text,
  cycling_ireland_num text,
  paypal_email text,
  created_at timestamptz DEFAULT now()
);

-- 5. RESULTS
-- One row per rider per fixture, calculated by the race engine
CREATE TABLE results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid REFERENCES fixtures(id),
  rider_id uuid REFERENCES riders(id),
  position int,                               -- 1-6 for placed, null for unplaced
  finish_time interval,
  is_first_lady boolean DEFAULT false,
  is_first_junior boolean DEFAULT false,
  prime_won text,                             -- null or prime name e.g. 'Lap 5'
  points_earned int DEFAULT 0,
  prize_amount decimal(10,2) DEFAULT 0,
  payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending','sent','claimed','failed')),
  payout_batch_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(fixture_id, rider_id)
);

-- 6. STANDINGS VIEW
-- Aggregates results per rider per series, ranked by points then wins then podiums
CREATE OR REPLACE VIEW standings AS
SELECT
  RANK() OVER (
    PARTITION BY f.series_id
    ORDER BY SUM(r.points_earned) DESC,
             COUNT(CASE WHEN r.position = 1 THEN 1 END) DESC,
             COUNT(CASE WHEN r.position <= 3 THEN 1 END) DESC
  ) as rank,
  r.rider_id,
  ri.name,
  ri.team,
  ri.category,
  f.series_id,
  SUM(r.points_earned) as total_points,
  COUNT(CASE WHEN r.position = 1 THEN 1 END) as wins,
  COUNT(CASE WHEN r.position <= 3 THEN 1 END) as podiums,
  COUNT(r.id) as races_entered,
  jsonb_agg(jsonb_build_object(
    'fixture_id', r.fixture_id,
    'position', r.position,
    'points', r.points_earned,
    'prize', r.prize_amount
  ) ORDER BY f.date) as round_details
FROM results r
JOIN riders ri ON r.rider_id = ri.id
JOIN fixtures f ON r.fixture_id = f.id
GROUP BY r.rider_id, ri.name, ri.team, ri.category, f.series_id
ORDER BY rank;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Mondello Series 2026 scoring template
INSERT INTO scoring_templates (name, points_per_position, first_lady_points, unplaced_points, primes)
VALUES (
  'Mondello Series 2026',
  '[
    {"position": 1, "points": 6},
    {"position": 2, "points": 5},
    {"position": 3, "points": 4},
    {"position": 4, "points": 3},
    {"position": 5, "points": 2},
    {"position": 6, "points": 1}
  ]',
  2,
  '{"C2": 1, "C3": 1}',
  '[{"name": "Prime", "points": 1}]'
);
