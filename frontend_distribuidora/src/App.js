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

// DASHBOARD VISUAL PARA ADMINISTRADOR
const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [dashboardData, setDashboardData] = useState({
    totalProductos: 156,
    usuariosActivos: 24,
    ventasHoy: 18,
    ingresosHoy: 2450,
    stockBajo: 7
  });

  const adminModules = [
    {
      titulo: 'Gestión de Productos',
      descripcion: 'Administrar inventario y categorías',
      icono: '📦',
      ruta: '/productos',
      color: '#1e40af'
    },
    {
      titulo: 'Gestión de Usuarios',
      descripcion: 'Administrar usuarios y permisos',
      icono: '👥',
      ruta: '/usuarios',
      color: '#059669'
    },
    {
      titulo: 'Registro de Ventas',
      descripcion: 'Registrar nuevas transacciones',
      icono: '💰',
      ruta: '/ventas',
      color: '#7c3aed'
    },
    {
      titulo: 'Historial de Ventas',
      descripcion: 'Consultar reportes de ventas',
      icono: '📊',
      ruta: '/historial-ventas',
      color: '#dc2626'
    },
    {
      titulo: 'Reportes',
      descripcion: 'Generar reportes detallados',
      icono: '📈',
      ruta: '/reportes',
      color: '#d97706'
    }
  ];

  const handleModuleClick = (ruta) => {
    navigate(ruta);
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">¡Bienvenido, {user?.username || 'Admin'}!</h1>
          <p className="dashboard-subtitle">Panel de control - Administrador</p>
        </div>
        <button 
          onClick={handleCerrarSesion}
          className="logout-button"
        >
          <i className="fas fa-sign-out-alt"></i>
          Cerrar Sesión
        </button>
      </div>

      {/* Resumen General - SOLO PARA ADMIN */}
      <div className="resumen-section">
        <h2 className="resumen-title">Resumen General</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
              <i className="fas fa-boxes"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.totalProductos}</div>
              <div className="stat-label">Total Productos</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.usuariosActivos}</div>
              <div className="stat-label">Usuarios Activos</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.ventasHoy}</div>
              <div className="stat-label">Ventas Hoy</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">${dashboardData.ingresosHoy}</div>
              <div className="stat-label">Ingresos Hoy</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.stockBajo}</div>
              <div className="stat-label">Stock Bajo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos del Sistema - ADMIN */}
      <div className="modules-section">
        <h2 className="section-title">Módulos del Sistema</h2>
        <p className="section-subtitle">
          Accede rápidamente a las funcionalidades del sistema
        </p>
        
        <div className="modules-grid">
          {adminModules.map((module, index) => (
            <div 
              key={index}
              className="module-card"
              onClick={() => handleModuleClick(module.ruta)}
              style={{ borderLeftColor: module.color }}
            >
              <div className="module-icon" style={{ color: module.color }}>
                {module.icono}
              </div>
              <div className="module-content">
                <h3 className="module-title">{module.titulo}</h3>
                <p className="module-description">{module.descripcion}</p>
              </div>
              <div className="module-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información rápida */}
      <div className="quick-info">
        <div className="info-card">
          <i className="fas fa-sync-alt" style={{ color: '#059669' }}></i>
          <div>
            <h4>Actualizado hace 5 min</h4>
            <p>La información se actualiza automáticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// DASHBOARD VISUAL PARA EMPLEADO - SOLO VENTAS
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [dashboardData, setDashboardData] = useState({
    ventasHoy: 12,
    ingresosHoy: 1850,
    comisionHoy: 185
  });

  const employeeModules = [
    {
      titulo: 'Registro de Ventas',
      descripcion: 'Registrar nuevas transacciones',
      icono: '💰',
      ruta: '/ventas',
      color: '#1e40af'
    },
    {
      titulo: 'Mis Ventas',
      descripcion: 'Consultar mi historial de ventas',
      icono: '📊',
      ruta: '/historial-ventas',
      color: '#059669'
    }
  ];

  const handleModuleClick = (ruta) => {
    navigate(ruta);
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">¡Bienvenido, {user?.username || 'Empleado'}!</h1>
          <p className="dashboard-subtitle">Panel de ventas - Empleado</p>
        </div>
        <button 
          onClick={handleCerrarSesion}
          className="logout-button"
        >
          <i className="fas fa-sign-out-alt"></i>
          Cerrar Sesión
        </button>
      </div>

      {/* Resumen General - SOLO VENTAS PARA EMPLEADO */}
      <div className="resumen-section">
        <h2 className="resumen-title">Mi Resumen de Ventas</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
              <i className="fas fa-shopping-cart"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboardData.ventasHoy}</div>
              <div className="stat-label">Ventas Hoy</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <i className="fas fa-dollar-sign"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">${dashboardData.ingresosHoy}</div>
              <div className="stat-label">Ingresos Hoy</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">${dashboardData.comisionHoy}</div>
              <div className="stat-label">Comisión Hoy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos del Sistema - SOLO VENTAS */}
      <div className="modules-section">
        <h2 className="section-title">Módulos de Ventas</h2>
        <p className="section-subtitle">
          Accede a las funcionalidades de ventas
        </p>
        
        <div className="modules-grid">
          {employeeModules.map((module, index) => (
            <div 
              key={index}
              className="module-card"
              onClick={() => handleModuleClick(module.ruta)}
              style={{ borderLeftColor: module.color }}
            >
              <div className="module-icon" style={{ color: module.color }}>
                {module.icono}
              </div>
              <div className="module-content">
                <h3 className="module-title">{module.titulo}</h3>
                <p className="module-description">{module.descripcion}</p>
              </div>
              <div className="module-arrow">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información rápida */}
      <div className="quick-info">
        <div className="info-card">
          <i className="fas fa-sync-alt" style={{ color: '#059669' }}></i>
          <div>
            <h4>Actualizado hace 5 min</h4>
            <p>La información se actualiza automáticamente</p>
          </div>
        </div>
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
  // Crear usuario automáticamente si no existe
  useEffect(() => {
    if (!localStorage.getItem('currentUser')) {
      const defaultUser = {
        username: 'admin',
        role: 'Administrador',
        email: 'admin@distribuidora.com',
        id: 1
      };
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
      console.log('✅ Usuario admin creado automáticamente');
    }
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* DASHBOARDS VISUALES ACTUALIZADOS */}
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
          
          {/* MÓDULOS DEL SISTEMA */}
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
          
          {/* RUTA ADICIONAL PARA REPORTES */}
          <Route 
            path="/reportes" 
            element={
              <ProtectedRoute>
                <div className="page-container">
                  <h1>Reportes y Estadísticas</h1>
                  <p>Módulo en desarrollo - Próximamente disponible</p>
                </div>
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