import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/clerk-react';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkDomain = import.meta.env.VITE_CLERK_DOMAIN;

if (!clerkPubKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not defined');
}

if (!clerkDomain) {
  throw new Error('VITE_CLERK_DOMAIN is not defined');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={clerkPubKey}
      appearance={{
        baseTheme: undefined,
        variables: { colorPrimary: '#000000' },
        elements: {
          formButtonPrimary: {
            backgroundColor: '#000000',
            '&:hover': { backgroundColor: '#333333' },
          }
        }
      }}
      navigate={(to) => window.location.href = to}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);