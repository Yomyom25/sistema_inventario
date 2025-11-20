import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './componentes/autenticacion/Login';
import { isAuthenticated, getCurrentUser } from './utilidades/auth';
import TablaProductos from './componentes/productos/TablaProductos';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const AdminDashboard = () => (
  <div className="dashboard">
    <h1>Dashboard Administrador</h1>
    <p>Bienvenido al panel de administración</p>
  </div>
);

const EmployeeDashboard = () => (
  <div className="dashboard">
    <h1>Dashboard Empleado</h1>
    <p>Bienvenido al panel de empleado</p>
  </div>
);

// Página dedicada para productos
const ProductosPage = () => (
  <div className="productos-page">
    <TablaProductos />
  </div>
);

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DashboardRedirect = () => {
  const user = getCurrentUser();
  if (user?.role === 'Administrador') {
    return <Navigate to="/admin-dashboard" replace />;
  } else if (user?.role === 'Empleado') {
    return <Navigate to="/employee-dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            } 
          />
          {/* RUTA PARA PRODUCTOS */}
          <Route 
            path="/productos" 
            element={
              <ProtectedRoute>
                <ProductosPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<DashboardRedirect />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
