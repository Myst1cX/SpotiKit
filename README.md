[README.md](https://github.com/user-attachments/files/29723797/README.md)
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

### Desktop (`open.spotify.com`) — features
- Ad blocking (ads, banners, download prompts)
- AMOLED pure black mode (`--background-base: #000`)
- Library sidebar toggle (expand/collapse with fullscreen overlay)
- Close now-playing panel
- Auto-close library on playlist/item selection (preserves folder clicks)
- Home button closes now-playing panel
- Search input hides now-playing bar on focus
- Compact banner repurposed as profile/payment shortcuts
- Tracklist layout improvements (compact rows, scaled buttons, grid adjustments)
- Rainbow playback bar (progress bar with rainbow gradient)
- Visual Premium interface (pink styling, text replacements)
- Block Premium pages and payment pages

### Mobile web player (`open.spotify.com` in responsive view on PC)
- Hide floating tooltips (`[data-tippy-root]`)
- Hide mobile upsells (`[data-testid="mobile-upsell"]`)
- Hide OneTrust consent dialog (`#onetrust-consent-sdk`)
- Library tab redirect — intercepts bottom navigation "Library" tab and redirects to `/collection/tracks`
- Prevent library context menu (`data-context-menu-open`) from appearing on Library tab
- UI spoticap

### Account pages (`spotify.com/account/*`, payments, etc.)
- Text replacements (e.g. "Spotify Free" → "Premium Individual", "Shuffle play" → "Play any song", etc.)
- Pink Premium branding on plan cards
- Premium page blocker — replaces premium/duo/student/family pages with a "you don't need Premium" message
- Payment page blocker — replaces payments.spotify.com with a "don't waste your money" message
- Disable payment forms and checkout buttons
- Hide download/install app prompts
- Hide "Open in Desktop App" elements
- Hide Premium navigation links

## Notes

- Client-side JavaScript only.
- No Spotify servers are modified.
- No account data is changed.
- Visual customization only.

## License

MIT License
