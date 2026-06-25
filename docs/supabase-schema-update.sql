-- ============================================================
-- Buku Penghubung Online — Skema Database Lengkap & Seeding
-- PAUD Islam Terpadu Darul Khairat
-- Jalankan seluruh script ini sekali saja di SQL Editor Supabase
-- ============================================================

-- 1. AKTIFKAN EXTENSION YANG DIBUTUHKAN
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. BUAT TABEL MASTER KELAS (Tanpa FK ke profiles dulu)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID, -- Akan ditambahkan FK di bagian akhir
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. BUAT TABEL UTAMA PROFILES (Tanpa FK ke students/classes dulu)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'admin')),
  class_id TEXT,          -- Untuk Guru
  student_id UUID,        -- Untuk Wali Murid
  email TEXT,             -- Kolom Email untuk query asinkronus mudah
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. BUAT TABEL SISWA (Tanpa FK ke profiles dulu)
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  class_id TEXT NOT NULL DEFAULT 'kelas-a',
  parent_id UUID, -- Akan ditambahkan FK di bagian akhir
  avatar_emoji TEXT DEFAULT '🦁',
  birthdate DATE NOT NULL DEFAULT '2020-01-01',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. BUAT TABEL DAILY LOGS (Jurnal Harian Sekolah)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  school_activities JSONB NOT NULL DEFAULT '{}',
  teacher_note TEXT DEFAULT '',
  health_status JSONB NOT NULL DEFAULT '{"kondisi": "sehat"}',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)
);

-- 6. BUAT TABEL HOME LOGS (Jurnal Aktivitas Rumah)
CREATE TABLE IF NOT EXISTS home_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  home_activities JSONB NOT NULL DEFAULT '{}',
  parent_note TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)
);

-- 7. BUAT TABEL MASTER AKTIVITAS SEKOLAH
CREATE TABLE IF NOT EXISTS school_activities (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT DEFAULT '📝',
  category TEXT DEFAULT 'belajar',
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. BUAT TABEL MASTER AKTIVITAS DI RUMAH
CREATE TABLE IF NOT EXISTS home_activities (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  emoji TEXT DEFAULT '🏠',
  has_time BOOLEAN DEFAULT false NOT NULL,
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 9. TAMBAHKAN KUNCI ASING (FOREIGN KEY CONSTRAINTS) SECARA AMAN
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_class_teacher' AND table_name = 'classes'
  ) THEN
    ALTER TABLE classes 
      ADD CONSTRAINT fk_class_teacher FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profile_class' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT fk_profile_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_profile_student' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE profiles 
      ADD CONSTRAINT fk_profile_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_student_class' AND table_name = 'students'
  ) THEN
    ALTER TABLE students 
      ADD CONSTRAINT fk_student_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET DEFAULT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_student_parent' AND table_name = 'students'
  ) THEN
    ALTER TABLE students 
      ADD CONSTRAINT fk_student_parent FOREIGN KEY (parent_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 10. AKTIFKAN ROW LEVEL SECURITY (RLS) & BUAT POLICIES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_activities ENABLE ROW LEVEL SECURITY;

-- Hapus kebijakan lama jika ada untuk mencegah error duplikasi
DROP POLICY IF EXISTS "Allow select for authenticated users on classes" ON classes;
DROP POLICY IF EXISTS "Allow select for authenticated users on school_activities" ON school_activities;
DROP POLICY IF EXISTS "Allow select for authenticated users on home_activities" ON home_activities;
DROP POLICY IF EXISTS "Allow all actions for admins on classes" ON classes;
DROP POLICY IF EXISTS "Allow all actions for admins on school_activities" ON school_activities;
DROP POLICY IF EXISTS "Allow all actions for admins on home_activities" ON home_activities;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Teachers see all students in their class" ON students;
DROP POLICY IF EXISTS "Parents see only their child" ON students;
DROP POLICY IF EXISTS "Admins can manage all students" ON students;
DROP POLICY IF EXISTS "Teachers can manage daily logs for their class" ON daily_logs;
DROP POLICY IF EXISTS "Parents can read their child daily logs" ON daily_logs;
DROP POLICY IF EXISTS "Admins can manage all daily logs" ON daily_logs;
DROP POLICY IF EXISTS "Parents can manage their child home logs" ON home_logs;
DROP POLICY IF EXISTS "Teachers can read home logs for their class" ON home_logs;
DROP POLICY IF EXISTS "Admins can manage all home logs" ON home_logs;

-- Buat kebijakan baru secara bersih
CREATE POLICY "Allow select for authenticated users on classes" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated users on school_activities" ON school_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow select for authenticated users on home_activities" ON home_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all actions for admins on classes" ON classes FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow all actions for admins on school_activities" ON school_activities FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow all actions for admins on home_activities" ON home_activities FOR ALL TO authenticated 
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Teachers see all students in their class" ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher' AND class_id = students.class_id));

CREATE POLICY "Parents see only their child" ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent' AND student_id = students.id));

CREATE POLICY "Admins can manage all students" ON students FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Teachers can manage daily logs for their class" ON daily_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p JOIN students s ON s.id = daily_logs.student_id WHERE p.id = auth.uid() AND p.role = 'teacher' AND p.class_id = s.class_id));

CREATE POLICY "Parents can read their child daily logs" ON daily_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.student_id = daily_logs.student_id));

CREATE POLICY "Admins can manage all daily logs" ON daily_logs FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Parents can manage their child home logs" ON home_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'parent' AND p.student_id = home_logs.student_id));

CREATE POLICY "Teachers can read home logs for their class" ON home_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p JOIN students s ON s.id = home_logs.student_id WHERE p.id = auth.uid() AND p.role = 'teacher' AND p.class_id = s.class_id));

CREATE POLICY "Admins can manage all home logs" ON home_logs FOR ALL TO authenticated
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- ============================================================
-- 11. TRIGGERS & FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS daily_logs_updated_at ON daily_logs;
CREATE TRIGGER daily_logs_updated_at BEFORE UPDATE ON daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS home_logs_updated_at ON home_logs;
CREATE TRIGGER home_logs_updated_at BEFORE UPDATE ON home_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger untuk membuat profil secara otomatis saat pendaftaran (signup) di Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email, name = COALESCE(profiles.name, EXCLUDED.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gunakan CREATE OR REPLACE TRIGGER untuk mencegah error jika trigger sudah ada
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 12. DATA AWAL (SEEDING)
-- ============================================================
-- A. Masukkan data kelas default
INSERT INTO classes (id, name) VALUES
  ('kelas-a', 'Kelas A (TK A)'),
  ('kelas-b', 'Kelas B (TK B)')
ON CONFLICT (id) DO NOTHING;

-- B. Buat User Default di auth.users & public.profiles
-- 1. Akun Admin
-- Email: admin@darulkhairat.com | Password: admin123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'd0a0b0c0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
  'authenticated', 'authenticated',
  'admin@darulkhairat.com',
  crypt('Bismillah2026', gen_salt('bf')),
  now(), NULL, now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Darul Khairat","role":"admin"}',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Perbarui status konfirmasi & password jika akun admin sudah ada sebelumnya
UPDATE auth.users
SET 
  encrypted_password = crypt('Bismillah2026', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  last_sign_in_at = COALESCE(last_sign_in_at, now()),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  raw_user_meta_data = '{"name":"Admin Darul Khairat","role":"admin"}'
WHERE id = 'd0a0b0c0-d0d0-d0d0-d0d0-d0d0d0d0d0d0';

-- Pastikan profile admin terbuat dengan role admin
INSERT INTO public.profiles (id, name, role, email)
VALUES (
  'd0a0b0c0-d0d0-d0d0-d0d0-d0d0d0d0d0d0',
  'Admin Darul Khairat',
  'admin',
  'admin@darulkhairat.com'
) ON CONFLICT (id) DO UPDATE SET role = 'admin', name = 'Admin Darul Khairat';

-- 2. Akun Guru-Guru Aktif (Password Default: darulkhairat2026)
-- Guru 1: Nurain Adam
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000001',
  'authenticated', 'authenticated', 'nurain.adam@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Nurain Adam","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000001', 'Nurain Adam', 'teacher', 'nurain.adam@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Nurain Adam', class_id = NULL;

-- Guru 2: Khairunnisa Mamulai
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000002',
  'authenticated', 'authenticated', 'khairunnisa.mamulai@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Khairunnisa Mamulai","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000002', 'Khairunnisa Mamulai', 'teacher', 'khairunnisa.mamulai@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Khairunnisa Mamulai', class_id = NULL;

-- Guru 3: Sri Rahayu A Humokor
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000003',
  'authenticated', 'authenticated', 'sri.rahayu@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Sri Rahayu A Humokor","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000003', 'Sri Rahayu A Humokor', 'teacher', 'sri.rahayu@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Sri Rahayu A Humokor', class_id = NULL;

-- Guru 4: Mutmainnah Umar
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000004',
  'authenticated', 'authenticated', 'mutmainnah.umar@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Mutmainnah Umar","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000004', 'Mutmainnah Umar', 'teacher', 'mutmainnah.umar@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Mutmainnah Umar', class_id = NULL;

-- Guru 5: Irniyusnita Abas
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000005',
  'authenticated', 'authenticated', 'irniyusnita.abas@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Irniyusnita Abas","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000005', 'Irniyusnita Abas', 'teacher', 'irniyusnita.abas@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Irniyusnita Abas', class_id = NULL;

-- Guru 6: Fitri Sumaila
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000006',
  'authenticated', 'authenticated', 'fitri.sumaila@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Fitri Sumaila","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000006', 'Fitri Sumaila', 'teacher', 'fitri.sumaila@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Fitri Sumaila', class_id = NULL;

-- Guru 7: Yolan Y Pasani
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000007',
  'authenticated', 'authenticated', 'yolan.pasani@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Yolan Y Pasani","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000007', 'Yolan Y Pasani', 'teacher', 'yolan.pasani@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Yolan Y Pasani', class_id = NULL;

-- Guru 8: Yulmi Manangin
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000008',
  'authenticated', 'authenticated', 'yulmi.manangin@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Yulmi Manangin","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000008', 'Yulmi Manangin', 'teacher', 'yulmi.manangin@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Yulmi Manangin', class_id = NULL;

-- Guru 9: Salma Fadlina Laus
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000009',
  'authenticated', 'authenticated', 'salma.fadlina@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Salma Fadlina Laus","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000009', 'Salma Fadlina Laus', 'teacher', 'salma.fadlina@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Salma Fadlina Laus', class_id = NULL;

-- Guru 10: Miranda Sumaila
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', 'e0100000-0000-0000-0000-000000000010',
  'authenticated', 'authenticated', 'miranda.sumaila@darulkhairat.com',
  crypt('darulkhairat2026', gen_salt('bf')),
  now(), NULL, now(), '{"provider":"email","providers":["email"]}',
  '{"name":"Miranda Sumaila","role":"teacher"}', now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES ('e0100000-0000-0000-0000-000000000010', 'Miranda Sumaila', 'teacher', 'miranda.sumaila@darulkhairat.com', NULL)
ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Miranda Sumaila', class_id = NULL;

-- D. Masukkan aktivitas sekolah default
INSERT INTO school_activities (id, label, emoji, category, "order", is_active) VALUES
  ('hadir', 'Hadir', '✅', 'kehadiran', 1, true),
  ('sholat_dhuha', 'Sholat Dhuha', '🕌', 'ibadah', 2, true),
  ('snack_pagi', 'Snack Pagi', '🥪', 'makan', 3, true),
  ('belajar', 'Belajar & Bermain', '📚', 'belajar', 4, true),
  ('makan_siang', 'Makan Siang', '🍱', 'makan', 5, true),
  ('tidur_siang', 'Tidur Siang', '😴', 'istirahat', 6, true),
  ('sholat_dzuhur', 'Sholat Dzuhur', '🕌', 'ibadah', 7, true),
  ('sholat_ashar', 'Sholat Ashar', '🌤️', 'ibadah', 8, true),
  ('pulang', 'Pulang', '🏠', 'kehadiran', 9, true)
ON CONFLICT (id) DO NOTHING;

-- E. Masukkan aktivitas rumah default
INSERT INTO home_activities (id, label, emoji, has_time, "order", is_active) VALUES
  ('pr_belajar', 'PR / Belajar di Rumah', '📖', false, 1, true),
  ('mandi_sore', 'Mandi Sore', '🛁', false, 2, true),
  ('sholat_maghrib', 'Sholat Maghrib', '🌅', false, 3, true),
  ('sholat_isya', 'Sholat Isya', '🌙', false, 4, true),
  ('baca_iqro', 'Baca Iqro / Quran', '📿', false, 5, true),
  ('tidur_malam', 'Tidur Malam', '⭐', true, 6, true)
ON CONFLICT (id) DO NOTHING;
