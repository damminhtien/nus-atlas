# Cross-device study sync

NUS Atlas keeps its existing browser storage as an offline mirror, but an authenticated account can sync Atlas-owned study state through the private Vercel API:

- completed lessons and reading positions;
- practice attempts, mastery, retrieval schedules, notes, bookmarks, and review state;
- Atlas preferences needed to make the study experience consistent.

Chrome cookies, browsing history, saved passwords, and unrelated browser-profile data are never read or uploaded.

## Runtime flow

1. Enter the default six-digit unlock code on a new device. `658215` identifies the default Atlas account `damminhtien` and starts the first sync automatically.
2. Atlas pulls the private snapshot, merges local and remote progress, then writes a revision-checked snapshot back before the first route is shown.
3. Later local study actions are debounced and synced automatically while the session is valid.
4. Other configured users sign in through **Sync progress** with their own username and password.

The bearer session is kept in `sessionStorage`, so the password is not stored in the browser. The app-owned snapshot remains in local storage as an offline cache for the current browser. The client binds that mirror to the authenticated username and will not merge one account's mirror into another account.

The six-digit unlock screen is a convenience gate, not a security boundary: the default code is present in the public client so the default account can auto-sync. Do not use that default account for sensitive data. A private account must use a separate password configured only on the server.

## Vercel configuration

The API is `api/sync.js` and is deployed with the existing `nus-atlas-grader` Vercel project. That Vercel project is API-only; GitHub Pages remains the static Atlas production site. Configure these production environment variables in Vercel:

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Token for a **private** Vercel Blob store |
| `ATLAS_SYNC_USERS_JSON` | JSON object mapping each username to its scrypt hash |
| `ATLAS_SYNC_USERNAME` | Default username for the legacy single-user fallback |
| `ATLAS_SYNC_PASSWORD_HASH` | Legacy single-user fallback; never the plain password |
| `ATLAS_SYNC_SESSION_SECRET` | Random secret used to sign 30-day bearer sessions |
| `ATLAS_SYNC_ORIGIN` | Allowed browser origin, `https://damminhtien.github.io` |

Generate a password hash locally without committing it. Type the password when prompted; the command prints only the hash:

```bash
read -rs ATLAS_PASSWORD
export ATLAS_PASSWORD
node <<'NODE'
const crypto = require("node:crypto");
const salt = crypto.randomBytes(16);
const key = crypto.scryptSync(process.env.ATLAS_PASSWORD, salt, 32, { N: 16384, r: 8, p: 1 });
process.stdout.write(`scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}\n`);
NODE
unset ATLAS_PASSWORD
```

The API accepts this format:

```text
scrypt$N$r$p$<salt-hex>$<derived-key-hex>
```

For another account, add another normalized username/hash entry to `ATLAS_SYNC_USERS_JSON`; each account gets a separate Blob path. Never put a private user's password, hash, session secret, or Blob token in Git, `index.html`, a GitHub Pages bundle, or a client-side environment variable.

## Conflict behavior

Each snapshot has a monotonically increasing revision. A stale write receives `409`; the client pulls the current snapshot, merges it with local progress, and retries once. This prevents one device from silently replacing another device's completed work.
