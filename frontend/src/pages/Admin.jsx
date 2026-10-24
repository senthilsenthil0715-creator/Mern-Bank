import { useEffect, useState } from 'react';
import api, { errMsg, money } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Admin() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const load = () =>
    Promise.all([api.get('/admin/stats'), api.get('/admin/users')])
      .then(([s, u]) => { setStats(s.data); setUsers(u.data.users); })
      .catch((x) => toast(errMsg(x), 'err'));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const toggle = async (u) => {
    try {
      await api.patch(`/admin/users/${u._id}/status`, { status: u.status === 'active' ? 'frozen' : 'active' });
      toast(u.status === 'active' ? 'Account frozen' : 'Account unfrozen');
      load();
    } catch (x) { toast(errMsg(x), 'err'); }
  };

  return (
    <div className="grid">
      <section className="panel stats four">
        <div><small>Customers</small><strong>{stats ? stats.users : '–'}</strong></div>
        <div><small>Frozen accounts</small><strong>{stats ? stats.frozen : '–'}</strong></div>
        <div><small>Deposits held</small><strong>{money(stats && stats.totalBalance)}</strong></div>
        <div><small>Transactions</small><strong>{stats ? stats.txCount : '–'}</strong></div>
      </section>
      <section className="panel wide">
        <h3>Customers</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Account</th><th>Balance</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.name}</td><td>{u.email}</td><td>{u.accountNumber}</td><td>{money(u.balance)}</td>
                  <td><span className={`pill ${u.status}`}>{u.status}</span></td>
                  <td><button className="btn ghost sm" onClick={() => toggle(u)}>{u.status === 'active' ? 'Freeze' : 'Unfreeze'}</button></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="6" className="empty">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
