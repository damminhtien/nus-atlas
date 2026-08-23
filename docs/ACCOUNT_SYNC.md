# Cross-device study sync

NUS Atlas keeps its existing browser storage as an offline mirror, but an authenticated account can sync Atlas-owned study state through the private Vercel API:

- completed lessons and reading positions;
- practice attempts, mastery, retrieval schedules, notes, bookmarks, and review state;
- Atlas preferences needed to make the study experience consistent.

Chrome cookies, browsing history, saved passwords, and unrelated browser-profile data are never read or uploaded.

## Runtime flow

1. Open **Sync progress** in the Atlas top bar.
2. Sign in with the Atlas account on each device.
3. Atlas pulls the private snapshot, merges local and remote progress, then writes a revision-checked snapshot back.
4. Later local study actions are debounced and synced automatically while the session is valid.

The bearer session is kept in `sessionStorage`, so the password is not stored in the browser. The app-owned snapshot remains in local storage as an offline cache for the current browser.

## Vercel configuration

The API is `api/sync.js` and is deployed with the existing `nus-atlas-grader` Vercel project. That Vercel project is API-only; GitHub Pages remains the static Atlas production site. Configure these production environment variables in Vercel:

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Token for a **private** Vercel Blob store |
| `ATLAS_SYNC_USERNAME` | Account username, normally `damminhtien` |
| `ATLAS_SYNC_PASSWORD_HASH` | Scrypt hash; never the plain password |
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

Never put the password, hash, session secret, or Blob token in Git, `index.html`, a GitHub Pages bundle, or a client-side environment variable.

## Conflict behavior

Each snapshot has a monotonically increasing revision. A stale write receives `409`; the client pulls the current snapshot, merges it with local progress, and retries once. This prevents one device from silently replacing another device's completed work.
