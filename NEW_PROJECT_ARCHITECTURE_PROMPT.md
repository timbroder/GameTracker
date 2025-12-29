# List App with Dropbox Sync - Architecture Guide

I want to build a React Native mobile list app with Dropbox sync. Use the following architecture, patterns, and tech stack as the foundation.

---

## TECH STACK

### Core Framework
- **React Native** (latest stable) - Cross-platform mobile
- **React** 18.3.1
- **TypeScript** 5.0.4 - Strict mode enabled
- **Node.js** >=18

### State Management & Navigation
- **@react-navigation/native** 6.x - Screen navigation
- **@react-navigation/stack** 6.x - Stack navigation
- **@react-native-async-storage/async-storage** 2.x - Local data persistence
- **Custom hooks pattern** - No Redux/Zustand (use local state + custom hooks)

### Animation & Gestures
- **react-native-reanimated** 3.x - Performant animations (FadeIn, FadeOut, Layout)
- **react-native-gesture-handler** 2.x - Touch gestures (swipe, long press)
- **react-native-draggable-flatlist** 4.x - Drag-and-drop reordering

### UI & Styling
- **react-native-linear-gradient** 2.x - Gradient backgrounds
- **react-native-safe-area-context** 4.x - Safe area handling
- **react-native-screens** 3.x - Native screen optimization

### Dropbox Integration
- **react-native-dropbox-api** or **dropbox** SDK - Dropbox sync
- **axios** 1.7.x - HTTP client with retry logic for API calls

### Device Integration
- **react-native-haptic-feedback** 2.x - Haptic feedback (iOS)
- **uuid** 11.x - Unique ID generation

### Build & Development
- **@react-native/metro-config** - Metro bundler
- **@react-native/babel-preset** - Babel preset
- **@react-native/eslint-config** - ESLint
- **prettier** 2.8.8 - Code formatting

### Testing
- **jest** 29.x - Test runner
- **@testing-library/react-native** 12.x - Component testing
- **react-test-renderer** 18.x
- **Coverage thresholds**: Global 80%, Services 95%, Utils 90%

---

## PROJECT STRUCTURE

```
src/
├── App.tsx                          # Main app component (navigation wrapper)
├── index.js                         # Entry point
│
├── screens/
│   ├── HomeScreen.tsx               # Main list screen
│   ├── SettingsScreen.tsx           # App settings, Dropbox auth
│   └── index.ts                     # Barrel export
│
├── components/                      # Reusable UI components
│   ├── ListItemRow.tsx              # Individual list item with gestures
│   ├── ItemList.tsx                 # Main list with drag-drop
│   ├── EditModal.tsx                # Item details/edit modal
│   ├── SearchBar.tsx                # Search functionality
│   ├── SkeletonRow.tsx              # Loading skeleton
│   └── index.ts                     # Barrel export
│
├── hooks/                           # Custom React hooks
│   ├── useItems.ts                  # List items state management
│   ├── useDropboxSync.ts            # Dropbox sync logic
│   ├── useHaptics.ts                # Haptic feedback wrapper
│   └── index.ts                     # Barrel export
│
├── services/                        # Business logic & external integrations
│   ├── itemManager.ts               # CRUD operations for list items
│   ├── storage.ts                   # AsyncStorage wrapper
│   ├── dropboxService.ts            # Dropbox API integration
│   ├── syncEngine.ts                # Sync conflict resolution
│   ├── index.ts                     # Barrel export
│   └── __tests__/                   # Service tests
│
├── types/                           # TypeScript definitions
│   ├── item.ts                      # ListItem, Category types
│   ├── storage.ts                   # Storage keys, preferences
│   ├── sync.ts                      # SyncStatus, ConflictResolution
│   └── index.ts                     # Barrel export
│
├── utils/                           # Utility functions
│   ├── colors.ts                    # Color palette & gradients
│   ├── sorting.ts                   # Item sorting utilities
│   ├── dateHelpers.ts               # Date formatting
│   ├── index.ts                     # Barrel export
│   └── __tests__/                   # Utility tests
│
├── config/                          # Configuration
│   ├── index.ts                     # Config initialization
│   ├── secrets.example.ts           # Example secrets (Dropbox app key)
│   └── __mocks__/                   # Mocked secrets for tests
│
└── dev/                             # Development utilities
    ├── testDataGenerator.ts         # Generate test data
    └── __tests__/                   # Dev util tests

Configuration Files:
├── tsconfig.json                    # baseUrl: src, paths: @/*
├── jest.config.js                   # Test config with 80% coverage
├── jest.setup.js                    # Mock native modules
├── babel.config.js                  # React Native preset + reanimated
├── metro.config.js                  # Metro bundler config
├── .eslintrc.js                     # @react-native preset
├── .prettierrc.js                   # singleQuote, trailingComma: all
├── .env.example                     # DROPBOX_APP_KEY, DROPBOX_APP_SECRET
└── app.json                         # App metadata
```

---

## ARCHITECTURAL PATTERNS

### 1. State Management Architecture

**Pattern: Custom Hook + Service Layer**

```
HomeScreen (container)
    └── useItems hook (local state)
        └── itemManager service (business logic)
            └── storage service (AsyncStorage)
                └── syncEngine (Dropbox sync)
```

**useItems Hook** - Main state management:
- State: `items[]`, `sortedItems`, `loading`, `error`, `lastSyncTime`
- Methods: `loadItems()`, `addItem()`, `updateItem()`, `deleteItem()`, `reorderItems()`, `syncWithDropbox()`
- Uses `useMemo` to derive `sortedItems` from raw items
- Calls itemManager services and updates local state
- **No Redux/Context** - use pure local component state

**itemManager Service** - Pure business logic:
- CRUD operations: `addItem()`, `updateItem()`, `deleteItem()`, `reorderItems()`
- Manages sort orders, timestamps, unique IDs
- Calls storage service for persistence
- NO state - pure functions only

**Storage Service** - AsyncStorage wrapper:
- Key management with constants (e.g., `@listapp:items`, `@listapp:prefs`)
- Functions: `saveItems()`, `loadItems()`, `savePreferences()`, `loadPreferences()`
- Error handling with try-catch, fallback to defaults

**Sync Engine** - Dropbox synchronization:
- `uploadToDropbox()` - Push local changes
- `downloadFromDropbox()` - Pull remote changes
- `resolveConflicts()` - Merge conflicts (last-write-wins or custom logic)
- Track sync status: `syncing`, `synced`, `error`, `lastSyncTime`

### 2. TypeScript Type System

**Core Types** (`/src/types/item.ts`):
```typescript
ListItem {
  id: string;                    // UUID locally generated
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  isCompleted: boolean;
  completedDate?: Date;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  sortOrder: number;             // Manual ordering
  dateAdded: Date;
  dateModified: Date;
  colorIndex: number;            // 0-6 (cycling colors)
  dropboxPath?: string;          // Path in Dropbox
  syncStatus: 'pending' | 'synced' | 'conflict';
}

UserPreferences {
  colorScheme: 'vibrant' | 'pastel';
  sortBy: 'manual' | 'dateAdded' | 'dueDate' | 'priority';
  sortCompletedBy: 'completedDate' | 'title';
  hapticFeedbackEnabled: boolean;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: Date | null;
  pendingChanges: number;
  conflicts: ConflictItem[];
}
```

### 3. Styling & Theming

**Color System** (similar to Clear app):
- 7 gradient colors that cycle through items
- `COLORS` array with primary & secondary for gradients
- Grey overlay for completed items (0.6 opacity)
- LinearGradient with 15° angle

**StyleSheet Pattern**:
- Each component has local `StyleSheet.create()`
- Dark theme: #000 background, white text
- Consistent spacing and border colors
- Performance optimization through StyleSheet memoization

### 4. Gesture & Animation Patterns

**ListItemRow Component**:
- **Swipe right gesture** → Mark complete (threshold: 60px)
- **Long press** → Drag mode
- **Animations**: FadeIn/FadeOut, Layout.springify() for reordering
- Haptic feedback on interactions

**ItemList Component**:
- Drag & drop reordering (react-native-draggable-flatlist)
- Separate sections for incomplete and completed items
- Skeleton loading state (6 shimmer rows during initial load)

### 5. Data Persistence Strategy

**Three-Tier Storage**:

1. **Local Cache** (React state):
   - In-memory, instant access
   - Source of truth for UI

2. **AsyncStorage** (Device storage):
   - Persists across app restarts
   - Automatic save on mutations
   - JSON serialized

3. **Dropbox** (Cloud storage):
   - Background sync (every 5 minutes or on-demand)
   - Conflict resolution strategy
   - Stores as JSON in `/Apps/YourListApp/data.json`

**Sync Flow**:
```
1. User makes change
   ↓
2. Update local state (instant UI update)
   ↓
3. Save to AsyncStorage (background)
   ↓
4. Mark as pending sync
   ↓
5. Background sync uploads to Dropbox (debounced)
   ↓
6. On success: update sync status
   On conflict: show resolution UI
```

### 6. Dropbox Sync Implementation

**Authentication**:
- OAuth 2.0 flow with Dropbox SDK
- Store access token in secure storage (react-native-keychain or AsyncStorage)
- Refresh token handling

**Sync Strategy**:
- **Auto-sync**: Background interval (configurable, default 5 min)
- **Manual sync**: Pull-to-refresh gesture
- **On-demand**: After CRUD operations (debounced 3 seconds)

**Conflict Resolution**:
- Compare `dateModified` timestamps
- Options:
  - Last-write-wins (automatic)
  - Manual resolution (show diff UI)
  - Keep both (duplicate with suffix)

**File Structure in Dropbox**:
```
/Apps/YourListApp/
  ├── data.json              # Main items list
  ├── preferences.json       # User settings
  └── metadata.json          # Sync metadata, last sync time
```

### 7. Error Handling Patterns

**API Errors** (Dropbox SDK):
- Network errors: Retry with exponential backoff (1s, 2s, 4s)
- 429 (Rate limit): Retry with delay
- 401 (Auth expired): Re-authenticate
- 409 (Conflict): Trigger conflict resolution
- Timeout: Inform user, retry option

**Component Errors**:
- Try-catch on async operations
- User-facing errors: Alert.alert() or toast
- Silent errors: Console log only
- Error state passed to child components

**Storage Errors**:
- Fallback to empty array/defaults
- Never crash app on storage failure
- Log for debugging

### 8. Performance Optimizations

**FlatList Configuration**:
```typescript
const LIST_PERFORMANCE_CONFIG = {
  getItemLayout: (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index
  }),
  removeClippedSubviews: true,
  maxToRenderPerBatch: 10,
  initialNumToRender: 10,
  windowSize: 11,
  updateCellsBatchingPeriod: 50,
};
```

**Memoization Strategy**:
- `React.memo()` for list item components
- `useCallback()` for event handlers passed to children
- `useMemo()` for sorted/filtered lists

**Debouncing**:
- Search: 300ms delay
- Dropbox sync: 3s delay after last change
- Auto-save: 1s delay

---

## CODE PATTERNS & CONVENTIONS

### Naming Conventions
- **Components**: PascalCase (`ListItemRow.tsx`)
- **Hooks**: camelCase with `use` prefix (`useItems.ts`)
- **Services**: camelCase (`itemManager.ts`)
- **Constants**: UPPER_SNAKE_CASE (`SWIPE_THRESHOLD`)
- **Types/Interfaces**: PascalCase (`ListItem`, `SyncState`)

### Function Patterns
```typescript
// Service functions (pure, no state)
export async function addItem(input: NewItemInput): Promise<ListItem> {
  try {
    // Business logic
    const newItem = { ...input, id: uuid(), dateAdded: new Date() };
    await storage.saveItems([...existingItems, newItem]);
    return newItem;
  } catch (error) {
    console.error('addItem error:', error);
    throw new Error('Failed to add item');
  }
}

// Hook pattern
export function useItems(): UseItemsReturn {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedItems = useMemo(() => sortItems(items), [items]);

  const addItem = useCallback(async (input: NewItemInput) => {
    try {
      const newItem = await itemManager.addItem(input);
      setItems(prev => [...prev, newItem]);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { items, sortedItems, loading, error, addItem, ... };
}

// Component pattern
export function ListItemRow({ item, onPress, onSwipe }: ListItemRowProps) {
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);

  return (
    <View style={styles.row}>
      {/* JSX */}
    </View>
  );
}
```

### Loading States Pattern
```typescript
if (loading && items.length === 0) {
  return <SkeletonLoader />;  // Initial load
}
if (error) {
  return <ErrorState />;      // Error occurred
}
if (items.length === 0) {
  return <EmptyState />;      // No data
}
return <ItemList items={sortedItems} />;
```

### Barrel Exports
```typescript
// components/index.ts
export { ListItemRow } from './ListItemRow';
export type { ListItemRowProps } from './ListItemRow';
export { ItemList, ITEM_HEIGHT } from './ItemList';
```

---

## TESTING STRATEGY

### Test Structure
```
src/services/itemManager.ts
src/services/__tests__/itemManager.test.ts
```

### Mocking
- Mock AsyncStorage globally
- Mock Dropbox SDK
- Mock uuid to return predictable IDs
- Use `jest.useFakeTimers()` for date testing

### Coverage Requirements
- **Global**: 80% (branches, functions, lines, statements)
- **Services**: 95% (critical business logic)
- **Utils**: 90%
- **Components**: 70% (focus on logic, not UI)

### Example Test
```typescript
describe('itemManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  it('should add item with correct properties', async () => {
    const input = { title: 'Buy milk', category: 'Shopping' };
    const result = await addItem(input);

    expect(result).toMatchObject({
      title: 'Buy milk',
      category: 'Shopping',
      isCompleted: false,
      sortOrder: 0,
    });
    expect(result.id).toBeDefined();
    expect(storage.saveItems).toHaveBeenCalledTimes(1);
  });
});
```

---

## CONFIGURATION FILES

### tsconfig.json
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./src/*"]
    },
    "target": "esnext",
    "module": "esnext",
    "jsx": "react-native",
    "noEmit": true,
    "isolatedModules": true
  }
}
```

### babel.config.js
```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin', // Must be last
  ],
};
```

### jest.config.js
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

### .prettierrc.js
```javascript
module.exports = {
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: false,
  bracketSameLine: true,
};
```

### .env.example
```
DROPBOX_APP_KEY=your_app_key_here
DROPBOX_APP_SECRET=your_app_secret_here
```

---

## KEY IMPLEMENTATION PRIORITIES

### Phase 1: Core App Structure
1. Set up React Native project with TypeScript
2. Configure navigation (stack navigator)
3. Implement basic list screen with add/edit/delete
4. Add drag-and-drop reordering
5. Implement swipe gestures for completion
6. Add AsyncStorage persistence

### Phase 2: UI & UX Polish
1. Implement color cycling system
2. Add animations (FadeIn, Layout transitions)
3. Skeleton loading states
4. Empty states and error handling
5. Haptic feedback

### Phase 3: Dropbox Integration
1. Set up Dropbox app and OAuth
2. Implement authentication flow
3. Create sync engine (upload/download)
4. Add conflict resolution logic
5. Background sync with debouncing
6. Sync status indicators in UI

### Phase 4: Testing & Polish
1. Write unit tests for services (95% coverage)
2. Write tests for utils (90% coverage)
3. Component testing for critical UI
4. Integration tests for sync flow
5. Performance optimization
6. Error handling polish

---

## DESIGN DECISIONS

1. **No State Management Library**: Local state + custom hooks (simple, maintainable)
2. **Service Layer Pattern**: Separates UI from business logic
3. **Three-Tier Storage**: State → AsyncStorage → Dropbox (progressive sync)
4. **Manual Sort Order**: Explicit field rather than calculated (flexible, auditable)
5. **Optimistic UI**: Update local state immediately, sync in background
6. **Last-Write-Wins**: Default conflict resolution (can be customized)
7. **Debounced Sync**: Prevents excessive API calls, better UX
8. **Memoization Selective**: Only where performance matters
9. **Barrel Exports**: Cleaner imports, easier refactoring
10. **TypeScript Strict Mode**: Catch errors early, better IDE support

---

## QUICK START CHECKLIST

- [ ] Initialize React Native project with TypeScript
- [ ] Install all dependencies from tech stack
- [ ] Set up folder structure as outlined above
- [ ] Configure TypeScript, Babel, Metro, Jest
- [ ] Create type definitions (ListItem, UserPreferences, SyncState)
- [ ] Implement storage service (AsyncStorage wrapper)
- [ ] Implement itemManager service (CRUD operations)
- [ ] Create useItems hook (state management)
- [ ] Build basic HomeScreen with list
- [ ] Add drag-and-drop and swipe gestures
- [ ] Implement color system and animations
- [ ] Set up Dropbox app and get API credentials
- [ ] Implement dropboxService (auth, upload, download)
- [ ] Create syncEngine (conflict resolution)
- [ ] Add useDropboxSync hook
- [ ] Wire up auto-sync and manual sync
- [ ] Add sync status indicators to UI
- [ ] Write tests (aim for 80%+ coverage)
- [ ] Polish error handling and edge cases
- [ ] Test on iOS and Android devices

---

## ADDITIONAL RESOURCES TO CONSULT

- React Native docs: https://reactnative.dev/
- React Navigation: https://reactnavigation.org/
- Dropbox SDK for JavaScript: https://github.com/dropbox/dropbox-sdk-js
- React Native Reanimated: https://docs.swmansion.com/react-native-reanimated/
- React Native Gesture Handler: https://docs.swmansion.com/react-native-gesture-handler/

---

**Use this architecture as your foundation. Start with Phase 1 (core structure), then iterate through each phase. Keep the code simple, maintainable, and well-tested. Let me know when you're ready to begin!**
