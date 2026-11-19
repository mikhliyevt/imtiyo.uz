-- Migration: Ensure student verification review fields exist on profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rejection_reason text DEFAULT '',
ADD COLUMN IF NOT EXISTS reviewed_by text DEFAULT '',
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.profiles.rejection_reason IS 'Moderator tomonidan talaba hujjatini rad etish sababi';
COMMENT ON COLUMN public.profiles.reviewed_by IS 'Hujjatni tekshirgan moderator ismi';
COMMENT ON COLUMN public.profiles.reviewed_at IS 'Hujjat tekshirilgan vaqt';
