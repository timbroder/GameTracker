# Supabase Sync Setup

This guide explains how to set up Supabase sync to share your game list across devices.

## Prerequisites

- A Supabase account (free tier works fine)
- Your existing Supabase project (the one used for hot-updater)

## Step 1: Run the Database Migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New query**
5. Copy the contents of `supabase/migrations/001_create_games_table.sql`
6. Click **Run** (or press Cmd+Enter)

You should see "Success. No rows returned" - this means the tables were created.

## Step 2: Get Your API Credentials

1. In Supabase Dashboard, go to **Settings** > **API**
2. Find these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 3: Generate a Sync User ID

Since this is a personal app without authentication, we use a fixed UUID to identify your data:

1. Go to https://www.uuidgenerator.net/
2. Copy the generated UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)

This UUID will be shared across all your devices to sync data.

## Step 4: Configure secrets.ts

Edit `src/config/secrets.ts`:

```typescript
// Supabase credentials
export const SUPABASE_URL = 'https://your-project.supabase.co';
export const SUPABASE_ANON_KEY = 'your-anon-key-here';

// Your personal sync ID - same on all devices
export const SYNC_USER_ID = 'your-generated-uuid-here';
```

## Step 5: Build and Test

```bash
cd ios && pod install && cd ..
npm run ios
```

The sync indicator appears in the top-right corner of the app:
- **Green** = synced successfully
- **Blue spinner** = syncing in progress
- **Red** = sync failed (tap for details)
- **Gray** = not configured

Tap the indicator to manually trigger a sync.

## How Sync Works

| Trigger | Behavior |
|---------|----------|
| App launch | Auto-sync |
| App returns to foreground | Auto-sync |
| Add/edit/delete a game | Sync after 2 seconds |
| Tap sync indicator | Immediate sync |

### Sync Strategy

- **Merge**: Games from cloud that don't exist locally are added
- **Upload**: All local games are uploaded to cloud
- **Delete**: Games deleted locally are removed from cloud

### Multi-Device Setup

To sync between devices:
1. Use the **same** `SYNC_USER_ID` in `secrets.ts` on all devices
2. Use the **same** Supabase project credentials
3. Build and install the app on each device

## Troubleshooting

### "Supabase not configured"
- Check that `SUPABASE_ANON_KEY` is set (not the placeholder)

### "Games table not found"
- Run the migration SQL in Step 1

### Sync not working between devices
- Verify both devices have the same `SYNC_USER_ID`
- Check that both are connected to the internet
- Tap the sync indicator to force a sync

### Data not appearing
- Wait a few seconds after making changes (sync is debounced)
- Pull to refresh / reopen the app on the other device

## Security Notes

- Your data is identified by your `SYNC_USER_ID` UUID
- The anon key allows read/write access to the games table (RLS is permissive)
- For a personal app this is fine; for production you'd add proper auth
- Keep your `secrets.ts` private and don't commit it to git
