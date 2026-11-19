-- Migration: Add student course (1..6) field to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS course smallint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_course_check'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_course_check CHECK (course IS NULL OR (course >= 1 AND course <= 6));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.course IS 'Talabaning o''quv kursi (1 dan 6 gacha)';
