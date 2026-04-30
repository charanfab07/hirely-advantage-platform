CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID,
  question_type TEXT NOT NULL DEFAULT 'behavioral',
  target_role TEXT,
  question TEXT NOT NULL,
  rationale TEXT,
  focus_area TEXT,
  difficulty TEXT,
  question_hash TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_interview_questions_user_resume_type
  ON public.interview_questions (user_id, resume_id, question_type, created_at DESC);

CREATE UNIQUE INDEX idx_interview_questions_user_hash
  ON public.interview_questions (user_id, question_hash);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interview questions"
ON public.interview_questions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview questions"
ON public.interview_questions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview questions"
ON public.interview_questions FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview questions"
ON public.interview_questions FOR DELETE TO authenticated
USING (auth.uid() = user_id);
