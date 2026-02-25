-- 1. Ensure 'teams' table has 'team_id' and other columns
-- If 'id' exists instead of 'team_id', we can add 'team_id' or rename it.
-- Let's ensure 'team_id' exists and is used for linking.
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS problem_title TEXT,
ADD COLUMN IF NOT EXISTS problem_statement TEXT,
ADD COLUMN IF NOT EXISTS team_size INTEGER,
ADD COLUMN IF NOT EXISTS team_members TEXT[],
ADD COLUMN IF NOT EXISTS team_roles TEXT[],
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS proposed_solution TEXT,
ADD COLUMN IF NOT EXISTS target_users TEXT[],
ADD COLUMN IF NOT EXISTS innovation_highlights TEXT[],
ADD COLUMN IF NOT EXISTS tech_stack TEXT[],
ADD COLUMN IF NOT EXISTS business_model TEXT,
ADD COLUMN IF NOT EXISTS market_insight TEXT;

-- 2. Create 'idea_results' table using 'team_id' for linking
CREATE TABLE IF NOT EXISTS idea_results (
    team_id UUID PRIMARY KEY,
    summary TEXT,
    desirability_score NUMERIC,
    feasibility_score NUMERIC,
    viability_score NUMERIC,
    weighted_dfv NUMERIC,
    insights TEXT,
    transaction_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create 'jury_scores' table
CREATE TABLE IF NOT EXISTS jury_scores (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    team_name TEXT NOT NULL,
    desirability NUMERIC NOT NULL,
    feasibility NUMERIC NOT NULL,
    viability NUMERIC NOT NULL,
    presentation NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS and Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE jury_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read for idea_results" ON idea_results FOR SELECT USING (true);
CREATE POLICY "Public read for jury_scores" ON jury_scores FOR SELECT USING (true);
CREATE POLICY "Public insert for jury_scores" ON jury_scores FOR INSERT WITH CHECK (true);
