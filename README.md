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

Flow:
- Visiting `/snes` redirects to a new session at `/snes/[session]`.
- That page shows the game area, local/remote ROMs, and QR codes for controllers at `/snes/[session]/player/1` and `/snes/[session]/player/2`.
- The controller page has no navbar and registers with the host so you should see Pusher status and a controller count.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
