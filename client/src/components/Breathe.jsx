import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s
const PHASES = [
  { label: 'Inhale', s: 4, scale: 1.8 },
  { label: 'Hold', s: 7, scale: 1.8 },
  { label: 'Exhale', s: 8, scale: 1 },
];

export default function Breathe() {
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!running) return;
    setLeft(PHASES[i].s);
    const tick = setInterval(() => setLeft((l) => Math.max(l - 1, 0)), 1000);
    const next = setTimeout(() => setI((x) => (x + 1) % 3), PHASES[i].s * 1000);
    return () => { clearInterval(tick); clearTimeout(next); };
  }, [running, i]);

  const p = PHASES[i];
  const toggle = () => { setRunning(!running); setI(0); };
  const t = (extra) => ({ duration: running ? p.s : 0.4, ease: 'easeInOut', ...extra });
  const to = running ? p.scale : 1;

  return (
    <div className="card center">
      <h3>4-7-8 breathing</h3>
      <p className="mute">Breathe in for 4, hold for 7, out for 8. Follow the circle.</p>
      <div className="stage">
        <motion.div className="ring" animate={{ scale: running ? to * 1.35 : 1 }} transition={t()} style={{ width: 230, height: 230, opacity: 0.25 }} />
        <motion.div className="ring" animate={{ scale: running ? to * 1.2 : 1 }} transition={t()} style={{ width: 180, height: 180, opacity: 0.45 }} />
        <motion.div className="orb" animate={{ scale: to }} transition={t()} aria-live="polite">
          {running ? `${p.label} ${left}` : 'Ready'}
        </motion.div>
      </div>
      <button className="btn" onClick={toggle}>{running ? 'Stop' : 'Start'}</button>
    </div>
  );
}
