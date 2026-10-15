const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { deriveKey, encrypt, CHECK } = require('../utils/crypto');

const sign = (u) => jwt.sign({ id: u.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, isPremium: u.isPremium });

router.post('/register', async (req, res) => {
  const { name, email, password, passphrase } = req.body;
  if (!name || !email || !password || !passphrase)
    return res.status(400).json({ message: 'All fields are required' });
  if (password.length < 8 || passphrase.length < 8)
    return res.status(400).json({ message: 'Password and passphrase need at least 8 characters' });
  if (password === passphrase)
    return res.status(400).json({ message: 'Passphrase must be different from your password' });
  if (await User.findOne({ email: String(email).toLowerCase() }))
    return res.status(409).json({ message: 'Email already registered' });

  const keySalt = crypto.randomBytes(16).toString('hex');
  const key = await deriveKey(passphrase, keySalt);
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    keySalt,
    keyCheck: encrypt(CHECK, key),
  });
  res.status(201).json({ token: sign(user), user: pub(user) });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.password)))
    return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: sign(user), user: pub(user) });
});

module.exports = router;
