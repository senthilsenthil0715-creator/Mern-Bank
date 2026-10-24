const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    type: { type: String, enum: ['deposit', 'withdraw', 'transfer'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromAccount: String,
    toAccount: String,
    note: { type: String, default: '', maxlength: 120 },
    category: { type: String, default: 'General', maxlength: 30 }
  },
  { timestamps: true }
);
schema.index({ fromUser: 1, createdAt: -1 });
schema.index({ toUser: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', schema);
