import { dateFmt, money } from '../api.js';

export default function TxList({ items }) {
  if (!items.length) return <div className="empty">No transactions yet. Make a deposit or send money to get started.</div>;
  return (
    <ul className="txlist">
      {items.map((t) => (
        <li key={t._id}>
          <span className={`dot ${t.direction}`}>{t.direction === 'credit' ? '+' : '−'}</span>
          <div className="tx-main">
            <strong>{t.type === 'transfer' ? (t.direction === 'credit' ? `From ${t.counterparty}` : `To ${t.counterparty}`) : t.note}</strong>
            <small>{dateFmt(t.createdAt)} · {t.category}</small>
          </div>
          <b className={t.direction}>{t.direction === 'credit' ? '+' : '−'}{money(t.amount)}</b>
        </li>
      ))}
    </ul>
  );
}
