# Privacy Policy for GameTracker

**Last updated: February 19, 2026**

## Overview

GameTracker is a video game collection tracker for iOS. Your privacy is important to us. This policy explains what data the app collects, how it's used, and your rights.

## Data We Collect

### Game Collection Data
- Game titles, platforms, and completion status that you add to your collection
- Games you dismiss in the Discovery feature

This data is stored locally on your device using AsyncStorage.

### Cloud Sync (Optional)
If you use the sync feature, your game collection data is uploaded to our Supabase-hosted database. This includes:
- Game titles and platforms
- Completion status and dates
- A unique device identifier (UUID generated locally)

No personal information (name, email, location) is collected or transmitted.

### Third-Party Services

**RAWG API (rawg.io)**
- The app uses the RAWG video game database to search for games and retrieve box art
- You provide your own RAWG API key, which is stored locally on your device
- Search queries are sent to RAWG's servers. See [RAWG's privacy policy](https://rawg.io/privacy) for details

**Supabase**
- Cloud sync uses Supabase as the backend database
- Data is stored on Supabase's infrastructure. See [Supabase's privacy policy](https://supabase.com/privacy) for details

## Data We Do NOT Collect

- No personal information (name, email, phone number)
- No location data
- No analytics or usage tracking
- No advertising identifiers
- No cookies or web tracking
- No data is sold to third parties

## Data Storage and Security

- Local data is stored on-device in AsyncStorage
- Cloud-synced data is stored in a Supabase PostgreSQL database with Row Level Security policies restricting access
- All network communication uses HTTPS

## Your Rights

- **Export**: You can export your entire game collection as a CSV file from Settings
- **Delete**: You can delete all local data from Settings. To delete cloud data, use the "Delete All Data" option before syncing
- **No Account Required**: The app does not require account creation

## Children's Privacy

GameTracker does not knowingly collect data from children under 13. The app does not require any personal information to use.

## Changes to This Policy

We may update this policy from time to time. Changes will be reflected in the "Last updated" date above.

## Contact

For questions about this privacy policy, please open an issue at the project's GitHub repository.
