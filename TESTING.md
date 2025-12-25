# Testing Guide

## Overview

This project follows a comprehensive testing strategy with a focus on Test-Driven Development (TDD) for critical paths and high coverage requirements.

## Testing Stack

- **Jest** - Test runner, assertions, mocking
- **React Native Testing Library** - Component testing with built-in matchers
- **axios-mock-adapter** - API mocking
- **TypeScript** - Type-safe tests

## Coverage Requirements

### Global Thresholds
- **80% minimum** for all code (branches, functions, lines, statements)

### Critical Path Thresholds
- **Services** (`src/services/**`): **95% coverage**
- **Utils** (`src/utils/**`): **90% coverage**

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci

# Update snapshots
npm run test:update
```

## Test File Organization

Tests should be colocated with the code they test:

```
src/
├── services/
│   ├── storage.ts
│   └── storage.test.ts          # Unit tests for storage service
├── hooks/
│   ├── useGames.ts
│   └── useGames.test.ts         # Hook integration tests
├── components/
│   ├── GameRow.tsx
│   └── GameRow.test.tsx         # Component tests
└── __tests__/
    └── utils/
        ├── testHelpers.ts       # Shared test utilities
        └── testHelpers.test.ts  # Tests for helpers
```

## Testing Patterns

### 1. Unit Tests (Services & Utilities)

**Example: Testing a utility function**

```typescript
// src/utils/sorting.ts
export const sortByDate = (items: Array<{date: string}>) => {
  return [...items].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// src/utils/sorting.test.ts
import { sortByDate } from './sorting';

describe('sortByDate', () => {
  it('should sort items by date descending', () => {
    const items = [
      { date: '2025-01-01' },
      { date: '2025-12-31' },
      { date: '2025-06-15' },
    ];

    const sorted = sortByDate(items);

    expect(sorted[0].date).toBe('2025-12-31');
    expect(sorted[2].date).toBe('2025-01-01');
  });

  it('should not mutate the original array', () => {
    const items = [{ date: '2025-01-01' }];
    const original = [...items];

    sortByDate(items);

    expect(items).toEqual(original);
  });
});
```

### 2. Service Tests (with Mocks)

**Example: Testing storage service**

```typescript
// src/services/storage.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveGames, loadGames } from './storage';
import { createMockGame } from '../__tests__/utils/testHelpers';

describe('Storage Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('saveGames', () => {
    it('should save games to AsyncStorage', async () => {
      const games = [createMockGame()];

      await saveGames(games);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@gametracker:games',
        JSON.stringify(games)
      );
    });

    it('should handle storage errors gracefully', async () => {
      const error = new Error('Storage full');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(saveGames([])).rejects.toThrow('Storage full');
    });
  });

  describe('loadGames', () => {
    it('should load games from AsyncStorage', async () => {
      const games = [createMockGame()];
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(games)
      );

      const result = await loadGames();

      expect(result).toEqual(games);
    });

    it('should return empty array if no games stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await loadGames();

      expect(result).toEqual([]);
    });
  });
});
```

### 3. API Tests (with axios-mock-adapter)

**Example: Testing RAWG API service**

```typescript
// src/services/rawgApi.test.ts
import { mockAxios, resetAxiosMocks } from '../__mocks__/axios';
import { searchGames } from './rawgApi';

describe('RAWG API Service', () => {
  afterEach(() => {
    resetAxiosMocks();
  });

  describe('searchGames', () => {
    it('should fetch games from RAWG API', async () => {
      const mockResponse = {
        results: [
          {
            id: 3498,
            name: 'Grand Theft Auto V',
            background_image: 'https://example.com/image.jpg',
          },
        ],
      };

      mockAxios.onGet(/\/games/).reply(200, mockResponse);

      const results = await searchGames('GTA');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Grand Theft Auto V');
    });

    it('should handle API errors', async () => {
      mockAxios.onGet(/\/games/).reply(500);

      await expect(searchGames('test')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockAxios.onGet(/\/games/).networkError();

      await expect(searchGames('test')).rejects.toThrow();
    });
  });
});
```

### 4. Hook Tests

**Example: Testing custom hooks**

```typescript
// src/hooks/useGames.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useGames } from './useGames';
import { createMockGame } from '../__tests__/utils/testHelpers';

describe('useGames', () => {
  it('should load games on mount', async () => {
    const { result } = renderHook(() => useGames());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.games).toBeDefined();
  });

  it('should add a new game', async () => {
    const { result } = renderHook(() => useGames());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newGame = createMockGame();

    await act(async () => {
      await result.current.addGame(newGame);
    });

    expect(result.current.games).toContainEqual(newGame);
  });
});
```

### 5. Component Tests

**Example: Testing React Native components**

```typescript
// src/components/GameRow.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GameRow } from './GameRow';
import { createMockGame } from '../__tests__/utils/testHelpers';

describe('GameRow', () => {
  const mockOnPress = jest.fn();
  const mockOnSwipe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render game information', () => {
    const game = createMockGame({ name: 'Test Game' });

    const { getByText } = render(
      <GameRow game={game} onPress={mockOnPress} onSwipe={mockOnSwipe} />
    );

    expect(getByText('Test Game')).toBeTruthy();
  });

  it('should call onPress when tapped', () => {
    const game = createMockGame();

    const { getByTestId } = render(
      <GameRow game={game} onPress={mockOnPress} onSwipe={mockOnSwipe} />
    );

    fireEvent.press(getByTestId('game-row'));

    expect(mockOnPress).toHaveBeenCalledWith(game);
  });

  it('should apply grey style when completed', () => {
    const completedGame = createMockGame({ isCompleted: true });

    const { getByTestId } = render(
      <GameRow game={completedGame} onPress={mockOnPress} onSwipe={mockOnSwipe} />
    );

    const row = getByTestId('game-row');
    expect(row.props.style).toMatchObject({
      opacity: expect.any(Number),
    });
  });

  it('should match snapshot', () => {
    const game = createMockGame();

    const tree = render(
      <GameRow game={game} onPress={mockOnPress} onSwipe={mockOnSwipe} />
    ).toJSON();

    expect(tree).toMatchSnapshot();
  });
});
```

### 6. Integration Tests

**Example: Testing multiple components together**

```typescript
// src/screens/HomeScreen.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from './HomeScreen';
import { createMockGames } from '../__tests__/utils/testHelpers';

describe('HomeScreen Integration', () => {
  it('should display list of games', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Test Game 1')).toBeTruthy();
    });
  });

  it('should separate completed and uncompleted games', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Completed Games')).toBeTruthy();
    });
  });

  it('should allow marking a game as completed', async () => {
    const { getByText, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Test Game 1')).toBeTruthy();
    });

    const gameRow = getByTestId('game-row-test-game-1');
    fireEvent(gameRow, 'swipe', { direction: 'right' });

    await waitFor(() => {
      // Game should move to completed section
      expect(getByText('Completed Games')).toBeTruthy();
    });
  });
});
```

## Test Utilities

### Mock Helpers

Located in `src/__tests__/utils/testHelpers.ts`:

- `createMockGame(overrides?)` - Create a mock game
- `createMockGames(count)` - Create multiple mock games
- `createMockCompletedGame(overrides?)` - Create a completed game
- `wait(ms)` - Wait for async operations
- `flushPromises()` - Flush pending promises

### Axios Mocking

Located in `src/__mocks__/axios.ts`:

```typescript
import { mockAxios, mockSuccessResponse, mockErrorResponse } from '../__mocks__/axios';

// Mock successful response
mockSuccessResponse('/api/games', { results: [...] });

// Mock error response
mockErrorResponse('/api/games', 500, 'Server Error');

// Reset mocks between tests
afterEach(() => {
  mockAxios.reset();
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```typescript
it('should call setState with new value', () => {
  // Testing implementation detail
});
```

✅ **Good:**
```typescript
it('should display updated game count after adding a game', () => {
  // Testing observable behavior
});
```

### 2. Use Descriptive Test Names

Follow the pattern: `should [expected behavior] when [condition]`

```typescript
it('should sort games by completion date when all games are completed', () => {
  // ...
});
```

### 3. Arrange, Act, Assert (AAA)

```typescript
it('should add a game to the list', () => {
  // Arrange
  const game = createMockGame();
  const { result } = renderHook(() => useGames());

  // Act
  act(() => {
    result.current.addGame(game);
  });

  // Assert
  expect(result.current.games).toContainEqual(game);
});
```

### 4. Test Edge Cases

- Empty states
- Error conditions
- Boundary values
- Async operations
- Race conditions

### 5. Mock External Dependencies

Always mock:
- API calls
- AsyncStorage
- Navigation
- Native modules
- Date/time

### 6. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  // Reset any global state
});
```

## TDD Workflow (Phase 2+)

For critical services and utilities, follow TDD:

1. **Write the test first** (it will fail - Red)
2. **Write minimal code to pass** (Green)
3. **Refactor** while keeping tests green
4. **Repeat** for next feature

Example TDD cycle:

```typescript
// 1. RED - Write failing test
describe('gameManager', () => {
  it('should assign next available color when adding a game', () => {
    const game = addGame(mockGameData);
    expect(game.colorIndex).toBe(0);
  });
});

// 2. GREEN - Implement minimal code
export const addGame = (data) => {
  return { ...data, colorIndex: 0 };
};

// 3. REFACTOR - Improve implementation
export const addGame = (data, existingGames) => {
  const lastColor = existingGames[existingGames.length - 1]?.colorIndex ?? -1;
  const nextColor = (lastColor + 1) % 7;
  return { ...data, colorIndex: nextColor };
};
```

## Debugging Tests

### View test output
```bash
npm test -- --verbose
```

### Run specific test file
```bash
npm test -- GameRow.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should add a game"
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Coverage Reports

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/index.html
```

Coverage reports show:
- **Statements**: Individual statements executed
- **Branches**: Conditional branches (if/else, switch, ternary)
- **Functions**: Function calls
- **Lines**: Lines of code executed

## Continuous Integration

The `test:ci` script is optimized for CI environments:
- Runs with `--ci` flag (no watch mode)
- Limits workers with `--maxWorkers=2`
- Generates coverage reports
- Enforces coverage thresholds

## Next Steps

As we build Phase 2 (Data Layer), we'll:
1. Write tests for storage service first (TDD)
2. Write tests for API service
3. Write tests for game manager
4. Achieve 95%+ coverage on all services

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Remember:** Good tests are:
- Fast
- Isolated
- Repeatable
- Self-validating
- Timely (written close to code)
