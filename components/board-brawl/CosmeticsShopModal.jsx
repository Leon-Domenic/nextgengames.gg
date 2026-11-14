'use client';



import React, { useState, useEffect } from 'react';

import { createPortal } from 'react-dom';

import { CHARACTERS, CHARACTER_MAP, getUnlockedCosmeticIds } from '@/lib/board-brawl/characters';

import { formatFullCash } from '@/lib/board-brawl/types';

import { DICE_SKINS, ROLL_STYLE_MAP } from '@/lib/board-brawl/diceSkins';

import DieCube3D from '@/components/board-brawl/DieCube3D';

import ShopDicePreview3D from '@/components/board-brawl/ShopDicePreview3D';

import { sounds } from '@/lib/audio';

import {

  X, Check, Sparkles, Shield, Coins, DollarSign, Crown, Zap, Dices, ShoppingBag

} from 'lucide-react';



export default function CosmeticsShopModal({

  isOpen,

  onClose,

  initialTab = 'characters',

  currentUserId,

  equippedCharacter = 'hat',

  equippedDiceSkin = 'classic_red',

  onEquipCharacter,

  onEquipDiceSkin,

  userCash = 5000,

  userCoins = 50,

}) {

  const [mounted, setMounted] = useState(false);

  useEffect(() => {

    setMounted(true);

  }, []);



  // Lock body scroll and listen for Escape key

  useEffect(() => {

    if (!isOpen) return;

    const handleKeyDown = (e) => {

      if (e.key === 'Escape') onClose();

    };

    window.addEventListener('keydown', handleKeyDown);

    const origOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    return () => {

      window.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = origOverflow;

    };

  }, [isOpen, onClose]);

  const [activeTab, setActiveTab] = useState(initialTab === 'dice' ? 'dice' : 'characters'); // 'characters' | 'dice'

  const [selectedItem, setSelectedItem] = useState(() =>

    initialTab === 'dice'

      ? (DICE_SKINS.find(d => d.id === equippedDiceSkin) || DICE_SKINS[0])

      : (CHARACTERS.find(c => c.id === equippedCharacter) || CHARACTERS[0])

  );



  useEffect(() => {

    if (!isOpen) return;

    const nextTab = initialTab === 'dice' ? 'dice' : 'characters';

    setActiveTab(nextTab);

    setSelectedItem(

      nextTab === 'dice'

        ? (DICE_SKINS.find(d => d.id === equippedDiceSkin) || DICE_SKINS[0])

        : (CHARACTERS.find(c => c.id === equippedCharacter) || CHARACTERS[0])

    );

  }, [isOpen, initialTab]);

  const [cashBalance, setCashBalance] = useState(userCash);

  const [coinsBalance, setCoinsBalance] = useState(userCoins);



  // Unlocked items state with localStorage persistence

  const [unlockedItems, setUnlockedItems] = useState(() => getUnlockedCosmeticIds());



  if (!isOpen || !mounted) return null;



  const isCharacterTab = activeTab === 'characters';

  const itemList = isCharacterTab ? CHARACTERS : DICE_SKINS;



  const isEquipped = (item) => {

    return isCharacterTab

      ? equippedCharacter === item.id

      : equippedDiceSkin === item.id;

  };



  const isUnlocked = (item) => {

    if (item.priceCash === 0 && item.priceCoins === 0) return true;

    return unlockedItems.has(item.id);

  };



  const handleSelect = (item) => {

    setSelectedItem(item);

    sounds.playPawnStep?.();

  };



  const handleEquip = (item) => {

    sounds.playBuild();

    if (isCharacterTab) {

      if (onEquipCharacter) onEquipCharacter(item.id);

    } else {

      if (onEquipDiceSkin) onEquipDiceSkin(item.id);

    }



    // Persist equip to localStorage

    if (typeof window !== 'undefined') {

      if (isCharacterTab) localStorage.setItem('ngg_equipped_character', item.id);

      else localStorage.setItem('ngg_equipped_dice_skin', item.id);

    }



    // Sync to backend if authenticated

    try {

      fetch('/api/auth/profile', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(

          isCharacterTab ? { avatar_token: item.id } : { dice_skin: item.id }

        ),

      }).catch(() => {});

    } catch (e) {}

  };



  const handleUnlock = (item) => {

    if (cashBalance < item.priceCash && coinsBalance < item.priceCoins) {

      alert("Not enough Cash or Gold Coins! Play more matches or complete quests to earn rewards.");

      return;

    }



    sounds.playCash();

    const newUnlocked = new Set(unlockedItems);

    newUnlocked.add(item.id);

    setUnlockedItems(newUnlocked);



    // Deduct currency

    setCashBalance(prev => Math.max(0, prev - item.priceCash));



    // Save to localStorage

    if (typeof window !== 'undefined') {

      try {

        localStorage.setItem(

          'ngg_unlocked_cosmetics',

          JSON.stringify(Array.from(newUnlocked))

        );

      } catch (e) {}

    }



    // Auto-equip newly purchased cosmetic

    handleEquip(item);

  };



  return createPortal(

    <div

      onClick={(e) => {

        if (e.target === e.currentTarget) onClose();

      }}

      style={{

        position: 'fixed',

        inset: 0,

        zIndex: 99999,

        background: 'rgba(15, 23, 42, 0.8)',

        backdropFilter: 'blur(10px)',

        display: 'flex',

        alignItems: 'flex-start',

        justifyContent: 'center',

        padding: '24px 16px',

        overflowY: 'auto',

        fontFamily: 'system-ui, -apple-system, sans-serif',

      }}

    >

      <div

        onClick={(e) => e.stopPropagation()}

        style={{

          width: '960px',

          maxWidth: '100%',

          maxHeight: 'calc(100vh - 48px)',

          height: 'min(760px, calc(100vh - 48px))',

          background: '#ffffff',

          borderRadius: '24px',

          border: '3px solid #38bdf8',

          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',

          display: 'flex',

          flexDirection: 'column',

          overflow: 'hidden',

          position: 'relative',

          margin: '0 auto',

        }}

      >

        {/* 1. Header Bar with Gold Ribbon & Currency */}

        <div style={{

          flexShrink: 0,

          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',

          padding: '14px 24px',

          display: 'flex',

          alignItems: 'center',

          justifyContent: 'space-between',

          borderBottom: '3px solid #38bdf8',

        }}>

          {/* Shop Title */}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <div style={{

              width: '42px',

              height: '42px',

              borderRadius: '12px',

              background: '#fbbf24',

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              fontSize: '22px',

              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',

            }}>

              🛍️

            </div>

            <div>

              <div style={{

                fontSize: '20px',

                fontWeight: 900,

                color: '#ffffff',

                textTransform: 'uppercase',

                letterSpacing: '0.5px',

                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',

              }}>

                BOARD BRAWL SHOP

              </div>

              <div style={{ fontSize: '12px', color: '#bae6fd', fontWeight: 700 }}>

                Customize Your Characters & 3D Dice Designs

              </div>

            </div>

          </div>



          {/* Right: Currency Balance + Close */}

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

            {/* Space Credits Pill */}

            <div style={{

              display: 'flex',

              alignItems: 'center',

              gap: '6px',

              background: 'rgba(255, 255, 255, 0.15)',

              border: '1px solid rgba(255, 255, 255, 0.25)',

              padding: '6px 14px',

              borderRadius: '20px',

              color: '#ffffff',

              fontWeight: 800,

              fontSize: '13px',

            }}>

              <span>🪐</span>

              <span>{formatFullCash(cashBalance)} Space Credits</span>

            </div>



            {/* Coins Pill */}

            <div style={{

              display: 'flex',

              alignItems: 'center',

              gap: '6px',

              background: 'rgba(251, 191, 36, 0.2)',

              border: '1px solid #fef08a',

              padding: '6px 14px',

              borderRadius: '20px',

              color: '#fef08a',

              fontWeight: 900,

              fontSize: '13px',

            }}>

              <span>🪙</span>

              <span>{coinsBalance} Coins</span>

            </div>



            {/* Close Button */}

            <button

              onClick={onClose}

              aria-label="Close Shop"

              title="Close Shop"

              style={{

                width: '36px',

                height: '36px',

                borderRadius: '10px',

                background: 'rgba(255, 255, 255, 0.2)',

                border: 'none',

                color: '#fff',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',

                cursor: 'pointer',

              }}

            >

              <X size={20} />

            </button>

          </div>

        </div>



        {/* 2. Shop Navigation Tabs */}

        <div style={{

          flexShrink: 0,

          display: 'flex',

          background: '#f8fafc',

          padding: '8px 24px',

          borderBottom: '1px solid #e2e8f0',

          gap: '12px',

        }}>

          <button

            onClick={() => {

              setActiveTab('characters');

              setSelectedItem(CHARACTERS[0]);

            }}

            style={{

              display: 'flex',

              alignItems: 'center',

              gap: '8px',

              padding: '8px 20px',

              borderRadius: '12px',

              background: isCharacterTab ? '#0284c7' : '#ffffff',

              color: isCharacterTab ? '#ffffff' : '#64748b',

              border: isCharacterTab ? '2px solid #38bdf8' : '1px solid #e2e8f0',

              fontWeight: 900,

              fontSize: '13px',

              cursor: 'pointer',

              boxShadow: isCharacterTab ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',

              transition: 'all 0.15s ease',

            }}

          >

            <span>🎭</span>

            CHARACTERS ({CHARACTERS.length})

          </button>



          <button

            onClick={() => {

              setActiveTab('dice');

              setSelectedItem(DICE_SKINS[0]);

            }}

            style={{

              display: 'flex',

              alignItems: 'center',

              gap: '8px',

              padding: '8px 20px',

              borderRadius: '12px',

              background: !isCharacterTab ? '#0284c7' : '#ffffff',

              color: !isCharacterTab ? '#ffffff' : '#64748b',

              border: !isCharacterTab ? '2px solid #38bdf8' : '1px solid #e2e8f0',

              fontWeight: 900,

              fontSize: '13px',

              cursor: 'pointer',

              boxShadow: !isCharacterTab ? '0 4px 12px rgba(2, 132, 199, 0.25)' : 'none',

              transition: 'all 0.15s ease',

            }}

          >

            <span>🎲</span>

            DICE DESIGNS ({DICE_SKINS.length})

          </button>

        </div>



        {/* 3. Main Split View: Left Showcase Hero | Right Catalog Grid */}

        <div style={{

          display: 'grid',

          gridTemplateColumns: '290px 1fr',

          flex: 1,

          minHeight: 0,

          overflow: 'hidden',

        }}>

          {/* Left: Selected Cosmetic Showcase */}

          <div style={{

            background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',

            padding: '18px 16px',

            borderRight: '1px solid #cbd5e1',

            display: 'flex',

            flexDirection: 'column',

            alignItems: 'center',

            justifyContent: 'space-between',

            overflowY: 'auto',

            minHeight: 0,

          }}>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* Rarity Tag */}

              <div style={{

                padding: '3px 12px',

                borderRadius: '16px',

                background: selectedItem.rarityColor || '#3b82f6',

                color: '#ffffff',

                fontWeight: 900,

                fontSize: '10px',

                textTransform: 'uppercase',

                letterSpacing: '1px',

                marginBottom: '10px',

                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',

              }}>

                {selectedItem.rarity || 'Common'} Cosmetic

              </div>



              {/* Big Icon / Standee Display for Characters | 3D Dice Showcase for Dice */}

              {isCharacterTab ? (

                <div style={{

                  width: '104px',

                  height: '104px',

                  borderRadius: '22px',

                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',

                  border: `4px solid ${selectedItem.accentColor || '#38bdf8'}`,

                  boxShadow: '0 8px 22px rgba(0, 0, 0, 0.16)',

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  fontSize: '52px',

                  marginBottom: '10px',

                  position: 'relative',

                }}>

                  {selectedItem.avatar ? (

                    <img src={selectedItem.avatar} alt={selectedItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }} />

                  ) : (

                    (typeof CHARACTER_MAP !== 'undefined' && CHARACTER_MAP[selectedItem.id]?.icon) || selectedItem.icon || '🤖'

                  )}

                </div>

              ) : (

                <ShopDicePreview3D skin={selectedItem} />

              )}



              {/* Name & Title */}

              <div style={{

                fontSize: '17px',

                fontWeight: 900,

                color: '#1e293b',

                textAlign: 'center',

                marginBottom: '2px',

              }}>

                {selectedItem.name}

              </div>

              <div style={{

                fontSize: '12px',

                fontWeight: 700,

                color: '#64748b',

                textAlign: 'center',

                marginBottom: '10px',

              }}>

                {selectedItem.title}

              </div>



              {/* Description Flavor Text */}

              <p style={{

                fontSize: '11px',

                lineHeight: '1.45',

                color: '#475569',

                textAlign: 'center',

                background: 'rgba(255, 255, 255, 0.8)',

                padding: '10px 12px',

                borderRadius: '12px',

                border: '1px solid rgba(255, 255, 255, 0.9)',

                margin: 0,

                width: '100%',

              }}>

                {selectedItem.description}
              </p>

              {!isCharacterTab && selectedItem.trailEffect && (
                <div style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.85)',
                  padding: '8px 10px',
                  borderRadius: '12px',
                  border: '1.5px solid ' + (selectedItem.accentColor || '#38bdf8') + '44',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#334155',
                  margin: '10px 0 0 0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Tail Effect:</span>
                    <span style={{ color: selectedItem.trailEffect.color || '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{selectedItem.trailEffect.particleIcon}</span>
                      <span>{selectedItem.trailEffect.name}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Signature Roll:</span>
                    <span style={{ color: '#0369a1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{ROLL_STYLE_MAP[selectedItem.rollStyle]?.icon || '⚡'}</span>
                      <span>{ROLL_STYLE_MAP[selectedItem.rollStyle]?.name || 'Classic Arc'}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>



            {/* Bottom Action Button for Selected Item */}

            <div style={{ width: '100%', marginTop: '14px' }}>

              {isEquipped(selectedItem) ? (

                <div style={{

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'center',

                  gap: '8px',

                  padding: '12px',

                  borderRadius: '12px',

                  background: '#16a34a',

                  color: '#ffffff',

                  fontWeight: 900,

                  fontSize: '14px',

                  boxShadow: '0 4px 15px rgba(22, 163, 74, 0.35)',

                }}>

                  <Check size={18} />

                  CURRENTLY EQUIPPED

                </div>

              ) : isUnlocked(selectedItem) ? (

                <button

                  onClick={() => handleEquip(selectedItem)}

                  style={{

                    width: '100%',

                    padding: '12px',

                    borderRadius: '12px',

                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',

                    border: '2px solid #38bdf8',

                    color: '#ffffff',

                    fontWeight: 900,

                    fontSize: '14px',

                    cursor: 'pointer',

                    boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',

                    transition: 'transform 0.1s',

                  }}

                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}

                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}

                >

                  EQUIP TO MATCH

                </button>

              ) : (

                <button

                  onClick={() => handleUnlock(selectedItem)}

                  style={{

                    width: '100%',

                    padding: '12px',

                    borderRadius: '12px',

                    background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',

                    border: '2px solid #fef08a',

                    color: '#ffffff',

                    fontWeight: 900,

                    fontSize: '13px',

                    cursor: 'pointer',

                    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.4)',

                    transition: 'transform 0.1s',

                  }}

                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}

                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}

                >

                  UNLOCK FOR {selectedItem.priceCash.toLocaleString()} SPACE CREDITS

                </button>

              )}

            </div>

          </div>



          {/* Right: Scrollable Grid of Available Items */}

          <div style={{

            padding: '16px 20px',

            overflowY: 'auto',

            minHeight: 0,

          }}>

            <div style={{

              display: 'grid',

              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',

              gap: '14px',

            }}>

              {itemList.map(item => {

                const selected = selectedItem.id === item.id;

                const equipped = isEquipped(item);

                const unlocked = isUnlocked(item);



                return (

                  <div

                    key={item.id}

                    onClick={() => handleSelect(item)}

                    style={{

                      background: selected ? 'rgba(2, 132, 199, 0.08)' : '#ffffff',

                      border: selected

                        ? '3px solid #0284c7'

                        : equipped

                        ? '2px solid #16a34a'

                        : '1.5px solid #e2e8f0',

                      borderRadius: '16px',

                      padding: '14px 12px',

                      display: 'flex',

                      flexDirection: 'column',

                      alignItems: 'center',

                      cursor: 'pointer',

                      position: 'relative',

                      boxShadow: selected

                        ? '0 8px 20px rgba(2, 132, 199, 0.2)'

                        : '0 2px 8px rgba(0, 0, 0, 0.04)',

                      transition: 'all 0.15s ease',

                    }}

                  >

                    {/* Equipped Badge */}

                    {equipped && (

                      <div style={{

                        position: 'absolute',

                        top: '8px',

                        right: '8px',

                        background: '#16a34a',

                        color: '#fff',

                        borderRadius: '6px',

                        padding: '2px 6px',

                        fontSize: '9px',

                        fontWeight: 900,

                      }}>

                        ACTIVE

                      </div>

                    )}



                    {/* Icon / Standee for Characters | 3D DieCube for Dice Skins */}

                    {isCharacterTab ? (

                      <div style={{

                        width: '64px',

                        height: '64px',

                        borderRadius: '16px',

                        background: '#f8fafc',

                        border: `2px solid ${item.accentColor || '#cbd5e1'}`,

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        fontSize: '32px',

                        marginBottom: '10px',

                        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',

                        overflow: 'hidden',

                      }}>

                        {item.avatar ? (

                          <img src={item.avatar} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        ) : (

                          (typeof CHARACTER_MAP !== 'undefined' && CHARACTER_MAP[item.id]?.icon) || item.icon || '🤖'

                        )}

                      </div>

                    ) : (

                      <div style={{

                        width: '64px',

                        height: '64px',

                        borderRadius: '16px',

                        background: `radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.18) 0%, rgba(0, 0, 0, 0.3) 100%), ${item.palette?.body || '#dc2626'}`,

                        border: selected

                          ? `2.5px solid ${item.accentColor || '#38bdf8'}`

                          : `2px solid ${item.palette?.border || item.accentColor || '#cbd5e1'}`,

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        marginBottom: '10px',

                        boxShadow: selected

                          ? `0 6px 18px ${item.accentColor || '#0284c7'}55`

                          : '0 4px 12px rgba(0, 0, 0, 0.12)',

                        perspective: '260px',

                        position: 'relative',

                      }}>

                        {/* Miniature Contact Shadow */}

                        <div

                          style={{

                            position: 'absolute',

                            bottom: '8px',

                            width: '38px',

                            height: '10px',

                            borderRadius: '50%',

                            background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0) 70%)',

                            pointerEvents: 'none',

                          }}

                        />

                        <div style={{ transformStyle: 'preserve-3d', transform: 'translateY(-2px)' }}>

                          <DieCube3D

                            size={34}

                            skin={item}

                            rx={-24}

                            ry={34}

                            rz={0}

                            spin={selected}

                            spinDuration="7s"

                          />

                        </div>

                      </div>

                    )}



                    {/* Name */}

                    <div style={{

                      fontSize: '13px',

                      fontWeight: 900,

                      color: '#1e293b',

                      textAlign: 'center',

                      marginBottom: '2px',

                      whiteSpace: 'nowrap',

                      overflow: 'hidden',

                      textOverflow: 'ellipsis',

                      width: '100%',

                    }}>

                      {item.name}

                    </div>



                    {/* Rarity & Price */}

                    <div style={{

                      fontSize: '11px',

                      fontWeight: 800,

                      color: unlocked ? '#16a34a' : '#d97706',

                      marginTop: '4px',

                    }}>

                      {equipped ? 'EQUIPPED' : unlocked ? 'OWNED' : `${item.priceCash} CR`}

                    </div>

                  </div>

                );

              })}

            </div>

          </div>

        </div>

      </div>

    </div>,

    document.body

  );

}

