import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { Provider } from 'react-redux';
import store from './redux/store';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

// Ensure environment variables are handled correctly
const env = {
  NODE_ENV: 'development',
  PUBLIC_URL: ''
};

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // You could add code here to display an error message on the page
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Debug message to verify script execution
console.log("React application starting...");

// Diagnostic function to check if important components exist
const checkComponents = () => {
  if (!React) console.error("React is not defined!");
  if (!ReactDOM) console.error("ReactDOM is not defined!");
  if (!App) console.error("App component is not defined!");
  if (!store) console.error("Redux store is not defined!");
  
  const rootElement = document.getElementById('root');
  if (!rootElement) console.error("Root element not found in DOM!");
  else console.log("Root element found:", rootElement);
};

// Run diagnostics
checkComponents();

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store}>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                },
              },
              error: {
                duration: 4000,
                theme: {
                  primary: '#ff6b6b',
                },
              },
            }}
          />
          <App />
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("React application rendered successfully");
} catch (error) {
  console.error("Failed to render React application:", error);
  
  // Create an error message directly in the DOM as a fallback
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">
        <h1 style="margin-bottom: 10px;">React Failed to Load</h1>
        <p>There was an error initializing the application.</p>
        <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin-top: 10px; overflow: auto;">${error.message}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}