// lib/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Role } from './types';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch profile details from Supabase
  async function fetchProfile(userId: string, email: string): Promise<User | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return {
        id: profile.id,
        name: profile.name,
        role: profile.role as Role,
        email: email,
        classId: profile.class_id || undefined,
        studentId: profile.student_id || undefined,
        createdAt: profile.created_at,
      };
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return null;
    }
  }

  useEffect(() => {
    // 1. Check active session on mount
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const u = await fetchProfile(session.user.id, session.user.email!);
          if (u) {
            setUser(u);
            localStorage.setItem('buku_penghubung_user', JSON.stringify(u));
          } else {
            // Profile not found but auth exists - clear it
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('buku_penghubung_user');
          }
        } else {
          // Check localStorage backup
          const stored = localStorage.getItem('buku_penghubung_user');
          if (stored) {
            try {
              setUser(JSON.parse(stored));
            } catch {
              localStorage.removeItem('buku_penghubung_user');
            }
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = await fetchProfile(session.user.id, session.user.email!);
        if (u) {
          setUser(u);
          localStorage.setItem('buku_penghubung_user', JSON.stringify(u));
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('buku_penghubung_user');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setIsLoading(false);
        // User-friendly error messages
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email atau password salah.' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setIsLoading(false);
        return { success: false, error: 'User tidak ditemukan.' };
      }

      const u = await fetchProfile(data.user.id, data.user.email!);
      if (!u) {
        setIsLoading(false);
        await supabase.auth.signOut();
        return { success: false, error: 'Profil akun Anda belum dikonfigurasi di database. Hubungi admin.' };
      }

      setUser(u);
      localStorage.setItem('buku_penghubung_user', JSON.stringify(u));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Terjadi kesalahan sistem.' };
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('buku_penghubung_user');
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
