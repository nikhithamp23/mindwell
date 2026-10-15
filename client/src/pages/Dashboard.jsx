import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import ThemeToggle from '../components/ThemeToggle';
import Journal from '../components/Journal';
import Mood from '../components/Mood';
import Breathe from '../components/Breathe';
import Settings from '../components/Settings';

const TABS = { Journal, Mood, Breathe, 'Privacy & data': Settings };

export default function Dashboard() {
  const { user, unlocked, lock, logout } = useAuth();
  const [tab, setTab] = useState('Journal');
  const Active = TABS[tab];

  return (
    <>
      <header className="top">
        <Link className="logo" to="/">Mind<i>Well</i></Link>
        <div className="row">
          <span className="mute hide-sm">{user.name}{user.isPremium ? ' · Premium' : ''}</span>
          <ThemeToggle />
          {unlocked && <button className="btn ghost" onClick={lock}>Lock</button>}
          <button className="btn ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="wrap">
        <div className="tabs" role="tablist">
          {Object.keys(TABS).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className="tab" onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <Active />
      </main>
    </>
  );
}
