'use client';

import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    socket = io({
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}
