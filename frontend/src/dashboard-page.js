import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './Dashboard';

function DashboardApp() {
  const [dashboardData, setDashboardData] = useState({ match_summary: {}, event_log: [] });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: '#0a0a1a',
      minHeight: '100vh',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 100%)',
        padding: '30px',
        borderBottom: '3px solid #00e5ff',
        boxShadow: '0 4px 20px rgba(0,229,255,0.3)',
        marginBottom: '30px',
        borderRadius: '10px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#00ff00',
            marginRight: '15px',
            animation: 'pulse 2s infinite',
            boxShadow: '0 0 10px #00ff00'
          }}></div>
          <h1 style={{
            fontSize: '48px',
            margin: '0',
            background: 'linear-gradient(90deg, #00e5ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>
            📊 LIVE KAFKA ANALYTICS DASHBOARD
          </h1>
        </div>
        <p style={{
          fontSize: '16px',
          color: '#888',
          margin: '0',
          textAlign: 'center',
          fontFamily: 'monospace'
        }}>
          Real-time Fight Analytics • Auto-updating every 1 second
        </p>
      </header>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }
        `}
      </style>

      <Dashboard dashboardData={dashboardData} />

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: '#666',
        fontSize: '12px',
        fontFamily: 'monospace',
        marginTop: '30px',
        borderTop: '1px solid #333'
      }}>
        <p>Data Flow: Game → FastAPI → Kafka → Spark Streaming → Redis → Dashboard</p>
      </footer>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DashboardApp />
  </React.StrictMode>
);
