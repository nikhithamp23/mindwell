import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../auth';

const fade = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7 } };

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/app' : '/auth';
  return (
    <>
      <header className="top">
        <Link className="logo" to="/">Mind<i>Well</i></Link>
        <div className="row">
          <ThemeToggle />
          <Link className="btn" to={cta}>{user ? 'Open journal' : 'Get started'}</Link>
        </div>
      </header>

      <section className="band">
        <div className="blob" style={{ width: 440, height: 440, right: -140, top: -90 }} />
        <div className="hero">
          <motion.div {...fade}>
            <p className="eyebrow">Private mental wellness journal</p>
            <h1>Find your calm, one page at a time.</h1>
            <p className="lead">Write, track your mood and breathe. Everything you write is encrypted before it is saved, so only you can read it.</p>
            <Link className="btn" to={cta}>Start journaling</Link>
          </motion.div>
          <svg viewBox="0 0 320 400" role="img" aria-label="Vase with leaves in an arch" className="art">
            <path d="M20 70C60 10 150 20 200 50c60 35 100 20 100 90v260H20z" fill="var(--sagel)" />
            <path d="M60 400V170a100 100 0 0 1 200 0v230z" fill="var(--peach)" />
            <g stroke="var(--sea)" strokeWidth="3" fill="none"><path d="M160 262V110M160 215c-30-10-45-35-45-60M160 190c30-10 45-30 45-55" /></g>
            <g fill="var(--sea)">
              <ellipse cx="115" cy="140" rx="10" ry="24" transform="rotate(-20 115 140)" />
              <ellipse cx="205" cy="125" rx="10" ry="24" transform="rotate(20 205 125)" />
              <ellipse cx="160" cy="98" rx="9" ry="22" />
            </g>
            <path d="M130 258h60c28 30 36 90 22 142H108c-14-52-6-112 22-142z" fill="var(--card)" />
          </svg>
        </div>
      </section>

      <section className="band card-bg center" id="approach">
        <motion.div {...fade}>
          <p className="eyebrow">My approach</p>
          <h2>Whole mind. <em>Whole you.</em></h2>
        </motion.div>
        <div className="arches">
          {[
            ['Write privately', 'Gentle daily prompts and AES-256 encryption before anything is saved.', 'var(--peach)'],
            ['Track your mood', 'Log mood and energy, then see your emotional journey as charts.', 'var(--sagel)'],
            ['Breathe', 'A guided 4-7-8 breathing circle to help you slow down.', 'var(--peach)'],
          ].map(([t, p, bg], i) => (
            <motion.div key={t} className="arch" style={{ background: bg }} {...fade} transition={{ duration: 0.7, delay: i * 0.12 }}>
              <h3>{t}</h3>
              <p>{p}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="band center" style={{ background: 'var(--sagel)' }}>
        <motion.div {...fade}>
          <h2>Your data is <em>yours</em>.</h2>
          <p className="lead" style={{ margin: '14px auto' }}>Even a database admin only sees scrambled text. You can export or delete everything at any time.</p>
        </motion.div>
      </section>

      <footer>
        <div className="logo">MindWell</div>
        <p>Whole mind. Whole you.</p>
        <p>This is a demo project. If you are in crisis, please contact your local emergency services.</p>
      </footer>
    </>
  );
}
