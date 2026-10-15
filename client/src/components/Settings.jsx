import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Settings() {
  const { user, unlocked, setPlan, logout } = useAuth();
  const nav = useNavigate();
  const [msg, setMsg] = useState('');

  const download = async (format) => {
    if (!unlocked) return setMsg('Unlock your journal first (Journal tab) so your entries can be decrypted for export.');
    try {
      const blob = await api('/user/export?format=' + format, { blob: true });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mindwell-export.' + format;
      a.click();
      URL.revokeObjectURL(a.href);
      setMsg('Export downloaded');
    } catch (e) {
      setMsg(e.message);
    }
  };

  const wipe = async () => {
    if (!confirm('Delete your account and ALL data? This cannot be undone.')) return;
    await api('/user/me', { method: 'DELETE' });
    logout();
    nav('/');
  };

  return (
    <>
      <div className="card">
        <h3>How your privacy works</h3>
        <p className="mute">Journal entries are encrypted with AES-256-GCM using a key derived from your passphrase (scrypt). Only scrambled text is stored in the database. Your passphrase is never saved.</p>
      </div>
      <div className="card">
        <h3>Your plan</h3>
        <p className="mute">{user.isPremium ? 'Premium: full history and search, weekly and monthly analytics, emotion breakdown.' : 'Free: journaling, breathing, latest 20 entries and last 7 mood check-ins.'}</p>
        <button className="btn" onClick={() => setPlan(!user.isPremium)}>{user.isPremium ? 'Switch to free' : 'Try premium (demo)'}</button>
      </div>
      <div className="card">
        <h3>Take your data with you</h3>
        <p className="mute">Download all your entries and mood logs.</p>
        <div className="row">
          <button className="btn" onClick={() => download('json')}>Export JSON</button>
          <button className="btn" onClick={() => download('pdf')}>Export PDF</button>
          <button className="btn ghost" onClick={wipe}>Delete account</button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </>
  );
}
