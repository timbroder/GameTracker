# Claude Code Instructions for GameTracker

## Project Overview
GameTracker is a React Native iOS app for tracking video games with a Clear app-inspired UI. It features:
- Clear-style color gradients (position-based coloring)
- Tinder-style game discovery with swipe gestures
- Supabase sync for cloud backup
- OTA updates via HotUpdater

## Common Commands

### OTA Deployment
```bash
# Deploy OTA update (bump version first!)
npx hot-updater deploy -p ios -t 1.x.x
```
**Important**: Always bump `APP_VERSION` in `src/config/index.ts` before deploying OTA.

### Development
```bash
# Run in iOS simulator (Debug mode for hot reload)
npx react-native run-ios --simulator="iPhone 16 Pro"

# Type check
npx tsc --noEmit

# Run tests
npm test
```

### Git Workflow
- Create feature branches: `git checkout -b feat/feature-name` or `fix/bug-name`
- Use conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Always include the Claude Code footer in commits:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Project Structure
```
src/
├── components/     # UI components (GameRow, GameList, SearchBar, etc.)
├── screens/        # Screen components (HomeScreen, DiscoveryScreen)
├── hooks/          # Custom React hooks
├── services/       # API and data services (rawgApi, storage, sync)
├── utils/          # Utilities (colors, sorting)
├── types/          # TypeScript type definitions
├── config/         # App configuration (version, API keys)
└── navigation/     # React Navigation setup
```

## Key Files
- `src/config/index.ts` - APP_VERSION (bump before OTA)
- `src/utils/colors.ts` - Clear-style color system
- `src/components/GameRow.tsx` - Main list item component
- `src/components/SearchBar.tsx` - Search with keyboard handling
- `ios/GameTrackerNew/AppDelegate.mm` - Native iOS entry (HotUpdater bundle loading)

## Color System
The app uses position-based coloring like the Clear app:
- **To Play section**: Green gradient (dark at top → light at bottom)
- **Completed section**: Grey gradient (dark at top → light at bottom)
- Each row has an inner vertical gradient for a "banded" effect

Colors are calculated dynamically based on list position - see `getPositionalGreen()` and `getPositionalGrey()` in `src/utils/colors.ts`.

## Testing
- Run `npm test` before pushing
- Test files are in `__tests__/` and `src/**/__tests__/`
- CI runs Jest tests on every PR

## OTA Update Flow
1. Bump `APP_VERSION` in `src/config/index.ts`
2. Deploy: `npx hot-updater deploy -p ios -t 1.x.x`
3. Test: Close app → Open → Close → Open (OTA applies on second launch)

## Simulator vs Device
- **Simulator**: Runs in Debug mode, connects to Metro, supports Cmd+R hot reload
- **Device**: Requires Release IPA via AltServer, uses OTA for updates
- OTA only works in Release builds (not Debug/Metro)

## Discovery Feature
Tinder-style card swiping for legacy platforms:
- Swipe LEFT: Dismiss (mark as seen)
- Swipe RIGHT: Add to collection as completed
- "Add" button: Add to "To Play" list
- Platforms: NES, Game Boy, SNES, N64, PS1, Xbox, Xbox 360, Nintendo Switch

## Supabase Integration
- Games sync to Supabase for cloud backup
- Seen games (discovery dismissals) also sync
- Uses `SYNC_USER_ID_DEV` and `SYNC_USER_ID_PROD` for different environments
