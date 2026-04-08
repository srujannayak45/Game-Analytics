import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

const Game = forwardRef(({ onMove, player1Name, aiName }, ref) => {
  const canvasRef = useRef(null);
  const [player1State, setPlayer1State] = useState({
    x: 250,
    y: 320,
    hp: 100,
    action: 'idle',
    frame: 0,
    isBlocking: false
  });
  const [aiState, setAiState] = useState({
    x: 650,
    y: 320,
    hp: 100,
    action: 'idle',
    frame: 0,
    isBlocking: false
  });
  const [roundNum, setRoundNum] = useState(1);
  const [showAnnouncer, setShowAnnouncer] = useState(true);
  const [announcerText, setAnnouncerText] = useState('ROUND 1 - FIGHT!');
  const [announcerAlpha, setAnnouncerAlpha] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [hitSpark, setHitSpark] = useState(null);
  const [screenFlash, setScreenFlash] = useState(0);
  const animationFrameRef = useRef();
  const timeRef = useRef(0);

  useImperativeHandle(ref, () => ({
    resetGame: () => {
      setPlayer1State({ x: 250, y: 320, hp: 100, action: 'idle', frame: 0, isBlocking: false });
      setAiState({ x: 650, y: 320, hp: 100, action: 'idle', frame: 0, isBlocking: false });
      setRoundNum(1);
      setGameOver(false);
      setShowAnnouncer(true);
      setAnnouncerText('ROUND 1 - FIGHT!');
      setAnnouncerAlpha(1);
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const drawBackground = () => {
      // Sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 350);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#4682B4');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, 1000, 350);
      
      // Buildings (urban background like Fighting Tiger)
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(50, 100, 120, 250);
      ctx.fillRect(200, 80, 100, 270);
      ctx.fillRect(750, 120, 150, 230);
      ctx.fillRect(850, 90, 100, 260);
      
      // Building windows
      ctx.fillStyle = '#34495E';
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 4; j++) {
          ctx.fillRect(60 + j * 25, 120 + i * 25, 15, 20);
          ctx.fillRect(210 + j * 20, 100 + i * 25, 12, 18);
        }
      }
      
      // Ground
      const groundGradient = ctx.createLinearGradient(0, 350, 0, 550);
      groundGradient.addColorStop(0, '#7D8B99');
      groundGradient.addColorStop(1, '#546370');
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, 350, 1000, 200);
      
      // Ground line
      ctx.strokeStyle = '#2C3E50';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 350);
      ctx.lineTo(1000, 350);
      ctx.stroke();
      
      // Street lines
      ctx.strokeStyle = '#F39C12';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 200 + 50, 380);
        ctx.lineTo(i * 200 + 120, 380);
        ctx.stroke();
      }
    };

    const drawDetailedFighter = (x, y, color, action, facingRight, isHurt, hp) => {
      ctx.save();
      
      if (!facingRight) {
        ctx.translate(x, 0);
        ctx.scale(-1, 1);
        x = 0;
      }
      
      // Realistic shadow on ground
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.ellipse(x, y + 42, 35, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Hurt red overlay
      if (isHurt) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(x - 50, y - 120, 100, 160);
        ctx.globalAlpha = 1.0;
      }
      
      // Idle bob animation
      const bobOffset = action === 'idle' ? Math.sin(timeRef.current * 0.003) * 4 : 0;
      y += bobOffset;
      
      // Attack movements
      let attackOffset = 0;
      if (action === 'punch') attackOffset = 15;
      if (action === 'heavy') attackOffset = 25;
      if (action === 'kick') attackOffset = 10;
      
      const skinColor = '#ffcc99';
      const shirtColor = color;
      const pantsColor = color === '#2E86DE' ? '#1a4d9e' : '#8b0000';
      const darkShade = color === '#2E86DE' ? '#003d7a' : '#5c0000';
      
      // === LEGS (3D styled with muscle definition) ===
      ctx.fillStyle = pantsColor;
      
      if (action === 'kick') {
        // Kicking leg raised and extended
        ctx.save();
        ctx.translate(x + 10, y - 5);
        ctx.rotate(0.6);
        ctx.fillRect(0, 0, 45, 14);
        ctx.fillStyle = darkShade;
        ctx.fillRect(5, 2, 35, 3); // muscle line
        ctx.restore();
        
        // Standing leg
        ctx.fillStyle = pantsColor;
        ctx.fillRect(x - 10, y, 14, 40);
        ctx.fillStyle = darkShade;
        ctx.fillRect(x - 8, y + 10, 3, 25); // muscle definition
      } else {
        // Both legs standing - with 3D shading
        // Left leg
        ctx.fillRect(x - 18, y, 14, 40);
        ctx.fillStyle = darkShade;
        ctx.fillRect(x - 16, y + 10, 3, 25);
        
        // Right leg
        ctx.fillStyle = pantsColor;
        ctx.fillRect(x + 4, y, 14, 40);
        ctx.fillStyle = darkShade;
        ctx.fillRect(x + 6, y + 10, 3, 25);
      }
      
      // === BOOTS (realistic combat boots) ===
      ctx.fillStyle = '#1a1a1a';
      if (action !== 'kick') {
        ctx.fillRect(x - 20, y + 38, 16, 10);
        ctx.fillRect(x + 4, y + 38, 16, 10);
        // Boot shine/laces
        ctx.fillStyle = '#333';
        ctx.fillRect(x - 18, y + 39, 4, 3);
        ctx.fillRect(x + 6, y + 39, 4, 3);
      } else {
        ctx.fillRect(x - 12, y + 38, 16, 10);
      }
      
      // === TORSO (muscular with abs) ===
      ctx.fillStyle = shirtColor;
      ctx.fillRect(x - 22, y - 55, 44, 60);
      
      // Chest muscles (pecs)
      ctx.fillStyle = darkShade;
      ctx.beginPath();
      ctx.arc(x - 10, y - 40, 10, 0, Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 10, y - 40, 10, 0, Math.PI);
      ctx.fill();
      
      // Abs definition (6-pack)
      ctx.strokeStyle = darkShade;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 30);
      ctx.lineTo(x, y);
      ctx.stroke();
      // Horizontal ab lines
      for (let i = -25; i < 0; i += 10) {
        ctx.beginPath();
        ctx.moveTo(x - 12, y + i);
        ctx.lineTo(x + 12, y + i);
        ctx.stroke();
      }
      
      // === BELT ===
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(x - 22, y - 2, 44, 7);
      ctx.fillStyle = '#b8860b';
      ctx.fillRect(x - 5, y - 2, 10, 7); // buckle
      
      // === ARMS (muscular with biceps) ===
      ctx.fillStyle = skinColor;
      
      if (action === 'punch' || action === 'heavy') {
        // Punching arm EXTENDED forward
        ctx.fillRect(x + 22 + attackOffset, y - 50, 45, 12);
        // Bicep bulge
        ctx.beginPath();
        ctx.arc(x + 30 + attackOffset, y - 44, 8, 0, Math.PI * 2);
        ctx.fill();
        // Fist
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x + 67 + attackOffset, y - 44, 7, 0, Math.PI * 2);
        ctx.fill();
        
        // Back arm
        ctx.fillStyle = skinColor;
        ctx.fillRect(x - 30, y - 48, 12, 35);
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x - 24, y - 15, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (action === 'block') {
        // Arms CROSSED in front
        ctx.fillRect(x - 35, y - 52, 12, 40);
        ctx.fillRect(x + 23, y - 52, 12, 40);
        // Fists
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x - 29, y - 14, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 29, y - 14, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Normal fighting stance
        ctx.fillRect(x - 30, y - 50, 12, 35);
        ctx.fillRect(x + 18, y - 50, 12, 35);
        // Biceps
        ctx.beginPath();
        ctx.arc(x - 24, y - 35, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 24, y - 35, 7, 0, Math.PI * 2);
        ctx.fill();
        // Fists
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(x - 24, y - 17, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 24, y - 17, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // === NECK ===
      ctx.fillStyle = skinColor;
      ctx.fillRect(x - 8, y - 60, 16, 12);
      
      // === HEAD (realistic proportions) ===
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.arc(x, y - 75, 18, 0, Math.PI * 2);
      ctx.fill();
      
      // Ear
      ctx.fillStyle = '#e6b380';
      ctx.beginPath();
      ctx.ellipse(x + (facingRight ? -16 : 16), y - 72, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // === HAIR (spiky fighting game style) ===
      ctx.fillStyle = color === '#2E86DE' ? '#1a0a00' : '#5c3317';
      ctx.beginPath();
      ctx.moveTo(x - 18, y - 75);
      ctx.lineTo(x - 12, y - 92);
      ctx.lineTo(x - 6, y - 88);
      ctx.lineTo(x, y - 94);
      ctx.lineTo(x + 6, y - 88);
      ctx.lineTo(x + 12, y - 92);
      ctx.lineTo(x + 18, y - 75);
      ctx.arc(x, y - 75, 18, 0, Math.PI, true);
      ctx.closePath();
      ctx.fill();
      
      // === FACE ===
      // Eyes (white with pupils looking at opponent)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + (facingRight ? -8 : 8), y - 76, 4, 0, Math.PI * 2);
      ctx.arc(x + (facingRight ? -8 : 8) + (facingRight ? 10 : -10), y - 76, 4, 0, Math.PI * 2);
      ctx.fill();
      // Pupils
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x + (facingRight ? -6 : 10), y - 76, 2.5, 0, Math.PI * 2);
      ctx.arc(x + (facingRight ? 4 : 0), y - 76, 2.5, 0, Math.PI * 2);
      ctx.fill();
      
      // Eyebrows (fierce expression)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 82);
      ctx.lineTo(x - 4, y - 80);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 12, y - 82);
      ctx.lineTo(x + 4, y - 80);
      ctx.stroke();
      
      // Nose
      ctx.strokeStyle = '#d4a373';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + (facingRight ? -2 : 2), y - 72);
      ctx.lineTo(x + (facingRight ? -4 : 4), y - 68);
      ctx.stroke();
      
      // Mouth (fighting grimace)
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 64, 6, 0, Math.PI);
      ctx.stroke();
      
      ctx.restore();
    };

    const drawHPBar = (x, y, hp, maxHp, fromLeft, name) => {
      // HP Bar background
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(x - 5, y - 5, 310, 50);
      
      // Name
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = fromLeft ? 'left' : 'right';
      ctx.fillText(name, fromLeft ? x + 5 : x + 295, y + 12);
      
      // HP bar border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y + 18, 300, 20);
      
      // HP fill
      let barColor = '#00FF00';
      if (hp < maxHp * 0.5) barColor = '#FFFF00';
      if (hp < maxHp * 0.25) barColor = '#FF0000';
      
      ctx.fillStyle = barColor;
      const barWidth = (hp / maxHp) * 295;
      if (fromLeft) {
        ctx.fillRect(x + 2.5, y + 20.5, barWidth, 15);
      } else {
        ctx.fillRect(x + 300 - 2.5 - barWidth, y + 20.5, barWidth, 15);
      }
      
      // HP text
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.max(0, Math.round(hp))} HP`, x + 150, y + 33);
    };

    const drawHitSpark = (x, y) => {
      ctx.save();
      const sparkColors = ['#FFFF00', '#FF8800', '#FF0000', '#FFF'];
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 / 12) * i;
        const len = 20 + Math.random() * 15;
        ctx.strokeStyle = sparkColors[Math.floor(Math.random() * sparkColors.length)];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        ctx.stroke();
      }
      // Impact text
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('POW!', x, y - 30);
      ctx.fillText('POW!', x, y - 30);
      ctx.restore();
    };

    const gameLoop = (timestamp) => {
      timeRef.current = timestamp;
      ctx.clearRect(0, 0, 1000, 550);
      
      drawBackground();
      
      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${screenFlash})`;
        ctx.fillRect(0, 0, 1000, 550);
      }
      
      drawDetailedFighter(player1State.x, player1State.y, '#2E86DE', player1State.action, true, player1State.action === 'hurt', player1State.hp);
      drawDetailedFighter(aiState.x, aiState.y, '#E74C3C', aiState.action, false, aiState.action === 'hurt', aiState.hp);
      
      if (hitSpark) {
        drawHitSpark(hitSpark.x, hitSpark.y);
      }
      
      drawHPBar(20, 10, player1State.hp, 100, true, player1Name);
      drawHPBar(670, 10, aiState.hp, 100, false, aiName);
      
      // VS and Round
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('VS', 500, 35);
      ctx.fillText('VS', 500, 35);
      ctx.font = '18px Arial';
      ctx.strokeText(`ROUND ${roundNum}`, 500, 60);
      ctx.fillText(`ROUND ${roundNum}`, 500, 60);
      
      if (showAnnouncer && announcerAlpha > 0) {
        ctx.save();
        ctx.globalAlpha = announcerAlpha;
        ctx.fillStyle = gameOver ? '#FF0000' : '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.font = 'bold 70px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(announcerText, 500, 280);
        ctx.fillText(announcerText, 500, 280);
        ctx.restore();
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [player1State, aiState, roundNum, showAnnouncer, announcerText, announcerAlpha, gameOver, hitSpark, screenFlash, player1Name, aiName]);

  useEffect(() => {
    if (showAnnouncer) {
      const timer = setTimeout(() => {
        const fadeInterval = setInterval(() => {
          setAnnouncerAlpha(prev => {
            if (prev <= 0.05) {
              clearInterval(fadeInterval);
              setShowAnnouncer(false);
              return 0;
            }
            return prev - 0.05;
          });
        }, 50);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showAnnouncer]);

  useEffect(() => {
    if (screenFlash > 0) {
      const timer = setTimeout(() => setScreenFlash(0), 100);
      return () => clearTimeout(timer);
    }
  }, [screenFlash]);

  useEffect(() => {
    if (hitSpark) {
      const timer = setTimeout(() => setHitSpark(null), 200);
      return () => clearTimeout(timer);
    }
  }, [hitSpark]);

  const performMove = (attacker, defender, move, damage, isPlayerMove) => {
    if (gameOver) return;
    
    const isBlocked = isPlayerMove ? aiState.isBlocking : player1State.isBlocking;
    const finalDamage = isBlocked ? Math.floor(damage / 2) : damage;
    
    const newDefenderHp = Math.max(0, defender.hp - finalDamage);
    
    if (isPlayerMove) {
      setPlayer1State(prev => ({ ...prev, action: move, isBlocking: move === 'block' }));
      setAiState(prev => ({ ...prev, hp: newDefenderHp, action: finalDamage > 0 ? 'hurt' : 'idle' }));
      setHitSpark({ x: aiState.x - 50, y: aiState.y - 50 });
      if (move === 'heavy') setScreenFlash(0.5);
    } else {
      setAiState(prev => ({ ...prev, action: move, isBlocking: move === 'block' }));
      setPlayer1State(prev => ({ ...prev, hp: newDefenderHp, action: finalDamage > 0 ? 'hurt' : 'idle' }));
      setHitSpark({ x: player1State.x + 50, y: player1State.y - 50 });
      if (move === 'heavy') setScreenFlash(0.5);
    }
    
    const eventData = {
      player_id: isPlayerMove ? 'player1' : 'ai',
      move: move,
      damage: finalDamage,
      is_blocked: isBlocked,
      attacker_hp: attacker.hp,
      defender_hp: newDefenderHp,
      round_num: roundNum,
      timestamp: Date.now() / 1000
    };
    
    onMove(eventData);
    
    setTimeout(() => {
      if (isPlayerMove) {
        setPlayer1State(prev => ({ ...prev, action: 'idle', isBlocking: false }));
        setAiState(prev => ({ ...prev, action: 'idle' }));
      } else {
        setAiState(prev => ({ ...prev, action: 'idle', isBlocking: false }));
        setPlayer1State(prev => ({ ...prev, action: 'idle' }));
      }
    }, move === 'kick' ? 250 : 200);
    
    if (newDefenderHp <= 0) {
      setGameOver(true);
      setShowAnnouncer(true);
      setAnnouncerText('K.O.!');
      setAnnouncerAlpha(1);
      if (isPlayerMove) {
        setPlayer1State(prev => ({ ...prev, action: 'idle' }));
        setAiState(prev => ({ ...prev, action: 'hurt' }));
      } else {
        setAiState(prev => ({ ...prev, action: 'idle' }));
        setPlayer1State(prev => ({ ...prev, action: 'hurt' }));
      }
    }
  };

  const triggerAIMove = () => {
    if (gameOver) return;
    
    const rand = Math.random();
    let move, damage;
    
    if (rand < 0.35) {
      move = 'punch';
      damage = 10;
    } else if (rand < 0.65) {
      move = 'kick';
      damage = 15;
    } else if (rand < 0.85) {
      move = 'heavy';
      damage = 20;
    } else {
      move = 'block';
      damage = 0;
    }
    
    performMove(aiState, player1State, move, damage, false);
  };

  const handleButtonClick = (move, damage) => {
    if (gameOver) return;
    performMove(player1State, aiState, move, damage, true);
    setTimeout(() => {
      triggerAIMove();
    }, 800);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      background: '#0a0a1a',
      minHeight: '100vh',
      paddingTop: '20px'
    }}>
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={550}
        style={{ 
          border: '4px solid #00e5ff', 
          borderRadius: '8px',
          boxShadow: '0 0 30px rgba(0,229,255,0.6)',
          background: '#000'
        }}
      />
      
      {/* Control Buttons - Fighting Tiger Style */}
      <div style={{
        display: 'flex',
        gap: '20px',
        marginTop: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        borderRadius: '15px',
        border: '3px solid #00e5ff',
        boxShadow: '0 0 20px rgba(0,229,255,0.4)'
      }}>
        <button
          onClick={() => handleButtonClick('punch', 10)}
          disabled={gameOver}
          style={{
            width: '120px',
            height: '80px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #FF6B6B, #C92A2A)',
            color: '#FFF',
            border: '3px solid #FFF',
            borderRadius: '10px',
            cursor: gameOver ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(255,107,107,0.5)',
            transition: 'all 0.2s',
            opacity: gameOver ? 0.5 : 1
          }}
          onMouseOver={(e) => !gameOver && (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        >
          👊 PUNCH<br/><span style={{fontSize: '14px'}}>10 DMG</span>
        </button>
        
        <button
          onClick={() => handleButtonClick('kick', 15)}
          disabled={gameOver}
          style={{
            width: '120px',
            height: '80px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4ECDC4, #1A936F)',
            color: '#FFF',
            border: '3px solid #FFF',
            borderRadius: '10px',
            cursor: gameOver ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(78,205,196,0.5)',
            transition: 'all 0.2s',
            opacity: gameOver ? 0.5 : 1
          }}
          onMouseOver={(e) => !gameOver && (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        >
          🦵 KICK<br/><span style={{fontSize: '14px'}}>15 DMG</span>
        </button>
        
        <button
          onClick={() => handleButtonClick('heavy', 20)}
          disabled={gameOver}
          style={{
            width: '120px',
            height: '80px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #FF9F1C, #F77F00)',
            color: '#FFF',
            border: '3px solid #FFF',
            borderRadius: '10px',
            cursor: gameOver ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(255,159,28,0.5)',
            transition: 'all 0.2s',
            opacity: gameOver ? 0.5 : 1
          }}
          onMouseOver={(e) => !gameOver && (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        >
          💥 HEAVY<br/><span style={{fontSize: '14px'}}>20 DMG</span>
        </button>
        
        <button
          onClick={() => handleButtonClick('block', 0)}
          disabled={gameOver}
          style={{
            width: '120px',
            height: '80px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #6C757D, #495057)',
            color: '#FFF',
            border: '3px solid #FFF',
            borderRadius: '10px',
            cursor: gameOver ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 15px rgba(108,117,125,0.5)',
            transition: 'all 0.2s',
            opacity: gameOver ? 0.5 : 1
          }}
          onMouseOver={(e) => !gameOver && (e.target.style.transform = 'scale(1.05)')}
          onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
        >
          🛡️ BLOCK<br/><span style={{fontSize: '14px'}}>-50% DMG</span>
        </button>
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        color: '#00e5ff', 
        fontFamily: 'monospace', 
        fontSize: '14px',
        textAlign: 'center'
      }}>
        Click the buttons above to attack! AI will counter-attack automatically.
      </div>
    </div>
  );
});

export default Game;