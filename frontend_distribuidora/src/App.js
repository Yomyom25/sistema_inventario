import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './componentes/autenticacion/Login';
import { isAuthenticated, getCurrentUser, verifySession, logout } from './utilidades/auth';
import TablaProductos from './componentes/productos/TablaProductos';
import TablaUsuarios from './componentes/usuarios/TablaUsuarios';
import FormularioVentas from './componentes/ventas/FormularioVentas';
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

  const handleRegistrarVentas = () => {
    navigate('/ventas');
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
          onClick={handleRegistrarVentas}
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
          Registrar Ventas
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

// NUEVO COMPONENTE PARA LA PÁGINA DE VENTAS
const VentasPage = () => {
  // Datos de ejemplo para productos - en un caso real vendrían de una API
  const [productos, setProductos] = useState([
    { 
      id: 1, 
      codigo: 'PROD-001', 
      nombre: 'Laptop HP Pavilion', 
      descripcion: 'Laptop gaming 15.6"', 
      precioCompra: 500, 
      precioVenta: 800, 
      stock: 10 
    },
    { 
      id: 2, 
      codigo: 'PROD-002', 
      nombre: 'Mouse Inalámbrico', 
      descripcion: 'Mouse ergonómico RGB', 
      precioCompra: 15, 
      precioVenta: 30, 
      stock: 25 
    },
    { 
      id: 3, 
      codigo: 'PROD-003', 
      nombre: 'Teclado Mecánico', 
      descripcion: 'Teclado mecánico gaming', 
      precioCompra: 40, 
      precioVenta: 75, 
      stock: 15 
    },
    { 
      id: 4, 
      codigo: 'PROD-004', 
      nombre: 'Monitor 24"', 
      descripcion: 'Monitor Full HD 1080p', 
      precioCompra: 120, 
      precioVenta: 200, 
      stock: 8 
    },
  ]);

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
    
    // Aquí normalmente harías la llamada a la API para guardar la venta
    // y actualizar el stock en la base de datos
    
    alert(`✅ Venta registrada exitosamente!\nProducto: ${venta.producto.nombre}\nCantidad: ${venta.cantidad}\nTotal: $${venta.total}`);
  };

  const handleCancelarVenta = () => {
    console.log('Venta cancelada');
    // Puedes agregar lógica adicional aquí si es necesario
  };

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
          {/* NUEVA RUTA PARA VENTAS */}
          <Route 
            path="/ventas" 
            element={
              <ProtectedRoute>
                <VentasPage />
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