-- Migration: Student support/help messages + Admin broadcast notifications
CREATE TABLE IF NOT EXISTS public.support_messages (
  id text PRIMARY KEY,
  student_id text DEFAULT '',
  full_name text NOT NULL,
  contact text DEFAULT '',
  email text DEFAULT '',
  category text DEFAULT 'help',
  message text NOT NULL,
  status text DEFAULT 'new',
  admin_note text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broadcast_notifications (
  id text PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL DEFAULT 'all', -- 'all' | 'registered' | 'guest'
  tone text DEFAULT 'info', -- 'info' | 'promo' | 'alert'
  sent_by text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.support_messages IS 'Yordam va Boglanish bolimlaridan talabalar yuborgan murojaatlar';
COMMENT ON TABLE public.broadcast_notifications IS 'Admin tomonidan ilova foydalanuvchilariga yuboriladigan bildirishnomalar';
