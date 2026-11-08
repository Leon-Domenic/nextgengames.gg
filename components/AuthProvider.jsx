'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket';

const AuthContext = createContext({
  user: null,
  loading: true,
  onlineUsers: [],
  login: async () => {},
  register: async () => {},
  playAsGuest: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [incomingInvite, setIncomingInvite] = useState(null);

  useEffect(() => {
    // Check session
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Sync with Socket.io for presence & party invites
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('register_presence', { userId: user.id, username: user.username });

    const handlePresence = (list) => {
      setOnlineUsers(list);
    };

    const handleInvite = (inviteData) => {
      setIncomingInvite(inviteData);
    };

    socket.on('presence_update', handlePresence);
    socket.on('party_invite_received', handleInvite);

    return () => {
      socket.off('presence_update', handlePresence);
      socket.off('party_invite_received', handleInvite);
    };
  }, [user]);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setUser(data.user);
    return data.user;
  };

  const register = async (username, password, avatar_color, avatar_token) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, avatar_color, avatar_token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setUser(data.user);
    return data.user;
  };

  const playAsGuest = async (customName = null) => {
    const res = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: customName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Guest login failed');
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  const updateProfile = async (avatar_color, avatar_token) => {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_color, avatar_token }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      setUser(prev => ({ ...prev, ...data.user }));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      onlineUsers,
      login,
      register,
      playAsGuest,
      logout,
      updateProfile,
    }}>
      {children}

      {/* Global Party Invite Toast */}
      {incomingInvite && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: 'rgba(16, 20, 29, 0.95)',
          border: '2px solid #00f0ff',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
          color: '#f0f4f8',
          maxWidth: '360px',
          backdropFilter: 'blur(10px)',
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎮</span>
            <strong style={{ color: '#00f0ff', fontSize: '15px' }}>Party Invitation!</strong>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#94a3b8' }}>
            <strong style={{ color: '#fff' }}>{incomingInvite.hostName}</strong> invited you to play{' '}
            <strong style={{ color: '#00f0ff' }}>{incomingInvite.gameName}</strong>!
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href={`/browsergames/board-brawl/${incomingInvite.roomId}`}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: '#00f0ff',
                color: '#060709',
                fontWeight: 700,
                textAlign: 'center',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '13px',
              }}
              onClick={() => setIncomingInvite(null)}
            >
              Accept & Join
            </a>
            <button
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
              onClick={() => setIncomingInvite(null)}
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
