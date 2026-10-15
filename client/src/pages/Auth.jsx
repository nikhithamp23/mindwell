import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Auth() {
  const { user, authenticate } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '', passphrase: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const payload = mode === 'login' ? { email: f.email, password: f.password } : f;
      await authenticate(mode, payload);
      nav('/app');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="narrow">
      <Link className="logo" to="/">Mind<i>Well</i></Link>
      <form className="card" onSubmit={submit}>
        <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        {mode === 'register' && <input className="input" placeholder="Name" value={f.name} onChange={set('name')} required />}
        <input className="input" type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
        <input className="input" type="password" placeholder="Password (min 8 characters)" value={f.password} onChange={set('password')} required />
        {mode === 'register' && (
          <>
            <input className="input" type="password" placeholder="Journal passphrase (min 8, different from password)" value={f.passphrase} onChange={set('passphrase')} required />
            <p className="mute">Your passphrase encrypts your journal. It is never stored, and it cannot be recovered if you forget it.</p>
          </>
        )}
        {err && <p className="msg" role="alert">{err}</p>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </form>
    </main>
  );
}
