import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './componentes/autenticacion/Login';
import { isAuthenticated, getCurrentUser, verifySession, logout } from './utilidades/auth';
import TablaProductos from './componentes/productos/TablaProductos';
import TablaUsuarios from './componentes/usuarios/TablaUsuarios';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleVerProductos = () => {
    navigate('/productos');
  };

  const handleVerUsuarios = () => {
    navigate('/usuarios');
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <h1>Dashboard Administrador</h1>
      <p>Bienvenido al panel de administración</p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleVerProductos}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#1e40af',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Ver Tabla Productos
        </button>
        <button 
          onClick={handleVerUsuarios}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Ver Tabla Usuarios
        </button>
        <button 
          onClick={handleCerrarSesion}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <h1>Dashboard Empleado</h1>
      <p>Bienvenido al panel de empleado</p>
      <div style={{ marginTop: '2rem' }}>
        <button 
          onClick={handleCerrarSesion}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

const ProductosPage = () => (
  <div className="productos-page">
    <TablaProductos />
  </div>
);

const UsuariosPage = () => (
  <div className="usuarios-page">
    <TablaUsuarios />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'

  useEffect(() => {
    const checkAuthentication = async () => {
      // Primero verificar si hay usuario en localStorage
      if (!isAuthenticated()) {
        setAuthStatus('unauthenticated');
        return;
      }

      // Luego verificar con el servidor
      try {
        const user = await verifySession();
        if (user) {
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        // En caso de error, permitir el acceso basado en localStorage
        setAuthStatus('authenticated');
      }
    };

    checkAuthentication();
  }, []);

  if (authStatus === 'checking') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
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
          <Route 
            path="/productos" 
            element={
              <ProtectedRoute>
                <ProductosPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute>
                <UsuariosPage />
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