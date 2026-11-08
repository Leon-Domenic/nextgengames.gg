import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { BoardBrawlGame } from './lib/board-brawl/engine.js';
import db from './lib/db.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-memory active game rooms & user presence
const activeGames = new Map(); // roomId -> BoardBrawlGame instance
const onlineUsers = new Map(); // userId -> { socketId, username, status: 'online'|'lobby'|'playing', roomId }

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on('connection', (socket) => {
    let currentUserId = null;
    let currentRoomId = null;

    console.log(`[Socket.io] Client connected: ${socket.id} (transport: ${socket.conn.transport.name})`);

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.io] Client disconnected: ${socket.id} (reason: ${reason})`);
      if (currentUserId && onlineUsers.has(currentUserId)) {
        onlineUsers.delete(currentUserId);
        io.emit('presence_update', Array.from(onlineUsers.entries()).map(([uId, data]) => ({
          userId: uId,
          username: data.username,
          status: data.status,
          roomId: data.roomId,
        })));
      }
    });

    // 1. User Online Presence
    socket.on('register_presence', ({ userId, username }) => {
      if (!userId) return;
      currentUserId = userId;
      onlineUsers.set(userId, {
        socketId: socket.id,
        username,
        status: 'online',
        roomId: null,
      });

      // Broadcast presence update
      io.emit('presence_update', Array.from(onlineUsers.entries()).map(([uId, data]) => ({
        userId: uId,
        username: data.username,
        status: data.status,
        roomId: data.roomId,
      })));
    });

    // 2. Friend Party Invite
    socket.on('invite_friend', ({ targetUserId, roomId, hostName, gameName }) => {
      const target = onlineUsers.get(targetUserId);
      if (target && target.socketId) {
        io.to(target.socketId).emit('party_invite_received', {
          roomId,
          hostName,
          gameName: gameName || 'Board Brawl',
        });
      }
    });

    // 3. Request Current Game State (Health check / re-sync)
    socket.on('request_game_state', ({ roomId }) => {
      if (!roomId) return;
      const game = activeGames.get(roomId);
      if (game) {
        socket.emit('game_state_update', game.getPublicState());
      }
    });

    // 4. Join / Create Board Brawl Room
    socket.on('join_game_room', ({ roomId, user, isSpectator = false, mode = 'blitz' }) => {
      if (!roomId) return;
      currentRoomId = roomId;
      socket.join(`game_${roomId}`);

      console.log(`[Game Room] Socket ${socket.id} joined room #${roomId} as ${user?.username || 'Guest'}`);

      let game = activeGames.get(roomId);
      if (!game) {
        game = new BoardBrawlGame(roomId, { mode });
        activeGames.set(roomId, game);

        // Wire game engine callbacks to Socket.io broadcasts
        game.setCallbacks({
          onStateChange: (state) => {
            io.to(`game_${roomId}`).emit('game_state_update', state);
          },
          onTomatoHit: (data) => {
            io.to(`game_${roomId}`).emit('tomato_impact_event', data);
            // Record stats in DB
            try {
              db.prepare('UPDATE player_stats SET tomatoes_thrown = tomatoes_thrown + 1 WHERE user_id = ?').run(data.fromPlayerId);
              db.prepare('UPDATE player_stats SET tomatoes_hit = tomatoes_hit + 1 WHERE user_id = ?').run(data.targetPlayerId);
            } catch (e) {}
          },
          onDiceRoll: (data) => {
            io.to(`game_${roomId}`).emit('dice_rolled_event', data);
          },
          onChatMessage: (msg) => {
            io.to(`game_${roomId}`).emit('chat_message_event', msg);
          },
          onWin: (winData) => {
            io.to(`game_${roomId}`).emit('game_over_event', winData);
            // Update match stats in DB
            try {
              if (winData.winner && !winData.winner.isBot) {
                db.prepare('UPDATE player_stats SET wins = wins + 1, matches_played = matches_played + 1 WHERE user_id = ?').run(winData.winner.id);
              }
              winData.players.forEach(p => {
                if (!p.isBot && p.id !== winData.winner?.id) {
                  db.prepare('UPDATE player_stats SET matches_played = matches_played + 1 WHERE user_id = ?').run(p.id);
                }
              });
            } catch (e) {}
          },
        });
      }

      if (!isSpectator && user) {
        game.addPlayer(user, false);
      }

      // Update presence
      if (currentUserId && onlineUsers.has(currentUserId)) {
        onlineUsers.get(currentUserId).status = 'playing';
        onlineUsers.get(currentUserId).roomId = roomId;
        io.emit('presence_update', Array.from(onlineUsers.entries()).map(([uId, data]) => ({
          userId: uId,
          username: data.username,
          status: data.status,
          roomId: data.roomId,
        })));
      }

      // Send initial state to the joining client and broadcast to the room
      const publicState = game.getPublicState();
      socket.emit('game_state_update', publicState);
      io.to(`game_${roomId}`).emit('game_state_update', publicState);
    });

    // 4. Game Actions
    socket.on('game_action', ({ roomId, action, payload }) => {
      const game = activeGames.get(roomId);
      if (!game) return;

      if (action === 'start_game') {
        game.startGame();
      } else if (action === 'add_bot') {
        const botCount = game.players.filter(p => p.isBot).length + 1;
        const botNames = ['BaronVonCash', 'Apex-9', 'AxelNitro', 'CaptainMonaco', 'AstroVance', 'LordQuackers', 'HodlKing', 'QueenVictoria', 'Knuckles', 'MadameSolana'];
        const botTokens = ['hat', 'robot', 'car', 'yacht', 'rocket', 'duck', 'diamond', 'crown', 'brawler', 'mystic'];
        const botColors = ['#00f0ff', '#00ff88', '#ff3344', '#38bdf8', '#a855f7', '#eab308', '#06b6d4', '#f59e0b', '#ef4444', '#ec4899'];

        game.addPlayer({
          id: `bot_${Date.now()}_${botCount}`,
          username: botNames[(botCount - 1) % botNames.length],
          avatar_color: botColors[(botCount - 1) % botColors.length],
          avatar_token: botTokens[(botCount - 1) % botTokens.length],
        }, true);
      } else if (action === 'roll_dice') {
        game.rollDice(payload.playerId);
      } else if (action === 'buy_city') {
        game.buyCity(payload.playerId, payload.tileId, payload.level || 1);
      } else if (action === 'buyout_city') {
        game.buyoutCity(payload.playerId, payload.tileId);
      } else if (action === 'upgrade_city') {
        game.upgradeCity(payload.playerId, payload.tileId);
      } else if (action === 'set_festival') {
        game.setFestival(payload.playerId, payload.tileId);
      } else if (action === 'throw_tomato') {
        game.throwTomato(payload.fromPlayerId, payload.targetPlayerId);
      } else if (action === 'end_turn') {
        game.endTurn(payload.playerId);
      } else if (action === 'send_chat') {
        game.addChatMessage({
          sender: payload.sender,
          text: payload.text,
          isSystem: false,
        });
      } else if (action === 'send_taunt') {
        io.to(`game_${roomId}`).emit('taunt_sound_event', {
          sender: payload.sender,
          tauntId: payload.tauntId,
        });
      }
    });

    // 5. Disconnect
    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        onlineUsers.delete(currentUserId);
        io.emit('presence_update', Array.from(onlineUsers.entries()).map(([uId, data]) => ({
          userId: uId,
          username: data.username,
          status: data.status,
          roomId: data.roomId,
        })));
      }

      if (currentRoomId && currentUserId) {
        const game = activeGames.get(currentRoomId);
        if (game) {
          game.removePlayer(currentUserId);
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> NextGenGames.gg server ready on http://${hostname}:${port}`);
  });
});
