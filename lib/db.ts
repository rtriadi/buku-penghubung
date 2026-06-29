// lib/db.ts
// Supabase Data Layer — performs real queries and mutations on the Supabase database.
// Replaces the local memory/localStorage store with actual server integration.

import { supabase } from './supabase';
import type { User, Student, DailyLog, HomeLog, ClassInfo, SchoolActivity, HomeActivity, AccountCredentials, Role, Announcement } from './types';

export const DEFAULT_PASSWORD = 'dkhairat2024';

// ============================================================
// DATABASE MAPPING HELPERS
// ============================================================

export function mapProfile(p: any): User {
  return {
    id: p.id,
    name: p.name || 'User',
    role: p.role as Role,
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
    status: s.status || 'active',
    program: s.program || 'fullday',
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
    hasTime: a.has_time === true,
    order: a.order || 0,
    isActive: a.is_active !== false,
    isFulldayOnly: a.is_fullday_only === true,
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

    // Sync relationships: clear old class's Wali Kelas if this teacher was the Wali Kelas
    if (data.classId !== undefined) {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('class_id')
        .eq('id', id)
        .single();
      
      const oldClassId = currentProfile?.class_id || null;
      const newClassId = data.classId || null;

      if (oldClassId !== newClassId) {
        if (oldClassId) {
          await supabase
            .from('classes')
            .update({ teacher_id: null })
            .eq('id', oldClassId)
            .eq('teacher_id', id);
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

export async function promoteToPrincipal(userId: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/set-principal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Gagal menetapkan kepala sekolah.');
    }
    return true;
  } catch (err: any) {
    console.error('promoteToPrincipal error:', err);
    throw err;
  }
}

export async function setTeacherAdmin(userId: string | null): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/set-teacher-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Gagal menetapkan admin dari pihak guru.');
    }
    return true;
  } catch (err: any) {
    console.error('setTeacherAdmin error:', err);
    throw err;
  }
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

export async function getStudentsByParent(parentId: string): Promise<Student[]> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapStudent);
  } catch (err) {
    console.error('getStudentsByParent error:', err);
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
        status: data.status || 'active',
        program: data.program || 'fullday',
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
    if (data.status !== undefined) dbData.status = data.status;
    if (data.program !== undefined) dbData.program = data.program;

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

export async function bulkUpdateStudents(
  studentIds: string[],
  data: { classId?: string; status?: 'active' | 'alumni' }
): Promise<boolean> {
  try {
    if (studentIds.length === 0) return true;

    const dbData: any = {};
    if (data.classId !== undefined) dbData.class_id = data.classId;
    if (data.status !== undefined) dbData.status = data.status;

    const { error } = await supabase
      .from('students')
      .update(dbData)
      .in('id', studentIds);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('bulkUpdateStudents error:', err);
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
        has_time: data.hasTime === true,
        order: data.order || 0,
        is_active: data.isActive !== false,
        is_fullday_only: data.isFulldayOnly === true,
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
    if (data.hasTime !== undefined) dbData.has_time = data.hasTime;
    if (data.order !== undefined) dbData.order = data.order;
    if (data.isActive !== undefined) dbData.is_active = data.isActive;
    if (data.isFulldayOnly !== undefined) dbData.is_fullday_only = data.isFulldayOnly;

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
        // Assign new teacher to class as Wali Kelas
        if (newTeacherId) {
          // Remove new teacher from being wali kelas of any other class
          await supabase
            .from('classes')
            .update({ teacher_id: null })
            .eq('teacher_id', newTeacherId);

          // Ensure the new teacher is assigned to this class in their profile
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

// ============================================================
// ANNOUNCEMENT MAPPER
// ============================================================

export function mapAnnouncement(a: any): Announcement {
  return {
    id: a.id,
    title: a.title,
    content: a.content || '',
    startDate: a.start_date,
    endDate: a.end_date,
    isActive: a.is_active !== false,
    createdBy: a.created_by || undefined,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

/** Ambil semua pengumuman yang aktif dan dalam rentang tanggal hari ini (untuk user) */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAnnouncement);
  } catch (err) {
    console.error('getActiveAnnouncements error:', err);
    return [];
  }
}

/** Ambil semua pengumuman untuk admin (termasuk nonaktif dan expired) */
export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAnnouncement);
  } catch (err) {
    console.error('getAllAnnouncements error:', err);
    return [];
  }
}

/** Buat pengumuman baru (melalui API route admin) */
export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Announcement> {
  const res = await fetch('/api/admin/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal membuat pengumuman');
  }
  const result = await res.json();
  return mapAnnouncement(result.data);
}

/** Update pengumuman yang ada */
export async function updateAnnouncement(
  id: string,
  data: Partial<Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Announcement> {
  const res = await fetch(`/api/admin/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal mengupdate pengumuman');
  }
  const result = await res.json();
  return mapAnnouncement(result.data);
}

/** Hapus pengumuman */
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.error('deleteAnnouncement error:', err);
    return false;
  }
}

// ============================================================
// ANNOUNCEMENT READS
// ============================================================

/** Ambil semua announcement_id yang sudah dibaca user */
export async function getMyAnnouncementReads(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map((r: any) => r.announcement_id);
  } catch (err) {
    console.error('getMyAnnouncementReads error:', err);
    return [];
  }
}

/** Tandai satu pengumuman sudah dibaca */
export async function markAnnouncementRead(
  announcementId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('announcement_reads')
      .upsert(
        { announcement_id: announcementId, user_id: userId },
        { onConflict: 'announcement_id,user_id' }
      );
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('markAnnouncementRead error:', err);
    return false;
  }
}

/** Tandai semua pengumuman aktif sebagai sudah dibaca */
export async function markAllAnnouncementsRead(userId: string): Promise<boolean> {
  try {
    const announcements = await getActiveAnnouncements();
    if (announcements.length === 0) return true;

    const rows = announcements.map(a => ({
      announcement_id: a.id,
      user_id: userId,
    }));

    const { error } = await supabase
      .from('announcement_reads')
      .upsert(rows, { onConflict: 'announcement_id,user_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('markAllAnnouncementsRead error:', err);
    return false;
  }
}
