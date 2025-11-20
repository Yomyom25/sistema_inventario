import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../comunes/Logo';
import '../../estilos/Login.css';
import { login } from '../../utilidades/auth';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!credentials.username && !credentials.password) {
      setError('❌ Por favor ingresa usuario y contraseña');
      setIsLoading(false);
      return;
    }

    if (!credentials.username) {
      setError('❌ Por favor ingresa tu usuario');
      setIsLoading(false);
      return;
    }

    if (!credentials.password) {
      setError('❌ Por favor ingresa tu contraseña');
      setIsLoading(false);
      return;
    }

    try {
      const user = await login(credentials);
      
      if (user) {
        if (user.role === 'Administrador') {
          navigate('/admin-dashboard');
        } else if (user.role === 'Empleado') {
          navigate('/employee-dashboard');
        }
      }
    } catch (error) {
      if (error.message === 'usuario no encontrado') {
        setError('❌ El usuario no existe en el sistema');
      } else if (error.message === 'contraseña incorrecta') {
        setError('❌ La contraseña es incorrecta');
      } else {
        setError('❌ Error al iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <Logo />
        
        <div className="system-text">
          Sistema de Gestión
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Usuario
            </label>
            <div className="form-input-container">
              {/* ICONO USUARIO */}
              <i className="fa-solid fa-user form-input-icon"></i>

              <input
                type="text"
                id="username"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="form-input"
                placeholder="Ingresa tu usuario"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="form-input-container">
              {/* ICONO CANDADO */}
              <i className="fa-solid fa-lock form-input-icon"></i>

              <input
                type="password"
                id="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Ingresa tu contraseña"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>¿Necesitas ayuda? <a href="#contact">Contacta al administrador</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;