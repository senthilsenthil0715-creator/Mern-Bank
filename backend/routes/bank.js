const router = require('express').Router();
const User = require('../models/User');
const Tx = require('../models/Transaction');
const { protect, active } = require('../middleware/auth');
const { wrap, parseAmount, escapeRegex } = require('../utils');

router.use(protect);

const BAD_AMOUNT = 'Enter an amount between 0.01 and 10,00,000';
const note = (v, d) => String(v || d).trim().slice(0, 120) || d;
const category = (v) => String(v || 'General').trim().slice(0, 30) || 'General';

router.post('/deposit', active, wrap(async (req, res) => {
  const amount = parseAmount(req.body.amount);
  if (!amount) return res.status(400).json({ message: BAD_AMOUNT });
  const u = await User.findByIdAndUpdate(req.user._id, { $inc: { balance: amount } }, { new: true }).select('-password');
  await Tx.create({ type: 'deposit', amount, toUser: u._id, toAccount: u.accountNumber, note: note(req.body.note, 'Cash deposit'), category: 'Deposit' });
  res.json({ user: u, message: 'Deposit successful' });
}));

router.post('/withdraw', active, wrap(async (req, res) => {
  const amount = parseAmount(req.body.amount);
  if (!amount) return res.status(400).json({ message: BAD_AMOUNT });
  const u = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  ).select('-password');
  if (!u) return res.status(400).json({ message: 'Insufficient balance' });
  await Tx.create({ type: 'withdraw', amount, fromUser: u._id, fromAccount: u.accountNumber, note: note(req.body.note, 'Cash withdrawal'), category: 'Withdrawal' });
  res.json({ user: u, message: 'Withdrawal successful' });
}));

router.get('/lookup/:acc', wrap(async (req, res) => {
  const u = await User.findOne({ accountNumber: String(req.params.acc).trim().toUpperCase(), status: 'active' }).select('name accountNumber');
  if (!u) return res.status(404).json({ message: 'Account not found' });
  res.json({ name: u.name, accountNumber: u.accountNumber });
}));

router.post('/transfer', active, wrap(async (req, res) => {
  const amount = parseAmount(req.body.amount);
  if (!amount) return res.status(400).json({ message: BAD_AMOUNT });
  const toAcc = String(req.body.toAccount || '').trim().toUpperCase();
  if (toAcc === req.user.accountNumber) return res.status(400).json({ message: 'You cannot transfer to your own account' });
  const receiver = await User.findOne({ accountNumber: toAcc });
  if (!receiver) return res.status(404).json({ message: 'Recipient account not found' });
  if (receiver.status === 'frozen') return res.status(400).json({ message: 'Recipient account cannot receive funds right now' });

  const sender = await User.findOneAndUpdate(
    { _id: req.user._id, balance: { $gte: amount } },
    { $inc: { balance: -amount } },
    { new: true }
  ).select('-password');
  if (!sender) return res.status(400).json({ message: 'Insufficient balance' });

  try {
    await User.updateOne({ _id: receiver._id }, { $inc: { balance: amount } });
  } catch (e) {
    await User.updateOne({ _id: sender._id }, { $inc: { balance: amount } }); // refund
    throw e;
  }
  await Tx.create({
    type: 'transfer', amount,
    fromUser: sender._id, toUser: receiver._id,
    fromAccount: sender.accountNumber, toAccount: receiver.accountNumber,
    note: note(req.body.note, 'Fund transfer'), category: category(req.body.category)
  });

  if (req.body.saveBeneficiary && !sender.beneficiaries.some((b) => b.accountNumber === toAcc)) {
    await User.updateOne({ _id: sender._id }, { $push: { beneficiaries: { name: receiver.name, accountNumber: toAcc } } });
  }
  const fresh = await User.findById(sender._id).select('-password');
  res.json({ user: fresh, message: `Sent to ${receiver.name}` });
}));

router.get('/transactions', wrap(async (req, res) => {
  const id = req.user._id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const q = { $or: [{ fromUser: id }, { toUser: id }] };
  if (['deposit', 'withdraw', 'transfer'].includes(req.query.type)) q.type = req.query.type;
  const search = String(req.query.search || '').trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    q.$and = [{ $or: [{ note: rx }, { fromAccount: rx }, { toAccount: rx }, { category: rx }] }];
  }
  const [total, rows] = await Promise.all([
    Tx.countDocuments(q),
    Tx.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
      .populate('fromUser toUser', 'name').lean()
  ]);
  const items = rows.map((t) => {
    const credit = t.toUser && String(t.toUser._id) === String(id);
    return {
      _id: t._id, type: t.type, amount: t.amount, note: t.note, category: t.category,
      createdAt: t.createdAt, direction: credit ? 'credit' : 'debit',
      counterparty: credit ? (t.fromUser ? t.fromUser.name : 'Self') : (t.toUser ? t.toUser.name : 'Self'),
      counterAccount: credit ? t.fromAccount : t.toAccount
    };
  });
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get('/summary', wrap(async (req, res) => {
  const id = req.user._id;
  const start = new Date();
  start.setDate(1); start.setHours(0, 0, 0, 0); start.setMonth(start.getMonth() - 5);
  const rows = await Tx.find({ createdAt: { $gte: start }, $or: [{ fromUser: id }, { toUser: id }] }).lean();
  const months = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString('en-IN', { month: 'short' }), income: 0, expense: 0 });
  }
  const cats = {};
  let income = 0, expense = 0;
  rows.forEach((t) => {
    const d = new Date(t.createdAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    const credit = t.toUser && String(t.toUser) === String(id);
    if (credit) { income += t.amount; if (m) m.income += t.amount; }
    else { expense += t.amount; if (m) m.expense += t.amount; cats[t.category] = (cats[t.category] || 0) + t.amount; }
  });
  res.json({
    income, expense,
    months: months.map(({ month, income: i, expense: e }) => ({ month, income: Math.round(i * 100) / 100, expense: Math.round(e * 100) / 100 })),
    categories: Object.entries(cats).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
  });
}));

router.post('/beneficiaries', wrap(async (req, res) => {
  const acc = String(req.body.accountNumber || '').trim().toUpperCase();
  if (acc === req.user.accountNumber) return res.status(400).json({ message: 'That is your own account' });
  const target = await User.findOne({ accountNumber: acc });
  if (!target) return res.status(404).json({ message: 'Account not found' });
  if (req.user.beneficiaries.some((b) => b.accountNumber === acc)) return res.status(409).json({ message: 'Already saved' });
  const u = await User.findByIdAndUpdate(req.user._id, { $push: { beneficiaries: { name: target.name, accountNumber: acc } } }, { new: true }).select('-password');
  res.json({ user: u, message: 'Beneficiary saved' });
}));

router.delete('/beneficiaries/:acc', wrap(async (req, res) => {
  const u = await User.findByIdAndUpdate(req.user._id, { $pull: { beneficiaries: { accountNumber: req.params.acc } } }, { new: true }).select('-password');
  res.json({ user: u, message: 'Beneficiary removed' });
}));

module.exports = router;
