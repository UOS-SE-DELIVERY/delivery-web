import '@/global.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AuthInitializer } from '@/components/AuthInitializer';
import { Router } from '@/routes';

// import { ThemeProvider } from '@/components/ThemeProvider';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <ThemeProvider> */}
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <Router />
      </AuthInitializer>
    </QueryClientProvider>
    {/* </ThemeProvider> */}
  </StrictMode>,
);
