CREATE TABLE public.cover_letters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resume_id UUID,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  job_description TEXT,
  tone TEXT NOT NULL DEFAULT 'confident',
  hook TEXT,
  alignment TEXT,
  proof TEXT,
  culture_fit TEXT,
  closing TEXT,
  full_letter TEXT NOT NULL DEFAULT '',
  notes TEXT,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cover letters"
ON public.cover_letters FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cover letters"
ON public.cover_letters FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cover letters"
ON public.cover_letters FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cover letters"
ON public.cover_letters FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER update_cover_letters_updated_at
BEFORE UPDATE ON public.cover_letters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cover_letters_user_created
  ON public.cover_letters(user_id, created_at DESC);