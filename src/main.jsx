import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import '@fontsource-variable/inter';
import './styles/tokens.css';
import './styles/base.css';
import { createQueryClient } from './lib/queryClient.js';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { ToastProvider } from './providers/ToastProvider.jsx';
import { router } from './routes/router.jsx';

function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
