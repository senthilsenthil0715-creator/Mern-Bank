const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sign, protect } = require('../middleware/auth');
const { wrap, genAccountNumber } = require('../utils');

const clean = (u) => {
  const o = u.toObject ? u.toObject() : u;
  delete o.password;
  return o;
};

router.post('/register', wrap(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2) return res.status(400).json({ message: 'Enter your full name' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (await User.exists({ email })) return res.status(409).json({ message: 'Email is already registered' });
  const user = await User.create({
    name, email,
    password: await bcrypt.hash(password, 10),
    accountNumber: await genAccountNumber()
  });
  res.status(201).json({ token: sign(user._id), user: clean(user) });
}));

router.post('/login', wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password)))
    return res.status(401).json({ message: 'Incorrect email or password' });
  res.json({ token: sign(user._id), user: clean(user) });
}));

router.get('/me', protect, (req, res) => res.json({ user: req.user }));

router.put('/password', protect, wrap(async (req, res) => {
  const { current, next } = req.body;
  if (!next || String(next).length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters' });
  const user = await User.findById(req.user._id);
  if (!(await bcrypt.compare(String(current || ''), user.password)))
    return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = await bcrypt.hash(String(next), 10);
  await user.save();
  res.json({ message: 'Password updated' });
}));

module.exports = router;
