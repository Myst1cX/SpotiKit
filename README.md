# SpotiKit

A JavaScript userscript that customizes the Spotify Web interface.

## Features

### Desktop (`open.spotify.com`) — v6 features
- Ad blocking (ads, banners, download prompts)
- AMOLED pure black mode (`--background-base: #000`)
- Library sidebar toggle (expand/collapse with fullscreen overlay)
- Close now-playing panel
- Auto-close library on playlist/item selection (preserves folder clicks)# SpotiKit

A JavaScript userscript that customizes the Spotify Web interface.

## Features

### Desktop (`open.spotify.com`)
- Ad blocking (ads, banners, download prompts)
- Hide Premium pages and payment pages

### Mobile web player (`open.spotify.com` in responsive view on PC)
- Hide floating tooltips (`[data-tippy-root]`)
- Hide mobile upsells (`[data-testid="mobile-upsell"]`)
- Hide OneTrust consent dialog (`#onetrust-consent-sdk`)
- Library tab redirect — intercepts bottom navigation "Library" tab and redirects to `/collection/tracks`
- Prevent library context menu (`data-context-menu-open`) from appearing on Library tab
- UI spoticap (desktop force)

### Account pages (`spotify.com/account/*`, payments, etc.)
- Text replacements (e.g. "Spotify Free" → "Premium Individual", "Shuffle play" → "Play any song", etc.)
- Pink Premium branding on plan cards
- Premium page blocker — replaces premium/duo/student/family pages with a "you don't need Premium" message
- Payment page blocker — replaces payments.spotify.com with a "don't waste your money" message
- Disable payment forms and checkout buttons
- Hide download/install app prompts
- Hide "Open in Desktop App" elements
- Hide Premium navigation links

# SpotiKit++ Mobile Desktop

A Tampermonkey userscript that transforms [open.spotify.com](https://open.spotify.com) into a **mobile**-style interface on your desktop. It includes a bottom navigation bar, a library overlay, a compact player, a Premium spoof, and ad blocking.

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) in your browser (Chrome, Edge, Firefox, Opera).
2. Click on [`SpotiKitMobileDesktop.js`](SpotiKitMobileDesktop.js) and then on **Raw** (or copy the content manually).
3. Tampermonkey will open the installation page → click **Install**.
4. Go to [open.spotify.com](https://open.spotify.com) and reload the page.

## Features

### Mobile Interface
- **Bottom navigation bar** with Home, Search, and Library tabs.
- **Library** as a full-screen overlay (with no visible sidebar).
- **Compact player** with album art, like, skip, and play/pause buttons.
- Thin progress bar at the top edge of the player.
- Home button hidden in Search and Library.


### Mobile DOM Hacks
- Synchronization with the sidebar (sidebar toggle without conflicts with React).
- Automatic closing of the playback panel when navigating.
- Extraction of official Spotify SVGs from the DOM.


## Notes

- Client-side JavaScript only.
- No Spotify servers are modified.
- No account data is changed.
- Visual customization only.

## License

MIT License
