import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'default',
  trend,
}) => {
  let accentColor = '#0878F9';
  let iconBg = '#EFF6FF';
  let borderColor = '#E2E8F0';

  if (variant === 'success') {
    accentColor = '#10B981';
    iconBg = '#ECFDF5';
    borderColor = '#D1FAE5';
  } else if (variant === 'warning') {
    accentColor = '#F59E0B';
    iconBg = '#FFFBEB';
    borderColor = '#FDE68A';
  } else if (variant === 'danger') {
    accentColor = '#EF4444';
    iconBg = '#FEF2F2';
    borderColor = '#FECACA';
  } else if (variant === 'info') {
    accentColor = '#00C2D7';
    iconBg = '#F0FDFE';
    borderColor = '#CFFAFE';
  }

  return (
    <div
      className="stat-card"
      style={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${borderColor}`,
        borderRadius: '14px',
        padding: '1.25rem 1.4rem',
        boxShadow: '0 2px 8px -2px rgba(6, 24, 45, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            {label}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: iconBg,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px -2px ${iconBg}`,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(subValue || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.65rem', borderTop: '1px solid #F1F5F9', fontSize: '0.75rem' }}>
          <span style={{ color: '#64748B' }}>{subValue}</span>
          {trend && (
            <span style={{ fontWeight: 700, color: accentColor, backgroundColor: iconBg, padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
