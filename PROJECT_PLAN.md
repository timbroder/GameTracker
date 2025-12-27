# Clear-Style Game Tracker - Project Plan

## Project Overview

A React Native mobile application inspired by the classic Clear todo app, designed for tracking video games you want to play. Features drag-and-drop reordering, swipe gestures, vibrant gradients, and game data from the RAWG API.

### Core Features
- Add video games with platform-specific tracking
- Drag-and-drop manual sorting for unplayed games
- Swipe to mark games as played/completed
- Completed games move to bottom (greyed out, sorted by completion date)
- Clear-style UI: bright colors, gradients, smooth animations
- Search games via RAWG API
- Display box art and platform logos
- Track optional playtime and completion dates
- Future: iCloud sync across devices

---

## Technical Stack

### Framework & Language
- **React Native** (bare workflow, not Expo)
- **TypeScript** (for type safety)
- **iOS** primary target (Android secondary)

### Key Dependencies
```json
{
  "dependencies": {
    "react-native": "latest",
    "react": "latest",
    "@react-navigation/native": "^6.x",
    "@react-navigation/stack": "^6.x",
    "react-native-gesture-handler": "^2.x",
    "react-native-reanimated": "^3.x",
    "react-native-draggable-flatlist": "^4.x",
    "@react-native-async-storage/async-storage": "^1.x",
    "axios": "^1.x",
    "uuid": "^9.x",
    "react-native-linear-gradient": "^2.x",
    "react-native-haptic-feedback": "^2.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-native": "^0.72.x",
    "@types/uuid": "^9.x",
    "typescript": "^5.x"
  }
}
```

### Future Dependencies (Phase 7)
- `react-native-icloud-storage` - for iCloud sync

---

## Data Model

### Game Object
```typescript
interface Game {
  id: string;                    // UUID generated locally
  rawgId: number;                // RAWG API game ID
  name: string;                  // Game title
  platform: string;              // Platform name (e.g., "PlayStation 5")
  platformId: number;            // RAWG platform ID
  boxArtUrl: string;             // URL to box art/cover image
  platformLogoUrl?: string;      // URL to platform logo (if available)
  isCompleted: boolean;          // Played status
  completedDate?: string;        // ISO date string, auto-set when completed
  playtimeHours?: number;        // Optional playtime tracking
  sortOrder: number;             // Manual sort order (for unplayed games)
  dateAdded: string;             // ISO date string
  colorIndex: number;            // Index for Clear-style gradient color (0-6)
}
```

### Storage Structure (AsyncStorage → iCloud-ready)
```typescript
// Storage keys
const STORAGE_KEYS = {
  GAMES: '@gametracker:games',           // Main games array
  LAST_SYNC: '@gametracker:lastSync',   // For future iCloud sync
  USER_PREFS: '@gametracker:prefs'      // User preferences
};

// Storage format
{
  "@gametracker:games": [Game[], ...],  // Array of Game objects
  "@gametracker:prefs": {
    colorScheme: 'vibrant' | 'pastel',  // Future preference
    sortCompletedBy: 'completedDate' | 'name'
  }
}
```

### Color Palette (Clear-inspired)
```typescript
const CLEAR_COLORS = [
  { primary: '#FF6B6B', secondary: '#FF8E8E' },  // Red
  { primary: '#FFA94D', secondary: '#FFB366' },  // Orange
  { primary: '#FFD93D', secondary: '#FFE066' },  // Yellow
  { primary: '#6BCF7F', secondary: '#8FD99E' },  // Green
  { primary: '#4ECDC4', secondary: '#6DD5CD' },  // Teal
  { primary: '#4D96FF', secondary: '#6BA8FF' },  // Blue
  { primary: '#9D4EDD', secondary: '#B26FE8' },  // Purple
];

const COMPLETED_COLOR = { primary: '#9CA3AF', secondary: '#B5BBC3' }; // Grey
```

---

## RAWG API Integration

### API Details
- **Base URL**: `https://api.rawg.io/api`
- **Documentation**: https://api.rawg.io/docs/
- **Rate Limit**: 20,000 requests/month (free tier)
- **API Key**: User must obtain from https://rawg.io/apidocs

### Key Endpoints

#### 1. Search Games
```
GET /games?key={API_KEY}&search={query}&page_size=10
```
Response includes: id, name, background_image, platforms[]

#### 2. Game Details
```
GET /games/{id}?key={API_KEY}
```
Response includes: detailed info, platforms with logos, screenshots

#### 3. Platforms List
```
GET /platforms?key={API_KEY}
```
Get all platforms with IDs and metadata

### API Service Structure
```typescript
// services/rawgApi.ts
class RAWGApiService {
  async searchGames(query: string): Promise<GameSearchResult[]>
  async getGameDetails(gameId: number): Promise<GameDetails>
  async getPlatforms(): Promise<Platform[]>
}
```

---

## UI/UX Design Specifications

### Screen Layout

#### Main Game List Screen
```
┌─────────────────────────┐
│  ⬇ Pull to Add Game     │ ← Pull-down trigger area
├─────────────────────────┤
│ ┌───┬─────────────┬───┐ │
│ │📦 │ Game Name   │ 🎮│ │ ← Unplayed game row
│ │   │             │   │ │   (Bright gradient)
│ └───┴─────────────┴───┘ │
│ ┌───┬─────────────┬───┐ │
│ │📦 │ Game Name   │ 🎮│ │ ← Drag handles for reorder
│ └───┴─────────────┴───┘ │
│         ...              │
├─────────────────────────┤
│ ── Completed Games ──    │ ← Divider
├─────────────────────────┤
│ ┌───┬─────────────┬───┐ │
│ │📦 │ Game Name   │ 🎮│ │ ← Completed (greyed)
│ └───┴─────────────┴───┘ │
└─────────────────────────┘
```

### Game Row Design
```
┌─────────────────────────────────────┐
│  ┌────┐                              │
│  │    │  Game Title                  │
│  │Box │  Platform Name           (i) │
│  │Art │                              │
│  └────┘                              │
└─────────────────────────────────────┘
```

**Dimensions:**
- Row height: 88px
- Box art: 64x64px (rounded corners: 8px)
- Padding: 12px vertical, 12px left, 16px right
- Info button: 28x28px circular

**Gradient:**
- Linear gradient from `primary` to `secondary` (left to right, 15° angle)
- Completed rows: grey gradient with 60% opacity

### Gestures & Interactions

#### 1. Swipe to Complete/Uncomplete
- **Swipe right** on any game → Toggle completed status
  - Visual: Swipe indicator shows ✓ (marking complete) or ↩ (marking unplayed)
  - Haptic: selection feedback when crossing threshold
  - Auto-sets/clears `completedDate`

#### 2. Long Press to Drag (Unplayed only)
- Long press (200ms) + drag on unplayed game
- Drag is constrained to unplayed section only
- Visual feedback: Row scales up slightly
- Updates `sortOrder` on drop

#### 3. Info Button to Edit
- Tap (i) button → Open edit modal
- Haptic: light impact
- Edit modal shows:
  - Game name, platform, box art (read-only)
  - Toggle completed button
  - Delete button (with confirmation)

### Search Bar (Bottom of Screen)
```
┌─────────────────────────┐
│ 🔍 Search games...  [X] │
└─────────────────────────┘
```

**Flow:**
1. Tap search bar to activate
2. Type game name (debounced 300ms search)
3. Results overlay appears with box art
4. Tap result → Platform selection (if multi-platform)
5. Select platform → Add to TOP of list
6. Search closes automatically

---

## Project Structure

```
GameTracker/
├── PROJECT_PLAN.md (this file)
├── README.md
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── ios/                          # iOS native code
│   └── GameTracker/
├── android/                      # Android native code
│   └── app/
├── src/
│   ├── types/
│   │   ├── game.ts              # Game interface & related types
│   │   ├── api.ts               # RAWG API response types
│   │   └── storage.ts           # Storage types
│   ├── services/
│   │   ├── storage.ts           # AsyncStorage wrapper
│   │   ├── rawgApi.ts           # RAWG API client
│   │   └── gameManager.ts       # Game CRUD operations
│   ├── hooks/
│   │   ├── useGames.ts          # Game list state management
│   │   ├── useGameSearch.ts    # Search functionality
│   │   └── useHaptics.ts        # Haptic feedback wrapper
│   ├── components/
│   │   ├── GameRow.tsx          # Individual game row
│   │   ├── GameList.tsx         # Main draggable list
│   │   ├── SearchModal.tsx      # Game search modal
│   │   ├── PlatformModal.tsx    # Platform selection
│   │   ├── EditModal.tsx        # Edit game details
│   │   ├── PullToAdd.tsx        # Pull-down add gesture
│   │   └── DeleteConfirm.tsx    # Delete confirmation
│   ├── screens/
│   │   └── HomeScreen.tsx       # Main screen
│   ├── utils/
│   │   ├── colors.ts            # Color palette & helpers
│   │   ├── sorting.ts           # Game sorting logic
│   │   └── dateHelpers.ts       # Date formatting
│   └── App.tsx                  # Root component
└── assets/
    └── platform-logos/          # Platform logo images (fallbacks)
```

---

## Implementation Phases

### Phase 1: Project Setup & Core Structure ✅ COMPLETE
**Goal:** Initialize bare React Native project with TypeScript and dependencies

**Tasks:**
1. ✅ Create detailed project plan (this file)
2. ✅ Initialize React Native project with TypeScript (React Native 0.76.6)
3. ✅ Install core dependencies
   - @react-navigation/native, @react-navigation/stack
   - react-native-gesture-handler, react-native-reanimated (~3.15.0)
   - react-native-screens, react-native-safe-area-context
   - @react-native-async-storage/async-storage
   - axios, uuid
   - react-native-linear-gradient
   - react-native-haptic-feedback
   - react-native-draggable-flatlist
4. ✅ Install dev dependencies (@types/uuid, jest, testing-library)
5. ✅ Configure TypeScript (tsconfig.json)
6. ✅ Configure Babel for reanimated
7. ✅ Set up folder structure (src/, types/, services/, etc.)
8. ✅ Configure React Navigation
9. ✅ iOS: Run `cd ios && pod install`
10. ✅ Test build on iOS simulator (iPhone 17 Pro, iOS 26.2)

**Acceptance Criteria:** ✅ All met
- App builds and runs on iOS simulator
- Navigation is configured
- Gesture handler is working
- TypeScript has no errors

---

### Phase 1.5: Hot Updater OTA Updates ✅ COMPLETE
**Goal:** Enable over-the-air JavaScript updates without rebuilding the native app

**Why:** App is sideloaded via AltServer. Hot Updater allows pushing JS updates without rebuilding and re-sideloading.

**Status:** Complete

**Tasks:**
1. ✅ Install `@hot-updater/react-native` package
2. ✅ Install `hot-updater` CLI and `@hot-updater/supabase` plugin
3. ✅ Configure `hot-updater.config.ts` for Supabase
4. ✅ Update iOS native code (pod install)
5. ✅ Wrap root App component with `HotUpdater.wrap()`
6. ✅ Create Supabase project (free tier)
7. ✅ Create storage bucket for bundles with RLS policies
8. ✅ Run database migrations for bundles table with RLS policies
9. ✅ Add Supabase credentials to `.env.hotupdater`
10. ✅ Deploy Supabase Edge Function for update endpoint
11. ✅ Test OTA update flow (verified v1 → v2 update)
12. ✅ Add comprehensive test suite with GitHub Actions CI

**Supabase Configuration:**
- Project URL: https://juorsgyjsgablrgdqpyp.supabase.co
- Edge Function: `/functions/v1/hot-updater`
- Storage bucket: `hot-updater`
- RLS policies configured for INSERT and SELECT on both storage and bundles table

**Usage:**
```bash
# Deploy an update
npx hot-updater deploy -p ios -m "Your message" -t "0.1.0"

# Run all tests
npm run test:all
```

**Files Added:**
- `hot-updater.config.ts` - Hot Updater configuration
- `.env.hotupdater` - Supabase credentials (gitignored)
- `.env.hotupdater.example` - Credential template
- `supabase/functions/hot-updater/` - Edge function code
- `supabase-setup.sql` - Database migration reference
- `.github/workflows/test.yml` - CI workflow
- `__mocks__/@hot-updater/react-native.js` - Jest mock

**Test Coverage:**
- Jest: App rendering tests with HotUpdater mock
- Deno: Edge function semver filtering logic (10 test cases)
- GitHub Actions: Runs both test suites on push/PR

**Acceptance Criteria:** ✅ All met
- App can receive OTA updates without AltServer rebuild
- Updates apply on next app launch (download → restart → apply)
- Comprehensive test suite with CI

---

### Phase 2: Data Layer & Storage ✅ COMPLETE
**Goal:** Implement data model, storage service, and RAWG API integration

**Tasks:**

#### 2.1 Type Definitions ✅ COMPLETE
1. ✅ Create `src/types/game.ts`
   - Define `Game` interface
   - Define `Platform` type
   - Define `GameSearchResult`, `GameDetails` types
2. ✅ Create `src/types/storage.ts`
   - Storage key constants
   - Storage data structures
   - User preferences types

#### 2.2 Storage Service ✅ COMPLETE
1. ✅ Create `src/services/storage.ts`
   - `saveGames(games: Game[]): Promise<void>`
   - `loadGames(): Promise<Game[]>`
   - `savePreferences(prefs: UserPrefs): Promise<void>`
   - `loadPreferences(): Promise<UserPrefs>`
   - `clearAllData(): Promise<void>`
   - Error handling with meaningful messages

#### 2.3 RAWG API Service ✅ COMPLETE
1. ✅ Create `src/services/rawgApi.ts`
   - Initialize axios instance with base URL
   - API key management via `src/config/secrets.ts`
   - `searchGames(query: string): Promise<GameSearchResult[]>`
   - `getGameDetails(id: number): Promise<GameDetails>`
   - `getPlatforms(): Promise<Platform[]>`
   - `getGamePlatforms(gameId: number): Promise<Platform[]>`
   - Error handling (401, 404, 429, network errors)
2. ✅ Add API key configuration
   - `src/config/secrets.ts` (gitignored)
   - `src/config/secrets.example.ts` (template)
   - README updated with setup instructions

#### 2.4 Game Manager Service ✅ COMPLETE
1. ✅ Create `src/services/gameManager.ts`
   - `addGame(input: NewGameInput): Promise<Game>`
   - `updateGame(id: string, updates: Partial<Game>): Promise<Game>`
   - `deleteGame(id: string): Promise<void>`
   - `toggleCompleted(id: string): Promise<Game>`
   - `reorderGames(reorderedIds: string[]): Promise<void>`
   - `getGames(filter?: { completed?: boolean }): Promise<Game[]>`
   - `gameExists(rawgId: number, platformId: number): Promise<boolean>`
   - Auto-assignment of colors (cycles through 7 Clear colors)
   - Auto-assignment of sort orders

#### 2.5 Testing ✅ COMPLETE
1. ✅ Unit tests for all services (51 Jest tests)
   - `src/services/__tests__/storage.test.ts`
   - `src/services/__tests__/rawgApi.test.ts`
   - `src/services/__tests__/gameManager.test.ts`
2. ✅ Jest mock for axios (`src/__mocks__/axios.ts`)
3. ✅ Jest mock for secrets (`src/config/__mocks__/secrets.ts`)
4. ✅ Temporary TestScreen for manual verification

**Acceptance Criteria:** ✅ All met
- Can save and load games from AsyncStorage
- Can search games via RAWG API
- Can fetch game details and platforms
- All services have proper error handling
- TypeScript types are complete
- All 51 unit tests passing

---

### Phase 3: UI Components - Game Row ✅ COMPLETE
**Goal:** Create the Clear-style game row component

**Tasks:**

#### 3.1 Color System ✅ COMPLETE
1. ✅ Create `src/utils/colors.ts`
   - Define `CLEAR_COLORS` array (7 colors)
   - `getGameColor(colorIndex, isCompleted)` - returns color for index
   - `getGradientProps(color, opacity)` - returns LinearGradient props
   - `COMPLETED_OPACITY` constant for greyed-out state

#### 3.2 Game Row Component ✅ COMPLETE
1. ✅ Create `src/components/GameRow.tsx`
   - Props: `game`, `onSwipe`, `onInfo`, `isDragging`
   - Render box art image with placeholder fallback
   - Render game name (truncate if long)
   - Render info button (i) for opening edit modal
   - Apply linear gradient background (separate layer for proper sizing)
   - Handle completed state (grey color, lower opacity)
   - Swipe right gesture with animated indicator
2. ✅ Style the row
   - 88px height
   - 64x64 box art with rounded corners
   - Proper spacing and alignment
   - Info button positioned right
   - Text overflow handling
3. ✅ Add placeholder for missing box art (game emoji)
4. ✅ Haptic feedback on swipe threshold

**Acceptance Criteria:** ✅ All met
- Game row displays correctly with all elements
- Colors cycle through CLEAR_COLORS
- Completed games appear greyed out
- Handles missing images gracefully

---

### Phase 4: Core Functionality - Game List ✅ COMPLETE
**Goal:** Build main game list with sorting and basic display

**Tasks:**

#### 4.1 Sorting Logic ✅ COMPLETE
1. ✅ Create `src/utils/sorting.ts`
   - `sortGames(games: Game[]): SortedGames`
   - Unplayed: sort by `sortOrder` ascending
   - Completed: sort by `completedDate` descending
   - Unit tests for sorting logic

#### 4.2 useGames Hook ✅ COMPLETE
1. ✅ Create `src/hooks/useGames.ts`
   - State: `games`, `sortedGames`, `loading`, `error`
   - `loadGames()` - load from storage
   - `addGame(game)` - add and save
   - `updateGame(id, updates)` - update and save
   - `deleteGame(id)` - delete and save
   - `toggleCompleted(id)` - toggle completed status
   - `reorderGames(reorderedIds)` - update sort order
   - Memoized sorted lists

#### 4.3 Game List Component ✅ COMPLETE
1. ✅ Create `src/components/GameList.tsx`
   - Use `DraggableFlatList` for unplayed section
   - Completed section as `ListFooterComponent`
   - Add section header "Completed (count)"
   - Handle empty states
   - Long press to drag for reordering (unplayed only)
   - Drag constrained to unplayed section

#### 4.4 Home Screen ✅ COMPLETE
1. ✅ Create `src/screens/HomeScreen.tsx`
   - Render `GameList`
   - Safe area handling with `useSafeAreaInsets`
   - Edit modal integration

**Acceptance Criteria:** ✅ All met
- Games load from storage on app start
- Unplayed games appear at top in manual order
- Completed games appear at bottom sorted by completion date
- List separates into two sections properly
- Empty states display correctly

---

### Phase 5: Gestures & Interactions ✅ COMPLETE
**Goal:** Implement Clear-style gestures (simplified)

**Tasks:**

#### 5.1 Haptics Hook ✅ COMPLETE
1. ✅ Create `src/hooks/useHaptics.ts`
   - Wrapper around react-native-haptic-feedback
   - `light()`, `medium()`, `heavy()`, `selection()`
   - iOS-specific configuration

#### 5.2 Swipe to Complete ✅ COMPLETE
1. ✅ Add swipe gesture to `GameRow`
   - Use `react-native-gesture-handler` Gesture.Pan()
   - Detect right swipe (threshold: 60px)
   - Animated swipe indicator (checkmark/undo)
   - Haptic feedback on threshold crossing
2. ✅ Implement `handleSwipe` in `HomeScreen`
   - Call `toggleCompleted(gameId)`
   - Row moves to/from completed section

#### 5.3 Drag to Reorder (Unplayed) ✅ COMPLETE
1. ✅ Configure `DraggableFlatList` for unplayed section
   - Long press (200ms) to initiate drag
   - Drag constrained to unplayed section only
   - Visual feedback when dragging
2. ✅ Implement `handleReorder` callback
   - Update `sortOrder` for reordered games
   - Save to storage

#### 5.4 Info Button to Edit ✅ COMPLETE
1. ✅ Add info button (i) to `GameRow`
   - Tap to open edit modal
   - Haptic feedback on tap
2. ✅ Create `src/components/EditModal.tsx`
   - Show game details (name, platform, box art)
   - Toggle completed status button
   - Delete button with confirmation
   - Close button
3. ✅ Integrate edit modal with `HomeScreen`

#### 5.5 Pinch to Delete - REMOVED
- Simplified: Delete via edit modal instead

#### 5.6 Pull Down to Add - REMOVED
- Simplified: Persistent search bar at bottom instead

**Acceptance Criteria:** ✅ All met
- Swipe right marks game as played/unplayed
- Drag and drop reorders unplayed games
- Info button opens edit modal
- Delete available through edit modal
- All gestures have appropriate haptic feedback
- Animations are smooth

---

### Phase 6: Search & Add Games ✅ COMPLETE
**Goal:** Implement game search and adding functionality

**Tasks:**

#### 6.1 Search Bar ✅ COMPLETE
1. ✅ Create `src/components/SearchBar.tsx`
   - Persistent search bar at bottom of screen
   - Text input with clear button
   - Cancel button when active
   - Keyboard handling

#### 6.2 Search Results ✅ COMPLETE
1. ✅ Create `src/components/SearchResults.tsx`
   - Full-screen overlay when search is active
   - Display search results with box art
   - Show loading spinner
   - Show error messages
   - Tap result → trigger platform selection

#### 6.3 Platform Selection Modal ✅ COMPLETE
1. ✅ Platform selector in `SearchResults.tsx`
   - Show list of platforms for selected game
   - Display platform names
   - Tap platform → add game to list
   - Cancel button to close

#### 6.4 Integration ✅ COMPLETE
1. ✅ Connect search flow in `HomeScreen`
   - Debounced search (300ms)
   - Search → select game → select platform → add to list
   - New games added to TOP of list (sortOrder: 0)
   - Existing games shifted down
   - Duplicate detection (same game + platform)
   - Close search on success
   - Haptic feedback

**Acceptance Criteria:** ✅ All met
- Can search for games via RAWG API
- Search is debounced properly
- Results show box art and game info
- Can select specific platform for multi-platform games
- Game is added to list with correct data
- New games appear at top of list
- Colors cycle properly
- Search closes after adding

---

### Phase 7: Polish & Refinement
**Goal:** Add animations, improve UX, handle edge cases

**Tasks:**

#### 7.1 Animations
1. [ ] Add enter/exit animations for game rows
   - Slide in when added
   - Fade out when deleted
   - Smooth transition when marked completed/uncompleted
2. [ ] Enhance gesture animations
   - Spring animation for swipe
   - Elastic effect for pull-to-add
   - Smooth drag-and-drop
3. [ ] Loading states
   - Skeleton loading for game rows
   - Spinner for API requests
4. [ ] Add transition animations between modals

#### 7.2 Error Handling
1. [ ] Network error handling
   - Retry logic for API failures
   - Offline mode messaging
   - Graceful degradation
2. [ ] Storage error handling
   - Data corruption recovery
   - Migration errors
3. [ ] User-friendly error messages
   - Toast notifications
   - Error modal for critical issues

#### 7.3 Edge Cases
1. [ ] Handle very long game names (truncate)
2. [ ] Handle missing box art (placeholder)
3. [ ] Handle missing platform logos (text fallback)
4. [ ] Handle empty list state
5. [ ] Handle single game (can't drag)
6. [ ] Handle rapid gestures (debounce/throttle)

#### 7.4 Performance
1. [ ] Optimize FlatList rendering
   - `getItemLayout` for consistent heights
   - `removeClippedSubviews`
   - `maxToRenderPerBatch`
2. [ ] Image optimization
   - Cache box art images
   - Lazy loading
   - Proper image sizes from API
3. [ ] Minimize re-renders
   - Memoize components
   - Use React.memo where appropriate

#### 7.5 Accessibility
1. [ ] Add accessibility labels
2. [ ] Screen reader support
3. [ ] High contrast mode support
4. [ ] Larger touch targets option

#### 7.6 User Preferences (Optional)
1. [ ] Settings screen
   - API key configuration
   - Color scheme preference
   - Haptic feedback toggle
2. [ ] Persist preferences in AsyncStorage

**Acceptance Criteria:**
- All animations are smooth and performant
- Errors are handled gracefully
- Edge cases don't cause crashes
- App performs well with 100+ games
- Accessibility features work
- User preferences persist

---

### Phase 8: Testing & Bug Fixes
**Goal:** Ensure stability and quality

**Tasks:**
1. [ ] Manual testing on iOS device
2. [ ] Test all gestures thoroughly
3. [ ] Test with poor/no network
4. [ ] Test with large dataset (100+ games)
5. [ ] Test rapid interactions
6. [ ] Fix all identified bugs
7. [ ] Performance profiling
8. [ ] Memory leak detection

**Acceptance Criteria:**
- No crashes in normal usage
- All features work as expected
- Performance is smooth
- No memory leaks

---

### Phase 9: iCloud Sync (Future Enhancement)
**Goal:** Sync game data across user's Apple devices

**Tasks:**

#### 9.1 Setup
1. [ ] Install `react-native-icloud-storage`
2. [ ] Configure iCloud capabilities in Xcode
3. [ ] Create iCloud container
4. [ ] Update entitlements

#### 9.2 Data Migration
1. [ ] Migrate from AsyncStorage to iCloud Storage
2. [ ] Maintain backward compatibility
3. [ ] Handle first-time iCloud setup

#### 9.3 Sync Logic
1. [ ] Create `src/services/icloudSync.ts`
   - `syncToCloud(games: Game[]): Promise<void>`
   - `syncFromCloud(): Promise<Game[]>`
   - `mergeGames(local: Game[], remote: Game[]): Game[]`
   - Conflict resolution strategy
2. [ ] Implement sync triggers
   - On app launch
   - On app background/foreground
   - After any data change

#### 9.4 Conflict Resolution
1. [ ] Determine conflict resolution strategy
   - Last write wins?
   - Manual conflict resolution?
   - Merge by comparing dates?
2. [ ] Implement chosen strategy
3. [ ] Test with multiple devices

#### 9.5 UI Updates
1. [ ] Add sync indicator
2. [ ] Show last sync time
3. [ ] Handle sync errors gracefully
4. [ ] Add manual sync trigger

**Acceptance Criteria:**
- Games sync across devices
- Conflicts are resolved correctly
- No data loss during sync
- User is informed of sync status

---

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Use functional components with hooks
- Use arrow functions
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for complex functions

### Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase (e.g., `GameRow.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useGames.ts`)
- **Services**: camelCase (e.g., `storageService.ts`)
- **Types**: PascalCase (e.g., `Game`, `Platform`)

### Git Workflow
- Commit frequently with clear messages
- Use conventional commits format:
  - `feat: add swipe gesture to game rows`
  - `fix: correct sorting of completed games`
  - `refactor: extract color logic to util`
  - `docs: update README with setup instructions`

### Testing Strategy
- Manual testing during development
- Future: Unit tests for services and utilities
- Future: Integration tests for key flows
- Future: E2E tests with Detox

---

## API Key Setup

### Getting a RAWG API Key
1. Go to https://rawg.io/apidocs
2. Sign up for a free account
3. Navigate to API section
4. Generate API key
5. Copy key to `.env` file:
   ```
   RAWG_API_KEY=your_key_here
   ```

### Environment Variables
Create `.env` file (add to `.gitignore`):
```
RAWG_API_KEY=your_api_key_here
```

Install `react-native-dotenv`:
```bash
npm install react-native-dotenv
```

Configure in `babel.config.js`:
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
```

---

## Known Limitations & Future Enhancements

### Current Limitations
- iOS only (Android support requires additional work)
- No user authentication (relies on device)
- No cloud backup (until Phase 9)
- No multiplayer/social features
- No game recommendations
- No filtering/search within your list

### Future Enhancement Ideas
1. **Statistics & Insights**
   - Total games played
   - Games by platform
   - Playtime tracking
   - Year in review

2. **Social Features**
   - Share your list with friends
   - See what friends are playing
   - Recommendations based on friends

3. **Enhanced Game Data**
   - Release dates
   - Genres and tags
   - Metacritic scores
   - Reviews and ratings

4. **Customization**
   - Custom color themes
   - Different list views (compact, expanded)
   - Custom game categories/tags

5. **Widgets**
   - Home screen widget showing current games
   - Lock screen widget

6. **Export/Import**
   - Export list to CSV/JSON
   - Import from other game tracking apps

7. **Notifications**
   - Remind to play games
   - Alert on price drops (integration with stores)

---

## Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [RAWG API Docs](https://api.rawg.io/docs/)

### Design Inspiration
- [Clear App (original)](https://www.youtube.com/watch?v=YU05_aGqNvs)
- [Clear App Design](https://www.behance.net/search/projects?search=clear%20app)

### Libraries
- [react-native-draggable-flatlist](https://github.com/computerjazz/react-native-draggable-flatlist)
- [react-native-icloud-storage](https://github.com/npomfret/react-native-icloud-storage)

---

## Session Tracking

### Current Session Status
- **Date**: 2025-12-27
- **Phase**: Phase 6 Complete - MVP Ready!
- **Last Completed**: Search & Add Games functionality
- **Next Steps**: Phase 7 - Polish & Refinement (optional)

### Session Notes
Use this section to track progress across multiple sessions:

#### Session 1 (2025-12-12)
- Gathered requirements
- Created comprehensive project plan
- Ready to begin Phase 1

#### Session 2 (2025-12-24)
- Resolved project setup issues (npx init was hanging)
- Created fresh React Native 0.76.6 project
- Copied source code and configurations from old project
- Fixed react-native-reanimated version compatibility (~3.15.0 for RN 0.76.6)
- Downloaded iOS 26.2 simulator runtime
- Successfully built and ran app on iPhone 17 Pro simulator
- Set up git repo with remote at github.com/timbroder/GameTracker
- Phase 1 fully complete

#### Session 3 (2025-12-25)
- Researched OTA update solutions (CodePush retired March 2025)
- Chose Hot Updater with Supabase free tier as replacement
- Installed hot-updater and @hot-updater/supabase packages
- Created hot-updater.config.ts for Supabase integration
- Updated App.tsx with HotUpdater.wrap()
- iOS pods installed for Hot Updater native module
- Phase 1.5 partially complete (awaiting Supabase project setup)

#### Session 4 (2025-12-26)
- Completed Supabase setup (project, storage bucket, edge function)
- Configured RLS policies for storage and bundles table
- Fixed HotUpdater.wrap() configuration (baseURL, updateStrategy, updateMode)
- Successfully tested OTA update flow (v1 → v2)
- Added comprehensive test suite:
  - Deno tests for edge function semver filtering (10 test cases)
  - Jest mock for @hot-updater/react-native
  - Updated App test to use src/App.tsx with HotUpdater
- Created GitHub Actions CI workflow (Jest + Deno tests)
- Added npm scripts: test:deno, test:all
- Created PR #2 with all Hot Updater changes
- Phase 1.5 fully complete

#### Session 5 (2025-12-26)
- Implemented Phase 2: Data Layer & Storage
- Created type definitions:
  - `src/types/storage.ts` - Storage keys, user preferences
  - `src/types/index.ts` - Barrel export for all types
- Created services:
  - `src/services/storage.ts` - AsyncStorage wrapper
  - `src/services/rawgApi.ts` - RAWG API client with error handling
  - `src/services/gameManager.ts` - Game CRUD with auto color cycling
  - `src/services/index.ts` - Barrel export
- Created config:
  - `src/config/index.ts` - App configuration
  - `src/config/secrets.ts` - API key (gitignored)
  - `src/config/secrets.example.ts` - Template for setup
- Added comprehensive unit tests (51 tests):
  - `src/services/__tests__/storage.test.ts`
  - `src/services/__tests__/rawgApi.test.ts`
  - `src/services/__tests__/gameManager.test.ts`
- Created TestScreen for manual API verification
- Fixed axios mock, tsconfig moduleResolution, App test async handling
- Updated README with secrets.ts setup instructions
- Created PR #3 - merged
- Phase 2 fully complete

#### Session 6 (2025-12-26)
- Implemented Phase 3: GameRow component
  - Clear-style gradient backgrounds
  - Box art with placeholder fallback
  - Swipe gesture with animated indicator
  - Info button for edit modal
- Implemented Phase 4: GameList with drag-and-drop
  - DraggableFlatList for unplayed games
  - Completed section as ListFooterComponent
  - Long press to drag (constrained to unplayed)
- Implemented Phase 5: Gestures & Interactions
  - Swipe right to toggle completion
  - Haptic feedback via useHaptics hook
  - EditModal for game details/delete
  - Simplified interactions (removed pinch, pull-down)
- Fixed visual issues:
  - LinearGradient sizing (separate background layer)
  - Edge-to-edge rows
  - Safe area handling
- Created PR #6 - merged
- Phases 3, 4, 5 complete

#### Session 7 (2025-12-27)
- Implemented Phase 6: Search & Add Games
  - Persistent SearchBar at bottom of screen
  - SearchResults overlay with RAWG API integration
  - Platform selection modal for multi-platform games
  - Debounced search (300ms)
  - New games added to TOP of list
  - Duplicate detection
- Simplified interactions further:
  - Removed pull-to-refresh
  - Removed floating + button
- Fixed scrolling issue (nested ScrollView → ListFooterComponent)
- Created PR #7 - merged
- Phase 6 complete - MVP ready!

---

## Questions & Decisions Log

### Decisions Made
1. **Framework**: Bare React Native (not Expo) - for more control and iCloud support
2. **API**: RAWG - free, comprehensive, easy to use
3. **Platforms**: All platforms supported
4. **Platform Tracking**: Track specific platform per game
5. **Data**: Optional playtime, auto-set completion date
6. **Gestures**: Swipe, pull-to-add, pinch-to-delete, long-press-to-edit, drag-to-reorder
7. **Storage**: AsyncStorage → react-native-icloud-storage (Phase 9)
8. **Auth**: Device-based (Apple ID) - no separate auth

### Open Questions
- [ ] Should platform logos be cached locally or fetched each time?
- [ ] Should we support custom game entries (not from API)?
- [ ] Should completion date be editable after auto-set?
- [ ] Max number of games before pagination needed?

---

## Success Metrics

### MVP Success Criteria (Phases 1-6) ✅ ALL COMPLETE
- [x] Can add games from RAWG API
- [x] Can select specific platform for each game
- [x] Can drag-and-drop to reorder unplayed games
- [x] Can swipe to mark as played/unplayed
- [x] Completed games appear at bottom, greyed out
- [x] Completed games sorted by completion date
- [x] Clear-style UI with gradients and colors
- [x] All gestures work smoothly
- [x] App is stable and performant

### Long-term Success Criteria (Phase 9)
- [ ] Games sync across devices via iCloud
- [ ] No data loss during sync
- [ ] Conflicts resolved gracefully

---

**End of Project Plan**

*This document is a living guide and will be updated as the project evolves.*
