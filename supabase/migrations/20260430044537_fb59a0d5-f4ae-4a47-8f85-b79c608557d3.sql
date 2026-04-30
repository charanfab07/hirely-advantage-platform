CREATE TABLE public.interview_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  resume_id uuid,
  target_role text,
  question text NOT NULL,
  question_type text NOT NULL DEFAULT 'behavioral',
  answer text NOT NULL,
  -- 0-100 scores
  clarity_score integer,
  confidence_score integer,
  length_score integer,
  metrics_score integer,
  star_score integer,
  keyword_score integer,
  overall_score integer,
  -- structured feedback
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  matched_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  star_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  improved_answer text,
  coaching_note text,
  word_count integer,
  model text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview answers"
  ON public.interview_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview answers"
  ON public.interview_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview answers"
  ON public.interview_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview answers"
  ON public.interview_answers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_interview_answers_updated_at
  BEFORE UPDATE ON public.interview_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_interview_answers_user_created
  ON public.interview_answers (user_id, created_at DESC);