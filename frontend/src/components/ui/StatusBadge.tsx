import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normStatus = (status || '').toUpperCase();

  let bg = '#f1f5f9';
  let text = '#475569';
  let border = '#cbd5e1';

  switch (normStatus) {
    case 'LOADED':
    case 'DELIVERED_TO_BELT':
    case 'CLAIMED':
    case 'PASS':
    case 'ONLINE':
    case 'ACTIVE':
    case 'RESOLVED':
    case 'SYNCHRONIZED':
      bg = '#ecfdf5';
      text = '#047857';
      border = '#a7f3d0';
      break;

    case 'SECURITY_CLEARED':
    case 'SORTED':
    case 'READY_FOR_LOADING':
    case 'PROCESSED':
      bg = '#f0f9ff';
      text = '#0369a1';
      border = '#bae6fd';
      break;

    case 'CHECKED_IN':
    case 'IN_TRANSIT':
    case 'SCHEDULED':
    case 'PENDING':
      bg = '#f0fdfa';
      text = '#0f766e';
      border = '#99f6e4';
      break;

    case 'REGISTERED':
    case 'IN_INVESTIGATION':
    case 'DEGRADED':
    case 'WARNING':
    case 'MEDIUM':
      bg = '#fffbeb';
      text = '#b45309';
      border = '#fde68a';
      break;

    case 'EXCEPTION':
    case 'FAIL':
    case 'SECURITY_REJECT':
    case 'MISROUTED':
    case 'DELAYED':
    case 'CRITICAL':
    case 'HIGH':
    case 'OFFLINE':
      bg = '#fef2f2';
      text = '#b91c1c';
      border = '#fecaca';
      break;

    case 'BLOCKED':
      bg = '#fff7ed';
      text = '#c2410c';
      border = '#ffedd5';
      break;

    case 'NOT CONFIGURED':
      bg = '#f8fafc';
      text = '#64748b';
      border = '#e2e8f0';
      break;

    default:
      break;
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.7rem' : '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: text,
          marginRight: '0.35rem',
        }}
      />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
