import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  selectedCountry: string | null;
  userRole: string | null; // Novo campo para saber se é supervisor
  setSelectedCountry: (country: string | null) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // Estado para a role
  const [loading, setLoading] = useState(true);
  
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedCountry');
    }
    return null;
  });

  // Função auxiliar para buscar o perfil e a role
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, country')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setUserRole(data.role || 'user');
        
        // LÓGICA IMPORTANTE:
        // Só forçamos o país do perfil se o usuário NÃO tiver selecionado nada ainda (localStorage vazio)
        // Isso permite que um usuário Brasileiro clique em "Global" na Landing Page e navegue como Global
        const storedCountry = localStorage.getItem('selectedCountry');
        
        if (!storedCountry && data.country) {
            setSelectedCountry(data.country);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    }
  };

  useEffect(() => {
    // Check inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listener de mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false); // Garante que loading pare ao deslogar
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Quando o profile/role carregar, liberamos o app
  useEffect(() => {
    if (user && userRole !== null) {
        setLoading(false);
    }
  }, [user, userRole]);

  useEffect(() => {
    if (selectedCountry) {
      localStorage.setItem('selectedCountry', selectedCountry);
    } else {
      localStorage.removeItem('selectedCountry');
    }
  }, [selectedCountry]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSelectedCountry(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        selectedCountry,
        userRole, // Expondo a role para o resto do app
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