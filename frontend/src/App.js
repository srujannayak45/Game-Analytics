import React, { useState, useRef } from 'react';
import Game from './Game';

function App() {
  const [player1Name] = useState('Player 1');
  const [aiName] = useState('Shadow AI');
  const gameRef = useRef();

  const handleMove = async (moveEvent) => {
    try {
      await fetch('http://localhost:8000/api/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(moveEvent),
      });
    } catch (error) {
      console.error('Error sending move:', error);
    }
  };

  const handleReset = async () => {
    try {
      await fetch('http://localhost:8000/api/reset', {
        method: 'POST',
      });
      if (gameRef.current) {
        gameRef.current.resetGame();
      }
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  return (
    <div style={{
      background: '#0a0a1a',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 100%)',
        padding: '20px',
        borderBottom: '3px solid #00e5ff',
        boxShadow: '0 4px 20px rgba(0,229,255,0.3)',
        marginBottom: '10px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '42px',
              margin: '0',
              background: 'linear-gradient(90deg, #00e5ff, #00ff88)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              ⚔️ FIGHT ARENA
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#888',
              margin: '5px 0 0 0',
              fontFamily: 'monospace'
            }}>
              Real-time Analytics Powered by Kafka + Spark
            </p>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button
              onClick={handleReset}
              style={{
                background: 'linear-gradient(135deg, #ff3300, #ff6600)',
                color: '#fff',
                border: 'none',
                padding: '12px 25px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255,51,0,0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              🔄 RESET
            </button>
            <a
              href="/dashboard.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #00e5ff, #0088ff)',
                color: '#fff',
                border: 'none',
                padding: '12px 25px',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px',
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(0,229,255,0.4)',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                display: 'inline-block'
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              📊 DASHBOARD
            </a>
          </div>
        </div>
      </header>

      <Game 
        ref={gameRef}
        onMove={handleMove}
        player1Name={player1Name}
        aiName={aiName}
      />
    </div>
  );
}

export default App;
