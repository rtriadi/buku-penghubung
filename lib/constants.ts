// lib/constants.ts

import type { SchoolActivity, HomeActivity } from './types';

export const SCHOOL_ACTIVITIES: SchoolActivity[] = [
  { id: 'hadir', label: 'Hadir', emoji: '✅', category: 'kehadiran' },
  { id: 'sholat_dhuha', label: 'Sholat Dhuha', emoji: '🕌', category: 'ibadah' },
  { id: 'snack_pagi', label: 'Snack Pagi', emoji: '🥪', category: 'makan' },
  { id: 'belajar', label: 'Belajar & Bermain', emoji: '📚', category: 'belajar' },
  { id: 'makan_siang', label: 'Makan Siang', emoji: '🍱', category: 'makan' },
  { id: 'tidur_siang', label: 'Tidur Siang', emoji: '😴', category: 'istirahat' },
  { id: 'sholat_dzuhur', label: 'Sholat Dzuhur', emoji: '🕌', category: 'ibadah' },
  { id: 'sholat_ashar', label: 'Sholat Ashar', emoji: '🌤️', category: 'ibadah' },
  { id: 'pulang', label: 'Pulang', emoji: '🏠', category: 'kehadiran' },
];

export const HOME_ACTIVITIES: HomeActivity[] = [
  { id: 'pr_belajar', label: 'PR / Belajar di Rumah', emoji: '📖' },
  { id: 'mandi_sore', label: 'Mandi Sore', emoji: '🛁' },
  { id: 'sholat_maghrib', label: 'Sholat Maghrib', emoji: '🌅' },
  { id: 'sholat_isya', label: 'Sholat Isya', emoji: '🌙' },
  { id: 'baca_iqro', label: 'Baca Iqro / Quran', emoji: '📿' },
  { id: 'tidur_malam', label: 'Tidur Malam', emoji: '⭐', hasTime: true },
];

export const ACTIVITY_CATEGORIES = [
  { id: 'kehadiran', label: 'Kehadiran', color: '#27AE60' },
  { id: 'ibadah', label: 'Ibadah', color: '#9B59B6' },
  { id: 'makan', label: 'Makan & Minum', color: '#E67E22' },
  { id: 'belajar', label: 'Belajar & Bermain', color: '#3498DB' },
  { id: 'istirahat', label: 'Istirahat', color: '#1ABC9C' },
];

export const KONDISI_OPTIONS = [
  { value: 'sehat' as const, label: 'Sehat', emoji: '😊', color: '#27AE60', bg: '#D5F5E3' },
  { value: 'kurang_sehat' as const, label: 'Kurang Sehat', emoji: '😐', color: '#F39C12', bg: '#FDEBD0' },
  { value: 'sakit' as const, label: 'Sakit', emoji: '🤒', color: '#E74C3C', bg: '#FADBD8' },
];

export const STUDENT_AVATAR_EMOJIS = ['🦁', '🐻', '🐰', '🦋', '🐯', '🦊', '🐼', '🐨', '🦄', '🐸'];

export const CLASS_NAME = 'Kelas A';
export const SCHOOL_NAME = 'PAUD Islam Terpadu Darul Khairat';
export const SCHOOL_TAGLINE = 'Membentuk Generasi Qur\'ani yang Berakhlak Mulia';
