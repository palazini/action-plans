// src/contexts/AppSettingsContext.tsx
import {
    createContext,
    useContext,
    useCallback,
    type ReactNode,
} from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchActiveMaturityLevel, updateActiveMaturityLevel } from '../services/api';
import type { MaturityLevel } from '../types';

type AppSettingsContextType = {
    activeLevel: MaturityLevel;
    isLoading: boolean;
    setActiveLevel: (level: MaturityLevel) => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const { data: activeLevel = 'FOUNDATION', isLoading } = useQuery({
        queryKey: ['activeMaturityLevel'],
        queryFn: fetchActiveMaturityLevel,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const mutation = useMutation({
        mutationFn: updateActiveMaturityLevel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activeMaturityLevel'] });
            // Invalidate queries that depend on the active level
            queryClient.invalidateQueries({ queryKey: ['backlog'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['actionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['globalCountryStats'] });
        },
    });

    const setActiveLevel = useCallback(async (level: MaturityLevel) => {
        await mutation.mutateAsync(level);
    }, [mutation]);

    return (
        <AppSettingsContext.Provider
            value={{
                activeLevel,
                isLoading,
                setActiveLevel,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
}

export function useAppSettings() {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useAppSettings must be used within an AppSettingsProvider');
    }
    return context;
}
