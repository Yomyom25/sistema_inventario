import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './componentes/autenticacion/Login';
import { isAuthenticated, getCurrentUser, verifySession, logout } from './utilidades/auth';
import TablaProductos from './componentes/productos/TablaProductos';
import TablaUsuarios from './componentes/usuarios/TablaUsuarios';
import FormularioVentas from './componentes/ventas/FormularioVentas';
import HistorialVentas from './componentes/ventas/HistorialVentas';
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

  const handleVerHistorialVentas = () => {
    navigate('/historial-ventas');
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
          onClick={handleVerHistorialVentas}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Historial de Ventas
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

  const handleRegistrarVenta = () => {
    navigate('/ventas');
  };

  const handleVerHistorialVentas = () => {
    navigate('/historial-ventas');
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <h1>Dashboard Empleado</h1>
      <p>Bienvenido al panel de empleado</p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={handleRegistrarVenta}
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
          Registrar Venta
        </button>
        <button 
          onClick={handleVerHistorialVentas}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Historial de Ventas
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

const VentasPage = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/productos', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        // Mapear datos de la API al formato que espera el componente
        const productosMapeados = data.data.map(p => ({
          id: p.id_producto,
          codigo: p.codigo,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precioCompra: parseFloat(p.precio_compra),
          precioVenta: parseFloat(p.precio_venta),
          stock: p.stock_actual
        }));
        setProductos(productosMapeados);
      } else {
        console.error('Error al cargar productos:', data.error);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarVenta = (venta) => {
    console.log('Venta registrada:', venta);
    
    // Actualizar stock del producto en el estado local
    setProductos(prev => 
      prev.map(p => 
        p.id === venta.productoId 
          ? { ...p, stock: p.stock - venta.cantidad }
          : p
      )
    );
  };

  const handleCancelarVenta = () => {
    console.log('Venta cancelada');
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando productos...</div>;
  }

  return (
    <div className="ventas-page">
      <FormularioVentas 
        productos={productos}
        onGuardarVenta={handleGuardarVenta}
        onCancelar={handleCancelarVenta}
        usuarioActual={getCurrentUser()}
      />
    </div>
  );
};

const HistorialVentasPage = () => (
  <div className="historial-ventas-page">
    <HistorialVentas />
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
          <Route 
            path="/ventas" 
            element={
              <ProtectedRoute>
                <VentasPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/historial-ventas" 
            element={
              <ProtectedRoute>
                <HistorialVentasPage />
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