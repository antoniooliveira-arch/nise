import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Occurrences from './pages/Occurrences';
import Calls from './pages/Calls';
import Reports from './pages/Reports';
import Schools from './pages/Schools';
import Users from './pages/Users';
import Settings from './pages/Settings';
import AvaliacaoPortaria from './pages/AvaliacaoPortaria';
import Login from './pages/Login';
import React from 'react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/ocorrencias" element={<ProtectedRoute><Layout><Occurrences /></Layout></ProtectedRoute>} />
      <Route path="/chamados" element={<ProtectedRoute><Layout><Calls /></Layout></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
      <Route path="/escolas" element={<ProtectedRoute><Layout><Schools /></Layout></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/avaliacao-portaria" element={<ProtectedRoute><Layout><AvaliacaoPortaria /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;