import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../api';
import { useAuth } from '../auth';

function Unlock() {
  const { unlock } = useAuth();
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await unlock(pass);
    } catch (ex) {
      setErr(ex.message);
    }
  };
  return (
    <form className="card" onSubmit={submit}>
      <h3>Unlock your journal</h3>
      <p className="mute">Enter your journal passphrase. It is used to decrypt your entries and is never stored.</p>
      <div className="row">
        <input className="input grow" type="password" placeholder="Passphrase" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button className="btn">Unlock</button>
      </div>
      {err && <p className="msg" role="alert">{err}</p>}
    </form>
  );
}

function Entries() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [limited, setLimited] = useState(false);
  const [editing, setEditing] = useState(null); // { id, content }
  const [err, setErr] = useState('');

  const load = useCallback(async (search = '') => {
    try {
      const d = await api('/journal' + (search ? `?q=${encodeURIComponent(search)}` : ''));
      setItems(d.items);
      setLimited(d.limited);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    api('/journal/prompt').then((d) => setPrompt(d.prompt));
  }, []);

  // Debounced load; the server only allows search for premium users
  useEffect(() => {
    const t = setTimeout(() => load(user.isPremium ? q : ''), 250);
    return () => clearTimeout(t);
  }, [q, user.isPremium, load]);

  const save = async () => {
    if (!text.trim()) return;
    try {
      await api('/journal', { method: 'POST', body: { content: text, prompt } });
      setText('');
      load(q);
    } catch (e) {
      setErr(e.message);
    }
  };
  const update = async () => {
    await api('/journal/' + editing.id, { method: 'PUT', body: { content: editing.content } });
    setEditing(null);
    load(q);
  };
  const remove = async (id) => {
    if (!confirm('Delete this entry?')) return;
    await api('/journal/' + id, { method: 'DELETE' });
    load(q);
  };

  return (
    <>
      <div className="card">
        <p className="prompt">{prompt}</p>
        <textarea className="input" placeholder="Write freely. Only you can read this." value={text} onChange={(e) => setText(e.target.value)} aria-label="Journal entry" />
        <div className="row"><button className="btn" onClick={save}>Save entry</button></div>
        {err && <p className="msg" role="alert">{err}</p>}
      </div>

      <div className="card">
        <div className="row between">
          <h3>Past entries</h3>
          {user.isPremium ? (
            <input className="input" style={{ maxWidth: 220 }} placeholder="Search all entries" value={q} onChange={(e) => setQ(e.target.value)} />
          ) : (
            <span className="mute">Search is a premium feature</span>
          )}
        </div>
        {limited && <p className="mute">Free plan shows your latest 20 entries.</p>}
        {!items.length && <p className="mute">{q ? 'No entries match.' : 'Nothing here yet. Write your first entry above.'}</p>}
        <AnimatePresence>
          {items.map((e) => (
            <motion.div key={e.id} className="entry" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mute">{new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{e.prompt ? ' · ' + e.prompt : ''}</div>
              {editing?.id === e.id ? (
                <>
                  <textarea className="input" value={editing.content} onChange={(ev) => setEditing({ ...editing, content: ev.target.value })} />
                  <div className="row"><button className="btn" onClick={update}>Save</button><button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button></div>
                </>
              ) : (
                <>
                  <p className="body">{e.content}</p>
                  <div className="row">
                    <button className="link" onClick={() => setEditing({ id: e.id, content: e.content })}>Edit</button>
                    <button className="link" onClick={() => remove(e.id)}>Delete</button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

export default function Journal() {
  const { unlocked } = useAuth();
  return unlocked ? <Entries /> : <Unlock />;
}
