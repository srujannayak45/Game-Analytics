import React from 'react';

const Dashboard = ({ dashboardData }) => {
  const { match_summary = {}, event_log = [] } = dashboardData || {};
  
  const player1Data = match_summary.player1 || {
    hp_remaining: 100,
    total_damage: 0,
    hits_landed: 0,
    blocks_used: 0,
    most_used_move: 'none',
    round_count: 1,
    move_counts: { punch: 0, kick: 0, heavy: 0, block: 0 }
  };
  
  const aiData = match_summary.ai || {
    hp_remaining: 100,
    total_damage: 0,
    hits_landed: 0,
    blocks_used: 0,
    most_used_move: 'none',
    round_count: 1,
    move_counts: { punch: 0, kick: 0, heavy: 0, block: 0 }
  };

  const getHPColor = (hp) => {
    if (hp > 60) return '#00ff00';
    if (hp > 30) return '#ffff00';
    return '#ff0000';
  };

  const getMoveColor = (move) => {
    const colors = {
      punch: '#ff8800',
      kick: '#00e5ff',
      heavy: '#ff3300',
      block: '#888888'
    };
    return colors[move] || '#ffffff';
  };

  const renderPlayerCard = (playerData, playerName, borderColor) => {
    const hpColor = getHPColor(playerData.hp_remaining);
    const maxMoveCount = Math.max(...Object.values(playerData.move_counts));
    
    return (
      <div style={{
        flex: 1,
        background: '#111130',
        border: `3px solid ${borderColor}`,
        borderRadius: '10px',
        padding: '20px',
        margin: '10px',
        boxShadow: `0 0 15px ${borderColor}40`
      }}>
        <h3 style={{ 
          color: borderColor, 
          margin: '0 0 15px 0', 
          fontSize: '24px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {playerName}
        </h3>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            fontSize: '48px', 
            fontWeight: 'bold',
            color: hpColor,
            marginBottom: '5px'
          }}>
            {playerData.hp_remaining} HP
          </div>
          <div style={{ 
            background: '#222', 
            height: '20px', 
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid #444'
          }}>
            <div style={{
              width: `${playerData.hp_remaining}%`,
              height: '100%',
              background: hpColor,
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginTop: '20px',
          fontSize: '14px'
        }}>
          <div style={{ color: '#aaa' }}>Total Damage:</div>
          <div style={{ color: '#00e5ff', fontWeight: 'bold' }}>{playerData.total_damage}</div>
          
          <div style={{ color: '#aaa' }}>Hits Landed:</div>
          <div style={{ color: '#00e5ff', fontWeight: 'bold' }}>{playerData.hits_landed}</div>
          
          <div style={{ color: '#aaa' }}>Blocks Used:</div>
          <div style={{ color: '#00e5ff', fontWeight: 'bold' }}>{playerData.blocks_used}</div>
          
          <div style={{ color: '#aaa' }}>Most Used Move:</div>
          <div style={{ 
            color: getMoveColor(playerData.most_used_move), 
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            {playerData.most_used_move}
          </div>
          
          <div style={{ color: '#aaa' }}>Round:</div>
          <div style={{ color: '#00e5ff', fontWeight: 'bold' }}>{playerData.round_count}</div>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h4 style={{ color: '#00e5ff', fontSize: '16px', marginBottom: '10px' }}>
            Move Distribution
          </h4>
          {Object.entries(playerData.move_counts).map(([move, count]) => (
            <div key={move} style={{ marginBottom: '8px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '3px',
                fontSize: '12px'
              }}>
                <span style={{ 
                  color: getMoveColor(move),
                  textTransform: 'uppercase',
                  fontWeight: 'bold'
                }}>
                  {move}
                </span>
                <span style={{ color: '#888' }}>{count}</span>
              </div>
              <div style={{ 
                background: '#222',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: maxMoveCount > 0 ? `${(count / maxMoveCount) * 100}%` : '0%',
                  height: '100%',
                  background: getMoveColor(move),
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEventLog = () => {
    const recentEvents = event_log.slice(-20).reverse();
    
    if (recentEvents.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666',
          fontSize: '18px'
        }}>
          Waiting for match data... Start playing to see live updates.
        </div>
      );
    }
    
    return recentEvents.map((event, index) => {
      const moveColor = getMoveColor(event.move);
      const playerName = event.player_id === 'player1' ? 'Player 1' : 'Shadow AI';
      
      return (
        <div 
          key={`${event.timestamp}-${index}`}
          style={{
            background: `linear-gradient(90deg, ${moveColor}20, transparent)`,
            borderLeft: `4px solid ${moveColor}`,
            padding: '10px 15px',
            marginBottom: '5px',
            borderRadius: '4px',
            display: 'grid',
            gridTemplateColumns: '60px 120px 100px 80px 100px',
            gap: '15px',
            fontSize: '13px',
            animation: index === 0 ? 'flashIn 0.5s ease' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ color: '#888' }}>Round {event.round_num}</div>
          <div style={{ color: '#00e5ff', fontWeight: 'bold' }}>{playerName}</div>
          <div style={{ 
            color: moveColor, 
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}>
            {event.move}
          </div>
          <div style={{ color: event.damage > 0 ? '#ff6600' : '#888' }}>
            {event.damage} DMG
          </div>
          <div style={{ color: event.is_blocked ? '#ffff00' : '#666' }}>
            {event.is_blocked ? '🛡️ BLOCKED' : ''}
          </div>
        </div>
      );
    });
  };

  const isEmpty = !match_summary.player1 && !match_summary.ai;

  return (
    <div style={{
      background: '#0d0d1a',
      padding: '30px',
      fontFamily: 'monospace',
      color: '#fff',
      minHeight: '600px'
    }}>
      <style>
        {`
          @keyframes flashIn {
            0% { background: #ffff0040; }
            100% { background: transparent; }
          }
        `}
      </style>
      
      {isEmpty ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px',
          fontSize: '24px',
          color: '#00e5ff'
        }}>
          🎮 Waiting for match data... Start playing to see live updates! 🎮
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', marginBottom: '30px' }}>
            {renderPlayerCard(player1Data, 'Player 1', '#0066ff')}
            {renderPlayerCard(aiData, 'Shadow AI', '#ff3300')}
          </div>
          
          <div style={{
            background: '#111130',
            border: '2px solid #00e5ff',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 0 15px #00e5ff40'
          }}>
            <h3 style={{ 
              color: '#00e5ff', 
              margin: '0 0 20px 0',
              fontSize: '20px',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              📊 Live Event Log (Last 20 Events)
            </h3>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              overflowX: 'hidden'
            }}>
              {renderEventLog()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
