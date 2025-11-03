-- Create the tasks table in Supabase
-- Copy and paste this SQL into your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    source TEXT DEFAULT 'app' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    telegram_message_id TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read/write for now (you can restrict this later)
CREATE POLICY "Allow public access to tasks" ON public.tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;


