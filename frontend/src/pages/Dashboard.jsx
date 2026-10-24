import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { money } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import TxList from '../components/TxList.jsx';

const COLORS = ['#0f766e', '#f2a93b', '#c4472d', '#3b6fb6', '#7a5cc2', '#6b7f7d'];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [sum, setSum] = useState(null);
  const [recent, setRecent] = useState([]);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/bank/summary'), api.get('/bank/transactions?limit=6')])
      .then(([s, t]) => { setSum(s.data); setRecent(t.data.items); })
      .catch(() => toast('Could not load your dashboard', 'err'));
  }, [user.balance, toast]);

  const copy = () => {
    if (navigator.clipboard) navigator.clipboard.writeText(user.accountNumber).then(() => toast('Account number copied'));
  };

  return (
    <div className="grid dash">
      <section className="bankcard">
        <div className="bc-top">
          <span>Savings account</span>
          <button className="link" onClick={() => setHide(!hide)}>{hide ? 'Show' : 'Hide'}</button>
        </div>
        <div className="bc-bal">{hide ? '₹ ••••••' : money(user.balance)}</div>
        <div className="bc-bot">
          <div>
            <small>Account number</small>
            <strong>{user.accountNumber}</strong>
          </div>
          <button className="btn light sm" onClick={copy}>Copy</button>
        </div>
        <div className="bc-actions">
          <Link className="btn light" to="/payments?tab=transfer">Send money</Link>
          <Link className="btn light" to="/payments?tab=deposit">Add money</Link>
          <Link className="btn light" to="/payments?tab=withdraw">Withdraw</Link>
        </div>
      </section>

      <section className="panel stats">
        <div><small>Money in (6 months)</small><strong className="credit">{money(sum && sum.income)}</strong></div>
        <div><small>Money out (6 months)</small><strong className="debit">{money(sum && sum.expense)}</strong></div>
      </section>

      <section className="panel">
        <h3>Income vs spending</h3>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sum ? sum.months : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="month" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" width={60} />
              <Tooltip formatter={(v) => money(v)} contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="income" name="Money in" fill="#0f766e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Money out" fill="#f2a93b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h3>Where your money goes</h3>
        <div className="chart">
          {sum && sum.categories.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sum.categories} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {sum.categories.map((c, i) => <Cell key={c.name} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty">Spending categories appear after your first payment.</div>}
        </div>
      </section>

      <section className="panel wide">
        <div className="row-between"><h3>Recent activity</h3><Link to="/transactions">View all</Link></div>
        <TxList items={recent} />
      </section>
    </div>
  );
}
