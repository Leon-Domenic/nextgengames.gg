'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getSocket } from '@/lib/socket';
import {
  Gamepad2, Users, Play, Sparkles, ArrowRight, Dices, Shield, Cpu, Zap, Trophy, Flame,
  UserPlus, Search, Copy, CheckCheck, Check, X, UserCheck, ShieldAlert
} from 'lucide-react';

export default function BrowserGamesHub() {
  const router = useRouter();
  const { user, playAsGuest } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  // In-Page Party Creator State
  const [partyRoomCode, setPartyRoomCode] = useState(null);
  const [partyMode, setPartyMode] = useState('blitz'); // 'blitz' or 'normal'
  const [copiedPartyLink, setCopiedPartyLink] = useState(false);

  // Friends & Squad State
  const [activeFriendsTab, setActiveFriendsTab] = useState('friends'); // 'friends', 'search', 'requests'
  const [friendsData, setFriendsData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const socket = getSocket();

  // Load Friends List & Requests
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

  // Real-time User Search
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

  // Instant Solo Match vs Bots
  const handleInstantSolo = async () => {
    try {
      setGuestLoading(true);
      if (!user) {
        await playAsGuest();
      }
      const randomRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
      router.push(`/browsergames/board-brawl/${randomRoom}?mode=blitz`);
    } catch (e) {
      alert(e.message);
    } finally {
      setGuestLoading(false);
    }
  };

  // Create Private Table / Party
  const handleGenerateParty = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setPartyRoomCode(code);
  };

  const copyPartyLink = () => {
    if (!partyRoomCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextgengames.gg';
    const link = `${origin}/browsergames/board-brawl/${partyRoomCode}?mode=${partyMode}`;
    navigator.clipboard.writeText(link);
    setCopiedPartyLink(true);
    setTimeout(() => setCopiedPartyLink(false), 2500);
  };

  const handleLaunchParty = async () => {
    if (!partyRoomCode) return;
    try {
      if (!user) {
        await playAsGuest();
      }
      router.push(`/browsergames/board-brawl/${partyRoomCode}?mode=${partyMode}`);
    } catch (e) {
      router.push(`/browsergames/board-brawl/${partyRoomCode}?mode=${partyMode}`);
    }
  };

  const inviteFriendToParty = (friendId) => {
    if (!socket || !user || !partyRoomCode) {
      alert('Please create a table room code first!');
      return;
    }
    socket.emit('invite_friend', {
      targetUserId: friendId,
      roomId: partyRoomCode,
      hostName: user.username,
      gameName: 'Board Brawl',
    });
    alert('Table invite sent to your friend!');
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    router.push(`/browsergames/board-brawl/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '44px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 240, 255, 0.1)',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          color: '#00f0ff',
          padding: '6px 16px',
          borderRadius: '24px',
          fontSize: '13px',
          fontWeight: 700,
          marginBottom: '16px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
        }}>
          <Gamepad2 size={16} />
          NextGen Arcade // Unified Hub
        </div>
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5vw, 3.6rem)',
          fontWeight: 900,
          letterSpacing: '-1px',
          margin: '0 0 16px 0',
          background: 'linear-gradient(135deg, #ffffff 40%, #00f0ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          Browser Games
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Play directly inside your browser with zero installation. Launch solo matches, create private tables,
          invite online friends, and dominate the 3D board!
        </p>
      </div>

      {/* Featured Game Hero Card: Board Brawl */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(20, 27, 45, 0.95) 0%, rgba(10, 14, 23, 0.98) 100%)',
        border: '1.5px solid rgba(0, 240, 255, 0.35)',
        borderRadius: '24px',
        padding: 'clamp(24px, 4vw, 44px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 45px rgba(0, 240, 255, 0.18)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '48px',
      }}>
        {/* Glow accent */}
        <div style={{
          position: 'absolute',
          top: '-120px',
          right: '-120px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 240, 255, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                background: '#ff0055',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}>
                FEATURED GAME
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#00ff88',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                <Flame size={14} /> LIVE 2-6 PLAYER ARENA
              </span>
            </div>

            <h2 style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              margin: '0 0 14px 0',
              color: '#ffffff',
            }}>
              Board Brawl: Cyber Arena
            </h2>

            <p style={{
              fontSize: '15px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}>
              A fast-paced, high-stakes 3D cyber tabletop game. Roll physics-based dice, collect property nodes,
              build landmarks, launch tomatoes at rivals, inspect full rent progressions, and claim victory!
            </p>

            {/* Quick feature tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                🎲 3D Isometric Board & Pawns
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                ⚡ Real-time WebSockets
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                🤖 Smart AI Bots
              </span>
              <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                🍅 Parabolic Tomato Trajectories
              </span>
            </div>

            {/* Launch Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
              <button
                onClick={handleInstantSolo}
                disabled={guestLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 28px',
                  background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                  color: '#060709',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
                  transition: 'transform 0.15s ease',
                }}
              >
                <Play size={18} fill="#060709" />
                {guestLoading ? 'Launching Game...' : 'Instant Play (Solo vs Bots)'}
              </button>

              <button
                onClick={() => {
                  if (!partyRoomCode) handleGenerateParty();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1.5px solid rgba(0, 240, 255, 0.4)',
                  color: '#00f0ff',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <Users size={17} />
                {partyRoomCode ? 'Party Table Ready' : 'Create Party Table'}
              </button>
            </div>

            {/* Quick Room Code Entry */}
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', maxWidth: '340px', gap: '8px' }}>
              <input
                type="text"
                placeholder="Enter 6-char Room Code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                style={{
                  flex: 1,
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  background: '#00ff88',
                  color: '#060709',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Join
              </button>
            </form>
          </div>

          {/* Right: In-Page Party Creator / Room Setup Box */}
          <div style={{
            background: 'radial-gradient(circle at center, rgba(0, 240, 255, 0.12), rgba(6, 9, 15, 0.95))',
            border: partyRoomCode ? '2px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: partyRoomCode ? '0 0 35px rgba(0, 240, 255, 0.25)' : 'none',
          }}>
            {partyRoomCode ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🎲</span>
                    <strong style={{ fontSize: '16px', color: '#fff', textTransform: 'uppercase' }}>
                      Party Room: #{partyRoomCode}
                    </strong>
                  </div>
                  <button
                    onClick={handleGenerateParty}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    New Code
                  </button>
                </div>

                {/* Mode Selector */}
                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                    Match Timer Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      onClick={() => setPartyMode('blitz')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: partyMode === 'blitz' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: partyMode === 'blitz' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: partyMode === 'blitz' ? '#38bdf8' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Blitz (20 Mins)
                    </button>
                    <button
                      onClick={() => setPartyMode('normal')}
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: partyMode === 'normal' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                        border: partyMode === 'normal' ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: partyMode === 'normal' ? '#fbbf24' : '#94a3b8',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      🏆 Normal (60 Mins)
                    </button>
                  </div>
                </div>

                {/* Copy Link */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={`https://nextgengames.gg/browsergames/board-brawl/${partyRoomCode}?mode=${partyMode}`}
                    style={{
                      flex: 1,
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#94a3b8',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={copyPartyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '8px 14px',
                      background: copiedPartyLink ? '#10b981' : '#38bdf8',
                      color: '#060709',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    {copiedPartyLink ? <CheckCheck size={14} /> : <Copy size={14} />}
                    {copiedPartyLink ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {/* Online Friends Quick Invite */}
                {friendsData.friends.length > 0 && (
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>
                      Invite Online Squad
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                      {friendsData.friends.map(f => (
                        <div key={f.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}>
                          <span style={{ color: '#fff', fontWeight: 700 }}>{f.username}</span>
                          <button
                            onClick={() => inviteFriendToParty(f.id)}
                            style={{
                              background: 'rgba(0, 240, 255, 0.15)',
                              border: '1px solid rgba(0, 240, 255, 0.3)',
                              color: '#00f0ff',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            + Invite
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enter Game Button */}
                <button
                  onClick={handleLaunchParty}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
                    color: '#060709',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 0 25px rgba(0, 240, 255, 0.4)',
                  }}
                >
                  <Play size={17} fill="#060709" />
                  ENTER TABLE LOBBY
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: '74px',
                  height: '74px',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #00f0ff, #00ff88)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '38px',
                  boxShadow: '0 0 35px rgba(0, 240, 255, 0.35)',
                }}>
                  🎲
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '19px', fontWeight: 800, color: '#fff' }}>
                    Full 3D WebGL Engine
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Real-time pawn hop animations, clickable tile rent inspector, Cantino & Rudolf avatars, and parabolic tomato battles.
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  textAlign: 'center',
                }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#00f0ff' }}>2-6</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Players</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#00ff88' }}>20m / 60m</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Timer Modes</div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffb703' }}>100%</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Free Play</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* INTEGRATED SQUAD & FRIENDS HUB (Directly inside Browser Games) */}
      {/* ============================================================== */}
      <div id="friends" style={{
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1.5px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '48px',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>
                Squad & Online Friends
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Invite squad mates directly into Board Brawl, accept pending requests, or add new rivals
            </p>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveFriendsTab('friends')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeFriendsTab === 'friends' ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                color: activeFriendsTab === 'friends' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Friends ({friendsData.friends.length})
            </button>
            <button
              onClick={() => setActiveFriendsTab('search')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeFriendsTab === 'search' ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                color: activeFriendsTab === 'search' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Add Friend
            </button>
            <button
              onClick={() => setActiveFriendsTab('requests')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeFriendsTab === 'requests' ? '#0284c7' : 'rgba(255, 255, 255, 0.05)',
                color: activeFriendsTab === 'requests' ? '#fff' : '#94a3b8',
                border: 'none',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Requests ({friendsData.incoming.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Friends List */}
        {activeFriendsTab === 'friends' && (
          <div>
            {friendsData.friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94a3b8' }}>
                <Users size={36} color="#64748b" style={{ margin: '0 auto 10px auto' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No friends added yet. Use the <strong>Add Friend</strong> tab to search players!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                {friendsData.friends.map(f => (
                  <div key={f.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '13px',
                      }}>
                        {f.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{f.username}</div>
                        <span style={{ fontSize: '11px', color: '#10b981' }}>● Online</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          if (!partyRoomCode) handleGenerateParty();
                          setTimeout(() => inviteFriendToParty(f.id), 100);
                        }}
                        title="Invite to Board Brawl Table"
                        style={{
                          background: 'rgba(0, 240, 255, 0.15)',
                          border: '1px solid rgba(0, 240, 255, 0.4)',
                          color: '#00f0ff',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Invite
                      </button>
                      <button
                        onClick={() => removeFriend(f.id)}
                        title="Remove Friend"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Search & Add Friends */}
        {activeFriendsTab === 'search' && (
          <div>
            <div style={{ maxWidth: '440px', marginBottom: '18px' }}>
              <input
                type="text"
                placeholder="Search players by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {searchLoading ? (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Searching players...</p>
            ) : searchResults.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {searchResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                  }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px' }}>{u.username}</span>
                    {u.relationship === 'friend' ? (
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800 }}>Friends</span>
                    ) : u.relationship === 'pending_outgoing' ? (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sent</span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(u.id)}
                        style={{
                          background: '#00ff88',
                          color: '#060709',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.length >= 2 ? (
              <p style={{ color: '#64748b', fontSize: '13px' }}>No users found matching "{searchQuery}"</p>
            ) : null}
          </div>
        )}

        {/* Tab 3: Incoming Friend Requests */}
        {activeFriendsTab === 'requests' && (
          <div>
            {friendsData.incoming.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>No pending incoming friend requests.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {friendsData.incoming.map(req => (
                  <div key={req.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                  }}>
                    <span style={{ color: '#fff', fontWeight: 800, fontSize: '13px' }}>{req.sender_username}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => respondToRequest(req.id, 'accept')}
                        style={{
                          background: '#10b981',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => respondToRequest(req.id, 'decline')}
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid of Other / Upcoming Browser Games */}
      <div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '20px', color: '#fff' }}>
          More Arcade Titles
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Card 1 */}
          <div style={{
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
            position: 'relative',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#fff' }}>Cyber Grid Tactics</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Turn-based grid strategy duel with customizable mechs and energy nodes.
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              IN DEVELOPMENT
            </span>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
            position: 'relative',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#fff' }}>Neon Speed Dices</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              High-velocity reflex dice matching game with global daily leaderboards.
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              IN DEVELOPMENT
            </span>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'var(--bg-glass-heavy)',
            border: '1px solid var(--border-dim)',
            borderRadius: '16px',
            padding: '24px',
            opacity: 0.7,
            position: 'relative',
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌌</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: '#fff' }}>Void Runner Mini</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Procedural infinite canvas obstacle avoider with synthwave audio track.
            </p>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
              IN DEVELOPMENT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
