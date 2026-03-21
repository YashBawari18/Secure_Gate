import React, { useEffect, useState } from 'react';
import { usersAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function Residents() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: 'changeme123', role: 'resident', phone: '', flatNumber: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ role: 'resident' });
      setUsers(res.data.users);
    } catch { toast.error('Failed to load residents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.flatNumber) return toast.error('Fill all required fields');
    try {
      await usersAPI.create(form);
      toast.success('Resident added');
      setShowForm(false);
      setForm({ name: '', email: '', password: 'changeme123', role: 'resident', phone: '', flatNumber: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add'); }
  };

  const handleToggle = async (id, isActive) => {
    try {
      await usersAPI.update(id, { isActive: !isActive });
      toast.success(isActive ? 'Resident deactivated' : 'Resident activated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--tx2)' }}>{users.length} registered resident{users.length !== 1 ? 's' : ''}</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add resident'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16, maxWidth: 500 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Add new resident</div>
          <form onSubmit={handleCreate}>
            <div className="grid2">
              <div className="form-group">
                <label className="form-label">Full name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Resident name" />
              </div>
              <div className="form-group">
                <label className="form-label">Flat number *</label>
                <input className="form-input" value={form.flatNumber} onChange={e => setForm(f => ({ ...f, flatNumber: e.target.value }))} placeholder="e.g. 4B" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 xxxxxxxxxx" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Create resident account</button>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Resident</th><th>Flat</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--tx3)', padding: 28 }}>No residents found</td></tr>
              ) : users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div className="avatar" style={{ width: 28, height: 28, fontSize: 10, background: '#eff4ff', color: 'var(--pri)' }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ fontWeight: 500 }}>{u.name}</div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{u.flatNumber || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--tx2)' }}>{u.email}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{u.phone || '—'}</td>
                  <td><span className={`badge badge-${u.isActive ? 'green' : 'red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(u._id, u.isActive)}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
