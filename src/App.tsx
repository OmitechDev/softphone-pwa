import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Softphone from './components/Softphone';
import { User } from './interfaces/User';
import { getCurrentUser, logout } from './services/api';
import './index.css';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Verificar si hay un usuario en el localStorage al cargar la app
  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  // Manejar el login exitoso
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  // Manejar el logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="softphone-container">
        {user ? (
          <Softphone user={user} onLogout={handleLogout} />
        ) : (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}
      </div>
    </div>
  );
};

export default App;