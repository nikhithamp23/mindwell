const router = require('express').Router();
const PDFDocument = require('pdfkit');
const User = require('../models/User');
const Journal = require('../models/Journal');
const Mood = require('../models/Mood');
const { auth, requireKey } = require('../middleware/auth');
const { decrypt } = require('../utils/crypto');

const pub = (u) => ({ id: u.id, name: u.name, email: u.email, isPremium: u.isPremium });
router.use(auth);

router.get('/me', (req, res) => res.json({ user: pub(req.user) }));

// DEMO upgrade. In production, set isPremium from a payment webhook (e.g. Stripe).
router.patch('/plan', async (req, res) => {
  req.user.isPremium = !!req.body.premium;
  await req.user.save();
  res.json({ user: pub(req.user) });
});

// GDPR data export: ?format=json (default) or ?format=pdf
router.get('/export', requireKey, async (req, res) => {
  const [docs, moods] = await Promise.all([
    Journal.find({ user: req.user.id }).sort({ createdAt: 1 }),
    Mood.find({ user: req.user.id }).sort({ createdAt: 1 }),
  ]);
  const entries = docs.map((d) => ({
    date: d.createdAt,
    prompt: d.prompt,
    content: decrypt(d.content, req.key),
  }));

  if (req.query.format === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="mindwell-export.pdf"');
    const pdf = new PDFDocument({ margin: 50 });
    pdf.pipe(res);
    pdf.fontSize(22).text('MindWell export');
    pdf.fontSize(10).fillColor('#666').text(`${req.user.name} · ${new Date().toLocaleDateString()}`);
    pdf.moveDown().fontSize(16).fillColor('#000').text('Journal entries');
    entries.forEach((e) => {
      pdf.moveDown().fontSize(10).fillColor('#666')
        .text(new Date(e.date).toLocaleString() + (e.prompt ? ' · ' + e.prompt : ''));
      pdf.fontSize(12).fillColor('#000').text(e.content);
    });
    pdf.addPage().fontSize(16).text('Mood log');
    moods.forEach((m) =>
      pdf.moveDown(0.5).fontSize(11)
        .text(`${new Date(m.createdAt).toLocaleDateString()}  mood ${m.mood}/10  energy ${m.energy}/10  ${m.emotions.join(', ')}`)
    );
    return pdf.end();
  }

  res.setHeader('Content-Disposition', 'attachment; filename="mindwell-export.json"');
  res.json({
    exportedAt: new Date(),
    user: pub(req.user),
    entries,
    moods: moods.map((m) => ({ date: m.createdAt, mood: m.mood, energy: m.energy, emotions: m.emotions })),
  });
});

// Right to erasure: delete the account and all data
router.delete('/me', async (req, res) => {
  await Promise.all([
    Journal.deleteMany({ user: req.user.id }),
    Mood.deleteMany({ user: req.user.id }),
    User.findByIdAndDelete(req.user.id),
  ]);
  res.json({ ok: true });
});

module.exports = router;
