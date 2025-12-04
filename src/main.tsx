import React, { Suspense } from 'react'; // Importe Suspense
import ReactDOM from 'react-dom/client';
import { MantineProvider, Loader, Center } from '@mantine/core'; // Importe componentes de loading
import { BrowserRouter } from 'react-router-dom';
import { Notifications } from '@mantine/notifications';
import App from './App';
import './i18n';
import { AuthProvider } from './contexts/AuthContext';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

// Um componente de loading bonito para o estado inicial
const PageLoader = () => (
  <Center h="100vh" bg="gray.0">
    <Loader size="xl" type="dots" />
  </Center>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light">
      <Notifications />
      <Suspense fallback={<PageLoader />}> {/* ADICIONE ISSO AQUI */}
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </Suspense>
    </MantineProvider>
  </React.StrictMode>,
);