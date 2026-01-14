// src/hooks/useQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchBacklogElements,
    fetchBacklogByLevel,
    fetchDashboardStats,
    fetchActionPlans,
    fetchPillarStats,
    fetchGlobalCountryStats,
    createActionPlan,
    updateActionPlan,
    updateActionPlanStatus,
    type GlobalCountryStats,
} from '../services/api';
import type {
    DashboardStats,
    ElementWithRelations,
    PillarStats,
    ActionPlanWithElement,
    ActionPlanStatus,
    MaturityLevel,
} from '../types';

// === Query Keys ===
export const queryKeys = {
    backlog: (country: string) => ['backlog', country] as const,
    backlogByLevel: (country: string, level: MaturityLevel) => ['backlogByLevel', country, level] as const,
    dashboard: (country: string) => ['dashboard', country] as const,
    actionPlans: (country: string) => ['actionPlans', country] as const,
    pillarStats: (country: string) => ['pillarStats', country] as const,
    globalStats: ['globalStats'] as const,
    pillars: (country: string) => ['pillars', country] as const,
};

// === Queries ===

export function useBacklogElements(country: string | null) {
    return useQuery<ElementWithRelations[]>({
        queryKey: queryKeys.backlog(country ?? ''),
        queryFn: () => fetchBacklogElements(country!),
        enabled: !!country,
    });
}

export function useBacklogByLevel(country: string | null, level: MaturityLevel) {
    return useQuery<ElementWithRelations[]>({
        queryKey: queryKeys.backlogByLevel(country ?? '', level),
        queryFn: () => fetchBacklogByLevel(country!, level),
        enabled: !!country,
    });
}

export function useDashboardStats(country: string | null) {
    return useQuery<DashboardStats>({
        queryKey: queryKeys.dashboard(country ?? ''),
        queryFn: () => fetchDashboardStats(country!),
        enabled: !!country && country !== 'Global',
    });
}

export function useActionPlans(country: string | null) {
    return useQuery<ActionPlanWithElement[]>({
        queryKey: queryKeys.actionPlans(country ?? ''),
        queryFn: () => fetchActionPlans(country!),
        enabled: !!country,
    });
}

export function usePillarStats(country: string | null) {
    return useQuery<PillarStats[]>({
        queryKey: queryKeys.pillarStats(country ?? ''),
        queryFn: () => fetchPillarStats(country!),
        enabled: !!country && country !== 'Global',
    });
}

export function useGlobalCountryStats() {
    return useQuery<GlobalCountryStats[]>({
        queryKey: queryKeys.globalStats,
        queryFn: fetchGlobalCountryStats,
    });
}

// === Mutations ===

export function useCreateActionPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createActionPlan,
        onSuccess: (_, variables) => {
            // Invalida caches relacionados ao país
            queryClient.invalidateQueries({ queryKey: queryKeys.backlog(variables.country) });
            queryClient.invalidateQueries({ queryKey: queryKeys.actionPlans(variables.country) });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(variables.country) });
            queryClient.invalidateQueries({ queryKey: queryKeys.pillarStats(variables.country) });
            queryClient.invalidateQueries({ queryKey: queryKeys.globalStats });
        },
    });
}

export function useUpdateActionPlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateActionPlan,
        onSuccess: () => {
            // Invalida todos os caches de planos (não sabemos o país exato aqui)
            queryClient.invalidateQueries({ queryKey: ['actionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['backlog'] });
        },
    });
}

export function useUpdateActionPlanStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: ActionPlanStatus }) =>
            updateActionPlanStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['globalStats'] });
        },
    });
}
