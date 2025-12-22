import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './i18n';
import { AuthProvider } from './contexts/AuthContext';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

// Configuração do React Query para cache inteligente
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Dados ficam "frescos" por 5 minutos
      gcTime: 1000 * 60 * 30, // Cache mantido por 30 minutos
      retry: 1, // Tentar novamente 1 vez em caso de erro
      refetchOnWindowFocus: false, // Não refetch ao focar janela
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="light">
        <Notifications />
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);