import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'default',
}) => {
  let accentColor = '#0284c7';
  let iconBg = '#f0f9ff';

  if (variant === 'success') {
    accentColor = '#059669';
    iconBg = '#ecfdf5';
  } else if (variant === 'warning') {
    accentColor = '#d97706';
    iconBg = '#fffbeb';
  } else if (variant === 'danger') {
    accentColor = '#dc2626';
    iconBg = '#fef2f2';
  } else if (variant === 'info') {
    accentColor = '#0d9488';
    iconBg = '#f0fdfa';
  }

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.25rem',
        boxShadow: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
    >
      <div>
        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#64748b', marginBottom: '0.35rem' }}>
          {label}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>
          {value}
        </div>
        {subValue && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
            {subValue}
          </div>
        )}
      </div>

      {icon && (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: iconBg,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
};
