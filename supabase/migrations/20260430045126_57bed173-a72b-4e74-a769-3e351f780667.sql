CREATE TABLE public.mock_interview_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  resume_id uuid,
  target_role text,
  focus text NOT NULL DEFAULT 'behavioral',
  difficulty text NOT NULL DEFAULT 'medium',
  duration_minutes integer NOT NULL DEFAULT 15,
  status text NOT NULL DEFAULT 'active',
  overall_score integer,
  summary text,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  improvements jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mock sessions"
  ON public.mock_interview_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mock sessions"
  ON public.mock_interview_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mock sessions"
  ON public.mock_interview_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mock sessions"
  ON public.mock_interview_sessions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_mock_interview_sessions_updated_at
  BEFORE UPDATE ON public.mock_interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mock_sessions_user_started
  ON public.mock_interview_sessions (user_id, started_at DESC);


CREATE TABLE public.mock_interview_turns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.mock_interview_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  turn_index integer NOT NULL,
  question text NOT NULL,
  question_kind text NOT NULL DEFAULT 'opening',
  answer text,
  feedback text,
  score integer,
  follow_up_hint text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mock_interview_turns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mock turns"
  ON public.mock_interview_turns FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own mock turns"
  ON public.mock_interview_turns FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own mock turns"
  ON public.mock_interview_turns FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mock turns"
  ON public.mock_interview_turns FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_mock_interview_turns_updated_at
  BEFORE UPDATE ON public.mock_interview_turns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mock_turns_session ON public.mock_interview_turns (session_id, turn_index);