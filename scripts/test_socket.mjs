import { io } from 'socket.io-client';

console.log('Connecting to https://nextgengames.gg...');
const socket = io('https://nextgengames.gg', {
  transports: ['polling', 'websocket'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('Connected! Socket ID:', socket.id);
  console.log('Emitting join_game_room for M9QI5F...');
  socket.emit('join_game_room', {
    roomId: 'M9QI5F',
    user: { id: 'test_user_1', username: 'Tester', avatar_color: '#00f0ff', avatar_token: 'hat' },
    isSpectator: false,
    mode: 'blitz'
  });
});

socket.on('game_state_update', (state) => {
  console.log('SUCCESS: Received game_state_update!');
  console.log('Room ID:', state.roomId);
  console.log('Status:', state.status);
  console.log('Players:', state.players);
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('Connect error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('FAIL: Timed out waiting for game_state_update');
  process.exit(1);
}, 8000);
