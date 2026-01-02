# GameTracker

A Clear-inspired game tracking app built with React Native. Track video games you want to play with beautiful gradients, drag-and-drop reordering, and swipe gestures.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Xcode** (v15 or higher) - Install from Mac App Store
- **CocoaPods** - `sudo gem install cocoapods`
- **Watchman** (recommended) - `brew install watchman`

### Verify Installation
```bash
node --version    # Should be v18+
xcodebuild -version   # Should show Xcode 15+
pod --version     # Should show CocoaPods version
```

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/timbroder/GameTracker.git
cd GameTracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Install iOS Pods
```bash
cd ios && pod install && cd ..
```

### 4. Get RAWG API Key

1. Go to https://rawg.io/apidocs
2. Sign up for a free account
3. Copy your API key
4. Create the secrets file:

```bash
cp src/config/secrets.example.ts src/config/secrets.ts
```

5. Edit `src/config/secrets.ts` and add your API key:

```typescript
export const RAWG_API_KEY = 'your_api_key_here';
```

## Running the App

### Start Metro Bundler
In one terminal:
```bash
npm start
```

### Run on iOS Simulator
In another terminal:
```bash
npm run ios
```

### Run on Specific Simulator
```bash
npm run ios -- --simulator="iPhone 17 Pro"
```

### List Available Simulators
```bash
xcrun simctl list devices available
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for TDD)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Update snapshots
npm run test:update
```

## Project Structure

```
GameTracker/
├── src/
│   ├── App.tsx              # Main app component
│   ├── types/               # TypeScript type definitions
│   ├── services/            # API & storage services
│   ├── hooks/               # Custom React hooks
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   └── utils/               # Utility functions
├── ios/                     # iOS native code
├── __mocks__/               # Test mocks
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Test setup file
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies & scripts
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro bundler |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type check without emitting |

## OTA Updates (HotUpdater)

The app uses [HotUpdater](https://github.com/nicepkg/hot-updater) for over-the-air updates in Release builds.

### Deploying an OTA Update
1. Bump `APP_VERSION` in `src/config/index.ts`
2. Deploy:
   ```bash
   npx hot-updater deploy -p ios -t 1.x.x
   ```
3. Test: Close app → Open → Close → Open (OTA applies on second launch)

**Note**: OTA only works in Release builds, not Debug/Metro builds.

### Console for Managing Updates
```bash
npx hot-updater console
```

## Features

### Clear-Style Color System
The app uses position-based coloring inspired by the Clear app:
- **To Play section**: Green gradient (dark at top → light at bottom)
- **Completed section**: Grey gradient (dark at top → light at bottom)
- Each row has an inner vertical gradient for a "banded" effect

### Game Discovery
Tinder-style card swiping for exploring legacy platforms:
- Swipe LEFT: Dismiss (mark as seen)
- Swipe RIGHT: Add to collection as completed
- "Add" button: Add to "To Play" list
- Platforms: NES, Game Boy, SNES, N64, PS1, Xbox, Xbox 360, Nintendo Switch

### Supabase Sync
Games sync to Supabase for cloud backup across devices. Seen games (discovery dismissals) also sync.

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### iOS Build Issues
```bash
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npm run ios
```

### Node Modules Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### No Simulators Found
Download iOS simulator runtime:
```bash
xcodebuild -downloadPlatform iOS
```

## Tech Stack

- **React Native** 0.76.6
- **TypeScript** 5.0
- **React Navigation** 6.x
- **React Native Reanimated** 3.x
- **React Native Gesture Handler** 2.x
- **AsyncStorage** for local persistence
- **Axios** for API calls
- **Jest** + **React Native Testing Library** for testing

## License

Private project
