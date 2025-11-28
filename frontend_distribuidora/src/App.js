import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './componentes/autenticacion/Login';
import { isAuthenticated, getCurrentUser, logout, authFetch } from './utilidades/auth';
import TablaProductos from './componentes/productos/TablaProductos';
import TablaUsuarios from './componentes/usuarios/TablaUsuarios';
import FormularioVentas from './componentes/ventas/FormularioVentas';
import HistorialVentas from './componentes/ventas/HistorialVentas';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Componente wrapper para actualización automática
const AutoRefreshWrapper = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return React.cloneElement(children, { key: refreshCount });
};

// DASHBOARD VISUAL PARA ADMINISTRADOR
const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [dashboardData, setDashboardData] = useState({
    totalProductos: 0,
    usuariosActivos: 0,
    ventasHoy: 0,
    ingresosHoy: 0,
    stockBajo: 0
  });
  const [loading, setLoading] = useState(true);

  // Obtener datos reales del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Obtener total productos
        const productosRes = await authFetch('/productos');
        const productosData = await productosRes.json();
        
        // Obtener usuarios activos
        const usuariosRes = await authFetch('/usuarios');
        const usuariosData = await usuariosRes.json();
        
        // Obtener ventas de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const ventasRes = await authFetch(`/ventas/historial?fechaDesde=${hoy}`);
        const ventasData = await ventasRes.json();

        // Calcular datos
        const totalProductos = productosData.data?.length || 0;
        const usuariosActivos = usuariosData.data?.filter(u => u.estado === 'activo').length || 0;
        const ventasHoy = ventasData.data?.length || 0;
        const ingresosHoy = ventasData.data?.reduce((sum, venta) => sum + parseFloat(venta.total), 0) || 0;
        const stockBajo = productosData.data?.filter(p => p.stock_actual < 10).length || 0;

        setDashboardData({
          totalProductos,
          usuariosActivos,
          ventasHoy,
          ingresosHoy,
          stockBajo
        });
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
  ];

  const handleModuleClick = (ruta) => {
    navigate(ruta);
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando datos del dashboard...</p>
      </div>
    );
  }

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
            <h4>Actualizado</h4>
            <p>La información se actualiza automáticamente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// DASHBOARD VISUAL PARA EMPLEADO - SOLO VENTAS (VERSIÓN CORREGIDA)
const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  
  const [dashboardData, setDashboardData] = useState({
    ventasHoy: 0,
    ingresosHoy: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // FIX: Extract username for dependency stability
  const username = user?.username;

  useEffect(() => {
    let mounted = true;

    const fetchEmployeeData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const hoy = new Date().toISOString().split('T')[0];
        const ventasRes = await authFetch(`/ventas/historial?fechaDesde=${hoy}`);
        
        if (!mounted) return;

        if (!ventasRes.ok) {
          throw new Error(`Error ${ventasRes.status}: ${ventasRes.statusText}`);
        }
        
        const ventasData = await ventasRes.json();

        if (!ventasData.success) {
          throw new Error(ventasData.error || 'Error al cargar ventas');
        }

        // Filtrar ventas del empleado actual
        const misVentasHoy = ventasData.data?.filter(venta => 
          venta.usuario?.nombre === username
        ) || [];

        const ventasHoy = misVentasHoy.length;
        const ingresosHoy = misVentasHoy.reduce((sum, venta) => {
          const total = parseFloat(venta.total) || 0;
          return sum + total;
        }, 0);

        setDashboardData({
          ventasHoy,
          ingresosHoy
        });
      } catch (error) {
        console.error('Error cargando datos del empleado:', error);
        if (mounted) {
          setError(error.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (username) {
      fetchEmployeeData();
    } else {
      setLoading(false);
      setError('No se encontró información del usuario');
    }

    return () => {
      mounted = false;
    };
  }, [username]); // Dependency is now stable primitive

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

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    // Forzar recarga llamando al efecto nuevamente
    const hoy = new Date().toISOString().split('T')[0];
    authFetch(`/ventas/historial?fechaDesde=${hoy}`)
      .then(response => response.json())
      .then(ventasData => {
        if (ventasData.success) {
          const misVentasHoy = ventasData.data?.filter(venta => 
            venta.usuario?.nombre === user?.username
          ) || [];

          const ventasHoy = misVentasHoy.length;
          const ingresosHoy = misVentasHoy.reduce((sum, venta) => {
            const total = parseFloat(venta.total) || 0;
            return sum + total;
          }, 0);

          setDashboardData({ ventasHoy, ingresosHoy });
        }
      })
      .catch(error => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Mostrar error
  if (error) {
    return (
      <div className="dashboard-container">
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

        <div className="error-container">
          <h2>Error al cargar datos</h2>
          <p>{error}</p>
          <button 
            onClick={handleRetry}
            className="logout-button"
            style={{ background: '#059669' }}
          >
            <i className="fas fa-redo"></i>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Mostrar loading
  if (loading) {
    return (
      <div className="dashboard-container">
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

        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando datos de ventas...</p>
        </div>
      </div>
    );
  }

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
              <div className="stat-value">${dashboardData.ingresosHoy.toFixed(2)}</div>
              <div className="stat-label">Ingresos en ventas de hoy</div>
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
            <h4>Actualizado</h4>
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
      const response = await authFetch('/productos');
      const data = await response.json();
      
      if (data.success) {
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

  const handleGuardarVenta = async (venta) => {
    try {
      const response = await authFetch('/ventas', {
        method: 'POST',
        body: JSON.stringify({
          productoId: venta.productoId,
          cantidad: venta.cantidad,
          fecha: venta.fecha,
          motivo: venta.motivo
        })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Venta registrada exitosamente:', data);
        
        // Actualizar stock del producto en el estado local
        setProductos(prev => 
          prev.map(p => 
            p.id === venta.productoId 
              ? { ...p, stock: p.stock - venta.cantidad }
              : p
          )
        );

        // Calcular total para el alert
        const producto = productos.find(p => p.id === venta.productoId);
        const total = producto ? (producto.precioVenta * venta.cantidad).toFixed(2) : '0.00';
        const nombreProducto = producto ? producto.nombre : 'Desconocido';

        alert(`✅ Venta registrada exitosamente
Producto: ${nombreProducto}
Cantidad: ${venta.cantidad}
Total: $${total}`);
        return true;
      } else {
        console.error('Error al registrar venta:', data.error);
        alert(`Error: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión al registrar la venta');
      return false;
    }
  };

  const handleCancelarVenta = () => {
    console.log('Venta cancelada');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando productos...</p>
      </div>
    );
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

const ProtectedRoute = ({ children, requiredRole }) => {
  const [authStatus, setAuthStatus] = useState('checking');

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isAuthenticated()) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        const response = await authFetch('/auth/verify');
        
        if (response.ok) {
          const data = await response.json();
          
          // Verificar rol si se requiere
          if (requiredRole && data.user.role !== requiredRole) {
            setAuthStatus('unauthorized');
            return;
          }
          
          setAuthStatus('authenticated');
        } else {
          setAuthStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Error verificando autenticación:', error);
        setAuthStatus('unauthenticated');
      }
    };

    checkAuthentication();
  }, [requiredRole]);

  if (authStatus === 'checking') {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'unauthorized') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h2>Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta página.</p>
        <button 
          onClick={() => window.history.back()}
          className="logout-button"
          style={{ marginTop: '1rem' }}
        >
          Volver
        </button>
      </div>
    );
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
          
          {/* DASHBOARDS VISUALES ACTUALIZADOS */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requiredRole="Administrador">
                <AutoRefreshWrapper>
                  <AdminDashboard />
                </AutoRefreshWrapper>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute requiredRole="Empleado">
                <EmployeeDashboard /> {/* Sin AutoRefreshWrapper */}
              </ProtectedRoute>
            } 
          />
          
          {/* MÓDULOS DEL SISTEMA */}
          <Route 
            path="/productos" 
            element={
              <ProtectedRoute requiredRole="Administrador">
                <ProductosPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/usuarios" 
            element={
              <ProtectedRoute requiredRole="Administrador">
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
              <ProtectedRoute requiredRole="Administrador">
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