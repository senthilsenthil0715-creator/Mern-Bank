import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg, money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const CATS = ['General', 'Rent', 'Food', 'Bills', 'Shopping', 'Travel', 'Family', 'Health'];

export default function Payments() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = ['deposit', 'withdraw', 'transfer'].includes(params.get('tab')) ? params.get('tab') : 'transfer';
  const [f, setF] = useState({ amount: '', note: '', toAccount: '', category: 'General', save: false });
  const [payee, setPayee] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  useEffect(() => { setPayee(null); setConfirm(false); }, [tab]);

  const lookup = async (acc) => {
    const a = acc.trim().toUpperCase();
    setF((x) => ({ ...x, toAccount: a }));
    if (a.length < 6) return setPayee(null);
    try {
      const { data } = await api.get(`/bank/lookup/${encodeURIComponent(a)}`);
      setPayee(data);
    } catch { setPayee(null); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (tab === 'transfer' && !confirm) {
      if (!payee) return toast('Enter a valid recipient account number', 'err');
      if (!(Number(f.amount) > 0)) return toast('Enter an amount', 'err');
      return setConfirm(true);
    }
    setBusy(true);
    try {
      const body = { amount: f.amount, note: f.note };
      if (tab === 'transfer') Object.assign(body, { toAccount: f.toAccount, category: f.category, saveBeneficiary: f.save });
      const { data } = await api.post(`/bank/${tab}`, body);
      setUser(data.user);
      toast(data.message);
      setF({ amount: '', note: '', toAccount: '', category: 'General', save: false });
      setPayee(null); setConfirm(false);
    } catch (x) {
      toast(errMsg(x), 'err'); setConfirm(false);
    } finally { setBusy(false); }
  };

  const removePayee = async (acc) => {
    try { const { data } = await api.delete(`/bank/beneficiaries/${acc}`); setUser(data.user); toast(data.message); }
    catch (x) { toast(errMsg(x), 'err'); }
  };

  return (
    <div className="grid pay">
      <section className="panel">
        <div className="tabs">
          {['transfer', 'deposit', 'withdraw'].map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setParams({ tab: t })}>
              {t === 'transfer' ? 'Send money' : t === 'deposit' ? 'Add money' : 'Withdraw'}
            </button>
          ))}
        </div>
        <p className="muted">Available balance: <strong>{money(user.balance)}</strong></p>
        <form onSubmit={submit} className="form">
          {tab === 'transfer' && (
            <>
              <label>Recipient account number
                <input value={f.toAccount} onChange={(e) => lookup(e.target.value)} placeholder="NX1234567890" required />
              </label>
              {payee && <div className="payee">Sending to <strong>{payee.name}</strong></div>}
              <label>Category
                <select value={f.category} onChange={set('category')}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
              </label>
            </>
          )}
          <label>Amount (₹)
            <input type="number" min="0.01" max="1000000" step="0.01" value={f.amount} onChange={set('amount')} required />
          </label>
          <label>Note (optional)
            <input maxLength={120} value={f.note} onChange={set('note')} />
          </label>
          {tab === 'transfer' && (
            <label className="check"><input type="checkbox" checked={f.save} onChange={set('save')} /> Save recipient for next time</label>
          )}
          {confirm ? (
            <div className="confirm">
              <p>Send <strong>{money(Number(f.amount))}</strong> to <strong>{payee && payee.name}</strong> ({f.toAccount})?</p>
              <div className="row">
                <button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Confirm and send'}</button>
                <button type="button" className="btn ghost" onClick={() => setConfirm(false)}>Edit</button>
              </div>
            </div>
          ) : (
            <button className="btn" disabled={busy || user.status === 'frozen'}>
              {tab === 'transfer' ? 'Review transfer' : tab === 'deposit' ? 'Add money' : 'Withdraw'}
            </button>
          )}
        </form>
      </section>

      <section className="panel">
        <h3>Saved recipients</h3>
        {user.beneficiaries && user.beneficiaries.length ? (
          <ul className="payees">
            {user.beneficiaries.map((b) => (
              <li key={b.accountNumber}>
                <button className="link" onClick={() => { setParams({ tab: 'transfer' }); lookup(b.accountNumber); }}>
                  <strong>{b.name}</strong><small>{b.accountNumber}</small>
                </button>
                <button className="link danger" onClick={() => removePayee(b.accountNumber)}>Remove</button>
              </li>
            ))}
          </ul>
        ) : <div className="empty">Tick “Save recipient” when sending money and they will show up here.</div>}
      </section>
    </div>
  );
}
