import { useState, useEffect } from 'react';
import type { ApiSuccessResponse, HealthData } from 'cityops-ai-shared';
import { API_PREFIX } from 'cityops-ai-shared';
import { initializeFirebaseClient } from './config/firebase';
import './App.css';

function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [authConfigured, setAuthConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    try {
      initializeFirebaseClient();
      setAuthConfigured(true);
    } catch {
      setAuthConfigured(false);
    }

    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}${API_PREFIX}/health`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: ApiSuccessResponse<HealthData> = await response.json();
        setHealth(json.data);
        setHealthError(null);
      } catch (err) {
        setHealthError(err instanceof Error ? err.message : 'Connection failed');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">🏙️</div>
        <h1 className="app-title">CityOps AI</h1>
        <p className="app-subtitle">AI-Powered City Operations Platform</p>
      </header>

      <div className="status-card">
        <h2>System Status</h2>
        <div className="status-item">
          <span className="status-label">Frontend</span>
          <span className="status-value ok">● Online</span>
        </div>
        <div className="status-item">
          <span className="status-label">Backend API</span>
          <span className={`status-value ${loading ? 'loading' : health ? 'ok' : 'error'}`}>
            {loading ? '◌ Checking...' : health ? '● Online' : `✕ ${healthError}`}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">Firebase Auth</span>
          <span className={`status-value ${authConfigured ? 'ok' : 'error'}`}>
            {authConfigured ? '● Configured' : '✕ Missing config'}
          </span>
        </div>
        {health && (
          <>
            <div className="status-item">
              <span className="status-label">Environment</span>
              <span className="status-value">{health.environment}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Uptime</span>
              <span className="status-value">{Math.floor(health.uptime)}s</span>
            </div>
          </>
        )}
      </div>

      <footer className="app-footer">
        <p>CityOps AI v0.1.0 — Milestone 1: Infrastructure</p>
      </footer>
    </div>
  );
}

export default App;
