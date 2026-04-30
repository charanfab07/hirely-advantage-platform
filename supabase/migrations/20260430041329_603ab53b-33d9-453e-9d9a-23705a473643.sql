CREATE TABLE public.resume_tailorings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID NOT NULL,
  analysis_id UUID,
  target_role TEXT NOT NULL,
  job_description TEXT,
  summary TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  bullets JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords_to_add JSONB NOT NULL DEFAULT '[]'::jsonb,
  cover_note TEXT,
  match_before INTEGER,
  match_after INTEGER,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_tailorings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tailorings"
ON public.resume_tailorings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tailorings"
ON public.resume_tailorings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tailorings"
ON public.resume_tailorings FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_resume_tailorings_user_created
  ON public.resume_tailorings(user_id, created_at DESC);
CREATE INDEX idx_resume_tailorings_resume
  ON public.resume_tailorings(resume_id);