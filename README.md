# قيادة حرة في المدينة — Free City Drive

A vertical-phone arcade driving game built as a React + Vite frontend with a Base44 backend scaffold. UI is in Arabic (RTL); all numbers render in English (Latin digits, Orbitron / tabular-nums).

## Running the frontend

```bash
npm install
npm run dev
```

Then open the printed URL (usually `http://localhost:5173`) on a phone-sized window or a real device on the same network. The app is designed for a **vertical phone viewport** and auto-fits a frame when viewed on a wider screen.

## Controls

| Action     | Touch         | Keyboard         |
|------------|---------------|------------------|
| Steer left/right | ◀ ▶ buttons (bottom-left) | Arrow keys / A,D |
| Accelerate | بنزين (green pedal) | ↑ / W |
| Brake      | فرامل (red pedal)   | ↓ / S |
| Pause      | top-left button     | Esc   |

## What's in here

```
my-game-app/
├── src/                     React frontend
│   ├── pages/MenuPage.*      Title screen with stats & high score
│   ├── pages/GamePage.*      In-game shell (HUD + canvas + controls + overlays)
│   ├── components/GameCanvas.jsx   Canvas game loop, physics, rendering
│   ├── components/Hud.jsx          Top HUD: speedometer / distance / coins
│   ├── components/Controls.jsx     Bottom touch buttons
│   └── components/GameOver.jsx     End-of-run summary
└── base44/                  Backend scaffold (not auto-deployed)
    ├── entities/             Player, Run, LeaderboardEntry schemas
    ├── functions/            submitRun, getLeaderboard
    ├── agents/               DrivingCoach (Arabic post-run AI tip)
    ├── auth/                 Auth providers + per-collection rules
    └── base44.config.json    Project link config
```

## Gameplay notes

- Endless 4-lane road: 2 lanes same direction (slow traffic to overtake), 2 lanes oncoming.
- Yellow coins to collect along the lanes.
- Crashing into any car ends the run.
- Best distance is persisted in `localStorage` (`hi_distance`).

## Connecting Base44

1. Edit `base44/base44.config.json` and set your `backendId`.
2. Deploy entities, functions, and auth rules via the Base44 CLI (per your environment).
3. From the frontend, call `POST /api/submitRun` at the end of a run to record stats and `GET /api/getLeaderboard` to render a leaderboard view (not yet wired into the UI — drop in a new page under `src/pages/`).
