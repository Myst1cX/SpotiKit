## SPOTIKIT USERSCRIPTS

> Fork of [kitbodega/SpotiKit](https://github.com/kitbodega/SpotiKit).   
> **Recommended userscript manager:** [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)

Two scripts, pick one:

> **SpotiwebJS**: premium spoof + ad-slot removal only. No layout changes. Use this if you want Spotify's normal desktop UI left alone.
>
> **SpotiKitMobileDesktop**: everything SpotiwebJS does, plus a full mobile-like layout on open.spotify.com (floating player, bottom nav, library-as-overlay). Already includes the desktop script's features, so don't install both.

## Features

> **FORCE ENGLISH**  
> Overrides `navigator.language`, strips non-English `/intl-xx/` and region paths, and flips your account's actual language setting at `open.spotify.com/preferences` through a hidden iframe - reloads, verifies it stuck, retries a few times if not.  
> Everything else here is keyed off English aria-labels, so without this the scripts just silently stop matching on non-English accounts.
>
> **VISUAL PREMIUM SPOOF**  
> Swaps "Free"/"Spotify Free" text and badges for Premium, recolors plan cards, relabels or hides upgrade/"Try" buttons, turns pricing-table cells into checkmarks, and rebuilds the account compact banner into "Edit profile"/"Payment method" buttons instead of an upgrade nag.  
> Toggleable per site (for `open.spotify.com` and for `www.spotify.com`) from the userscript manager menu, saved via GM storage, enabled by default.
>
> **AD-SLOT CLEANUP**  
> Removes ad-slot-container elements from the DOM. Cosmetic only.   
> Doesn't touch the actual audio ad requests (see [Ad-Blocking (actual audio ads)](https://github.com/Myst1cX/SpotiKit/blob/main/README.md#ad-blocking-actual-audio-ads) below for that.
>
> **LOGGING OF TEXT NODE SWAPS**  
> Every text swap gets logged. A "📋 Show everything replaced so far" menu command dumps it as a table in the console.
>
> **EFFICIENT SCANNING**  
> The text-replacement pass only re-scans nodes that actually changed (debounced MutationObserver), not a blind full-page walk on a timer.

### SpotiwebJS only

> Matches `open.spotify.com`, `www.spotify.com`'s account/premium/duo/student/family pages and `payments.spotify.com` (plan payment blockers/redirects),   
> Premium/duo/student/family pages get replaced outright with a "you don't need Premium" message and a link home.  
> Payments page gets replaced with a "don't waste your money" message; checkout/payment buttons are disabled.

### SpotiKitMobileDesktop only

> Does everything above too (layout changes are restricted to open.spotify.com so they don't leak onto the account pages), plus:
>
> **FLOATING PLAYER**  
> Glassmorphism now-playing bar (blur, translucent, rounded corners) with a minimize toggle.
>
> **BOTTOM NAV**  
> Home / Search / Library, built-in fallback icons, active tab follows the route.
>
> **LIBRARY OVERLAY**  
> Library opens full-screen instead of as a sidebar, closes itself once you tap into a track/album/playlist (folders don't trigger the close, so navigating to playlists still works).
>
> **SEARCH BAR**  
> Hidden everywhere except the search page.
>
> **SIMPLER REDIRECTS**  
> Premium/duo/student/family and payments pages redirect straight to open.spotify.com instead of showing an overlay message.

> NOTE: This is an experimental build. There may be bugs with the library view.   
> Consider a more stable version: [Spotifuck Userscript](https://raw.githubusercontent.com/Myst1cX/spotifuck-userscript/main/spotifuck-v6.user.js).    
> [README & Installation Guide](https://github.com/Myst1cX/spotifuck-userscript/blob/main/README.md)    

## Installation

> 1. Install [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
> 2. Click whichever raw link matches what you want - it'll pop the install dialog:
>    - Desktop / spoof only: **https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.js**
>    - Mobile-like layout: **https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitMobileDesktop.user.js**
> 3. Install it.
> 4. Go to [open.spotify.com](https://open.spotify.com) and reload.
> 5. On mobile, you'll need a few more steps:
> 6. Install Chameleon extension
> 7. Chameleon extension settings > Profile Panel (globe icon) > Select Random Profile (Desktop)
> 8. Chameleon extension settings > Options Panel > Select the 'Profile' option under the 'Screen size' option
> 9. Go back to Firefox browser > Firefox Settings > Site settings > Click on "DRM-controlled content" and select "Allowed"
> 10. Restart Firefox
> 11. Open Spotify Web and login to your account
> 12. The interface should be mobile-friendly > If it ever resets, try redoing the Chameleon extension configuration and refreshing the Spotify page
> 13. NOTE: Keep Desktop Mode (browser setting) disabled.

* * *

> **TIP:** Add Spotify Web Player to your home screen for a PWA-like experience.

* * *

## Ad-Blocking (actual audio ads)

> Neither script here blocks the ad audio itself — the ad-slot removal is just DOM cleanup. For true audio ad blocking, use **[uBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)** or **[uSpot](https://github.com/Myst1cX/uSpot/)** alongside whichever script you picked. More on the difference [here](https://github.com/Myst1cX/uSpot/blob/main/README.md#uspot-vs-ublock-origin-what-is-the-difference).

## Notes

> - Client-side only, doesn't touch Spotify's servers.
> - Doesn't change any account data except the language setting, and only if Force English needs to flip it.
> - Needs a userscript manager (Tampermonkey or Violentmonkey preferrably).

## Feedback

> For feedback or bug reports, open an issue:  
> [https://github.com/Myst1cX/SpotiKit/issues](https://github.com/Myst1cX/SpotiKit/issues)

## Credits

> 1. **Forked from** [kitbodega/SpotiKit](https://github.com/kitbodega/SpotiKit).
> 2. **Powered by** [Spotify](https://open.spotify.com/).

## License

> This project is licensed under the [MIT License](https://github.com/Myst1cX/SpotiKit/blob/main/LICENSE). (attached below is the original author's license)
