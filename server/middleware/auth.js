const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { deriveKey, decrypt, CHECK } = require('../utils/crypto');

// Verifies the JWT and loads the user
exports.auth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not logged in' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) throw new Error('no user');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

// Derives the AES key from the passphrase header and checks it is correct
exports.requireKey = async (req, res, next) => {
  const raw = req.headers['x-journal-key'];
  if (!raw) return res.status(400).json({ message: 'Passphrase required', code: 'KEY_REQUIRED' });
  try {
    const key = await deriveKey(decodeURIComponent(raw), req.user.keySalt);
    if (decrypt(req.user.keyCheck, key) !== CHECK) throw new Error('bad key');
    req.key = key;
    next();
  } catch {
    res.status(403).json({ message: 'Wrong passphrase', code: 'BAD_KEY' });
  }
};

// Premium flag gate
exports.requirePremium = (req, res, next) =>
  req.user.isPremium
    ? next()
    : res.status(403).json({ message: 'This is a premium feature', code: 'PREMIUM_REQUIRED' });
