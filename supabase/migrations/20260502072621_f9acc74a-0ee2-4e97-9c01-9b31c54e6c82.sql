-- Add a content fingerprint to resumes so the same file always maps to the same row.
ALTER TABLE public.resumes
  ADD COLUMN IF NOT EXISTS content_hash text;

-- Backfill existing rows from raw_text so old uploads also get a hash.
UPDATE public.resumes
SET content_hash = encode(digest(regexp_replace(coalesce(raw_text, ''), '\s+', ' ', 'g'), 'sha256'), 'hex')
WHERE content_hash IS NULL AND raw_text IS NOT NULL;

-- Unique per user (different users may upload the same file — that's fine).
-- Allows multiple NULLs while preventing duplicates per (user_id, content_hash).
CREATE UNIQUE INDEX IF NOT EXISTS resumes_user_content_hash_uniq
  ON public.resumes (user_id, content_hash)
  WHERE content_hash IS NOT NULL;
