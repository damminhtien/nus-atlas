# Production workflow

The repository is maintained directly on `main`. Production GitHub Pages is the verification surface; no feature branch or pull request is needed for routine changes.

## Push flow

```bash
git switch main
git pull --ff-only origin main
# make the smallest readable change
git add <intended-files>
git commit -m "docs: describe the change"
git push origin main
```

The workflow in `.github/workflows/pages.yml` behaves as follows:

| Event | Prerender build | Pages deploy |
| --- | ---: | ---: |
| Push to any branch | Yes | No |
| Push to `main` | Yes | Yes |
| Pull request targeting `main` | Yes | No |
| Manual run on `main` | Yes | Yes |

GitHub Pages accepts the production deployment from `main`; the workflow therefore builds every push but gates the publish job to the default branch. This prevents an experimental branch from replacing the production site.

## Production verification

After `git push origin main`:

1. Open the [Pages workflow runs](https://github.com/damminhtien/nus-atlas/actions).
2. Wait for both `build` and `deploy` to finish successfully.
3. Check [https://damminhtien.github.io/nus-atlas/](https://damminhtien.github.io/nus-atlas/) and hard-refresh if the browser or CDN has a cached app shell.
4. For a content change, open the relevant NUS route and confirm the production page, not a local file.

The CI build runs `node prerender.js`, which copies the app shell into `dist/` and generates lesson pages, `sitemap.xml`, and `robots.txt`. `dist/` is generated and ignored.

## Graphify policy

`graphify-out/` is local-only and ignored by Git. Graphify can still be regenerated for repository navigation, but its reports, HTML, JSON, labels, and cache must never be staged. This keeps machine-specific indexes out of production and out of commits.

## Troubleshooting

- **Build fails:** open the failed `build` job and fix the reported gate or prerender error; do not rely on an unverified local artifact.
- **Deploy is skipped:** confirm the push is on `main`; feature-branch and pull-request runs intentionally build only.
- **Deploy is rejected:** check the repository’s `github-pages` environment and keep its deployment branch policy aligned with `main`.
- **Production looks stale:** confirm the latest successful run’s SHA matches `main`, then hard-refresh the Pages URL. The service worker cache is versioned in `sw.js` when app assets change.
