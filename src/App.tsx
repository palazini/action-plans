//src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BacklogPage } from './pages/BacklogPage';
import { ActionPlansPage } from './pages/ActionPlansPage';
import { StructurePage } from './pages/StructurePage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthGuard } from './components/AuthGuard';

export default function App() {
  return (
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
  );
}
