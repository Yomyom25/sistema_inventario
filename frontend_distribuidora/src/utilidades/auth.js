// auth.js - VERSIÓN MEJORADA CON MANEJO DE ERRORES

const API_URL = 'http://localhost:5000/api';

// Login real con el backend
export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error en el login');
    }

    if (data.success) {
      localStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    } else {
      throw new Error(data.error || 'Error en el login');
    }
  } catch (error) {
    console.error('Error en login:', error);
    throw error;
  }
};

// Verificar sesión con el backend
export const verifySession = async () => {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'GET',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
    }
    
    // Si la respuesta no es exitosa, limpiar sesión
    localStorage.removeItem('user');
    return null;
  } catch (error) {
    console.error('Error verificando sesión:', error);
    // En caso de error de conexión, mantener la sesión local
    return getCurrentUser();
  }
};

// Logout
export const logout = async () => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error en logout:', error);
  } finally {
    localStorage.removeItem('user');
  }
};

// Obtener usuario actual
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Verificar si está autenticado
export const isAuthenticated = () => {
  return !!getCurrentUser();
};

// Función para hacer requests autenticados
export const authFetch = async (url, options = {}) => {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_URL}${url}`, config);
    
    if (response.status === 401) {
      logout();
      window.location.href = '/login';
      throw new Error('Sesión expirada');
    }

    return response;
  } catch (error) {
    console.error('Error en authFetch:', error);
    throw error;
  }
};