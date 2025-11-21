import React, { useState, useEffect } from 'react';
import './FormularioUsuario.css';

const FormularioUsuario = ({ usuarioEditar, onGuardar, onCancelar, usuariosExistentes }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'Empleado'
  });
  
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);

  // Si estamos editando, cargar los datos del usuario
  useEffect(() => {
    if (usuarioEditar) {
      setFormData({
        username: usuarioEditar.username,
        role: usuarioEditar.role,
        password: '',
        confirmPassword: ''
      });
    } else {
      // Si es nuevo usuario, resetear el formulario
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        role: 'Empleado'
      });
    }
  }, [usuarioEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario escribe
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleMostrarPassword = () => {
    setMostrarPassword(!mostrarPassword);
  };

  const toggleMostrarConfirmPassword = () => {
    setMostrarConfirmPassword(!mostrarConfirmPassword);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar nombre de usuario
    if (!formData.username.trim()) {
      nuevosErrores.username = 'El nombre de usuario es obligatorio';
    } else if (formData.username.length < 3) {
      nuevosErrores.username = 'El usuario debe tener al menos 3 caracteres';
    } else if (usuariosExistentes.some(u => 
      u.username === formData.username && 
      (!usuarioEditar || u.id !== usuarioEditar.id)
    )) {
      nuevosErrores.username = 'Este nombre de usuario ya está en uso';
    }

    // Validar contraseña (solo obligatoria para nuevo usuario)
    if (!usuarioEditar) {
      if (!formData.password) {
        nuevosErrores.password = 'La contraseña es obligatoria';
      } else if (formData.password.length < 6) {
        nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        nuevosErrores.password = 'Debe incluir mayúsculas, minúsculas y números';
      }

      // Validar confirmación de contraseña (solo para nuevo usuario)
      if (!formData.confirmPassword) {
        nuevosErrores.confirmPassword = 'Confirma tu contraseña';
      } else if (formData.password !== formData.confirmPassword) {
        nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
      }
    } else {
      // Para edición: si se llena una contraseña, validar ambas
      if (formData.password || formData.confirmPassword) {
        if (formData.password && formData.password.length < 6) {
          nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
        } else if (formData.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          nuevosErrores.password = 'Debe incluir mayúsculas, minúsculas y números';
        }

        if (formData.password !== formData.confirmPassword) {
          nuevosErrores.confirmPassword = 'Las contraseñas no coinciden';
        }
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setEnviando(true);

    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const usuario = {
        id: usuarioEditar ? usuarioEditar.id : Date.now(),
        username: formData.username.trim(),
        role: formData.role,
        activo: usuarioEditar ? usuarioEditar.activo : true,
        fechaCreacion: usuarioEditar ? usuarioEditar.fechaCreacion : new Date().toISOString().split('T')[0],
        nombre: usuarioEditar ? usuarioEditar.nombre : formData.username,
        email: usuarioEditar ? usuarioEditar.email : `${formData.username}@martin.com`
      };

      // Solo incluir password si se está creando o si se cambió en edición
      if (formData.password) {
        usuario.password = formData.password;
      }

      onGuardar(usuario);
      
      // Limpiar formulario si es nuevo usuario
      if (!usuarioEditar) {
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          role: 'Empleado'
        });
      }
      
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    } finally {
      setEnviando(false);
    }
  };

  const calcularSeguridadPassword = () => {
    if (!formData.password) return { nivel: 0, texto: '', color: '' };
    
    let puntaje = 0;
    if (formData.password.length >= 6) puntaje += 1;
    if (/[a-z]/.test(formData.password)) puntaje += 1;
    if (/[A-Z]/.test(formData.password)) puntaje += 1;
    if (/\d/.test(formData.password)) puntaje += 1;
    if (/[^A-Za-z0-9]/.test(formData.password)) puntaje += 1;

    const niveles = [
      { texto: 'Muy débil', color: '#ef4444' },
      { texto: 'Débil', color: '#f59e0b' },
      { texto: 'Regular', color: '#eab308' },
      { texto: 'Buena', color: '#84cc16' },
      { texto: 'Excelente', color: '#10b981' }
    ];

    return niveles[Math.min(puntaje - 1, 4)] || niveles[0];
  };

  const seguridad = calcularSeguridadPassword();

  return (
    <div className="pagina-usuario">
      <div className="formulario-usuario">
        <div className="formulario-header">
          <h2>{usuarioEditar ? '✏️ Editar Usuario' : '👥 Nuevo Usuario'}</h2>
          <p>Completa los campos para {usuarioEditar ? 'actualizar' : 'registrar'} el usuario</p>
        </div>

        <form onSubmit={handleSubmit} className="formulario-body">
          <div className="form-fila">
            <div className="form-grupo">
              <label htmlFor="username" className="form-label">
                Nombre de Usuario *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${errores.username ? 'error' : ''}`}
                placeholder="Ej: juan.perez"
                disabled={enviando}
              />
              {errores.username && <span className="mensaje-error">{errores.username}</span>}
            </div>

            <div className="form-grupo">
              <label htmlFor="role" className="form-label">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-input input-disabled"
                disabled={true}
              >
                <option value="Empleado">Empleado</option>
              </select>
              <small className="texto-ayuda">
                Solo se pueden crear usuarios con rol Empleado
              </small>
            </div>
          </div>

          {/* SECCIÓN DE CONTRASEÑAS - SIEMPRE VISIBLE */}
          <div className="seccion-contraseñas">
            <h3 className="titulo-seccion">
              {usuarioEditar ? 'Cambiar Contraseña' : 'Contraseña'}
            </h3>
            <p className="descripcion-seccion">
              {usuarioEditar 
                ? 'Deja vacío para mantener la contraseña actual' 
                : 'Establece una contraseña segura para el usuario'
              }
            </p>
            
            <div className="form-fila">
              <div className="form-grupo">
                <label htmlFor="password" className="form-label">
                  {usuarioEditar ? 'Nueva Contraseña' : 'Contraseña *'}
                </label>
                <div className="input-con-icono">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`form-input ${errores.password ? 'error' : ''}`}
                    placeholder={usuarioEditar ? "Dejar vacío para mantener actual" : "Mínimo 6 caracteres"}
                    disabled={enviando}
                  />
                  <button
                    type="button"
                    className="btn-visibilidad"
                    onClick={toggleMostrarPassword}
                    disabled={enviando}
                  >
                    {mostrarPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errores.password && <span className="mensaje-error">{errores.password}</span>}
                {formData.password && (
                  <div className="indicador-seguridad">
                    <div className="barra-seguridad">
                      <div 
                        className="nivel-seguridad" 
                        style={{
                          width: `${(seguridad.nivel + 1) * 20}%`,
                          backgroundColor: seguridad.color
                        }}
                      ></div>
                    </div>
                    <span className="texto-seguridad" style={{ color: seguridad.color }}>
                      Seguridad: {seguridad.texto}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-grupo">
                <label htmlFor="confirmPassword" className="form-label">
                  {usuarioEditar ? 'Confirmar Nueva Contraseña' : 'Confirmar Contraseña *'}
                </label>
                <div className="input-con-icono">
                  <input
                    type={mostrarConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errores.confirmPassword ? 'error' : ''}`}
                    placeholder="Repite la contraseña"
                    disabled={enviando}
                  />
                  <button
                    type="button"
                    className="btn-visibilidad"
                    onClick={toggleMostrarConfirmPassword}
                    disabled={enviando}
                  >
                    {mostrarConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                  </button>
                </div>
                {errores.confirmPassword && <span className="mensaje-error">{errores.confirmPassword}</span>}
              </div>
            </div>
          </div>

          <div className="requisitos-contraseña">
            <h4>Requisitos de contraseña:</h4>
            <ul>
              <li className={formData.password?.length >= 6 ? 'cumplido' : ''}>
                Mínimo 6 caracteres
              </li>
              <li className={/[a-z]/.test(formData.password) ? 'cumplido' : ''}>
                Al menos una minúscula
              </li>
              <li className={/[A-Z]/.test(formData.password) ? 'cumplido' : ''}>
                Al menos una mayúscula
              </li>
              <li className={/\d/.test(formData.password) ? 'cumplido' : ''}>
                Al menos un número
              </li>
            </ul>
          </div>

          <div className="formulario-acciones">
            <button
              type="button"
              className="btn-cancelar"
              onClick={onCancelar}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-guardar"
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <span className="loading-spinner"></span>
                  {usuarioEditar ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                usuarioEditar ? 'Actualizar Usuario' : 'Crear Usuario'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioUsuario;