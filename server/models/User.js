const { Schema, model } = require('mongoose');

module.exports = model(
  'User',
  new Schema(
    {
      name: { type: String, required: true, trim: true, maxlength: 60 },
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, required: true }, // bcrypt hash
      keySalt: { type: String, required: true }, // salt for deriving the journal key
      keyCheck: { type: String, required: true }, // encrypted known string, verifies passphrase
      isPremium: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
);
