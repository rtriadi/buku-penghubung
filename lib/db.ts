// lib/db.ts
// Supabase Data Layer — performs real queries and mutations on the Supabase database.
// Replaces the local memory/localStorage store with actual server integration.

import { supabase } from './supabase';
import type { User, Student, DailyLog, HomeLog, ClassInfo, SchoolActivity, HomeActivity, AccountCredentials } from './types';

export const DEFAULT_PASSWORD = 'dkhairat2024';

// ============================================================
// DATABASE MAPPING HELPERS
// ============================================================

export function mapProfile(p: any): User {
  return {
    id: p.id,
    name: p.name || 'User',
    role: p.role as 'admin' | 'teacher' | 'parent',
    email: p.email || '',
    classId: p.class_id || undefined,
    studentId: p.student_id || undefined,
    createdAt: p.created_at,
  };
}

export function mapStudent(s: any): Student {
  return {
    id: s.id,
    name: s.name,
    nickname: s.nickname || '',
    classId: s.class_id,
    parentId: s.parent_id || undefined,
    avatarEmoji: s.avatar_emoji || '🦁',
    birthdate: s.birthdate,
    createdAt: s.created_at,
  };
}

export function mapDailyLog(l: any): DailyLog {
  return {
    id: l.id,
    studentId: l.student_id,
    date: l.date,
    schoolActivities: l.school_activities || {},
    teacherNote: l.teacher_note || '',
    healthStatus: l.health_status || { kondisi: 'sehat' },
    createdBy: l.created_by,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

export function mapHomeLog(l: any): HomeLog {
  return {
    id: l.id,
    studentId: l.student_id,
    date: l.date,
    homeActivities: l.home_activities || {},
    parentNote: l.parent_note || '',
    createdBy: l.created_by,
    createdAt: l.created_at,
    updatedAt: l.updated_at,
  };
}

export function mapSchoolActivity(a: any): SchoolActivity {
  return {
    id: a.id,
    label: a.label,
    emoji: a.emoji || '📝',
    category: a.category || 'belajar',
    order: a.order || 0,
    isActive: a.is_active !== false,
  };
}

export function mapHomeActivity(a: any): HomeActivity {
  return {
    id: a.id,
    label: a.label,
    emoji: a.emoji || '🏠',
    hasTime: a.has_time === true,
    order: a.order || 0,
    isActive: a.is_active !== false,
  };
}

export function mapClass(c: any): ClassInfo {
  return {
    id: c.id,
    name: c.name,
    teacherId: c.teacher_id || '',
  };
}

// ============================================================
// ASYNC DATABASE OPERATIONS (REAL SUPABASE INTEGRATION)
// ============================================================

// --- Users (Profiles) ---
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapProfile);
  } catch (err) {
    console.error('getUsers error:', err);
    return [];
  }
}

export async function getUserById(id: string): Promise<User | undefined> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? mapProfile(data) : undefined;
  } catch (err) {
    console.error('getUserById error:', err);
    return undefined;
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  // Profiles in Supabase do not have direct email column, but we can query them.
  // We can join or just query profiles. To make it robust, profiles table contains email or we join.
  // Let's assume auth metadata or we query profiles. If profiles does not store email,
  // we fetch profiles first. Wait, let's see: the profiles table in our original schema:
  // CREATE TABLE profiles ( id UUID REFERENCES auth.users PRIMARY KEY, name TEXT, role TEXT, class_id TEXT, student_id UUID )
  // Wait, in a client environment, we can't query auth.users directly because it's in a separate schema and protected.
  // So the best way to handle user emails is: when creating a user, we save their email in the profiles table, OR we can fetch it.
  // Wait! Let's check if the profiles table has an email column or if we should add it.
  // In `docs/supabase-schema-update.sql`, we can also add an email column to profiles table if needed, OR we can query it!
  // Wait, if the profiles table doesn't have an email column, how can we fetch by email?
  // Let's add an email column to `profiles` table to make queries extremely simple!
  // Yes! Adding an email column to profiles makes client-side queries very easy, and we can keep it updated.
  // Let's make sure our queries support email.
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    return data ? mapProfile(data) : undefined;
  } catch (err) {
    console.error('getUserByEmail error:', err);
    return undefined;
  }
}

export async function createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<{ user: User; credentials: AccountCredentials }> {
  const res = await fetch('/api/admin/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Gagal mendaftarkan user baru');
  }

  const data = await res.json();

  // Sync classes.teacher_id if classId is set
  if (user.role === 'teacher' && user.classId) {
    // 1. Remove this teacher from any other class they were assigned to (just in case)
    await supabase
      .from('classes')
      .update({ teacher_id: null })
      .eq('teacher_id', data.user.id);
    
    // 2. Set any other teacher currently assigned to this new class to have class_id = null in profiles
    await supabase
      .from('profiles')
      .update({ class_id: null })
      .eq('class_id', user.classId);

    // 3. Assign this teacher to the class
    await supabase
      .from('classes')
      .update({ teacher_id: data.user.id })
      .eq('id', user.classId);
  }

  return {
    user: data.user,
    credentials: {
      email: data.user.email,
      password: user.password || DEFAULT_PASSWORD,
      name: data.user.name,
      role: data.user.role,
    },
  };
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
  try {
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.role !== undefined) dbData.role = data.role;
    if (data.classId !== undefined) dbData.class_id = data.classId || null;
    if (data.studentId !== undefined) dbData.student_id = data.studentId || null;

    // Sync relationships between profiles.class_id and classes.teacher_id
    if (data.classId !== undefined) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', id)
        .single();
      
      const oldClassId = currentProfile?.class_id || null;
      const newClassId = data.classId || null;

      if (oldClassId !== newClassId) {
        // 1. Remove teacher from old class
        if (oldClassId) {
          await supabase
            .from('classes')
            .update({ teacher_id: null })
            .eq('id', oldClassId);
        }
        // 2. Assign teacher to new class
        if (newClassId) {
          // Remove any other teacher currently assigned to this new class
          await supabase
            .from('profiles')
            .update({ class_id: null })
            .eq('class_id', newClassId);

          await supabase
            .from('classes')
            .update({ teacher_id: id })
            .eq('id', newClassId);
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated ? mapProfile(updated) : undefined;
  } catch (err) {
    console.error('updateUser error:', err);
    throw err;
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/delete-user?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Gagal menghapus user');
    }
    return true;
  } catch (err) {
    console.error('deleteUser error:', err);
    return false;
  }
}

export async function resetPassword(userId: string, newPassword: string = DEFAULT_PASSWORD): Promise<string> {
  const res = await fetch('/api/admin/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, newPassword }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Gagal reset password');
  }
  return newPassword;
}

// --- Students ---
export async function getStudents(): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapStudent);
  } catch (err) {
    console.error('getStudents error:', err);
    return [];
  }
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? mapStudent(data) : undefined;
  } catch (err) {
    console.error('getStudentById error:', err);
    return undefined;
  }
}

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapStudent);
  } catch (err) {
    console.error('getStudentsByClass error:', err);
    return [];
  }
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  try {
    const { data: created, error } = await supabase
      .from('students')
      .insert({
        name: data.name,
        nickname: data.nickname,
        class_id: data.classId,
        parent_id: data.parentId || null,
        avatar_emoji: data.avatarEmoji,
        birthdate: data.birthdate,
      })
      .select()
      .single();

    if (error) throw error;
    return mapStudent(created);
  } catch (err) {
    console.error('createStudent error:', err);
    throw err;
  }
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student | undefined> {
  try {
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.nickname !== undefined) dbData.nickname = data.nickname;
    if (data.classId !== undefined) dbData.class_id = data.classId;
    if (data.parentId !== undefined) dbData.parent_id = data.parentId || null;
    if (data.avatarEmoji !== undefined) dbData.avatar_emoji = data.avatarEmoji;
    if (data.birthdate !== undefined) dbData.birthdate = data.birthdate;

    const { data: updated, error } = await supabase
      .from('students')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated ? mapStudent(updated) : undefined;
  } catch (err) {
    console.error('updateStudent error:', err);
    throw err;
  }
}

export async function deleteStudent(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteStudent error:', err);
    return false;
  }
}

// --- Daily Logs ---
export async function getDailyLogs(): Promise<DailyLog[]> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDailyLog);
  } catch (err) {
    console.error('getDailyLogs error:', err);
    return [];
  }
}

export async function getDailyLog(studentId: string, date: string): Promise<DailyLog | undefined> {
  try {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data ? mapDailyLog(data) : undefined;
  } catch (err) {
    console.error('getDailyLog error:', err);
    return undefined;
  }
}

export async function upsertDailyLog(log: Omit<DailyLog, 'id' | 'createdAt'>): Promise<DailyLog> {
  try {
    const dbData = {
      student_id: log.studentId,
      date: log.date,
      school_activities: log.schoolActivities,
      teacher_note: log.teacherNote,
      health_status: log.healthStatus,
      created_by: log.createdBy,
    };

    const { data, error } = await supabase
      .from('daily_logs')
      .upsert(dbData, { onConflict: 'student_id,date' })
      .select()
      .single();

    if (error) throw error;
    return mapDailyLog(data);
  } catch (err) {
    console.error('upsertDailyLog error:', err);
    throw err;
  }
}

// --- Home Logs ---
export async function getHomeLogs(): Promise<HomeLog[]> {
  try {
    const { data, error } = await supabase
      .from('home_logs')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapHomeLog);
  } catch (err) {
    console.error('getHomeLogs error:', err);
    return [];
  }
}

export async function getHomeLog(studentId: string, date: string): Promise<HomeLog | undefined> {
  try {
    const { data, error } = await supabase
      .from('home_logs')
      .select('*')
      .eq('student_id', studentId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;
    return data ? mapHomeLog(data) : undefined;
  } catch (err) {
    console.error('getHomeLog error:', err);
    return undefined;
  }
}

export async function upsertHomeLog(log: Omit<HomeLog, 'id' | 'createdAt'>): Promise<HomeLog> {
  try {
    const dbData = {
      student_id: log.studentId,
      date: log.date,
      home_activities: log.homeActivities,
      parent_note: log.parentNote,
      created_by: log.createdBy,
    };

    const { data, error } = await supabase
      .from('home_logs')
      .upsert(dbData, { onConflict: 'student_id,date' })
      .select()
      .single();

    if (error) throw error;
    return mapHomeLog(data);
  } catch (err) {
    console.error('upsertHomeLog error:', err);
    throw err;
  }
}

// --- School Activities ---
export async function getActiveSchoolActivities(): Promise<SchoolActivity[]> {
  try {
    const { data, error } = await supabase
      .from('school_activities')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSchoolActivity);
  } catch (err) {
    console.error('getActiveSchoolActivities error:', err);
    return [];
  }
}

export async function getSchoolActivities(): Promise<SchoolActivity[]> {
  try {
    const { data, error } = await supabase
      .from('school_activities')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapSchoolActivity);
  } catch (err) {
    console.error('getSchoolActivities error:', err);
    return [];
  }
}

export async function createSchoolActivity(data: Omit<SchoolActivity, 'id'>): Promise<SchoolActivity> {
  try {
    const id = data.label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const finalId = `${id}_${Date.now()}`;
    
    const { data: created, error } = await supabase
      .from('school_activities')
      .insert({
        id: finalId,
        label: data.label,
        emoji: data.emoji,
        category: data.category,
        order: data.order || 0,
        is_active: data.isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapSchoolActivity(created);
  } catch (err) {
    console.error('createSchoolActivity error:', err);
    throw err;
  }
}

export async function updateSchoolActivity(id: string, data: Partial<SchoolActivity>): Promise<SchoolActivity | undefined> {
  try {
    const dbData: any = {};
    if (data.label !== undefined) dbData.label = data.label;
    if (data.emoji !== undefined) dbData.emoji = data.emoji;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.order !== undefined) dbData.order = data.order;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;

    const { data: updated, error } = await supabase
      .from('school_activities')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated ? mapSchoolActivity(updated) : undefined;
  } catch (err) {
    console.error('updateSchoolActivity error:', err);
    throw err;
  }
}

export async function deleteSchoolActivity(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('school_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteSchoolActivity error:', err);
    return false;
  }
}

// --- Home Activities ---
export async function getActiveHomeActivities(): Promise<HomeActivity[]> {
  try {
    const { data, error } = await supabase
      .from('home_activities')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapHomeActivity);
  } catch (err) {
    console.error('getActiveHomeActivities error:', err);
    return [];
  }
}

export async function getHomeActivities(): Promise<HomeActivity[]> {
  try {
    const { data, error } = await supabase
      .from('home_activities')
      .select('*')
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapHomeActivity);
  } catch (err) {
    console.error('getHomeActivities error:', err);
    return [];
  }
}

export async function createHomeActivity(data: Omit<HomeActivity, 'id'>): Promise<HomeActivity> {
  try {
    const id = data.label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const finalId = `${id}_${Date.now()}`;

    const { data: created, error } = await supabase
      .from('home_activities')
      .insert({
        id: finalId,
        label: data.label,
        emoji: data.emoji,
        has_time: data.hasTime === true,
        order: data.order || 0,
        is_active: data.isActive !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapHomeActivity(created);
  } catch (err) {
    console.error('createHomeActivity error:', err);
    throw err;
  }
}

export async function updateHomeActivity(id: string, data: Partial<HomeActivity>): Promise<HomeActivity | undefined> {
  try {
    const dbData: any = {};
    if (data.label !== undefined) dbData.label = data.label;
    if (data.emoji !== undefined) dbData.emoji = data.emoji;
    if (data.hasTime !== undefined) dbData.has_time = data.hasTime;
    if (data.order !== undefined) dbData.order = data.order;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;

    const { data: updated, error } = await supabase
      .from('home_activities')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated ? mapHomeActivity(updated) : undefined;
  } catch (err) {
    console.error('updateHomeActivity error:', err);
    throw err;
  }
}

export async function deleteHomeActivity(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('home_activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteHomeActivity error:', err);
    return false;
  }
}

// --- Classes ---
export async function getClasses(): Promise<ClassInfo[]> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapClass);
  } catch (err) {
    console.error('getClasses error:', err);
    return [];
  }
}

export async function createClass(data: Omit<ClassInfo, 'id'>): Promise<ClassInfo> {
  try {
    const id = `kelas-${Date.now()}`;
    const { data: created, error } = await supabase
      .from('classes')
      .insert({
        id: id,
        name: data.name,
        teacher_id: data.teacherId || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Sync profiles.class_id if teacherId is assigned
    if (data.teacherId) {
      // Remove new teacher from any other class they were assigned to
      await supabase
        .from('classes')
        .update({ teacher_id: null })
        .eq('teacher_id', data.teacherId);

      await supabase
        .from('profiles')
        .update({ class_id: id })
        .eq('id', data.teacherId);
    }

    return mapClass(created);
  } catch (err) {
    console.error('createClass error:', err);
    throw err;
  }
}

export async function updateClass(id: string, data: Partial<ClassInfo>): Promise<ClassInfo | undefined> {
  try {
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.teacherId !== undefined) dbData.teacher_id = data.teacherId || null;

    // Sync relationships between classes.teacher_id and profiles.class_id
    if (data.teacherId !== undefined) {
      const { data: currentClass } = await supabase
        .from('classes')
        .select('teacher_id')
        .eq('id', id)
        .single();
      
      const oldTeacherId = currentClass?.teacher_id || null;
      const newTeacherId = data.teacherId || null;

      if (oldTeacherId !== newTeacherId) {
        // 1. Remove old teacher's class assignment
        if (oldTeacherId) {
          await supabase
            .from('profiles')
            .update({ class_id: null })
            .eq('id', oldTeacherId);
        }
        // 2. Assign new teacher to class
        if (newTeacherId) {
          // Remove new teacher from any other class they were assigned to
          await supabase
            .from('classes')
            .update({ teacher_id: null })
            .eq('teacher_id', newTeacherId);

          await supabase
            .from('profiles')
            .update({ class_id: id })
            .eq('id', newTeacherId);
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('classes')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated ? mapClass(updated) : undefined;
  } catch (err) {
    console.error('updateClass error:', err);
    throw err;
  }
}

export async function deleteClass(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('deleteClass error:', err);
    return false;
  }
}

// --- Utils ---
export function generateEmailFromName(name: string, domain: string = 'dkhairat.sch.id'): string {
  const cleaned = name
    .toLowerCase()
    .replace(/^(bu |pak |bpk\.|ibu |dr\.|ustadz |ustadzah )/gi, '')
    .trim()
    .split(' ')
    .slice(0, 2)
    .join('.')
    .replace(/[^a-z0-9.]/g, '');
  return `${cleaned}@${domain}`;
}

// ============================================================
// COMPATIBILITY PLACEHOLDERS
// ============================================================
// We keep these empty exports to prevent compile issues while pages are refactoring
export const mockSchoolActivities: SchoolActivity[] = [];
export const mockHomeActivities: HomeActivity[] = [];
export const mockClasses: ClassInfo[] = [];
export const MOCK_USERS: User[] = [];
export const MOCK_STUDENTS: Student[] = [];
export const mockDailyLogs: DailyLog[] = [];
export const mockHomeLogs: HomeLog[] = [];
