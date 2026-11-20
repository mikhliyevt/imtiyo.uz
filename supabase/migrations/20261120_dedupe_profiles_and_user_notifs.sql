-- Migration: Direct per-student notification columns + Deduplicate profiles by email
-- 1. Add targeted student columns to broadcast_notifications
ALTER TABLE public.broadcast_notifications
ADD COLUMN IF NOT EXISTS target_student_id text DEFAULT '',
ADD COLUMN IF NOT EXISTS target_profile_id text DEFAULT '',
ADD COLUMN IF NOT EXISTS target_name text DEFAULT '';

-- 2. Safely merge and clean up existing duplicate email rows in profiles
-- Keeps the highest-priority profile (verified > pending > rejected > unverified, richest data, oldest created_at)
DO $$
DECLARE
  rec RECORD;
  primary_id text;
BEGIN
  FOR rec IN
    SELECT lower(trim(email)) AS norm_email
    FROM public.profiles
    WHERE email IS NOT NULL AND trim(email) <> ''
    GROUP BY lower(trim(email))
    HAVING count(*) > 1
  LOOP
    SELECT id INTO primary_id
    FROM public.profiles
    WHERE lower(trim(email)) = rec.norm_email
    ORDER BY
      CASE status
        WHEN 'verified' THEN 4
        WHEN 'pending' THEN 3
        WHEN 'rejected' THEN 2
        ELSE 1
      END DESC,
      (CASE WHEN coalesce(university, '') <> '' THEN 1 ELSE 0 END +
       CASE WHEN coalesce(phone, '') <> '' THEN 1 ELSE 0 END +
       CASE WHEN coalesce(document_url, '') <> '' THEN 1 ELSE 0 END +
       CASE WHEN coalesce(region, '') <> '' THEN 1 ELSE 0 END) DESC,
      created_at ASC NULLS LAST,
      id ASC
    LIMIT 1;

    -- Backfill phone/university/region/birth_date/gender/avatar from duplicate rows if missing on primary
    UPDATE public.profiles p
    SET
      phone = COALESCE(NULLIF(p.phone, ''), (
        SELECT NULLIF(d.phone, '') FROM public.profiles d
        WHERE lower(trim(d.email)) = rec.norm_email AND d.id <> primary_id AND coalesce(d.phone, '') <> ''
        LIMIT 1
      )),
      university = COALESCE(NULLIF(p.university, ''), (
        SELECT NULLIF(d.university, '') FROM public.profiles d
        WHERE lower(trim(d.email)) = rec.norm_email AND d.id <> primary_id AND coalesce(d.university, '') <> ''
        LIMIT 1
      )),
      region = COALESCE(NULLIF(p.region, ''), (
        SELECT NULLIF(d.region, '') FROM public.profiles d
        WHERE lower(trim(d.email)) = rec.norm_email AND d.id <> primary_id AND coalesce(d.region, '') <> ''
        LIMIT 1
      )),
      birth_date = COALESCE(NULLIF(p.birth_date, ''), (
        SELECT NULLIF(d.birth_date, '') FROM public.profiles d
        WHERE lower(trim(d.email)) = rec.norm_email AND d.id <> primary_id AND coalesce(d.birth_date, '') <> ''
        LIMIT 1
      )),
      gender = COALESCE(NULLIF(p.gender, ''), (
        SELECT NULLIF(d.gender, '') FROM public.profiles d
        WHERE lower(trim(d.email)) = rec.norm_email AND d.id <> primary_id AND coalesce(d.gender, '') <> ''
        LIMIT 1
      ))
    WHERE p.id = primary_id;

    -- Delete duplicate rows so only the single primary profile remains
    DELETE FROM public.profiles
    WHERE lower(trim(email)) = rec.norm_email AND id <> primary_id;
  END LOOP;
END $$;

-- 3. Prevent duplicate emails at database level going forward
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique_idx
  ON public.profiles (lower(trim(email)))
  WHERE email IS NOT NULL AND trim(email) <> '';
