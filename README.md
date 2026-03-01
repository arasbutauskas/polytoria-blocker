# Polytoria Friend Request Blocker

A Chrome/Chromium extension that automatically declines incoming friend requests from usernames you choose on `polytoria.com`.

## Features

- Block a custom list of usernames (case-insensitive).
- Automatically scans request UI and presses the decline/ignore button when a blocked sender is detected.
- Simple popup UI to add/remove blocked usernames.
- Uses `chrome.storage.sync` so your list can sync across browsers signed into the same profile.

## Install (Developer Mode)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder (`polytoria-blocker`).

## Usage

1. Click the extension icon.
2. Add usernames you want blocked.
3. Open Polytoria where friend requests appear.
4. Requests from blocked users will be auto-declined.

## Notes

- Usernames are normalized to lowercase (`ExampleUser` and `exampleuser` are treated the same).
- The blocker looks for request cards and decline-like buttons (Decline/Ignore/Deny text).
- If Polytoria changes its UI selectors, you may need to adjust `content.js`.
