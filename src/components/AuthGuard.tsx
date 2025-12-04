//src/components/AuthGuard.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, loading, selectedCountry } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Center h="100vh">
                <Loader size="xl" />
            </Center>
        );
    }

    // If not authenticated, redirect to landing page (country selection)
    // But if we are already on the landing page or login/register, we don't redirect loop
    // Actually, AuthGuard should wrap protected routes (Dashboard, etc.)

    if (!user || !selectedCountry) {
        // If no user OR no country selected, redirect to landing
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // If user is authenticated but somehow we lost the country context (shouldn't happen if persisted)
    // We might want to check if the user's profile matches the selected country?
    // For now, just checking auth is enough.

    return <>{children}</>;
}
