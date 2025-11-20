// Simulación de base de datos de usuarios
const users = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'Administrador',
    name: 'Administrador Principal'
  },
  {
    username: 'empleado',
    password: 'empleado123',
    role: 'Empleado',
    name: 'Juan Pérez'
  }
];

// Simular llamada a API
export const login = async (credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Verificar si el usuario existe
      const userExists = users.find(u => u.username === credentials.username);
      
      if (!userExists) {
        reject(new Error('Usuario no encontrado'));
        return;
      }
      
      // Verificar si la contraseña es correcta
      const user = users.find(u => 
        u.username === credentials.username && 
        u.password === credentials.password
      );
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        resolve(user);
      } else {
        reject(new Error('Contraseña incorrecta'));
      }
    }, 1000);
  });
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!getCurrentUser();
};