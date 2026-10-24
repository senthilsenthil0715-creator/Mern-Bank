const jwt = require('jsonwebtoken');
const User = require('../models/User');

const secret = () => process.env.JWT_SECRET || 'dev_secret_change_me';

const sign = (id) => jwt.sign({ id }, secret(), { expiresIn: '7d' });

async function protect(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorised' });
    const { id } = jwt.verify(h.slice(7), secret());
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }
}

const active = (req, res, next) =>
  req.user.status === 'frozen'
    ? res.status(403).json({ message: 'Your account is frozen. Contact support.' })
    : next();

const adminOnly = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ message: 'Admins only' });

module.exports = { sign, protect, active, adminOnly };
