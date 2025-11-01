## Log Pulse

Smart Log Analyser – BrowserStack Hackathon 2025

This repo exposes an API that returns analysed log error objects generated from a log parsing + AI analysis pipeline, plus a dashboard UI served at `/dashboard` that fetches and renders them.

---

## Features

- Express API (Node.js) with endpoints:
  - `GET /api/errors` – list analysed errors `{ count, errors: [...] }`
  - `GET /api/errors/:id` – fetch a single analysed error
- AI / parsing pipeline generates `backend/error_report.json` (triggered on demand)
- Dashboard UI at `/dashboard` (root path `/` is intentionally removed / 404)
- Client-side category filter, environment selector hook, and analysis refresh action
- Error transformation layer in `helpers/errors.js` that converts raw report entries

---

## Prerequisites

- Node.js >= 18 (tested with 20.9.0)
- npm (comes with Node) or pnpm/yarn if you prefer

---

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server (default port 6000 – override with `PORT`):
   ```sh
   npm start
   # or: PORT=4000 npm start
   ```
3. Open the dashboard UI:
   ```
   http://localhost:6000/dashboard
   ```
4. Call the API directly (example):
   ```sh
   curl http://localhost:6000/api/errors | jq
   ```

---

## Project Structure

```
log-pulse/
├── backend/
│   ├── index.js               # Log parsing + AI analysis script (main())
│   └── error_report.json      # Generated analysis output
├── helpers/
│   └── errors.js              # Loads + transforms error_report.json for API
├── public/
│   ├── pages/
│   │   └── dashboard/         # Dashboard UI (index.html + assets)
│   ├── components/            # Shared component styles / fragments
│   └── styles.css             # Legacy/global styles (if still needed)
├── index.js                   # Express server (serves /dashboard + API)
├── package.json
└── README.md
```

---

## Environment Variables

| Variable | Purpose     | Default |
| -------- | ----------- | ------- |
| `PORT`   | Server port | `6000`  |

---

## Frontend / Dashboard Notes

- Main UI lives at `/dashboard`.
- Root path `/` now returns 404 (or can be redirected to `/dashboard`, toggle in `index.js`).
- All static assets are still served by `express.static('public')`.
- The dashboard fetches from `/api/errors`.

---

## Extending

Pipeline extension:

- Improve analysis quality: enhance prompt or add retry logic.
- Persist historical reports (timestamped files) and add `/api/reports`.

### API Error Object (Transformed) Schema

```json
{
  "id": "error_512",
  "title": "Thread Management Issue",
  "description": "Summary of the analysed issue",
  "recommendation": "Suggested action from AI analysis",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL | UNKNOWN",
  "category": "Thread | Database | Initialization | Configuration | Other | ...",
  "impact": "Potential impact statement",
  "timestamp": "2025-10-31T12:46:28.129Z",
  "lineNumber": 512
}
```

---

## Troubleshooting

| Symptom                                              | Cause                           | Fix                                                                          |
| ---------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| `404 /` after starting server                        | Root intentionally removed      | Use `/dashboard` instead. Enable redirect inside `index.js` if preferred.    |
| Browser can’t load `http://localhost:6000/dashboard` | Server not running              | Start with `npm start` (leave it running).                                   |
| `curl: (7) Failed to connect`                        | Port mismatch / process stopped | Check port in log; verify with `lsof -i :6000`.                              |
| Blank page but API works                             | JS not loaded                   | Check dev tools network tab for `app.js` 404; ensure `public/app.js` exists. |
| CORS errors (if calling from different origin)       | Cross-origin request            | Add `cors` package and `app.use(require('cors')())`.                         |

Quick diagnostics:

```sh
# Is process listening?


# Test API
curl -s http://localhost:6000/api/errors | head
```

---

## Useful NPM Scripts

| Script | Command                            | Description            |
| ------ | ---------------------------------- | ---------------------- |
| start  | node index.js                      | Run server             |
| dev    | NODE_ENV=development node index.js | Dev mode (placeholder) |

---

## License

MIT (see LICENSE if added later)

## License
