CREATE TABLE public.resume_enhancements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID NOT NULL,
  analysis_id UUID,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  headline TEXT,
  summary TEXT,
  skills JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  changelog JSONB NOT NULL DEFAULT '[]'::jsonb,
  added_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_score_before INTEGER,
  estimated_score_after INTEGER,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.resume_enhancements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enhancements"
  ON public.resume_enhancements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enhancements"
  ON public.resume_enhancements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enhancements"
  ON public.resume_enhancements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_resume_enhancements_user_created
  ON public.resume_enhancements (user_id, created_at DESC);