# iCloud Setup Instructions

These steps must be completed manually in Xcode to enable iCloud sync.

## Prerequisites

- Apple Developer Account
- Xcode with your project open

## Step 1: Enable iCloud Capability

1. Open the `ios/GameTrackerNew.xcworkspace` in Xcode
2. Select the `GameTrackerNew` project in the navigator
3. Select the `GameTrackerNew` target
4. Go to the **Signing & Capabilities** tab
5. Click **+ Capability**
6. Search for and add **iCloud**

## Step 2: Configure iCloud Services

In the iCloud capability section:

1. Check **iCloud Documents** (we use file-based storage)
2. Check **Key-value storage** (optional, for future use)

## Step 3: Create iCloud Container

1. In the iCloud section, click the **+** button under Containers
2. Create a container with identifier: `iCloud.com.yourteam.GameTracker`
   - Replace `yourteam` with your Apple Developer Team ID
   - Or use your app's bundle identifier prefix
3. Wait for the container to be created (it should turn from red to normal)

## Step 4: Verify Entitlements

After adding the capability, Xcode should automatically create/update the entitlements file. Verify it contains:

```xml
<key>com.apple.developer.icloud-container-identifiers</key>
<array>
    <string>iCloud.com.yourteam.GameTracker</string>
</array>
<key>com.apple.developer.icloud-services</key>
<array>
    <string>CloudDocuments</string>
</array>
<key>com.apple.developer.ubiquity-container-identifiers</key>
<array>
    <string>iCloud.com.yourteam.GameTracker</string>
</array>
```

## Step 5: Create Swift Bridging Header (if not exists)

1. In Xcode, go to File > New > File
2. Select **Swift File**
3. Name it anything (e.g., `Dummy.swift`)
4. When prompted to create a bridging header, click **Create Bridging Header**
5. **Do NOT delete this Swift file** - it's required for the native module

## Troubleshooting

### Container shows in red
- Wait a few minutes for Apple's servers to provision the container
- Make sure you have an active Apple Developer membership

### iCloud not available on device/simulator
- Make sure you're signed into iCloud on the device
- Check Settings > [Your Name] > iCloud > iCloud Drive is enabled

### Sync not working
- iCloud sync can take a few minutes
- Try force-quitting and reopening the app
- Check the device's iCloud storage isn't full

## Testing

To test iCloud sync:
1. Install the app on two devices with the same Apple ID
2. Add a game on Device A
3. Wait 1-2 minutes
4. Open the app on Device B - the game should appear

## Container Identifier

Update this after creating your container:

```
Container ID: iCloud.com.yourteam.GameTracker
```
