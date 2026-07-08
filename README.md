# SpotiKit

A JavaScript userscript that customizes the Spotify Web interface.

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) (Brave).
2. Click the raw link below — Tampermonkey will open the install dialog:
   - **https://raw.githubusercontent.com/kitbodega/SpotiKit/main/SpotiKitMobileDesktop.user.js**
3. Click **Install**.
4. Go to [open.spotify.com](https://open.spotify.com) and reload.

## Features

### Mobile-like Desktop UI (`open.spotify.com`)
- **Floating player** with glassmorphism (blur, border, rounded corners) and minimize toggle button
- **Transparent bottom navigation bar** with Home, Search, and Library tabs
- **Library as full-screen overlay** (no persistent sidebar)
- **Home button always visible** with filled SVG icon
- **Search input hidden globally**, shown only on Search page
- **Right sidebar (Now Playing) visible** but selectively collapsed — hides close button, artist bio, and credits; keeps the **queue list** visible
- **Auto-closes Now Playing panel** when it opens on song play (MutationObserver)
- Official Spotify SVGs extracted from the DOM for the bottom nav icons
- Ad blocking (CSS-only, no audio/video manipulation)

### Premium Spoof & Page Blockers (`spotify.com/account/*`, payments, etc.)
- Text replacements (e.g. "Spotify Free" → "Premium Individual", "Shuffle play" → "Play any song")
- Pink Premium branding on plan cards
- Premium/duo/student/family pages blocked — replaced with "you don't need Premium" message
- Payment page blocker — replaces `payments.spotify.com` with "don't waste your money" message
- Disable payment forms and checkout buttons
- Hide download/install app prompts, "Open in Desktop App" elements, and Premium navigation links

## Notes

- Client-side JavaScript only. No Spotify servers are modified.
- No account data is changed. Visual customization only.
- Requires Tampermonkey or compatible userscript manager.

## License

MIT
