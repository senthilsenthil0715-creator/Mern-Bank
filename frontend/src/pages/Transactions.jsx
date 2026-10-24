import { useCallback, useEffect, useState } from 'react';
import api, { dateFmt, errMsg } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import TxList from '../components/TxList.jsx';

export default function Transactions() {
  const toast = useToast();
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { const t = setTimeout(() => { setQ(search); setPage(1); }, 350); return () => clearTimeout(t); }, [search]);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/bank/transactions', { params: { page, limit: 10, type, search: q } });
      setData(d);
    } catch (x) { toast(errMsg(x), 'err'); }
  }, [page, type, q, toast]);
  useEffect(() => { load(); }, [load]);

  const exportCsv = async () => {
    try {
      const { data: d } = await api.get('/bank/transactions', { params: { limit: 500, type, search: q } });
      const rows = [['Date', 'Type', 'Direction', 'Counterparty', 'Category', 'Note', 'Amount']].concat(
        d.items.map((t) => [dateFmt(t.createdAt), t.type, t.direction, t.counterparty, t.category, t.note, t.amount])
      );
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'nexa-statement.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (x) { toast(errMsg(x), 'err'); }
  };

  return (
    <section className="panel">
      <div className="row-between wrap">
        <h3>Statements <small className="muted">({data.total})</small></h3>
        <div className="row">
          <input className="inp" placeholder="Search note, category, account" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="inp" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
            <option value="transfer">Transfers</option>
          </select>
          <button className="btn ghost sm" onClick={exportCsv}>Download CSV</button>
        </div>
      </div>
      <TxList items={data.items} />
      <div className="pager">
        <button className="btn ghost sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
        <span>Page {data.page} of {data.pages}</span>
        <button className="btn ghost sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </section>
  );
}
