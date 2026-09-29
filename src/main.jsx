import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.jsx';

const render = () => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </StrictMode>,
);

const enableMocking = async () => {
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
};

const mockSetting = import.meta.env.VITE_ENABLE_MOCKS;
const shouldEnableMocking = mockSetting === 'true'
  || (mockSetting !== 'false' && import.meta.env.DEV);

(shouldEnableMocking ? enableMocking() : Promise.resolve()).finally(render);
