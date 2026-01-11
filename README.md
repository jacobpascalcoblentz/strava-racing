# Strava Racing

Create custom Strava segment races and compete with friends on a leaderboard.

## Features

- **Create Races** - Pick segments, set start/end dates, get a unique shareable link
- **Join Races** - Click a link, sign in with Strava, you're in
- **Leaderboard** - See standings based on segment times synced from Strava

## Quick Start

### 1. Prerequisites

- Node.js 18+
- PostgreSQL database
- Strava API credentials

### 2. Clone and Install

```bash
git clone https://github.com/jacobpascalcoblentz/strava-racing.git
cd strava-racing
npm install
```

### 3. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Database - your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/strava_racing"

# Strava OAuth - get from https://www.strava.com/settings/api
STRAVA_CLIENT_ID="your_client_id"
STRAVA_CLIENT_SECRET="your_client_secret"

# NextAuth - generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your_random_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Set Up Strava API

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application
3. Set Authorization Callback Domain to `localhost` (for dev)
4. Copy Client ID and Client Secret to your `.env`

### 5. Set Up Database

```bash
npx prisma migrate dev
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. **Organizer creates a race**
   - Sign in with Strava
   - Click "Create Race"
   - Enter name, start date, end date
   - Add segments by entering Strava segment IDs

2. **Share the race**
   - Copy the unique race URL
   - Send to friends/competitors

3. **Participants join**
   - Click the race link
   - Sign in with Strava
   - Click "Join This Race"

4. **Compete**
   - Ride the segments on Strava during the race period
   - Click "Sync My Efforts" to pull your times
   - Check the leaderboard for standings

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Strava API](https://developers.strava.com/) - Activity data

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Set up a PostgreSQL database (Vercel Postgres, Supabase, or Neon)
5. Update Strava callback domain to your production URL

## License

MIT
