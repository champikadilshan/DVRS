// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NextUIProvider } from '@nextui-org/react';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import RepositoryList from './pages/repositories/RepositoryList';
import RepositoryAnalysisPage from './pages/repositories/RepositoryAnalysisPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <NextUIProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/repositories" element={<RepositoryList />} />
              <Route
                path="/repositories/:name/analyze"
                element={<RepositoryAnalysisPage />}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </NextUIProvider>
  );
}

export default App;
