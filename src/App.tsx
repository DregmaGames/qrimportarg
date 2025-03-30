import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import PublicProduct from './pages/PublicProduct';
import Layout from './components/Layout';
import './i18n';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:uuid" element={<PublicProduct />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <Products />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;