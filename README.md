# 3bra.in

Static site. No CMS, no DB, no JS, no webfonts, no tracking.

## Deploy (GitHub Pages)

1. Push this folder's contents to the repo root (or `/docs`), enable Pages.
2. `CNAME` file is included (`3bra.in`).
3. Apex DNS: A records → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
   (AAAA: 2606:50c0:8000::153 … :8003::153). Enable "Enforce HTTPS" once the cert issues.

## Pending

- `playbook/index.html` body — converts from `track-a-inventory/playbook-draft.md`
- `work/index.html` entries — derived from `track-a-inventory/cv-of-work.md`
- Photo assets → `/assets/`
- Replace `GITHUB-USERNAME` in all pages with the real GitHub username (3 files: index, playbook, work + footer links)
