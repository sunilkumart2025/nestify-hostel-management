import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useAuth } from './contexts/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import TenantLogin from './pages/TenantLogin';
import TenantSignup from './pages/TenantSignup';
import AdminDashboard from './pages/AdminDashboard';
import TenantDashboard from './pages/TenantDashboard';
import ForgotPassword from './pages/ForgotPassword';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                <Route path="/tenant/login" element={<TenantLogin />} />
                <Route path="/tenant/signup" element={<TenantSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                <Route 
                  path="/admin/dashboard/*" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/tenant/dashboard/*" 
                  element={
                    <ProtectedRoute requiredRole="tenant">
                      <TenantDashboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
              <Toaster 
                position="top-right" 
                toastOptions={{
                  className: 'dark:bg-gray-800 dark:text-white',
                  duration: 4000,
                }}
              />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;