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

### 3. Generate iOS Project Files

The Xcode project file needs to be generated. Run:

```bash
# Generate the iOS project
npx @react-native-community/cli init GameTrackerTemp --skip-install
cp -r GameTrackerTemp/ios/GameTracker.xcodeproj ./ios/
rm -rf GameTrackerTemp
```

### 4. Install iOS Pods
```bash
cd ios && pod install && cd ..
```

### 5. Get RAWG API Key

1. Go to https://rawg.io/apidocs
2. Sign up for a free account
3. Copy your API key
4. Create a `.env` file in the project root:

```bash
echo "RAWG_API_KEY=your_api_key_here" > .env
```

## VSCode Setup

### Recommended Extensions

Install these extensions for the best development experience:

1. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
2. **ESLint** (`dbaeumer.vscode-eslint`)
3. **Prettier** (`esbenp.prettier-vscode`)
4. **TypeScript Importer** (`pmneo.tsimporter`)
5. **React Native Tools** (`msjsdiag.vscode-react-native`)
6. **iOS Debug** (`nicholaslee119.ios-debug`)

Install all at once:
```bash
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension pmneo.tsimporter
code --install-extension msjsdiag.vscode-react-native
```

### Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.workingDirectories": ["."],
  "files.exclude": {
    "**/node_modules": true,
    "**/ios/Pods": true
  }
}
```

### Launch Configurations

Create `.vscode/launch.json` for debugging:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug iOS",
      "cwd": "${workspaceFolder}",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios",
      "target": "iPhone 15 Pro"
    },
    {
      "name": "Attach to Packager",
      "cwd": "${workspaceFolder}",
      "type": "reactnative",
      "request": "attach"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache", "--watchAll=false"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Tasks Configuration

Create `.vscode/tasks.json` for common tasks:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Metro",
      "type": "shell",
      "command": "npm start",
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^(.*)$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "Starting Metro",
          "endsPattern": "Loading dependency graph"
        }
      },
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Run iOS",
      "type": "shell",
      "command": "npm run ios",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "npm test",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Run Tests (Watch)",
      "type": "shell",
      "command": "npm run test:watch",
      "isBackground": true,
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    }
  ]
}
```

## Running the App

### Start Metro Bundler
In one terminal (or use VSCode task):
```bash
npm start
```

### Run on iOS Simulator
In another terminal:
```bash
npm run ios
```

Or press `Cmd+Shift+P` in VSCode and select "Tasks: Run Task" → "Run iOS"

### Run on Specific Simulator
```bash
npm run ios -- --simulator="iPhone 15 Pro Max"
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

# Run specific test file
npm test -- GameRow.test.tsx

# Update snapshots
npm run test:update
```

### View Coverage Report
After running `npm run test:coverage`:
```bash
open coverage/lcov-report/index.html
```

### Debug Tests in VSCode
1. Set breakpoints in test files
2. Press `F5` or go to Run → Start Debugging
3. Select "Debug Tests" configuration

## Development Workflow

### TDD Workflow (Recommended)
1. Start test watcher: `npm run test:watch`
2. Write a failing test
3. Implement code to pass the test
4. Refactor with confidence
5. Repeat

### Hot Reload
- **Fast Refresh** is enabled by default
- Save a file to see changes instantly
- Press `R` in Metro terminal to reload manually
- Press `D` to open developer menu

### Debugging
1. Run the app in simulator
2. Press `Cmd+D` in simulator to open dev menu
3. Select "Debug with Chrome" or use React Native Tools extension
4. Set breakpoints in VSCode

## Project Structure

```
GameTracker/
├── .vscode/                 # VSCode configuration
│   ├── settings.json
│   ├── launch.json
│   └── tasks.json
├── src/
│   ├── App.tsx              # Main app component
│   ├── types/               # TypeScript type definitions
│   │   └── game.ts          # Game, Platform types
│   ├── services/            # API & storage services
│   ├── hooks/               # Custom React hooks
│   ├── components/          # Reusable UI components
│   ├── screens/             # Screen components
│   ├── utils/               # Utility functions
│   ├── __mocks__/           # Test mocks
│   └── __tests__/           # Test utilities
├── ios/                     # iOS native code
├── __mocks__/               # Global test mocks
├── PROJECT_PLAN.md          # Detailed implementation plan
├── TESTING.md               # Testing guide
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
| `npm run test:ci` | Run tests for CI |
| `npm run lint` | Run ESLint |

## Coverage Requirements

| Scope | Minimum Coverage |
|-------|------------------|
| Global | 80% |
| Services (`src/services/`) | 95% |
| Utils (`src/utils/`) | 90% |

## Troubleshooting

### Metro Bundler Issues
```bash
# Clear Metro cache
npm start -- --reset-cache
```

### iOS Build Issues
```bash
# Clean and rebuild
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
npm run ios
```

### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Xcode Issues
- Open `ios/GameTracker.xcworkspace` (not `.xcodeproj`)
- Select a valid development team in Signing & Capabilities
- Clean build: `Cmd+Shift+K`
- Rebuild: `Cmd+B`

## Documentation

- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Full implementation plan with 9 phases
- [TESTING.md](./TESTING.md) - Comprehensive testing guide

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
