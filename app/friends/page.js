'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSocket } from '@/lib/socket';
import {
  Users, UserPlus, Play, Check, X, Search, Copy, CheckCheck,
  Bot, Sparkles, Trophy, Gamepad2, Flame, ShieldAlert, ArrowRight, UserCheck
} from 'lucide-react';
import { TOKEN_ICONS, CHARACTERS } from '@/lib/board-brawl/characters.js';

export default function FriendsHubPage() {
  const router = useRouter();
  const { user, onlineUsers } = useAuth();
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'party'

  // Party Lobby State
  const [lobbyCode, setLobbyCode] = useState(null);
  const [gameMode, setGameMode] = useState('blitz'); // 'blitz' or 'normal'
  const [copiedLink, setCopiedLink] = useState(false);

  const socket = getSocket();

  // Load Friends & Requests
  const loadFriends = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/friends/list');
      const data = await res.json();
      if (data.success) {
        setFriendsData({
          friends: data.friends || [],
          incoming: data.incoming || [],
          outgoing: data.outgoing || [],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadFriends();
  }, [user]);

  // Handle User Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const sendFriendRequest = async (targetUserId) => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.error);
      else {
        loadFriends();
        // Update local search results
        setSearchResults(prev => prev.map(u => u.id === targetUserId ? { ...u, relationship: 'pending_outgoing' } : u));
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      loadFriends();
    } catch (e) {
      alert(e.message);
    }
  };

  const removeFriend = async (friendUserId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await fetch('/api/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUserId }),
      });
      loadFriends();
    } catch (e) {
      alert(e.message);
    }
  };

  // Generate unique room code for party lobby
  const createParty = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setLobbyCode(code);
    setActiveTab('party');
  };

  const copyInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgengames.gg';
    const link = `${origin}/join/${lobbyCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const inviteFriendToParty = (friendId) => {
    if (!socket || !user || !lobbyCode) return;
    socket.emit('invite_friend', {
      targetUserId: friendId,
      roomId: lobbyCode,
      hostName: user.username,
      gameName: 'Board Brawl',
    });
    alert('Invitation sent to your friend!');
  };

  const launchBoardBrawl = () => {
    if (!lobbyCode) return;
    router.push(`/game/board-brawl/${lobbyCode}?mode=${gameMode}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '28px' }}>⚡</span>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 900,
              margin: 0,
              fontFamily: 'var(--font-display, sans-serif)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>
              Friends & Party Hub
            </h1>
          </div>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px' }}>
            Gather your squad, track real-time online status, and launch high-stakes Board Brawl matches
          </p>
        </div>

        {/* Quick Launch Action */}
        <button
          onClick={createParty}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #00f0ff, #0ea5e9)',
            color: '#060709',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Gamepad2 size={20} />
          CREATE BOARD BRAWL LOBBY
        </button>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '28px' }}>
        {/* Left Sidebar: Friends & Requests Tabs */}
        <div>
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '16px',
          }}>
            <button
              onClick={() => setActiveTab('friends')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'friends' ? '#00f0ff' : 'transparent',
                color: activeTab === 'friends' ? '#060709' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Friends ({friendsData.friends.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === 'requests' ? '#00f0ff' : 'transparent',
                color: activeTab === 'requests' ? '#060709' : '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              Requests
              {friendsData.incoming.length > 0 && (
                <span style={{
                  background: '#ff3344',
                  color: '#fff',
                  fontSize: '10px',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  marginLeft: '4px',
                }}>
                  {friendsData.incoming.length}
                </span>
              )}
            </button>
          </div>

          {/* User Search Input */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users to add..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: 'rgba(16, 20, 29, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.trim().length >= 2 && (
            <div style={{
              background: 'rgba(16, 20, 29, 0.95)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '20px',
            }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                Search Results ({searchResults.length})
              </span>
              {searchResults.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No players found</p>
              ) : (
                searchResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>{TOKEN_ICONS[u.avatar_token] || '🎩'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{u.username}</span>
                    </div>

                    {u.relationship === 'friend' ? (
                      <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 600 }}>Friends</span>
                    ) : u.relationship === 'pending_outgoing' ? (
                      <span style={{ fontSize: '11px', color: '#f97316' }}>Requested</span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(u.id)}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(0, 240, 255, 0.15)',
                          border: '1px solid #00f0ff',
                          color: '#00f0ff',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Tab View: Friends List */}
          {activeTab === 'friends' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {friendsData.friends.length === 0 ? (
                <div style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                }}>
                  <Users size={32} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                    No friends added yet.<br />Search above or share an invite link!
                  </p>
                </div>
              ) : (
                friendsData.friends.map(f => {
                  const onlineInfo = onlineUsers.find(u => u.userId === f.id);
                  const isOnline = Boolean(onlineInfo);
                  const isPlaying = onlineInfo?.status === 'playing';

                  return (
                    <div
                      key={f.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'rgba(16, 20, 29, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: isPlaying ? '#a855f7' : isOnline ? '#00ff88' : '#64748b',
                          boxShadow: isOnline ? `0 0 8px ${isPlaying ? '#a855f7' : '#00ff88'}` : 'none',
                        }} />
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', display: 'block' }}>
                            {f.username}
                          </span>
                          <span style={{ fontSize: '11px', color: isPlaying ? '#a855f7' : isOnline ? '#00ff88' : '#64748b' }}>
                            {isPlaying ? 'Playing Board Brawl' : isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOnline && lobbyCode && (
                          <button
                            onClick={() => inviteFriendToParty(f.id)}
                            title="Invite to your lobby"
                            style={{
                              padding: '5px 10px',
                              background: '#00f0ff',
                              color: '#060709',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Invite
                          </button>
                        )}
                        <button
                          onClick={() => removeFriend(f.id)}
                          title="Remove friend"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Active Tab View: Requests */}
          {activeTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Incoming Requests ({friendsData.incoming.length})
              </span>
              {friendsData.incoming.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b' }}>No pending requests</p>
              ) : (
                friendsData.incoming.map(req => (
                  <div key={req.request_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(16, 20, 29, 0.7)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    borderRadius: '8px',
                  }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{req.username}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => respondToRequest(req.request_id, 'accept')}
                        style={{
                          background: '#00ff88',
                          color: '#060709',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => respondToRequest(req.request_id, 'decline')}
                        style={{
                          background: 'rgba(255, 51, 68, 0.2)',
                          color: '#ff3344',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Main Pane: Party Lobby Arena or Welcome Board */}
        <div>
          {lobbyCode ? (
            <div style={{
              background: 'rgba(16, 20, 29, 0.85)',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 0 35px rgba(0, 240, 255, 0.15)',
            }}>
              {/* Lobby Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '24px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#00f0ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Active Party Room
                  </span>
                  <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '4px 0 0 0', color: '#fff' }}>
                    ROOM #{lobbyCode}
                  </h2>
                </div>

                {/* 1-Click Invite Link Copier */}
                <button
                  onClick={copyInviteLink}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    background: copiedLink ? '#00ff88' : 'rgba(255, 255, 255, 0.08)',
                    color: copiedLink ? '#060709' : '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copiedLink ? <CheckCheck size={16} /> : <Copy size={16} />}
                  {copiedLink ? 'Link Copied to Clipboard!' : 'Copy 1-Click Invite Link'}
                </button>
              </div>

              {/* Mode Selector */}
              <div style={{ marginBottom: '28px' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px' }}>
                  MATCH SETTINGS & PACING
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div
                    onClick={() => setGameMode('blitz')}
                    style={{
                      padding: '16px',
                      background: gameMode === 'blitz' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: gameMode === 'blitz' ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Flame size={18} color="#00f0ff" />
                      <strong style={{ color: '#fff', fontSize: '16px' }}>Blitz Mode (Recommended)</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                      ⚡ 20-minute match cap • 15s rapid turn timers • $2,200 starting cash • High octane griefing!
                    </p>
                  </div>

                  <div
                    onClick={() => setGameMode('normal')}
                    style={{
                      padding: '16px',
                      background: gameMode === 'normal' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: gameMode === 'normal' ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <ShieldAlert size={18} color="#a855f7" />
                      <strong style={{ color: '#fff', fontSize: '16px' }}>Normal Mode</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
                      🎲 45-60 minute match • 30s turn timers • $1,500 starting cash • Deep strategic buyouts & trades
                    </p>
                  </div>
                </div>
              </div>

              {/* Character & Pawn Model Selector (10 Unique Tycoons) */}
              <div style={{ marginBottom: '28px' }}>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px' }}>
                  CHOOSE YOUR TYCOON & PAWN MODEL (10 UNIQUE CHARACTERS)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {CHARACTERS.map((c) => {
                    const isSelected = user?.avatar_token === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={async () => {
                          if (user) {
                            await fetch('/api/auth/profile', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ avatar_token: c.id, avatar_color: c.color }),
                            });
                            window.location.reload();
                          }
                        }}
                        style={{
                          padding: '10px 6px',
                          background: isSelected ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px',
                          textAlign: 'center',
                          boxShadow: isSelected ? '0 0 15px rgba(0, 240, 255, 0.35)' : 'none',
                        }}
                      >
                        <span style={{ fontSize: '24px' }}>{c.icon}</span>
                        <strong style={{ fontSize: '11px', color: isSelected ? '#00f0ff' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                          {c.name.split(' ')[0]}
                        </strong>
                        <span style={{ fontSize: '9px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                          {c.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lobby Features Summary */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '28px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#00f0ff', textTransform: 'uppercase' }}>
                  🍅 Match Features Enabled:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px', color: '#94a3b8' }}>
                  <div>✓ 3 Free Tomatoes / match</div>
                  <div>✓ Real Screen Shake & Splat</div>
                  <div>✓ Interactive Cursor Wipe</div>
                  <div>✓ 2x Buyout & Landmark Immunity</div>
                  <div>✓ Line & Triple Monopolies</div>
                  <div>✓ 3D Tumbling Dice + Doubles</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  onClick={launchBoardBrawl}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '16px',
                    background: '#00f0ff',
                    color: '#060709',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)',
                  }}
                >
                  <Play size={20} fill="#060709" />
                  ENTER MATCH ARENA (SOLO OR MULTIPLAYER)
                </button>
              </div>
            </div>
          ) : (
            /* Welcome / Game Showcase Card */
            <div style={{
              background: 'linear-gradient(180deg, rgba(16, 20, 29, 0.9) 0%, rgba(10, 13, 18, 0.95) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '36px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid #00f0ff',
                color: '#00f0ff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                marginBottom: '16px',
                letterSpacing: '1px',
              }}>
                GAME #1: BOARD BRAWL
              </div>

              <h2 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 12px 0', color: '#fff' }}>
                Monopoly Meets Chaos Sabotage
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, margin: '0 0 28px 0', maxWidth: '640px' }}>
                Conquer 32 World Capitals, snatch properties with 2x Buyouts, erect permanent Landmarks,
                and hurl juicy tomatoes directly into your friends&apos; viewports to shake their screen
                and obscure their buttons while their turn timer counts down!
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎲</div>
                  <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>3D Physics Dice</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tumbling dice with doubles electric pulse surges</span>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🍅</div>
                  <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Tomato Sabotage</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Real screen shake + wipeable splatter handicap</span>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
                  <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '4px' }}>Smart AI Bots</strong>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>Play solo anytime or add bots to fill 6 seats</span>
                </div>
              </div>

              <button
                onClick={createParty}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '16px 28px',
                  background: '#00f0ff',
                  color: '#060709',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.35)',
                }}
              >
                START A PARTY LOBBY NOW
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
