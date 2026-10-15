const router = require('express').Router();
const Journal = require('../models/Journal');
const { auth, requireKey } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/crypto');

const FREE_HISTORY_LIMIT = 20; // free users see their latest 20 entries
const PROMPTS = [
  'What made you smile today?',
  'What is one thing you are grateful for right now?',
  "What's weighing on you, and what would help?",
  'Describe a small moment of calm from today.',
  'Who made your day easier, and how?',
  'What would you tell a friend feeling the way you do?',
  'What are you looking forward to this week?',
  'What is one thing you did well today?',
];

const view = (d, content) => ({ id: d.id, prompt: d.prompt, createdAt: d.createdAt, content });

router.use(auth);

// Daily prompt (does not need the passphrase)
router.get('/prompt', (req, res) => {
  const day = Math.floor(Date.now() / 86400000);
  res.json({ prompt: PROMPTS[day % PROMPTS.length] });
});

router.post('/', requireKey, async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Entry cannot be empty' });
  const doc = await Journal.create({
    user: req.user.id,
    prompt: req.body.prompt,
    content: encrypt(content, req.key), // encrypted BEFORE it reaches MongoDB
  });
  res.status(201).json(view(doc, content));
});

router.get('/', requireKey, async (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  if (q && !req.user.isPremium)
    return res.status(403).json({ message: 'Search is a premium feature', code: 'PREMIUM_REQUIRED' });

  const docs = await Journal.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(req.user.isPremium ? 0 : FREE_HISTORY_LIMIT); // 0 = no limit
  let items = docs.map((d) => view(d, decrypt(d.content, req.key)));
  // Content is encrypted, so search happens after decryption, in memory
  if (q) items = items.filter((i) => i.content.toLowerCase().includes(q));
  res.json({ items, limited: !req.user.isPremium });
});

router.put('/:id', requireKey, async (req, res) => {
  const content = (req.body.content || '').trim();
  if (!content) return res.status(400).json({ message: 'Entry cannot be empty' });
  const doc = await Journal.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { content: encrypt(content, req.key) },
    { new: true }
  );
  if (!doc) return res.status(404).json({ message: 'Entry not found' });
  res.json(view(doc, content));
});

router.delete('/:id', async (req, res) => {
  const doc = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  if (!doc) return res.status(404).json({ message: 'Entry not found' });
  res.json({ ok: true });
});

module.exports = router;
