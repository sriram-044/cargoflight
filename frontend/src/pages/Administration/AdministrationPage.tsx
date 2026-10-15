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
      <div className="card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <Lock size={36} color="#dc2626" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
          This console is strictly restricted to authenticated <strong>SYSTEM_ADMIN</strong> and <strong>OPERATIONS_MANAGER</strong> roles.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div
        className="card"
        style={{
          padding: '1.5rem',
          backgroundColor: '#FFFFFF',
          borderLeft: '4px solid #0878F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="#0878F9" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#14233B' }}>
              Users, Roles & Security Audit
            </h1>
          </div>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Role-based authorization control (RBAC), operator credential policies, and compliance audit trail.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Records</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <UserPlus size={15} />
            <span>Add Operator</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', color: '#065F46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#EF4444', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('users')}
          className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Users size={14} />
          <span>Authorized Personnel ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <History size={14} />
          <span>Compliance Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : activeTab === 'users' ? (
        <div className="card">
          <div className="card-header">
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14233B' }}>
              Active Personnel & Credentials ({users.length})
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              BCrypt-Hashed PostgreSQL User Accounts
            </span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0878F9' }}>{u.username}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Station: {u.airport || 'MAA'}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: '#14233B' }}>{u.fullName}</td>
                    <td style={{ fontSize: '0.8125rem', color: '#475569' }}>{u.email || `${u.username}@cargoflight.aero`}</td>
                    <td>
                      <select
                        className="form-select"
                        style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 600 }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                        <option value="OPERATIONS_MANAGER">OPERATIONS_MANAGER</option>
                        <option value="FLIGHT_OPERATOR">FLIGHT_OPERATOR</option>
                        <option value="BAGGAGE_HANDLER">BAGGAGE_HANDLER</option>
                        <option value="SECURITY_OFFICER">SECURITY_OFFICER</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="DATABASE_ADMIN">DATABASE_ADMIN</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: 700,
                          backgroundColor: u.active ? '#ECFDF5' : '#FEF2F2',
                          color: u.active ? '#065F46' : '#991B1B',
                        }}
                      >
                        {u.active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`btn btn-sm ${u.active ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Power size={12} />
                        <span>{u.active ? 'Suspend' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#14233B' }}>
              Immutable Compliance Audit Logs ({auditLogs.length})
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Append-Only Operational Audit Trail
            </span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp (IST)</th>
                  <th>Operator</th>
                  <th>Action Triggered</th>
                  <th>Target Entity</th>
                  <th>Audit Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false })}
                    </td>
                    <td style={{ fontWeight: 700, color: '#14233B' }}>{log.username}</td>
                    <td>
                      <StatusBadge status={log.action} size="sm" />
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {log.entityType} ({log.entityId || 'N/A'})
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#334155' }}>{log.details}</td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#64748B' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Operator Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 24, 45, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF' }}>
            <div className="card-header" style={{ backgroundColor: '#03111F', color: '#FFFFFF' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Create Authorized Operator</div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. flight_ops_1"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rajesh Kumar"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Assignment</label>
                <select
                  className="form-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  required
                >
                  <option value="BAGGAGE_HANDLER">BAGGAGE_HANDLER</option>
                  <option value="FLIGHT_OPERATOR">FLIGHT_OPERATOR</option>
                  <option value="SECURITY_OFFICER">SECURITY_OFFICER</option>
                  <option value="OPERATIONS_MANAGER">OPERATIONS_MANAGER</option>
                  <option value="ANALYST">ANALYST</option>
                  <option value="DATABASE_ADMIN">DATABASE_ADMIN</option>
                  <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
                  <option value="VIEWER">VIEWER</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creatingUser} className="btn btn-primary">
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
