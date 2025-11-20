import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { BacklogPage } from './pages/BacklogPage';
import { ActionPlansPage } from './pages/ActionPlansPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="backlog" element={<BacklogPage />} />
        <Route path="plans" element={<ActionPlansPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
