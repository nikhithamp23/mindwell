# MindWell - A Simple Mental Wellness Journal

A privacy-first mental wellness journal built with the MERN stack (MongoDB, Express, React, Node).
Journal entries are encrypted before they reach the database, mood data is visualised with Chart.js,
and a Framer Motion breathing assistant helps users relax.

**Live app:** `<add your Vercel link>`  |  **API:** `<add your Render link>`

## Features (mapped to the project brief)

| Phase | Feature | Where |
|---|---|---|
| 1 | Daily guided prompts | `server/routes/journal.js`, `client/src/components/Journal.jsx` |
| 1 | AES-256 encryption at rest | `server/utils/crypto.js` |
| 1 | Auth (register, login, JWT) | `server/routes/auth.js`, `server/middleware/auth.js` |
| 2 | Mood (1-10) and energy logging | `client/src/components/Mood.jsx` |
| 2 | "Mood over time" line chart, "Most common emotions" pie chart (Chart.js) | `Mood.jsx` |
| 2 | Aggregation queries: average mood by week / month | `server/routes/mood.js` (`/analytics`) |
| 3 | 4-7-8 breathing assistant (Framer Motion) | `client/src/components/Breathe.jsx` |
| 3 | Calm minimalist UI + dark mode | `client/src/styles.css`, `ThemeToggle.jsx` |
| 4 | Freemium: premium flag locks analytics, history and search | `requirePremium` middleware |
| 4 | Data export (JSON and PDF) and account deletion (GDPR) | `server/routes/user.js` |

## Security note: encryption strategy

- Journal `content` is encrypted with **AES-256-GCM** (Node `crypto`) **before** it is saved to MongoDB.
- The key is derived from the user's **journal passphrase** with **scrypt** and a random per-user salt.
  The passphrase and the key are **never stored**. Only the salt and an encrypted check value are kept
  (used to verify the passphrase). If the passphrase is wrong, decryption fails.
- Stored format is `iv:authTag:ciphertext` (base64). GCM also authenticates data, so tampering is detected.
- Account passwords are hashed with **bcrypt** (12 rounds). Sessions use signed **JWTs**.
- The passphrase is kept in browser memory only, sent per request in an `x-journal-key` header over HTTPS, and
  is used for the request and then discarded. **A database admin cannot read entries.**
- Limitation: this is encryption at rest with a user-held key, not true end-to-end encryption, because the server
  sees the passphrase for the duration of a request. (Full E2E would move encryption into the browser with Web Crypto.)
- Other protections: helmet, CORS allow-list, rate limiting on auth routes, JSON body size limit.

### Privacy demo (required screenshot)

1. Register, unlock the journal, and save an entry.
2. Open MongoDB Atlas > Browse Collections > `journals`, or run in `mongosh`:
   `db.journals.find().pretty()`
3. Screenshot the `content` field. It looks like `Qm9v...:x7Fa...:9sLk...` (gibberish).
4. Add the screenshot to this README: `![Encrypted data](docs/encrypted-db.png)`

## Run locally

Requirements: Node 20+, a MongoDB database (local or Atlas free tier).

```bash
# 1. API
cd server
cp .env.example .env      # set MONGO_URI and a long random JWT_SECRET
npm install
npm run dev               # http://localhost:5000

# 2. Client (new terminal)
cd client
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:5173
```

## Deploy

**API on Render** (Web Service): root directory `server`, build `npm install`, start `npm start`.
Environment variables: `MONGO_URI` (Atlas), `JWT_SECRET`, `CLIENT_URL` (your Vercel URL, no trailing slash).

**Client on Vercel**: root directory `client`, framework Vite.
Environment variable: `VITE_API_URL=https://<your-render-app>.onrender.com/api`. (`vercel.json` handles routing.)

In MongoDB Atlas, allow Render's IP (or `0.0.0.0/0` for a demo).

## API summary

| Method | Route | Notes |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | returns JWT |
| GET | `/api/journal/prompt` | daily prompt |
| GET/POST | `/api/journal` | needs `x-journal-key`; GET `?q=` search is premium |
| PUT/DELETE | `/api/journal/:id` | |
| GET/POST | `/api/mood` | free: last 7, premium: all |
| GET | `/api/mood/analytics?period=week|month` | premium only |
| GET | `/api/user/export?format=json|pdf` | decrypted export |
| PATCH | `/api/user/plan` | demo premium toggle (replace with a payment webhook) |
| DELETE | `/api/user/me` | deletes account and data |

## Notes

- Premium is a demo toggle. For real payments, set `isPremium` from a Stripe webhook.
- There is no password or passphrase recovery by design. Forgetting the passphrase means entries cannot be read.
