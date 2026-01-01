/**
 * Jest mock for @supabase/supabase-js
 */

// Mock query builder that chains methods
const createMockQueryBuilder = () => {
  const builder: any = {
    select: jest.fn(() => builder),
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    upsert: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    neq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    order: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    single: jest.fn(() => builder),
    maybeSingle: jest.fn(() => builder),
    then: jest.fn((resolve) => resolve({ data: [], error: null })),
  };

  // Make it thenable for async/await
  builder[Symbol.toStringTag] = 'Promise';

  return builder;
};

// Mock Supabase client
const createMockClient = () => ({
  from: jest.fn(() => createMockQueryBuilder()),
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    session: jest.fn(() => null),
    user: jest.fn(() => null),
    onAuthStateChange: jest.fn(() => ({ data: null, unsubscribe: jest.fn() })),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      list: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: '' } })),
    })),
  },
  rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
});

export const createClient = jest.fn(() => createMockClient());

export type SupabaseClient = ReturnType<typeof createMockClient>;
