//src/contexts/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  selectedCountry: string | null;
  userRole: string | null;
  setSelectedCountry: (country: string | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedCountry');
    }
    return null;
  });

  // Função auxiliar para buscar o perfil e a role
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, country')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUserRole(data.role || 'user');
        if (data.country) {
          setSelectedCountry(data.country);
        }
      } else {
        setUserRole('user');
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
      setUserRole('user');
    } finally {
      setProfileLoaded(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    // Listener de mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setProfileLoaded(false);
        fetchProfile(session.user.id);
      } else {
        setUserRole(null);
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Quando o profile carregar, liberamos o app
  useEffect(() => {
    if (profileLoaded) {
      setLoading(false);
    }
  }, [profileLoaded]);

  useEffect(() => {
    if (selectedCountry) {
      localStorage.setItem('selectedCountry', selectedCountry);
    } else {
      localStorage.removeItem('selectedCountry');
    }
  }, [selectedCountry]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSelectedCountry(null);
    setUserRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        selectedCountry,
        userRole,
        setSelectedCountry,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}