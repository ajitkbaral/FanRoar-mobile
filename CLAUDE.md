# FanRoar Mobile — CLAUDE.md

## Project Overview
FanRoar Mobile is a real-time fan engagement app for the 2026 FIFA World Cup. Fans shake, tap, and cheer to drive their team's Fan Impact Score. Built with Expo React Native (iOS-first). Internal MVP document: `../FanRoar_Mobile_README.docx`.

## Technology Stack
| Technology | Role |
|---|---|
| Expo SDK 51 | React Native build + runtime |
| TypeScript | Type safety |
| React Navigation v6 | Bottom tab + stack navigation |
| Zustand | State management (domain slices) |
| Reanimated 3 | 60fps worklet animations |
| Socket.IO Client | Real-time WebSocket connection |
| expo-sensors | Accelerometer for shake detection |
| expo-av | Audio metering for voice level |
| expo-haptics | Haptic feedback on shake events |
| expo-linear-gradient | Gradient backgrounds |
| Inter Tight + JetBrains Mono | Display + monospace fonts |

## Project Structure
```
src/
├── screens/
│   ├── HomeScreen.tsx           # Match slate + personal stats
│   ├── MatchScreen.tsx          # CORE: shake zone, tug-of-war, power-ups
│   ├── LeaderboardScreen.tsx    # Country / City / Friends tabs
│   ├── ProfileScreen.tsx        # XP, badges, role display
│   ├── OnboardingScreen.tsx     # Fan role picker
│   ├── RecapScreen.tsx          # Shareable match recap card
│   └── MiniGameScreen.tsx       # Half-time mini-games lobby
├── components/
│   ├── ShakeZone/               # Core tap/shake interaction zone
│   ├── TugOfWarBar/             # Live momentum split bar
│   ├── EnergyMeter/             # Personal energy counter
│   ├── FanRoleSelector/         # Role picker (Drummer/Chanter/Ultra)
│   ├── PowerUpPanel/            # Mega Cheer / Shield / Steal
│   ├── MomentCard/              # Shareable recap card component
│   ├── MiniGame/                # Half-time game cards
│   └── shared/                  # Reusable primitives (Card, Chip, Icon, etc.)
├── hooks/
│   ├── useShakeDetector.ts      # Accelerometer — 2.5G threshold, 300ms cooldown
│   ├── useVoiceLevel.ts         # Mic amplitude polling (>65dB threshold)
│   ├── useMatchSocket.ts        # Socket.IO room management + event handlers
│   └── useEnergyEngine.ts       # Multiplier stack + batch submission
├── store/
│   ├── matchStore.ts            # Live match state (scores, event mode, momentum)
│   ├── userStore.ts             # Auth, profile, fan role, XP
│   └── energyStore.ts           # Energy counter, power-up state
├── api/
│   ├── client.ts                # Axios instance with auth interceptor
│   ├── socket.ts                # Socket.IO singleton + reconnect logic
│   └── types.ts                 # Shared API types
├── utils/
│   └── constants.ts             # Game constants (thresholds, multipliers, caps)
├── theme/
│   ├── colors.ts                # OKLCH → hex color tables, palette builder
│   └── index.ts                 # Theme object factory (dark/light × team)
└── navigation/
    └── index.tsx                # Bottom tab + stack navigator
```

## Design System
Pixel-perfect implementation of the Claude Design prototype.

### Typography
- **Display**: Inter Tight — UI text, headings, numbers
- **Monospace**: JetBrains Mono — stats, labels, kickers, counters
- Never mix: heading labels always Mono, big text always Inter Tight

### Color Palette (Dark Mode Primary)
```
bg:           #13141D   (cool near-black)
bgRaised:     #191B26
surface:      #1E2130
surface2:     #242738
border:       #2B2F42
borderStrong: #373C54
text:         #F5F6FB
textDim:      #A3A6B5
textMute:     #6E7283

Brazil yellow:   #E8C429   (accent for Brazil supporters)
Argentina cyan:  #62AFE0
Energy lime:     #66E040
Danger red:      #E85030
Success green:   #4ADE80
Warning yellow:  #E8C000
```

### Layout Rules
- Screen padding: 20px horizontal
- Card border radius: 18px (large), 14px (medium), 10px (small)
- Tabbar: floating pill at bottom, 78px total height, blur background
- Status/kicker labels: 10px JetBrains Mono, uppercase, letter-spacing 1–1.5

## Energy Pipeline (Hot Path)
The core loop — do not add synchronous network calls here.

1. Accelerometer/tap/mic → `emitEnergy(kind, raw)`
2. `useEnergyEngine` applies multiplier stack: Role × EventBoost × PowerUp
3. Batch accumulates locally for 500ms
4. `energy_batch` emitted via Socket.IO
5. Optimistic UI update: energy counter + momentum bar shift immediately
6. Confirmation arrives via `score_update` socket event

**Multiplier stack** (applied in order, matching backend):
- Fan Role: Ultra=1.5×, Drummer=1.2× tap, Chanter=1.3× voice
- Goal Boost (30s): 2.0×
- Clutch Mode (last 5 min): 3.0× (overrides goal)
- Combo (Shake+Tap within 500ms): +3 flat
- Group bonus (5+ friends in room): +10%

## Shake Detection
```typescript
const THRESHOLD = 2.5;   // G-force
const COOLDOWN_MS = 300; // debounce
Accelerometer.setUpdateInterval(16); // ~60Hz
```
- Remove listener when app goes to background (battery)
- Haptic feedback: `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` on accepted shake

## Socket.IO Events
**Emit:** `join_match`, `energy_batch`, `activate_powerup`, `leave_match`
**On:** `score_update`, `match_event`, `boost_activated`, `badge_awarded`, `user_count`

Reconnect: exponential backoff, rejoin room automatically on reconnect.

## Animation Rules
- All animations via Reanimated 3 worklets — never blocking JS thread
- Momentum bar: `withSpring` on width change
- Particle bursts: `withTiming` + `withSequence`, auto-cleanup after 700ms
- +N floaters: translate Y -80 + fade, 900ms
- Power-up activation: scale bounce + glow pulse

## State Management
Three Zustand slices:
- `useMatchStore`: `{ match, scores, momentum, eventMode, boostActive }`
- `useUserStore`: `{ user, token, fanRole, xp, badges }`
- `useEnergyStore`: `{ myEnergy, combo, batchBuffer, activePowerup }`

## API Endpoints (Backend → Mobile)
```
POST /api/v1/auth/request-otp
POST /api/v1/auth/verify-otp     → { accessToken }
GET  /api/v1/auth/me
PATCH /api/v1/auth/profile

GET  /api/v1/matches/live
GET  /api/v1/matches/:id

GET  /api/v1/leaderboard/global?matchId=&limit=
GET  /api/v1/leaderboard/country?matchId=&countryCode=
GET  /api/v1/leaderboard/city?matchId=&cityCode=
GET  /api/v1/leaderboard/friends?matchId=

GET  /api/v1/profile/:userId/badges
GET  /api/v1/profile/:userId/history
GET  /api/v1/profile/:userId/recap/:matchId
```

## Local Development
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Set EXPO_PUBLIC_API_URL=http://localhost:4000

# 3. Start backend
cd ../backend && docker-compose up -d && npm run dev

# 4. Start Expo
npx expo start
# Press 'i' for iOS simulator, 'a' for Android
```

## Key Invariants
- **Never write network calls in the accelerometer callback** — buffer in `useEnergyEngine` and batch every 500ms.
- **Remove all sensor listeners on background** — see AppState usage in hooks.
- **Optimistic UI first** — update local state immediately, reconcile from `score_update`.
- **Font loading is async** — gates must wait for `useFonts` to resolve before rendering.
- **`constants.ts` is the source of truth** for all game thresholds — never hardcode multipliers.

## Performance Rules
- Shake zone renders in a Reanimated `useAnimatedStyle` — never `setState` inside the worklet
- Leaderboard data is lazy-loaded on tab focus (`useFocusEffect`)
- Accelerometer listener is torn down in `useEffect` cleanup

## Post-MVP Roadmap
- AI engagement triggers (detect low activity → push mini-game)
- AR stadium overlay via device camera
- Apple Watch / Wear OS shake support
- Multi-sport expansion: cricket, basketball, kabaddi
- NFT badge minting
