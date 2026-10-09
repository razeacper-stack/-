import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { storageResetService } from './services/storageResetService';

// Ensure fresh run starts with zero demo data so user starts completely from scratch
storageResetService.ensureCleanModeOnFirstRun();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
