import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import './index.css'
import App from './App.jsx'
import toast, { Toaster } from 'react-hot-toast'

// Global Fetch Interceptor for API Error Toasts
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    if (!response.ok) {
      try {
        const clone = response.clone();
        const data = await clone.json();
        // Prevent duplicate toasts for the same error message
        const msg = data.detail || data.message || `API Error: ${response.status} ${response.statusText}`;
        toast.error(msg, { id: msg });
      } catch (e) {
        toast.error(`API Error: ${response.status} ${response.statusText}`, { id: `err-${response.status}` });
      }
    }
    return response;
  } catch (error) {
    toast.error(`Network Error: ${error.message}`, { id: 'network-err' });
    throw error;
  }
};

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-dark)', height: '100vh', color: 'var(--text-main)' }}>
      <h2>Oops, something went wrong.</h2>
      <pre style={{ color: 'var(--accent-rose)', margin: '1rem 0', whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <button onClick={resetErrorBoundary} className="btn-primary" style={{ margin: '0 auto' }}>Try again</button>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <App />
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem',
            padding: '12px 16px',
          },
          error: {
            iconTheme: {
              primary: 'var(--accent-rose)',
              secondary: 'white',
            },
          },
        }} 
      />
    </ErrorBoundary>
  </StrictMode>,
)
