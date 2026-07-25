# Nodoos AI — Frontend

## Quick Start

Run this from the `frontend/` folder:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS v3** with custom oklch design tokens
- **Framer Motion** — page animations
- **Lucide React** — icons
- **Recharts** — charts on the dashboard pages

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx         # Root layout — fonts, metadata
│   ├── page.tsx           # Landing page
│   ├── globals.css        # Design tokens + Tailwind base
│   └── dashboard/         # (Phase 4) At-risk accounts dashboard
├── components/
│   └── landing/           # All landing page sections
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── LogoCloud.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── SplitFeature.tsx
│       ├── Stats.tsx
│       ├── Testimonials.tsx
│       ├── Pricing.tsx
│       ├── FAQ.tsx
│       └── Footer.tsx
└── public/
    ├── nodoos-logo.png    # Copied from Nodoos AI Suite/src/assets/
    ├── hero-figure.png
    ├── icon-slack.png
    ├── icon-gmail.png
    ├── icon-google.png
    └── icon-notes.png
```

## Asset Setup (one-time)

The landing page images live in the source project. Copy them once:

```powershell
# Run from repo root (NodoosAI/)
Copy-Item ".\Nodoos AI Suite\src\assets\*" ".\frontend\public\" -Force
```

Or double-click `setup.bat` in the repo root.
