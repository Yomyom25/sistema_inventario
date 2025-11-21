import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../utilidades/auth';
import FormularioUsuario from './FormularioUsuario';
import './TablaUsuarios.css';

const API_BASE_URL = 'http://localhost:5000/api';

const TablaUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modoFormulario, setModoFormulario] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [error, setError] = useState(null);
  const usuarioActual = getCurrentUser();

  // Cargar usuarios desde el backend
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Nota: Necesitarás crear este endpoint en tu backend
      const response = await fetch(`${API_BASE_URL}/usuarios`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo cargar los usuarios`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Convertir datos del backend al formato esperado
        const usuariosConvertidos = data.data.map(usuario => ({
          id: usuario.id_usuario,
          username: usuario.nombre_usuario,
          nombre: usuario.nombre_completo || usuario.nombre_usuario,
          email: usuario.email || `${usuario.nombre_usuario}@martin.com`,
          role: usuario.rol,
          activo: usuario.estado === 'activo',
          fechaCreacion: usuario.fecha_creacion
        }));
        setUsuarios(usuariosConvertidos);
      } else {
        throw new Error(data.error || 'Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setError(error.message);
      setUsuarios([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Validación de permisos
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

  const manejarGuardarUsuario = async (usuarioData) => {
    try {
      let response;
      let url;

      if (modoFormulario === 'crear') {
        // Crear nuevo usuario
        url = `${API_BASE_URL}/usuarios/nuevo`;
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            nombre_usuario: usuarioData.username,
            contraseña: usuarioData.password,
            rol: usuarioData.role,
            estado: 'activo'
          })
        });
      } else {
        // Editar usuario existente
        url = `${API_BASE_URL}/usuarios/${usuarioEditando.id}`;
        const datosActualizacion = {
          nombre_usuario: usuarioData.username,
          rol: usuarioData.role
        };

        // Solo incluir contraseña si se proporcionó una nueva
        if (usuarioData.password) {
          datosActualizacion.contraseña = usuarioData.password;
        }

        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(datosActualizacion)
        });
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudo guardar el usuario`);
      }

      const data = await response.json();

      if (data.success) {
        // Recargar usuarios desde el backend
        await cargarUsuarios();
        alert(`✅ Usuario ${modoFormulario === 'crear' ? 'creado' : 'actualizado'} exitosamente`);
        setModoFormulario(null);
        setUsuarioEditando(null);
      } else {
        throw new Error(data.error || 'Error al guardar usuario');
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert(`❌ Error al guardar usuario: ${error.message}`);
    }
  };

  const manejarCambiarEstado = async (usuario) => {
    const accion = usuario.activo ? 'desactivar' : 'activar';
    const nuevoEstado = usuario.activo ? 'inactivo' : 'activo';
    
    if (window.confirm(`¿Estás seguro de ${accion} al usuario: ${usuario.nombre}?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios/${usuario.id}/estado`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            estado: nuevoEstado
          })
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudo cambiar el estado`);
        }

        const data = await response.json();

        if (data.success) {
          // Recargar usuarios desde el backend
          await cargarUsuarios();
          alert(`✅ Usuario ${accion}do correctamente`);
        } else {
          throw new Error(data.error || 'Error al cambiar estado');
        }
      } catch (error) {
        console.error('Error cambiando estado:', error);
        alert(`❌ Error al cambiar estado: ${error.message}`);
      }
    }
  };

  // ========== RENDER PRINCIPAL ==========

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

  if (error) {
    return (
      <div className="tabla-usuarios-container">
        <div className="usuarios-header">
          <div className="header-info">
            <h1> Gestión de Usuarios</h1>
            <p>Administra los usuarios del sistema de Distribuidora Martin</p>
          </div>
        </div>
        <div className="sin-usuarios">
          <div className="sin-usuarios-icon">❌</div>
          <h3>Error de conexión</h3>
          <p>{error}</p>
          <button className="btn-nuevo-usuario" onClick={cargarUsuarios}>
            🔄 Reintentar
          </button>
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
                    Editar
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