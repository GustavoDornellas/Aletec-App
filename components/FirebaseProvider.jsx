'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
const FirebaseContext = createContext(undefined);
function mapUser(user) {
    if (!user)
        return null;
    return {
        uid: user.id,
        email: user.email ?? null,
        displayName: (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
            (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
            user.email ||
            'Usuario',
        photoURL: (typeof user.user_metadata?.avatar_url === 'string' && user.user_metadata.avatar_url) ||
            null,
    };
}
export function FirebaseProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const login = async (username, password) => {
        if (!username || !password) {
            throw new Error('Informe e-mail e senha.');
        }
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: username,
            password,
        });
        if (error) {
            setLoading(false);
            throw new Error('E-mail ou senha incorretos. Verifique os campos e tente novamente.');
        }
        setUser(mapUser(data.user));
        setLoading(false);
    };
    const logout = async () => {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
        setUser(null);
    };
    useEffect(() => {
        const supabase = getSupabaseClient();
        const syncSession = (session) => {
            setUser(mapUser(session?.user ?? null));
            setLoading(false);
        };
        void supabase.auth.getSession().then(({ data }) => {
            syncSession(data.session);
        });
        const { data: { subscription }, } = supabase.auth.onAuthStateChange((_event, session) => {
            syncSession(session);
        });
        return () => {
            subscription.unsubscribe();
        };
    }, []);
    return (<FirebaseContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </FirebaseContext.Provider>);
}
export function useFirebase() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
}
