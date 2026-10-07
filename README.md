This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Games (SNES, N64, PS1, DS)

This project includes SNES, N64, PS1 and Nintendo DS emulators under `/games/[system]` with mobile controllers via Pusher. They run
[EmulatorJS](https://emulatorjs.org) from its CDN and share one session/controller flow, configured per console in
`src/lib/retro/systems.ts`. The old `/snes` and `/n64` URLs permanently redirect to `/games/snes` and `/games/n64`.

ROMs:
- Players add ROMs they own from the game picker; they are stored only in that browser's IndexedDB (separate libraries per console).
- SNES accepts `.smc`, `.sfc`, `.fig`, `.swc`, `.zip`, `.7z`; N64 accepts `.z64`, `.n64`, `.v64`, `.zip`, `.7z`; PS1 accepts `.chd`, `.pbp`, `.bin`, `.iso`, `.img`, `.zip`, `.7z` (zip multi-track `.cue`/`.bin` discs together); DS accepts `.nds`, `.zip`, `.7z`. No BIOS is needed for any of them (melonDS uses its built-in open-source DS BIOS).
- An optional shared library is listed from `public/roms`, `public/@roms` (SNES), `public/roms/n64` (N64), `public/roms/ps1` (PS1) and `public/roms/nds` (DS) via `GET /api/roms?system=snes|n64|ps1|nds`. PS1 discs are large and get baked into the Docker image, so prefer `.chd`.

DS notes:
- Runs the melonDS core. The bottom screen is a touch screen driven by the host's mouse/trackpad; M holds the microphone.
- The DS is single-player, so the QR screen shows one controller and any phone or gamepad controls player 1. The phone controller reuses the SNES pad layout (A/B/X/Y, L/R, Start/Select, D-pad).
- Wii/GameCube aren't offered because EmulatorJS has no Dolphin core.

N64 notes:
- The phone controller has a floating analog stick, A/B, C buttons, L/Z/R, Start and a compact D-pad. Stick movement is sent as coalesced analog updates (at most ~20/s, only when the value changes), which count toward Pusher message usage.
- N64 emulation is far heavier than SNES; a laptop/desktop host is recommended. On iOS, EmulatorJS uses the `parallel_n64` core and performance depends on the game and device.
- Cloud saves share the SNES save code and 2 MB per-save limit; N64 save states larger than that stay in the browser only.

Environment variables required for controller connectivity:

```
# Client (browser)
NEXT_PUBLIC_PUSHER_KEY=pk_xxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
# Optional override for QR host (defaults to window.location.origin)
NEXT_PUBLIC_SNES_HOST=your-domain.com
NEXT_PUBLIC_SNES_PROTOCOL=https
NEXT_PUBLIC_SNES_PORT=

# Server (API routes)
PUSHER_APP_ID=xxxx
PUSHER_KEY=pk_xxxxx
PUSHER_SECRET=sk_xxxxx
PUSHER_CLUSTER=ap1
```

Mailing list signup (Postgres):

```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
```

Music / Navidrome (homepage now-playing + `/distractions/music`):

Point this site at your home Navidrome instance (Subsonic API). Prefer a public
hostname that exposes more than the Substreamer web UI — Vercel needs
`/rest/*` (now playing + cover art) and `/api/*` (recent listens) reachable.

```
NAVIDROME_URL=https://media.adentranter.com
NAVIDROME_USER=<navidrome username>
NAVIDROME_PASSWORD=<navidrome password>
```

Optional Last.fm fallback (used only when Navidrome env vars are missing):

```
LASTFM_API_KEY=<from https://www.last.fm/api/account/create>
LASTFM_USERNAME=<your last.fm username>
```

Without Navidrome or Last.fm credentials, the music widgets stay hidden.

The small workspace package lives at [`packages/music-api`](packages/music-api).

## Essays + comments

Essay metadata lives in [`src/app/essays/data.ts`](src/app/essays/data.ts) and the
markdown bodies live in [`src/app/essays/content/`](src/app/essays/content/).
They are the source of truth; the server syncs them into the Postgres `essays`
table at startup (see [`src/instrumentation.ts`](src/instrumentation.ts) and
[`src/lib/essays-sync.ts`](src/lib/essays-sync.ts)).

To publish a new essay:

1. Add the `.md` file under `src/app/essays/content/`.
2. Add an entry to `essays` in `data.ts` with the matching `slug` and `contentPath`.
3. Deploy (or restart the server). Sync runs once per process and only writes when
   the content hash changes.

To force a sync without restarting the server:

```
npm run sync:essays
```

Comments are public and gated by a small signed math problem ("What is 7 + 4?")
plus a honeypot field and a per-IP-per-hour rate limit. Routes:

- `GET /api/essays/[slug]/comment-challenge` — issues a problem + signed token.
- `GET /api/essays/[slug]/comments` — lists comments oldest-first.
- `POST /api/essays/[slug]/comments` — validates the math answer and inserts.

Required env vars:

```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
COMMENT_CHALLENGE_SECRET=<random 32+ byte string>
```

Generate a secret with `openssl rand -base64 48`.

## Admin dashboard (`/forthelols`)

A private dashboard lives at `/forthelols`. It shows DB-derived stats (mailing
list signups, comments per essay, recent comments + delete button, essay sync
status). It is gated by HTTP Basic Auth via [`src/proxy.ts`](src/proxy.ts).
The same proxy also protects `/api/admin/*` and `/home/*`.

Required env vars:

```
ADMIN_USERNAME=<your choice>
ADMIN_PASSWORD=<your choice>
```

If either is missing the dashboard returns 503. Browsers cache Basic Auth for
the session, so you only get prompted once per browser window.

## Home dashboard (`/home`)

A password-protected media server dashboard lives at `/home` (or
`home.adentranter.com` once the subdomain is pointed at Vercel — add a Vercel
redirect from `home.adentranter.com` to `https://adentranter.com/home`).
link to public HTTPS subdomains; admin tools link to LAN-only addresses and
are not exposed to the internet.

Your home server reports its current public IP to the site via a cron job.
The dashboard displays the latest IP and last-seen time.

### Environment variables

```
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
HOME_IP_KEY=<random string for the home-server cron job>
HOME_DASHBOARD_PASSWORD=<shared password for you and friends>
HOME_DASHBOARD_SECRET=<random 32+ byte string for signing session cookies>
```

Generate secrets with `openssl rand -base64 48`.

### Home-server cron (every 5 minutes)

```bash
*/5 * * * * curl -fsS -X POST -H "x-home-ip-key: $HOME_IP_KEY" https://adentranter.com/api/home-ip >/dev/null
```

The route derives the caller IP from `x-forwarded-for` (or accepts an optional
`{"ip":"1.2.3.4"}` body override for testing). Send the key via the
`x-home-ip-key` header or `Authorization: Bearer` — never in the query string.

### Routes

- `POST /api/home-ip` — upserts the home public IP (requires `HOME_IP_KEY`).
- `POST /api/home/login` — sets the signed `home_session` cookie.
- `POST /api/home/logout` — clears the session cookie.

Flow:
- Visiting `/games` redirects to a new SNES session at `/games/snes/[session]`; `/games/n64`, `/games/ps1` and `/games/nds` do the same for those consoles.
- That page shows the console switch, game area, local/remote ROMs, and QR codes for controllers at `/games/[system]/[session]/player/1` and `/games/[system]/[session]/player/2`.
- The controller page has no navbar and registers with the host so you should see Pusher status and a controller count.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
