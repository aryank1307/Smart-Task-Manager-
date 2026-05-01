import React, { useEffect, useState } from 'react';
import AuthForm from './components/AuthForm';
import TaskManager from './components/TaskManager';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  const onAuthSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <main className="container">
      <h1>Smart Task Manager</h1>
      {!token ? (
        <AuthForm apiUrl={API_URL} onAuthSuccess={onAuthSuccess} />
      ) : (
        <TaskManager apiUrl={API_URL} token={token} user={user} onLogout={logout} />
      )}
    </main>
  );
}