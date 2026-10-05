# Deploying to Cloudflare

The whole app runs as one Cloudflare Worker:

- **Static assets**: the built Vue app (`client/dist`) is served by Workers Static Assets, with SPA fallback for `/room/:id`.
- **API** (`worker/index.js`): `POST /api/rooms`, `GET /api/rooms/:id`, `GET /api/health`.
- **Real-time**: each room is a Durable Object (`Room`), and players connect over a WebSocket at `/api/rooms/:id/ws`. Room state is saved to Durable Object storage. Rooms delete themselves once they're empty, and players who stay disconnected are removed after 5 minutes.

Config is in `wrangler.jsonc`.

## Deploy from your machine

```bash
npm install
npx wrangler login
npm run deploy
```

This builds the client and runs `wrangler deploy`. The app goes live at `https://deathroll-wow.<your-subdomain>.workers.dev`.

## Deploy from Git (Workers Builds)

In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** and pick this repo:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

## Custom domain

In the dashboard, go to **Workers & Pages → deathroll-wow → Settings → Domains & Routes → Add → Custom domain**. The domain's zone has to be on Cloudflare.

## Local development

Hot-reloading UI (two terminals):

```bash
npm run dev:worker   # wrangler dev on :8787 (API + Durable Objects)
npm run dev:client   # vite on :5173, proxies /api (incl. WebSockets) to :8787
```

Or run the production build locally on :8787: `npm run dev`.
