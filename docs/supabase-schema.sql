-- ============================================================
-- Buku Penghubung Online — Supabase Schema
-- PAUD Islam Terpadu Darul Khairat
-- ============================================================
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'parent', 'admin')),
  class_id TEXT,          -- for teachers: which class they manage
  student_id UUID,        -- for parents: which student they belong to
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- 3. STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  class_id TEXT NOT NULL DEFAULT 'kelas-a',
  parent_id UUID REFERENCES profiles(id),
  avatar_emoji TEXT DEFAULT '🦁',
  birthdate DATE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add foreign key from profiles to students
ALTER TABLE profiles ADD CONSTRAINT fk_profile_student
  FOREIGN KEY (student_id) REFERENCES students(id);

-- ============================================================
-- 4. DAILY LOGS TABLE (Teacher fills for each student)
-- ============================================================
CREATE TABLE daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  school_activities JSONB NOT NULL DEFAULT '{}',
  -- school_activities example:
  -- {"hadir": true, "sholat_dhuha": true, "snack_pagi": false, ...}
  teacher_note TEXT DEFAULT '',
  health_status JSONB NOT NULL DEFAULT '{"kondisi": "sehat"}',
  -- health_status example:
  -- {"kondisi": "sehat", "suhu": 36.5, "catatan": ""}
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)  -- one log per student per day
);

-- ============================================================
-- 5. HOME LOGS TABLE (Parent fills)
-- ============================================================
CREATE TABLE home_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  home_activities JSONB NOT NULL DEFAULT '{}',
  -- home_activities example:
  -- {"pr_belajar": true, "mandi_sore": true, "tidur_malam": "20:30"}
  parent_note TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, date)  -- one home log per student per day
);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) — CRITICAL FOR DATA PRIVACY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- STUDENTS policies
-- Teachers can see all students in their class
CREATE POLICY "Teachers see all students in their class"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'teacher'
        AND class_id = students.class_id
    )
  );

-- Parents can only see their own child
CREATE POLICY "Parents see only their child"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
        AND student_id = students.id
    )
  );

-- DAILY LOGS policies
-- Teachers can read/write all logs for their class
CREATE POLICY "Teachers can manage daily logs for their class"
  ON daily_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN students s ON s.id = daily_logs.student_id
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = s.class_id
    )
  );

-- Parents can only read their child's daily logs
CREATE POLICY "Parents can read their child daily logs"
  ON daily_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'parent'
        AND p.student_id = daily_logs.student_id
    )
  );

-- HOME LOGS policies
-- Parents can manage their own child's home logs
CREATE POLICY "Parents can manage their child home logs"
  ON home_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'parent'
        AND p.student_id = home_logs.student_id
    )
  );

-- Teachers can read all home logs for their class
CREATE POLICY "Teachers can read home logs for their class"
  ON home_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN students s ON s.id = home_logs.student_id
      WHERE p.id = auth.uid()
        AND p.role = 'teacher'
        AND p.class_id = s.class_id
    )
  );

-- ============================================================
-- 7. TRIGGERS for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_logs_updated_at
  BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER home_logs_updated_at
  BEFORE UPDATE ON home_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. TRIGGER: Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 9. SAMPLE DATA (for testing)
-- ============================================================
-- NOTE: Replace UUIDs with real auth.users UUIDs after creating accounts in Supabase Auth

/*
-- After creating users in Supabase Auth Dashboard, run:
INSERT INTO students (id, name, nickname, class_id, avatar_emoji, birthdate) VALUES
  ('student-uuid-1', 'Muhammad Zaid Al-Faruq', 'Zaid', 'kelas-a', '🦁', '2020-03-15'),
  ('student-uuid-2', 'Hana Nur Azizah', 'Hana', 'kelas-a', '🌸', '2020-07-22'),
  ('student-uuid-3', 'Ibrahim Al-Khatib', 'Ibra', 'kelas-a', '🐻', '2020-01-10'),
  ('student-uuid-4', 'Aisyah Rahmawati Putri', 'Aisyah', 'kelas-a', '🦋', '2020-11-05'),
  ('student-uuid-5', 'Umar Hakim Santoso', 'Umar', 'kelas-a', '🐯', '2020-05-30');

-- Update teacher profile
UPDATE profiles SET role = 'teacher', class_id = 'kelas-a', name = 'Bu Fatimah Azzahra'
  WHERE id = 'teacher-auth-uuid';

-- Update parent profiles with student_id
UPDATE profiles SET role = 'parent', student_id = 'student-uuid-1', name = 'Bpk. Ahmad'
  WHERE id = 'parent-1-auth-uuid';
*/
