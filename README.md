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

## SNES

This project includes a SNES emulator and mobile controller via Pusher.

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

Mailing list signup (Neon):

```
NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

Music / Last.fm (homepage now-playing + `/distractions/music`):

Point Navidrome (or another player) at Last.fm scrobbling, then set:

```
LASTFM_API_KEY=<from https://www.last.fm/api/account/create>
LASTFM_USERNAME=<your last.fm username>
```

Without these, the music widgets stay hidden.

## Essays + comments

Essay metadata lives in [`src/app/essays/data.ts`](src/app/essays/data.ts) and the
markdown bodies live in [`src/app/essays/content/`](src/app/essays/content/).
They are the source of truth; the server syncs them into the Neon `essays`
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
NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
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
NEON_DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
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
- Visiting `/snes` redirects to a new session at `/snes/[session]`.
- That page shows the game area, local/remote ROMs, and QR codes for controllers at `/snes/[session]/player/1` and `/snes/[session]/player/2`.
- The controller page has no navbar and registers with the host so you should see Pusher status and a controller count.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
