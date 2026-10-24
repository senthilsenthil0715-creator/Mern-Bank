const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Tx = require('../models/Transaction');
const { protect, adminOnly } = require('../middleware/auth');
const { wrap } = require('../utils');

router.use(protect, adminOnly);

router.get('/stats', wrap(async (req, res) => {
  const [users, frozen, txCount, bal, vol] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ status: 'frozen' }),
    Tx.countDocuments(),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Tx.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);
  res.json({ users, frozen, txCount, totalBalance: (bal[0] && bal[0].total) || 0, volume: (vol[0] && vol[0].total) || 0 });
}));

router.get('/users', wrap(async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password -beneficiaries').sort({ createdAt: -1 }).limit(200);
  res.json({ users });
}));

router.patch('/users/:id/status', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user id' });
  const status = req.body.status === 'frozen' ? 'frozen' : 'active';
  const u = await User.findOneAndUpdate({ _id: req.params.id, role: 'user' }, { status }, { new: true }).select('-password -beneficiaries');
  if (!u) return res.status(404).json({ message: 'User not found' });
  res.json({ user: u });
}));

module.exports = router;
