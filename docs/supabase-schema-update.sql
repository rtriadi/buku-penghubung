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
  crypt('admin123', gen_salt('bf')),
  now(), NULL, now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Darul Khairat","role":"admin"}',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Perbarui status konfirmasi & password jika akun admin sudah ada sebelumnya
UPDATE auth.users
SET 
  encrypted_password = crypt('admin123', gen_salt('bf')),
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

-- 2. Akun Guru (Teacher)
-- Email: guru@darulkhairat.com | Password: guru123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0',
  'authenticated', 'authenticated',
  'guru@darulkhairat.com',
  crypt('guru123', gen_salt('bf')),
  now(), NULL, now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Bu Fatimah Azzahra","role":"teacher"}',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Perbarui status konfirmasi & password jika akun guru sudah ada sebelumnya
UPDATE auth.users
SET 
  encrypted_password = crypt('guru123', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  last_sign_in_at = COALESCE(last_sign_in_at, now()),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  raw_user_meta_data = '{"name":"Bu Fatimah Azzahra","role":"teacher"}'
WHERE id = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0';

-- Pastikan profile guru terbuat dengan role teacher & class_id = 'kelas-a'
INSERT INTO public.profiles (id, name, role, email, class_id)
VALUES (
  'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0',
  'Bu Fatimah Azzahra',
  'teacher',
  'guru@darulkhairat.com',
  'kelas-a'
) ON CONFLICT (id) DO UPDATE SET role = 'teacher', name = 'Bu Fatimah Azzahra', class_id = 'kelas-a';

-- Tautkan kelas-a ke guru ini
UPDATE classes SET teacher_id = 'e0e0e0e0-e0e0-e0e0-e0e0-e0e0e0e0e0e0' WHERE id = 'kelas-a';

-- 3. Akun Wali Murid (Parent)
-- Email: ortu@darulkhairat.com | Password: ortu123
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
  'authenticated', 'authenticated',
  'ortu@darulkhairat.com',
  crypt('ortu123', gen_salt('bf')),
  now(), NULL, now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Bapak Ahmad","role":"parent"}',
  now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- Perbarui status konfirmasi & password jika akun wali murid sudah ada sebelumnya
UPDATE auth.users
SET 
  encrypted_password = crypt('ortu123', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  last_sign_in_at = COALESCE(last_sign_in_at, now()),
  raw_app_meta_data = '{"provider":"email","providers":["email"]}',
  raw_user_meta_data = '{"name":"Bapak Ahmad","role":"parent"}'
WHERE id = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

-- Pastikan profile wali terbuat dengan role parent
INSERT INTO public.profiles (id, name, role, email)
VALUES (
  'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0',
  'Bapak Ahmad',
  'parent',
  'ortu@darulkhairat.com'
) ON CONFLICT (id) DO UPDATE SET role = 'parent', name = 'Bapak Ahmad';

-- C. Masukkan data siswa default & tautkan ke Wali Murid
INSERT INTO students (id, name, nickname, class_id, parent_id, avatar_emoji, birthdate) VALUES
  ('c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0', 'Muhammad Zaid Al-Faruq', 'Zaid', 'kelas-a', 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0', '🦁', '2020-03-15')
ON CONFLICT (id) DO NOTHING;

-- Tautkan profil wali murid ke siswa ini
UPDATE public.profiles SET student_id = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c0' WHERE id = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';

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
