import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Navbar />

        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>

        <footer
          style={{
            padding: '1rem 2rem',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>FLYTRACK</span>
            <span>&bull;</span>
            <span>&ldquo;Your baggage journey, made simple.&rdquo;</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Chennai International Airport (MAA)</span>
            <span>&bull;</span>
            <span>PostgreSQL &bull; MongoDB Atlas &bull; Neo4j</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
