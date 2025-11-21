import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../utilidades/auth';
import FormularioUsuario from './FormularioUsuario';
import './TablaUsuarios.css';

// Datos de ejemplo de usuarios
const usuariosEjemplo = [
  {
    id: 1,
    username: 'admin',
    nombre: 'Administrador Principal',
    email: 'admin@martin.com',
    role: 'Administrador',
    activo: true,
    fechaCreacion: '2024-01-15'
  },
  {
    id: 2,
    username: 'empleado',
    nombre: 'Juan Pérez',
    email: 'juan@martin.com',
    role: 'Empleado',
    activo: true,
    fechaCreacion: '2024-01-20'
  },
  {
    id: 3,
    username: 'maria.garcia',
    nombre: 'María García',
    email: 'maria@martin.com',
    role: 'Empleado',
    activo: false,
    fechaCreacion: '2024-02-01'
  },
  {
    id: 4,
    username: 'carlos.lopez',
    nombre: 'Carlos López',
    email: 'carlos@martin.com',
    role: 'Empleado',
    activo: true,
    fechaCreacion: '2024-02-10'
  }
];

const TablaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modoFormulario, setModoFormulario] = useState(null); // 'crear' o 'editar'
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const usuarioActual = getCurrentUser();

  // ✅ MOVER useEffect ANTES de cualquier return condicional
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setUsuarios(usuariosEjemplo);
      setCargando(false);
    }, 1000);
  }, []);

  // ✅ AHORA SÍ la validación de permisos DESPUÉS de los hooks
  if (usuarioActual?.role !== 'Administrador') {
    return (
      <div className="acceso-denegado">
        <h2>🚫 Acceso Denegado</h2>
        <p>No tienes permisos para acceder a la gestión de usuarios.</p>
        <p>Solo los administradores pueden ver esta sección.</p>
      </div>
    );
  }

  // Filtrar usuarios por búsqueda
  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.username.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const manejarBusqueda = (e) => {
    setBusqueda(e.target.value);
  };

  // ========== FUNCIONES PARA FORMULARIO ==========

  const manejarNuevoUsuario = () => {
    setModoFormulario('crear');
    setUsuarioEditando(null);
  };

  const manejarEditar = (usuario) => {
    setModoFormulario('editar');
    setUsuarioEditando(usuario);
  };

  const manejarCancelarFormulario = () => {
    setModoFormulario(null);
    setUsuarioEditando(null);
  };

  const manejarGuardarUsuario = (usuarioData) => {
    if (modoFormulario === 'crear') {
      // Crear nuevo usuario
      const nuevoUsuario = {
        ...usuarioData,
        id: Date.now(),
        activo: true,
        fechaCreacion: new Date().toISOString().split('T')[0],
        nombre: usuarioData.username, // Como no hay campo nombre, usamos username
        email: `${usuarioData.username}@martin.com` // Generar email automático
      };
      setUsuarios(prev => [nuevoUsuario, ...prev]);
      
      // Mostrar mensaje de éxito
      alert(`✅ Usuario "${usuarioData.username}" creado exitosamente`);
      
    } else if (modoFormulario === 'editar') {
      // Editar usuario existente
      const usuariosActualizados = usuarios.map(u =>
        u.id === usuarioEditando.id 
          ? { 
              ...u, 
              username: usuarioData.username,
              role: usuarioData.role,
              nombre: usuarioData.username, // Actualizar nombre también
              // Solo actualizar password si se proporcionó uno nuevo
              ...(usuarioData.password && { password: usuarioData.password })
            }
          : u
      );
      setUsuarios(usuariosActualizados);
      
      // Mostrar mensaje de éxito
      alert(`✅ Usuario "${usuarioData.username}" actualizado exitosamente`);
    }

    // Cerrar formulario
    setModoFormulario(null);
    setUsuarioEditando(null);
  };

  const manejarCambiarEstado = (usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    
    if (window.confirm(`¿Estás seguro de ${accion} al usuario: ${usuario.nombre}?`)) {
      const usuariosActualizados = usuarios.map(u =>
        u.id === usuario.id ? { ...u, activo: !u.activo } : u
      );
      setUsuarios(usuariosActualizados);
      
      alert(`✅ Usuario ${accion}do correctamente`);
    }
  };

  // ========== RENDER PRINCIPAL ==========

  // Si estamos en modo formulario, mostrar el formulario
  if (modoFormulario) {
    return (
      <FormularioUsuario
        usuarioEditar={usuarioEditando}
        onGuardar={manejarGuardarUsuario}
        onCancelar={manejarCancelarFormulario}
        usuariosExistentes={usuarios}
      />
    );
  }

  if (cargando) {
    return (
      <div className="tabla-usuarios-container">
        <div className="cargando">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tabla-usuarios-container">
      {/* Header con título */}
      <div className="usuarios-header">
        <div className="header-info">
          <h1>👥 Gestión de Usuarios</h1>
          <p>Administra los usuarios del sistema de Distribuidora Martin</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{usuarios.length}</span>
            <span className="stat-label">Usuarios Totales</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{usuarios.filter(u => u.activo).length}</span>
            <span className="stat-label">Usuarios Activos</span>
          </div>
        </div>
      </div>

      {/* Barra de herramientas */}
      <div className="herramientas-usuarios">
        <div className="busqueda-container">
          <div className="busqueda-wrapper">
            <span className="busqueda-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar usuarios por nombre o usuario..."
              value={busqueda}
              onChange={manejarBusqueda}
              className="busqueda-input"
            />
          </div>
          <span className="resultados-busqueda">
            {usuariosFiltrados.length} usuarios encontrados
          </span>
        </div>
        <button 
          className="btn-nuevo-usuario"
          onClick={manejarNuevoUsuario}
        >
          <span className="btn-icon">+</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla de usuarios */}
      <div className="tabla-container">
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(usuario => (
              <tr key={usuario.id} className="fila-usuario">
                <td className="usuario-info">
                  <div className="usuario-principal">
                    <strong>{usuario.username}</strong>
                  </div>
                  <div className="usuario-secundario">
                    {usuario.nombre}
                  </div>
                  <div className="usuario-email">
                    {usuario.email}
                  </div>
                </td>
                <td className="rol">
                  <span className={`rol-badge ${usuario.role.toLowerCase()}`}>
                    {usuario.role}
                  </span>
                </td>
                <td className="estado">
                  <span className={`estado-badge ${usuario.activo ? 'activo' : 'inactivo'}`}>
                    {usuario.activo ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                </td>
                <td className="acciones">
                  <button 
                    className="btn-editar"
                    onClick={() => manejarEditar(usuario)}
                    title="Editar usuario"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    className={`btn-estado ${usuario.activo ? 'desactivar' : 'activar'}`}
                    onClick={() => manejarCambiarEstado(usuario)}
                    title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {usuario.activo ? '🚫 Desactivar' : '✅ Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mensaje si no hay usuarios */}
        {usuariosFiltrados.length === 0 && (
          <div className="sin-usuarios">
            <div className="sin-usuarios-icon">👥</div>
            <h3>No se encontraron usuarios</h3>
            <p>{busqueda ? 'Prueba con otros términos de búsqueda' : 'No hay usuarios registrados en el sistema'}</p>
            {!busqueda && (
              <button className="btn-nuevo-usuario" onClick={manejarNuevoUsuario}>
                + Agregar Primer Usuario
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TablaUsuarios;