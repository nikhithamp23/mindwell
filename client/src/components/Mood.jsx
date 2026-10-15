import { useCallback, useEffect, useState } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { api } from '../api';
import { useAuth } from '../auth';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const FACES = ['😭', '😢', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩'];
const EMOTIONS = ['Calm', 'Grateful', 'Happy', 'Anxious', 'Tired', 'Sad', 'Irritable', 'Hopeful'];
const COLORS = ['#5d7557', '#d9a566', '#c9788a', '#a8704f', '#6f8fb0', '#7b8a94', '#c4684f', '#8dae6b'];
const scales = { y: { min: 1, max: 10, ticks: { stepSize: 1 } } };

export default function Mood() {
  const { user, setPlan } = useAuth();
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(5);
  const [emos, setEmos] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('week');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const d = await api('/mood');
    setItems(d.items);
    setStats(user.isPremium ? await api('/mood/analytics?period=' + period) : null);
  }, [user.isPremium, period]);

  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [load]);

  const save = async () => {
    if (!mood) return setMsg('Pick a mood from 1 to 10');
    try {
      await api('/mood', { method: 'POST', body: { mood, energy, emotions: emos } });
      setMsg('Mood logged');
      setMood(0);
      setEmos([]);
      load();
    } catch (e) {
      setMsg(e.message);
    }
  };
  const toggle = (e) => setEmos(emos.includes(e) ? emos.filter((x) => x !== e) : [...emos, e]);
  const day = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  const lineData = {
    labels: items.map((i) => day(i.createdAt)),
    datasets: [
      { label: 'Mood', data: items.map((i) => i.mood), borderColor: '#5d7557', backgroundColor: 'rgba(93,117,87,.15)', fill: true, tension: 0.35 },
      { label: 'Energy', data: items.map((i) => i.energy), borderColor: '#a8704f', tension: 0.35 },
    ],
  };

  return (
    <>
      <div className="card">
        <h3>Today's check-in</h3>
        <p className="mute">How is your mood? (1 to 10)</p>
        <div className="faces">
          {FACES.map((f, i) => (
            <button key={i} aria-pressed={mood === i + 1} aria-label={`Mood ${i + 1} of 10`} title={i + 1} onClick={() => setMood(i + 1)}>{f}</button>
          ))}
        </div>
        <p className="mute">Energy: <b>{energy}</b></p>
        <input type="range" min="1" max="10" value={energy} onChange={(e) => setEnergy(+e.target.value)} aria-label="Energy level" />
        <p className="mute">What fits? Pick any.</p>
        <div className="chips">
          {EMOTIONS.map((e) => <button key={e} className="chip" aria-pressed={emos.includes(e)} onClick={() => toggle(e)}>{e}</button>)}
        </div>
        <div className="row"><button className="btn" onClick={save}>Log mood</button><span className="mute">{msg}</span></div>
      </div>

      <div className="card">
        <h3>Mood over time</h3>
        {items.length > 1
          ? <Line data={lineData} options={{ scales, plugins: { legend: { position: 'bottom' } } }} />
          : <p className="mute">Log at least two check-ins to see your trend.</p>}
        {!user.isPremium && <p className="mute">Free plan shows your last 7 check-ins.</p>}
      </div>

      {user.isPremium && stats ? (
        <>
          <div className="card">
            <div className="row between">
              <h3>Average by {period}</h3>
              <div className="row">
                {['week', 'month'].map((p) => <button key={p} className={'chip'} aria-pressed={period === p} onClick={() => setPeriod(p)}>{p}</button>)}
              </div>
            </div>
            <Line
              data={{
                labels: stats.trend.map((t) => t.period),
                datasets: [
                  { label: 'Avg mood', data: stats.trend.map((t) => t.avgMood), borderColor: '#5d7557', tension: 0.3 },
                  { label: 'Avg energy', data: stats.trend.map((t) => t.avgEnergy), borderColor: '#a8704f', tension: 0.3 },
                ],
              }}
              options={{ scales, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
          <div className="card">
            <h3>Most common emotions</h3>
            {stats.emotions.length ? (
              <div style={{ maxWidth: 320, margin: '0 auto' }}>
                <Pie data={{ labels: stats.emotions.map((e) => e.emotion), datasets: [{ data: stats.emotions.map((e) => e.count), backgroundColor: stats.emotions.map((e) => COLORS[EMOTIONS.indexOf(e.emotion)] || '#999') }] }} />
              </div>
            ) : <p className="mute">Tag emotions when you log a mood.</p>}
          </div>
        </>
      ) : (
        <div className="card center">
          <h3>Advanced analytics</h3>
          <p className="mute">Weekly and monthly averages, full history and the emotions breakdown are premium features.</p>
          <button className="btn" onClick={() => setPlan(true)}>Try premium (demo)</button>
        </div>
      )}
    </>
  );
}
