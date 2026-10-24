import { useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/password', f);
      toast(data.message);
      setF({ current: '', next: '' });
    } catch (x) { toast(errMsg(x), 'err'); }
  };

  return (
    <div className="grid pay">
      <section className="panel">
        <h3>Profile</h3>
        <dl className="kv">
          <dt>Name</dt><dd>{user.name}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Account number</dt><dd>{user.accountNumber}</dd>
          <dt>Status</dt><dd><span className={`pill ${user.status}`}>{user.status}</span></dd>
        </dl>
      </section>
      <section className="panel">
        <h3>Change password</h3>
        <form className="form" onSubmit={submit}>
          <label>Current password<input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></label>
          <label>New password<input type="password" minLength={6} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required /></label>
          <button className="btn">Update password</button>
        </form>
      </section>
    </div>
  );
}
