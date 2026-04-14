'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSessionUser, signInWithPassword, signOut } from '@/services/authService';
import { getSupabaseClient } from '@/services/supabaseClient';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    const response = await signInWithPassword({ email, password });

    if (response.success) {
      setUser(response.data);
    }

    return response;
  }

  async function logout() {
    const response = await signOut();

    if (response.success) {
      setUser(null);
    }

    return response;
  }

  useEffect(() => {
    const supabase = getSupabaseClient();

    function syncSession(session) {
      setUser(getSessionUser(session));
      setLoading(false);
    }

    void supabase.auth.getSession().then(({ data }) => {
      syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth precisa ser usado dentro de AuthProvider.');
  }

  return context;
}
