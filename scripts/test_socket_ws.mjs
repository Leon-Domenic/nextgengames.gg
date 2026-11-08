import { io } from 'socket.io-client';

console.log('Testing pure websocket transport...');
const socket = io('https://nextgengames.gg', {
  transports: ['websocket'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('PURE WEBSOCKET CONNECTED! Socket ID:', socket.id);
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('PURE WEBSOCKET ERROR:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('TIMEOUT');
  process.exit(1);
}, 5000);
