-- Migration: Global site settings controlled from Admin Panel -> Sozlamalar
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
  id,
  show_test_banner,
  test_banner_text,
  telegram_url,
  instagram_url,
  youtube_url,
  contact_phone,
  contact_email,
  hero_title,
  hero_subtitle
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

COMMENT ON TABLE public.site_settings IS 'Admin panel Sozlamalar bolimidan boshqariladigan sayt konfiguratsiyasi';
