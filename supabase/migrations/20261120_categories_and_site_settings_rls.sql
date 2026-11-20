-- ============================================================================
-- Migration: Ensure `categories` and `site_settings` exist in Supabase
-- and configure Row Level Security (RLS) so:
--   1) All visitors (including Incognito / anon) can SELECT live data
--   2) Admin Panel can INSERT / UPDATE / DELETE directly in Supabase
-- ============================================================================

-- 1. CATEGORIES JADVALI
CREATE TABLE IF NOT EXISTS public.categories (
  id text PRIMARY KEY,
  label_uz text NOT NULL,
  label_ru text DEFAULT '',
  label_en text DEFAULT '',
  icon text DEFAULT 'Sparkles',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Agar categories jadvali bo'sh bo'lsa standart kategoriyalarni 1 marta kiritish
INSERT INTO public.categories (id, label_uz, label_ru, label_en, icon, sort_order)
SELECT v.id, v.label_uz, v.label_ru, v.label_en, v.icon, v.sort_order
FROM (
  VALUES
    ('all', 'Tavsiya etilganlar', 'Рекомендуемые', 'Recommended', 'Sparkles', 1),
    ('new', 'Yangilar', 'Новые', 'New', 'Sparkles', 2),
    ('food', 'Taomlar va ichimliklar', 'Еда и напитки', 'Food & Drinks', 'Utensils', 3),
    ('coffee', 'Qahva va shirinlik', 'Кофе и десерты', 'Coffee & Bakery', 'Coffee', 4),
    ('fitness', 'Salomatlik va fitnes', 'Здоровье и фитнес', 'Health & Fitness', 'Dumbbell', 5),
    ('barber', 'Go‘zallik va sartaroshxona', 'Красота и барбершоп', 'Beauty & Barber', 'Scissors', 6),
    ('education', 'Ta’lim va kurslar', 'Обучение', 'Education', 'GraduationCap', 7),
    ('shopping', 'Kiyim va xaridlar', 'Мода и шопинг', 'Fashion & Shopping', 'ShoppingBag', 8),
    ('entertainment', 'Ko‘ngilochar', 'Развлечения', 'Entertainment', 'Gamepad2', 9)
) AS v(id, label_uz, label_ru, label_en, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.categories LIMIT 1)
ON CONFLICT (id) DO NOTHING;

-- 2. SITE_SETTINGS JADVALI
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'default',
  show_test_banner boolean NOT NULL DEFAULT true,
  test_banner_text text DEFAULT '',
  telegram_url text DEFAULT 'https://t.me/imtiyosupport_bot',
  instagram_url text DEFAULT 'https://instagram.com/imtiyo.uz',
  youtube_url text DEFAULT '',
  contact_phone text DEFAULT '+998 (71) 200-00-00',
  contact_email text DEFAULT 'info@imtiyo.uz',
  hero_title text DEFAULT '',
  hero_subtitle text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.site_settings (
  id, show_test_banner, test_banner_text, telegram_url, instagram_url,
  youtube_url, contact_phone, contact_email, hero_title, hero_subtitle
)
VALUES (
  'default',
  true,
  'Diqqat: Sayt hozirda test rejimida ishlamoqda, hech qaysi aksiya va chegirmalar hozircha faol emas.',
  'https://t.me/imtiyosupport_bot',
  'https://instagram.com/imtiyo.uz',
  '',
  '+998 (71) 200-00-00',
  'info@imtiyo.uz',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 3. GRANTS (anon va authenticated rollari uchun ruxsat)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.site_settings TO anon, authenticated;

-- 4. RLS (Row Level Security) — PUBLIC (login qilmaganlar ham) SELECT + Admin yozish ruxsatlari
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- categories policies
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories"
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories"
  ON public.categories
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- site_settings policies
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin write site_settings" ON public.site_settings;
CREATE POLICY "Admin write site_settings"
  ON public.site_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
