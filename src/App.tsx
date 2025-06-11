import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import useStore from './store/useStore';
import { lightTheme, darkTheme } from './theme';
import './styles/variables.css';

const Login = React.lazy(() => import('./pages/Login'));
const Chat = React.lazy(() => import('./pages/Chat'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useStore(state => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const isDarkMode = useStore(state => state.isDarkMode);
  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const root = document.documentElement;
    const { palette } = theme;

    root.style.setProperty('--primary-main', palette.primary.main);
    root.style.setProperty('--primary-light', palette.primary.light);
    root.style.setProperty('--primary-dark', palette.primary.dark);
    root.style.setProperty('--primary-contrast-text', palette.primary.contrastText);

    root.style.setProperty('--secondary-main', palette.secondary.main);
    root.style.setProperty('--secondary-light', palette.secondary.light);
    root.style.setProperty('--secondary-dark', palette.secondary.dark);
    root.style.setProperty('--secondary-contrast-text', palette.secondary.contrastText);

    root.style.setProperty('--background-default', palette.background.default);
    root.style.setProperty('--background-paper', palette.background.paper);

    root.style.setProperty('--text-primary', palette.text.primary);
    root.style.setProperty('--text-secondary', palette.text.secondary);

    root.style.setProperty('--divider', palette.divider);

    root.style.setProperty('--grey-100', palette.grey[100]);
    root.style.setProperty('--grey-200', palette.grey[200]);
    root.style.setProperty('--grey-300', palette.grey[300]);
    root.style.setProperty('--grey-400', palette.grey[400]);
    root.style.setProperty('--grey-500', palette.grey[500]);
  }, [theme]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <React.Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: theme.palette.background.default,
          }}>
            <p style={{
              color: theme.palette.text.primary,
              fontSize: 'var(--font-size-lg)',
            }}>
              Loading...
            </p>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
          </Routes>
        </React.Suspense>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </ThemeProvider>
  );
}

export default App;
