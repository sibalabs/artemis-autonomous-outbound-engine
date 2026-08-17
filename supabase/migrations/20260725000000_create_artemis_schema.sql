-- 1. Enable the pgvector extension for AI similarity search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- 2. Create the Artemis generations log table
CREATE TABLE IF NOT EXISTS public.artemis_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    target_company_url TEXT NOT NULL,
    target_role TEXT NOT NULL,
    value_proposition TEXT NOT NULL,
    generated_playbook JSONB NOT NULL,
    -- Reserving a vector column for future embedding searches
    company_embedding vector(1536)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.artemis_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy: Allow the FastAPI backend (using Service Role Key) full access
CREATE POLICY "Allow service role full access"
ON public.artemis_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
