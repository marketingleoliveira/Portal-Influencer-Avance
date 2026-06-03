ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS partnership_start_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativa',
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS social_network TEXT,
  ADD COLUMN IF NOT EXISTS post_link TEXT,
  ADD COLUMN IF NOT EXISTS contact_admin TEXT,
  ADD COLUMN IF NOT EXISTS reception_month TEXT;