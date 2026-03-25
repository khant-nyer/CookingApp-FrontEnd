import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import './styles/base.css';
import './features/backend-explorer/styles/explorer.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

const isHealthcheckRoute = window.location.pathname === '/health';

if (isHealthcheckRoute) {
  ReactDOM.createRoot(rootElement).render(<main>ok</main>);
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  );
}
