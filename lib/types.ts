// lib/types.ts

export type Role = 'teacher' | 'parent' | 'admin' | 'principal';

export type HealthCondition = 'sehat' | 'kurang_sehat' | 'sakit';

export type ActivityCategory = string;

export interface Student {
  id: string;
  name: string;
  nickname: string;
  classId: string;
  parentId: string;
  avatarEmoji: string;
  birthdate: string;
  status: 'active' | 'alumni';
  createdAt?: string;
}

export interface SchoolActivity {
  id: string;
  label: string;
  emoji: string;
  category: ActivityCategory;
  hasTime?: boolean;
  order?: number;
  isActive?: boolean; // admin can toggle
}

export interface HomeActivity {
  id: string;
  label: string;
  emoji: string;
  hasTime?: boolean;
  order?: number;
  isActive?: boolean; // admin can toggle
}

export interface HealthStatus {
  suhu?: number;
  kondisi: HealthCondition;
  catatan?: string;
}

export interface DailyLog {
  id: string;
  studentId: string;
  date: string;
  schoolActivities: Record<string, boolean | string>;
  teacherNote: string;
  healthStatus: HealthStatus;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HomeLog {
  id: string;
  studentId: string;
  date: string;
  homeActivities: Record<string, boolean | string>;
  parentNote: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  password?: string; // stored for mock auth (never do this in real app!)
  studentId?: string;
  classId?: string;
  createdAt?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  teacherId: string;
}

// Admin-specific types
export interface AccountCredentials {
  email: string;
  password: string;
  name: string;
  role: Role;
}
