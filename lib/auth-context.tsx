// lib/auth-context.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Role } from './types';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean, expectedRole?: Role) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
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
        .select('*, classes!fk_profile_class(name)')
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
        className: (profile as any).classes?.name || undefined,
        studentId: profile.student_id || undefined,
        createdAt: profile.created_at,
      };
    } catch (err) {
      console.error('Exception fetching profile:', err);
      return null;
    }
  }

  useEffect(() => {
    // 1. Register PWA Service Worker
    let cleanUpLoadListener: (() => void) | undefined;
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
          .catch((err) => console.warn('Service Worker registration failed:', err));
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
        cleanUpLoadListener = () => window.removeEventListener('load', registerSW);
      }
    }

    // 2. Check active session on mount
    async function initAuth() {
      try {
        const rememberMe = localStorage.getItem('buku_penghubung_remember_me') === 'true';
        const sessionActive = sessionStorage.getItem('buku_penghubung_session_active') === 'true';

        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // If rememberMe is false and this is a new session tab (sessionActive is false), log out.
          if (!rememberMe && !sessionActive) {
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem('buku_penghubung_user');
            sessionStorage.setItem('buku_penghubung_session_active', 'true'); // mark to avoid infinite signouts
          } else {
            const u = await fetchProfile(session.user.id, session.user.email!);
            if (u) {
              setUser(u);
              localStorage.setItem('buku_penghubung_user', JSON.stringify(u));
              sessionStorage.setItem('buku_penghubung_session_active', 'true');
            } else {
              // Profile not found but auth exists - clear it
              await supabase.auth.signOut();
              setUser(null);
              localStorage.removeItem('buku_penghubung_user');
            }
          }
        } else {
          // Check localStorage backup only if rememberMe is true or sessionActive is true
          if (rememberMe || sessionActive) {
            const stored = localStorage.getItem('buku_penghubung_user');
            if (stored) {
              try {
                setUser(JSON.parse(stored));
              } catch {
                localStorage.removeItem('buku_penghubung_user');
              }
            }
          } else {
            localStorage.removeItem('buku_penghubung_user');
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // 3. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const u = await fetchProfile(session.user.id, session.user.email!);
        if (u) {
          setUser(u);
          localStorage.setItem('buku_penghubung_user', JSON.stringify(u));
          sessionStorage.setItem('buku_penghubung_session_active', 'true');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('buku_penghubung_user');
        sessionStorage.removeItem('buku_penghubung_session_active');
      }
    });

    return () => {
      subscription.unsubscribe();
      if (cleanUpLoadListener) cleanUpLoadListener();
    };
  }, []);

  async function refreshUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = await fetchProfile(session.user.id, session.user.email!);
        if (u) {
          setUser(u);
          localStorage.setItem('buku_penghubung_user', JSON.stringify(u));
        }
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
  }

  async function login(email: string, password: string, rememberMe: boolean = false, expectedRole?: Role): Promise<{ success: boolean; error?: string }> {
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

      if (expectedRole && u.role !== expectedRole) {
        setIsLoading(false);
        await supabase.auth.signOut();
        const roleNames = {
          admin: 'Admin',
          teacher: 'Guru',
          parent: 'Orang Tua',
          principal: 'Kepala Sekolah',
        };
        return {
          success: false,
          error: `Akun Anda terdaftar sebagai ${roleNames[u.role] || u.role}, tidak cocok dengan pilihan masuk Anda.`,
        };
      }

      // Save rememberMe configuration
      localStorage.setItem('buku_penghubung_remember_me', rememberMe ? 'true' : 'false');
      sessionStorage.setItem('buku_penghubung_session_active', 'true');

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
      localStorage.removeItem('buku_penghubung_remember_me');
      sessionStorage.removeItem('buku_penghubung_session_active');
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
