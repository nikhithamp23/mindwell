const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let token = localStorage.getItem('mw_token');
let passphrase = null; // kept in memory only, never written to storage

export const setToken = (t) => {
  token = t;
  t ? localStorage.setItem('mw_token', t) : localStorage.removeItem('mw_token');
};
export const setPassphrase = (p) => {
  passphrase = p;
};

export async function api(path, { method = 'GET', body, blob = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  if (passphrase) headers['x-journal-key'] = encodeURIComponent(passphrase);

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(data.message || 'Request failed'), { code: data.code, status: res.status });
  }
  return blob ? res.blob() : res.json();
}
