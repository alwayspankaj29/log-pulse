## Log Pulse
Smart Log Analyser – BrowserStack Hackathon 2025

This repo currently exposes a small API that returns predefined error objects with human‑readable recommendations, plus a lightweight frontend UI that fetches and renders them.

---
## Features
* Express API (Node.js) with endpoints:
  * `GET /api/errors` – list all errors `{ count, errors: [...] }`
  * `GET /api/errors/:id` – fetch a single error (future use)
* Static frontend served from `public/` at the root path `/`
* Search + client-side filtering + manual refresh
* Structured helper module in `helpers/errors.js`
* Each error includes a `slackThreadSuggestion` field for internal reference context

---
## Prerequisites
* Node.js >= 18 (tested with 20.9.0)
* npm (comes with Node) or pnpm/yarn if you prefer

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
3. Open the UI:
   ```
   http://localhost:6000/
   ```
4. Call the API directly (example):
   ```sh
   curl http://localhost:6000/api/errors | jq
   ```

---
## Project Structure
```
log-pulse/
├── helpers/
│   └── errors.js          # Centralised error definitions + accessors
├── public/                # Frontend assets served statically
│   ├── index.html         # UI shell
│   ├── app.js             # Fetch + render logic
│   └── styles.css         # Basic styling
├── index.js               # Express server
├── package.json
└── README.md
```

---
## Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT`   | Server port | `6000` |

---
## Frontend Notes
* The root route `/` serves `public/index.html` explicitly.
* All static assets are served by `express.static('public')`.
* The frontend fetches from relative path `/api/errors` so it works regardless of host/port.

---
## Extending
Add a new error: edit `helpers/errors.js` and append to the `errors` array (ensure unique `id`).

Add persistence later: replace the helper functions with DB queries (e.g., PostgreSQL / Mongo) while keeping the same interface (`getAllErrors`, `getErrorById`).

### Error Object Schema
```json
{
   "id": "string",
   "title": "string",
   "description": "string",
   "recommendation": "string",
   "slackThreadSuggestion": {
      "label": "string",          // Human friendly thread title
      "url": "https://..."        // Direct link to Slack thread/channel message
   }
}
```

---
## Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| Browser can’t load `http://localhost:6000/` | Server not running | In a dedicated terminal: `npm start` (leave it running). |
| `curl: (7) Failed to connect` | Port mismatch / process stopped | Check port in log; verify with `lsof -i :6000`. |
| Blank page but API works | JS not loaded | Check dev tools network tab for `app.js` 404; ensure `public/app.js` exists. |
| CORS errors (if calling from different origin) | Cross-origin request | Add `cors` package and `app.use(require('cors')())`. |

Quick diagnostics:
```sh
# Is process listening?


# Test root (HTML)
curl -i http://localhost:6000/

# Test API
curl -s http://localhost:6000/api/errors | head
```

---
## Useful NPM Scripts
| Script | Command | Description |
|--------|---------|-------------|
| start  | node index.js | Run server |
| dev    | NODE_ENV=development node index.js | Dev mode (placeholder) |

---
## License
MIT (see LICENSE if added later)
## License
