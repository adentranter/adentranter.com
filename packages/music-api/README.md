# @adentranter/music-api

Small Navidrome client used by the personal site to read listening activity.

## What it talks to

| Need | Endpoint |
| --- | --- |
| Now playing | Subsonic `GET /rest/getNowPlaying.view` |
| Recent listens | Native `GET /api/song?_sort=playDate&_order=DESC` |
| Cover art | Subsonic `GET /rest/getCoverArt.view` (proxied by the Next app) |

## Env vars (read by the package)

```
NAVIDROME_URL=https://media.adentranter.com
NAVIDROME_USER=aden
NAVIDROME_PASSWORD=...
```

Optional: `NAVIDROME_USERNAME` (alias), `NAVIDROME_CLIENT_NAME`, `NEXT_PUBLIC_SITE_URL`.

## Usage

```ts
import { getListening, isNavidromeConfigured } from '@adentranter/music-api'

if (isNavidromeConfigured()) {
  const { nowPlaying, recent } = await getListening(8)
}
```

Your reverse proxy must expose `/rest/*` and `/api/*` (and `/auth/login` or
`/api/authenticate`) on `NAVIDROME_URL`, not only the Substreamer frontend.
