const router = require('express').Router();
const mongoose = require('mongoose');
const Mood = require('../models/Mood');
const { auth, requirePremium } = require('../middleware/auth');

const valid = (n) => Number.isInteger(n) && n >= 1 && n <= 10;
router.use(auth);

router.post('/', async (req, res) => {
  const { mood, energy, emotions = [] } = req.body;
  if (!valid(mood) || !valid(energy))
    return res.status(400).json({ message: 'Mood and energy must be whole numbers from 1 to 10' });
  const doc = await Mood.create({
    user: req.user.id,
    mood,
    energy,
    emotions: emotions.slice(0, 8).map(String),
  });
  res.status(201).json(doc);
});

// Free: last 7 check-ins. Premium: full history.
router.get('/', async (req, res) => {
  const items = await Mood.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(req.user.isPremium ? 0 : 7);
  res.json({ items: items.reverse(), limited: !req.user.isPremium });
});

// Premium: aggregation queries (average by week/month + emotion counts)
router.get('/analytics', requirePremium, async (req, res) => {
  const format = req.query.period === 'month' ? '%Y-%m' : '%G-W%V';
  const match = { $match: { user: new mongoose.Types.ObjectId(req.user.id) } };

  const [trend, emotions] = await Promise.all([
    Mood.aggregate([
      match,
      {
        $group: {
          _id: { $dateToString: { format, date: '$createdAt' } },
          avgMood: { $avg: '$mood' },
          avgEnergy: { $avg: '$energy' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Mood.aggregate([
      match,
      { $unwind: '$emotions' },
      { $group: { _id: '$emotions', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    trend: trend.map((t) => ({
      period: t._id,
      avgMood: +t.avgMood.toFixed(2),
      avgEnergy: +t.avgEnergy.toFixed(2),
      count: t.count,
    })),
    emotions: emotions.map((e) => ({ emotion: e._id, count: e.count })),
  });
});

module.exports = router;
