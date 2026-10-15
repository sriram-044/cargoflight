import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Plane, Lock, User, AlertCircle, Shield, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Aerotrace@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // In direct-dashboard mode, always redirect to the main CARGOFLIGHT dashboard
    navigate('/', { replace: true });
  }, [navigate]);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDevAccount = (u: string) => {
    setUsername(u);
    setPassword('Aerotrace@2026');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#06182D', // CARGOFLIGHT Navy
        backgroundImage: 'radial-gradient(circle at 50% 20%, #0878F9 0%, transparent 45%), radial-gradient(circle at 80% 80%, #00C2D7 0%, transparent 35%)',
        padding: '1.5rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        {/* Header with CARGOFLIGHT Branding */}
        <div style={{ padding: '2.25rem 2rem 1.75rem', textAlign: 'center', backgroundColor: '#03111F', color: '#FFFFFF', borderBottom: '1px solid #1E293B' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: '#0878F9',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 0 20px rgba(8, 120, 249, 0.5)',
            }}
          >
            <Plane size={30} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.04em' }}>
              CARGOFLIGHT
            </h1>
          </div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00C2D7', letterSpacing: '0.08em', marginTop: '0.25rem', textTransform: 'uppercase' }}>
            AIRPORT CARGO & BAGGAGE TRACKING SYSTEM
          </p>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.35rem' }}>
            Authoritative Operations &bull; PostgreSQL &bull; MongoDB &bull; Neo4j
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '8px',
                color: '#EF4444',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                Operator Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '0.7rem', color: '#94A3B8' }}>
                  <User size={16} />
                </span>
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin or ops_manager"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.85rem', top: '0.7rem', color: '#94A3B8' }}>
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                marginTop: '0.5rem',
                backgroundColor: '#0878F9',
                borderColor: '#0878F9',
                boxShadow: '0 4px 12px rgba(8, 120, 249, 0.3)',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Operations Console'}
            </button>
          </form>

          {/* Quick Development Demo Credentials */}
          <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748B', fontWeight: 700, marginBottom: '0.75rem' }}>
              <Shield size={14} color="#0878F9" />
              <span>CLICK TO LOAD PRECONFIGURED DEMO ACCOUNTS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDevAccount('admin')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.45rem 0.65rem' }}
              >
                <CheckCircle2 size={12} color="#0878F9" />
                <span><strong>admin</strong> (System Admin)</span>
              </button>
              <button
                type="button"
                onClick={() => setDevAccount('ops_manager')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.45rem 0.65rem' }}
              >
                <CheckCircle2 size={12} color="#0878F9" />
                <span><strong>ops_manager</strong> (Operations)</span>
              </button>
              <button
                type="button"
                onClick={() => setDevAccount('handler1')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.45rem 0.65rem' }}
              >
                <CheckCircle2 size={12} color="#0878F9" />
                <span><strong>handler1</strong> (Handler)</span>
              </button>
              <button
                type="button"
                onClick={() => setDevAccount('security_off')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', justifyContent: 'flex-start', padding: '0.45rem 0.65rem' }}
              >
                <CheckCircle2 size={12} color="#0878F9" />
                <span><strong>security_off</strong> (Security)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
