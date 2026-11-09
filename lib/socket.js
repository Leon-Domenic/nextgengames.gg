'use client';

import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    socket = io({
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });
  }
  if (typeof window !== 'undefined') {
    window.__ngg_socket = socket;
  }
  return socket;
}
