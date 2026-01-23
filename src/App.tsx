//src/App.tsx
/*
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { MainLayout } from './layout/MainLayout';
import { AuthGuard } from './components/AuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages para melhor performance
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ActionPlansPage = lazy(() => import('./pages/ActionPlansPage').then(m => ({ default: m.ActionPlansPage })));
const MaturityPage = lazy(() => import('./pages/MaturityPage').then(m => ({ default: m.MaturityPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const PillarManagementPage = lazy(() => import('./pages/PillarManagementPage').then(m => ({ default: m.PillarManagementPage })));

// Loading fallback component
function PageLoader() {
  return (
    <Center h="100vh">
      <Loader size="xl" type="dots" />
    </Center>
  );
}
*/

// Maintenance Mode Active
import MaintenancePage from './pages/MaintenancePage';

export default function App() {
  return <MaintenancePage />;
}

/*
// Original Routes - Disabled for Maintenance
export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/app"
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="maturity" element={<MaturityPage />} />
            <Route path="plans" element={<ActionPlansPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/pillars" element={<PillarManagementPage />} />
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
*/
