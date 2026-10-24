const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    accountNumber: { type: String, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'frozen'], default: 'active' },
    beneficiaries: [{ name: String, accountNumber: String }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', schema);
