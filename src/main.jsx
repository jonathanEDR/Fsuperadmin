import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/clerk-react';

// Usando clerkPublishableKey consistentemente
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

console.log('Clerk Publishable Key:', clerkPublishableKey);

if (!clerkPublishableKey) {
  throw new Error('VITE_CLERK_PUBLISHABLE_KEY is not defined');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </StrictMode>,
);