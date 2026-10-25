import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton';
import {
  ShieldCheck,
  Users,
  History,
  RefreshCw,
  PlusCircle,
  Power,
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Mail,
  Shield,
  Key,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdministrationPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [error, setError] = useState('');

  // User Creation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('BAGGAGE_HANDLER');
  const [creatingUser, setCreatingUser] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const { hasRole } = useAuth();
  const isAdmin = hasRole(['SYSTEM_ADMIN', 'DATABASE_ADMIN', 'OPERATIONS_MANAGER']);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [uList, logs] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(0, 50),
      ]);
      setUsers(uList);
      setAuditLogs(logs.content);
    } catch (err: any) {
      setError('Failed to load administrative security logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleToggleUserStatus = async (user: any) => {
    try {
      setActionFeedback(null);
      const updated = await api.updateUserStatus(user.id, !user.active);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, active: updated.active } : u)));
      setActionFeedback(`User ${user.username} status set to ${updated.active ? 'ACTIVE' : 'SUSPENDED'}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      setActionFeedback(null);
      const updated = await api.updateUserRole(userId, role);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      setActionFeedback(`Role updated to ${role} for operator`);
    } catch (err: any) {
      setError(err.message || 'Failed to update user role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      setError('');
      const created = await api.createUser({
        username: newUsername,
        password: newPassword,
        fullName: newFullName,
        role: newRole,
        airport: 'MAA',
      });
      setUsers([...users, created]);
      setShowCreateModal(false);
      setActionFeedback(`Created operator account: ${created.username} (${created.role})`);
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '3rem auto', borderRadius: '14px', backgroundColor: '#FFFFFF', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
          Restricted Security Console
        </h2>
        <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.5 }}>
          Staff management and security audit trail are strictly restricted to authenticated <strong>SYSTEM_ADMIN</strong> and <strong>OPERATIONS_MANAGER</strong> credentials.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1540px', margin: '0 auto', width: '100%' }}>
      {/* Modern Airport Hero Header */}
      <div className="airport-hero">
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div className="airport-hero-badge">
              <span className="pulse-dot"></span>
              <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
            </div>
            <h1 className="airport-hero-title">User Permissions & Staff Management</h1>
            <p className="airport-hero-subtitle">
              Manage airport staff credentials, assign operational permissions, and audit system activities at Chennai Airport Hub (MAA).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={loadData}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <UserPlus size={15} />
              <span>Add Staff Member</span>
            </button>
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '10px',
            color: '#065F46',
            fontSize: '0.875rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <CheckCircle2 size={18} color="#10B981" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem 1.25rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#EF4444', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: '8px', fontWeight: 700 }}
        >
          <Users size={15} />
          <span>Airport Staff Accounts ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderRadius: '8px', fontWeight: 700 }}
        >
          <History size={15} />
          <span>Activity Audit History ({auditLogs.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : activeTab === 'users' ? (
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B' }}>
                Staff Accounts & Role Assignments ({users.length})
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Authorized operations staff with active credentials at Chennai Hub
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0878F9', backgroundColor: '#EFF6FF', padding: '0.25rem 0.65rem', borderRadius: '6px' }}>
              Station MAA
            </span>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Staff Member</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Full Name</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Email Contact</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Assigned Role</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const initials = (u.fullName || u.username || 'U')
                    .split(' ')
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: '#EFF6FF',
                              color: '#0878F9',
                              border: '1px solid #BFDBFE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0878F9' }}>{u.username}</div>
                            <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Station: {u.airport || 'MAA'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#14233B', fontSize: '0.875rem' }}>{u.fullName}</td>
                      <td style={{ padding: '1rem 1.25rem', fontSize: '0.825rem', color: '#475569' }}>
                        {u.email || `${u.username}@flytrack.aero`}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <select
                          className="form-select"
                          style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px' }}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="SYSTEM_ADMIN">System Administrator</option>
                          <option value="OPERATIONS_MANAGER">Operations Manager</option>
                          <option value="FLIGHT_OPERATOR">Flight Operations Staff</option>
                          <option value="BAGGAGE_HANDLER">Baggage Handler / Ramp Staff</option>
                          <option value="SECURITY_OFFICER">Security & Inspection Officer</option>
                          <option value="ANALYST">Operations Analyst</option>
                          <option value="DATABASE_ADMIN">Database Administrator</option>
                          <option value="VIEWER">Read-Only Viewer</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '12px',
                            fontWeight: 800,
                            backgroundColor: u.active ? '#ECFDF5' : '#FEF2F2',
                            color: u.active ? '#065F46' : '#991B1B',
                            border: `1px solid ${u.active ? '#A7F3D0' : '#FECACA'}`,
                          }}
                        >
                          {u.active ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ fontSize: '0.775rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', borderRadius: '8px' }}
                        >
                          <Power size={13} />
                          <span>{u.active ? 'Suspend Account' : 'Activate Account'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div className="card-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#14233B' }}>
              System Activity History & Audit Trail ({auditLogs.length})
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Tamper-evident log of operational changes, baggage status updates, and security authorizations
            </span>
          </div>

          <div className="table-responsive">
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFD', borderBottom: '1px solid #E2E8F0', textAlign: 'left', color: '#64748B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Timestamp</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Staff Member</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Action</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Record Type</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Details</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontWeight: 800, color: '#0878F9' }}>{log.username}</td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <StatusBadge status={log.action} size="sm" />
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                      {log.entityType} ({log.entityId || 'N/A'})
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.825rem', color: '#334155' }}>{log.details}</td>
                    <td style={{ padding: '1rem 1.25rem', fontSize: '0.785rem', fontFamily: 'monospace', color: '#64748B' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 17, 31, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '520px', backgroundColor: '#FFFFFF', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="card-header" style={{ backgroundColor: '#03111F', color: '#FFFFFF', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Create New Staff Account</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.15rem' }}>Add an operator to the Chennai Hub staff directory</div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Username *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. flight_ops_1"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rajesh Kumar"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Initial Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Role & Permission Level *</label>
                <select
                  className="form-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{ height: '42px', borderRadius: '8px' }}
                  required
                >
                  <option value="BAGGAGE_HANDLER">BAGGAGE_HANDLER — Baggage Handler / Ramp Staff</option>
                  <option value="FLIGHT_OPERATOR">FLIGHT_OPERATOR — Flight Operations Staff</option>
                  <option value="SECURITY_OFFICER">SECURITY_OFFICER — Security & Inspection Officer</option>
                  <option value="OPERATIONS_MANAGER">OPERATIONS_MANAGER — Operations Manager</option>
                  <option value="ANALYST">ANALYST — Operations Analyst</option>
                  <option value="DATABASE_ADMIN">DATABASE_ADMIN — Database Administrator</option>
                  <option value="SYSTEM_ADMIN">SYSTEM_ADMIN — System Administrator</option>
                  <option value="VIEWER">VIEWER — Read-Only Viewer</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creatingUser} className="btn btn-primary" style={{ fontWeight: 700 }}>
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

