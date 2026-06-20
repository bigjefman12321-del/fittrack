# FitTrack

A full-stack personal fitness and health tracking web app — Hevy meets Strava meets Whoop. Dark-mode-first UI with workout logging, run tracking, Garmin health stats, water intake, and a daily journal.

![Dashboard screenshot placeholder](./docs/screenshots/dashboard.png)

> Screenshots: add your own to `docs/screenshots/` after running the app.

## Features

- **Workout Tracker** — Custom workouts, exercise library, set logging (weight/reps/RPE), warm-up/working/drop sets, rest timer with sound, PR tracking, volume & frequency charts
- **Run Tracker** — Strava OAuth sync (90-day backfill + ongoing sync), manual entry fallback, pace/distance/elevation charts, activity deep-links
- **Garmin Health** — Sleep, HRV, VO2 Max, resting HR, steps, stress, body battery (scaffolded; requires Garmin Health API approval)
- **Water Tracker** — Quick-add buttons, daily goal, progress ring, 30-day charts, streak counter
- **Journal** — Rich text entries, mood selector, tags, calendar view, search, tag frequency chart
- **Dashboard** — Today's summary, quick actions, weekly sparklines

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui-style components |
| Charts | Recharts |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| State | Zustand + TanStack React Query |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Toasts | Sonner |

## Prerequisites

- **Node.js 18+** and npm
- **Supabase account** — [supabase.com](https://supabase.com)
- **Strava developer app** (optional) — [developers.strava.com](https://developers.strava.com)
- **Garmin developer app** (optional) — [developer.garmin.com](https://developer.garmin.com) — Health API requires approval

## Quick Start (Demo Mode)

Try the app instantly with seeded fake data — no Supabase required:

```bash
git clone https://github.com/YOUR_USERNAME/fittrack.git
cd fittrack
npm install
cp .env.example .env
# VITE_DEMO_MODE=true is already set in .env.example
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Continue in Demo Mode**.

## Production Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/fittrack.git
cd fittrack
npm install
cp .env.example .env
```

### 2. Configure Supabase

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy your **Project URL** and **anon public key** into `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_DEMO_MODE=false
VITE_APP_URL=http://localhost:5173
```

3. Run database migrations:

```bash
# Install Supabase CLI: https://supabase.com/docs/guides/cli
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste the SQL from `supabase/migrations/20240601000000_initial_schema.sql` into the Supabase SQL Editor.

4. Enable **Email** auth in Supabase Dashboard → Authentication → Providers.

### 3. Deploy Edge Functions

```bash
supabase functions deploy strava-token-exchange
supabase functions deploy strava-sync
supabase functions deploy strava-disconnect
supabase functions deploy garmin-token-exchange
supabase functions deploy garmin-sync
supabase functions deploy garmin-disconnect

# Set secrets (never commit these)
supabase secrets set STRAVA_CLIENT_ID=your_id
supabase secrets set STRAVA_CLIENT_SECRET=your_secret
supabase secrets set GARMIN_CLIENT_ID=your_id
supabase secrets set GARMIN_CLIENT_SECRET=your_secret
```

### 4. Strava Integration

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application
3. Set **Authorization Callback Domain** to `localhost` (dev) or your production domain
4. Add to `.env`:

```env
VITE_STRAVA_CLIENT_ID=your_client_id
```

5. Set redirect URI in Strava app: `{VITE_APP_URL}/auth/strava/callback`

On connect, the edge function exchanges the OAuth code, stores tokens server-side, and syncs the last 90 days of runs.

### 5. Garmin Integration

> ⚠️ The Garmin Health API requires developer approval. Apply at [developer.garmin.com](https://developer.garmin.com/).

1. Register a developer application
2. Request Health API access (sleep, activities, dailies, HRV)
3. Add to `.env`:

```env
VITE_GARMIN_CLIENT_ID=your_client_id
```

4. Set callback URL: `{VITE_APP_URL}/auth/garmin/callback`
5. Complete the edge function implementation in `supabase/functions/garmin-sync/` once API access is granted

### 6. Run locally

```bash
npm run dev
```

### 7. Build for production

```bash
npm run build
npm run preview
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes* | Supabase anon/public key |
| `VITE_DEMO_MODE` | No | `true` = use seeded demo data |
| `VITE_APP_URL` | Yes | App URL for OAuth redirects |
| `VITE_STRAVA_CLIENT_ID` | No | Strava OAuth client ID (public) |
| `VITE_GARMIN_CLIENT_ID` | No | Garmin OAuth client ID (public) |

\* Not required when `VITE_DEMO_MODE=true`

**Edge Function secrets** (set via `supabase secrets set`, never in `.env`):

- `STRAVA_CLIENT_SECRET`
- `GARMIN_CLIENT_SECRET`
- `STRAVA_WEBHOOK_VERIFY_TOKEN` (optional, for webhooks)

## Deploy to Vercel

1. Push the repo to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Set environment variables in Vercel dashboard
4. Update `VITE_APP_URL` to your production URL
5. Update Strava/Garmin redirect URIs to match production URL

The included `vercel.json` handles SPA routing.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/fittrack)

## Project Structure

```
fittrack/
├── src/
│   ├── components/     # UI, charts, layout, shared
│   ├── pages/          # Route pages
│   ├── hooks/          # React Query data hooks
│   ├── stores/         # Zustand stores
│   ├── lib/            # Supabase, Strava, Garmin, utils
│   └── types/          # TypeScript types
├── supabase/
│   ├── migrations/     # PostgreSQL schema
│   └── functions/      # Edge Functions (OAuth, sync)
├── .env.example
├── vercel.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

Please keep PRs focused and include a brief description of changes.

## License

MIT
