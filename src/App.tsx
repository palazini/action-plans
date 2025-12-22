//src/App.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { MainLayout } from './layout/MainLayout';
import { AuthGuard } from './components/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages para melhor performance
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const BacklogPage = lazy(() => import('./pages/BacklogPage').then(m => ({ default: m.BacklogPage })));
const ActionPlansPage = lazy(() => import('./pages/ActionPlansPage').then(m => ({ default: m.ActionPlansPage })));
const StructurePage = lazy(() => import('./pages/StructurePage').then(m => ({ default: m.StructurePage })));

// Loading fallback component
function PageLoader() {
  return (
    <Center h="100vh">
      <Loader size="xl" type="dots" />
    </Center>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/app"
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="backlog" element={<BacklogPage />} />
            <Route path="plans" element={<ActionPlansPage />} />
            <Route path="structure" element={<StructurePage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>

          {/* Catch all redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
