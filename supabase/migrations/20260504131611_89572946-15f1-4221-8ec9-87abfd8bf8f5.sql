ALTER TABLE public.resume_enhancements
  ADD COLUMN IF NOT EXISTS verifiable_claims jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow users to update claim verification status on their own enhancements
CREATE POLICY "Users can update their own enhancements"
ON public.resume_enhancements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);