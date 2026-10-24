const User = require('./models/User');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

async function genAccountNumber() {
  for (;;) {
    const n = 'NX' + Math.floor(1e9 + Math.random() * 9e9);
    if (!(await User.exists({ accountNumber: n }))) return n;
  }
}

const parseAmount = (v) => {
  const n = Math.round(Number(v) * 100) / 100;
  return Number.isFinite(n) && n > 0 && n <= 1000000 ? n : null;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { wrap, genAccountNumber, parseAmount, escapeRegex };
