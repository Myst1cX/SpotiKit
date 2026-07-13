## SPOTIKIT USERSCRIPTS

> Fork of [kitbodega/SpotiKit](https://github.com/kitbodega/SpotiKit).   
> **Recommended userscript manager:** [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)   

Two scripts, pick one:

> **SpotiwebJS**: premium spoof + ad-slot removal only. Forced english locale spoof. No desktop UI layout changes except for the restoration of the old Now Playing View button.   
>
> **SpotiKitMobileDesktop**: everything SpotiwebJS does, plus a full mobile-like layout on open.spotify.com (floating player, bottom nav, library-as-overlay). Already includes the desktop script's features, so don't install both.
> **NOTE**: An updated version of the mobile script (Spotifuck Mobile) can be found [here](https://github.com/Myst1cX/spotifuck-userscript) - fixed the library bugs, restored the Now Playing View toggle.   
> **Spotifuck Mobile**: takes in all of SpotiKitDesktopMobile. Ad-slot cleanup and visual premium spoof, with which also came the logging of replaced text nodes and a forced english locale spoof are features that remain in this version. Check out [Spotifuck's Installation Guide](https://github.com/Myst1cX/spotifuck-userscript/blob/main/README.md).    
> **NOTE**: The original dev of the SpotiKitMobileScript script (now called SpotiKitUI) has resumed work. Their updates can be found [here](https://github.com/kitbodega/SpotiKit) - they will likely merge the library bug fixes and the Now Playing View. Watch out for new updates!    
> SpotiKitUI focuses on the mobile-like enhancement aspect. Other features (ad-slot cleanup and visual premium spoof, with which also came the logging of replaced text nodes and a forced english locale spoof are no longer present there).   

## Features

> **MOBILE-LIKE UI ENHANCEMENT**  
>
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

### SpotiwebJS 

> Matches `open.spotify.com`, `www.spotify.com`'s account/premium/duo/student/family pages and `payments.spotify.com` (plan payment blockers/redirects),   
> Premium/duo/student/family pages get replaced outright with a "you don't need Premium" message and a link home.  
> Payments page gets replaced with a "don't waste your money" message; checkout/payment buttons are disabled.   
> Restoration of the old Now Playing View button.   

### SpotiKitMobileDesktop 

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

* * *

> **NOTE:** This is an experimental build. There may be bugs with the library view. Now Playing View feature is missing.   
> **NOTE**: An updated version of the mobile script (Spotifuck Mobile) can be found [here](https://github.com/Myst1cX/spotifuck-userscript/raw/main/spotifuck-mobile.user.js) - fixed the library bugs, restored the Now Playing View toggle.   
> **Spotifuck Mobile**: takes in all of SpotiKitDesktopMobile. Ad-slot cleanup and visual premium spoof, with which also came the logging of replaced text nodes and a forced english locale spoof are features that remain in this version. Check out [Spotifuck's Installation Guide](https://github.com/Myst1cX/spotifuck-userscript/blob/main/README.md).    
> **NOTE**: The original dev of the SpotiKitMobileScript script (now called SpotiKitUI) has resumed work. Their updates can be found [here](https://github.com/kitbodega/SpotiKit/blob/main/SpotiKitUI.user.js) - they will likely merge the library bug fixes and the Now Playing View. Watch out for new updates!    
> SpotiKitUI focuses on the mobile-like enhancement aspect. Other features (ad-slot cleanup and visual premium spoof, with which also came the logging of replaced text nodes and a forced english locale spoof are no longer present there).    

* * *

## Installation
a) DESKTOP:
> 1. Install [Violentmonkey](https://violentmonkey.github.io/)  
> 2. Recommended: [Ublock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)  
> 3. Alternative to Ublock Origin for blocking Spotify ads: [uSpot - Spotify Ad Blocker](https://github.com/Myst1cX/uSpot/releases). Click [here](https://github.com/Myst1cX/uSpot/blob/main/README.md) for installation steps.   
> 4. Optional - for the lyrics translator inside the stock spotify lyrics view: [Cigi Spotify Translator - broken, may fork shortly](https://greasyfork.org/en/scripts/523415-cigi-spotify-translator)
> 5. Install [SpotiwebJS](https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.user.js) (ad-slot removal, visual premium and forced English locale spoof, restoration of the old Now Playing View button)    
> 6. Optional: [Spotify Lyrics+](https://raw.githubusercontent.com/Myst1cX/spotify-web-lyrics-plus/main/pip-gui-stable.user.js). Click [here](https://github.com/Myst1cX/spotify-web-lyrics-plus/blob/main/README.md) for the setup and feature list.    
> 7. Open [Spotify Web Player](https://open.spotify.com/)

b) MOBILE: 
> NEW 'QUETTA BROWSER + USER-AGENT SWITCHER AND MANAGER' METHOD:    
> Credits to: [u/soujunim/](https://www.reddit.com/r/SpotifyLatestModAPK/comments/1upaed1/mobile_browser_spotifuck_ui_and_adblock/)
> 
> 1. Download and install the Quetta Browser.    
> 2. Quetta Browser > Open Spotify Web and login to your account   
> 3. Press on the three dots next to the search bar's tab counter.   
> 4. Click on the Extensions tab > Manage Extensions > Search Extensions and get the following: 'Violentmonkey', 'User-Agent Switcher and Manager', 'Spotify Ad-Blocker (Blockify)'   
> 5. Backup ad-blocking extension: [uSpot - Spotify Ad Blocker](https://github.com/Myst1cX/uSpot/releases)    
> Click [here](https://github.com/Myst1cX/uSpot/blob/main/README.md) for installation steps.   
> 6. NOTE: Keep only 1 ad-blocking extension enabled at the same time.    
> 7. Optional - for a lyrics translator inside the stock spotify lyrics view: [Cigi Spotify Translator - broken, may fork shortly](https://greasyfork.org/en/scripts/523415-cigi-spotify-translator)   
> 8. Optional: [Spotify Lyrics+](https://raw.githubusercontent.com/Myst1cX/spotify-web-lyrics-plus/main/pip-gui-stable.user.js). Click [here](https://github.com/Myst1cX/spotify-web-lyrics-plus/blob/main/README.md) for the setup and feature list.   
> 9. Install your preferred mobile layout script:
> a) Spotifuck Userscript (best choice): [install](https://raw.githubusercontent.com/Myst1cX/spotifuck-userscript/main/spotifuck-mobile.user.js)     
> b) SpotiKitMobileDesktop (my 7.31.fork of SpotiKitUI, mobile-like layout + visual premium spoof): [install](https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitMobileDesktop.user.js)     
> c) SpotiKitUI (the successor of SpotiKitMobileDesktop, focus only on mobile-like layout enhancement): [install](https://raw.githubusercontent.com/kitbodega/SpotiKit/main/SpotiKitUI.user.js)    
> 10. Open the Spotify web player > Press on the three dots next to the search bar's tab counter > Click on the Extensions tab > Click on the 'User-Agent Switcher and Manager' extension icon > Select the first option (a Chrome Windows 10 user agent) > Click 'Apply (this tab' and then 'Refresh Tab'.   
> 11. Spotify web player should reload. The interface should now be mobile-friendly.   
> 12. NOTE: Keep Desktop Mode (browser setting) disabled.    

* * * 

> LEGACY 'FIREFOX BROWSER + CHAMELEON EXTENSION' METHOD (SLOWER, LESS RESPONSIVE):
> 1. Download the latest version of Firefox (must be the Original version; Nightly or other releases might break your userscript manager).  
> 2. Install [Violentmonkey](https://violentmonkey.github.io/)    
> 3. Recommended: [Ublock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)  
> 4. Alternative to Ublock Origin for blocking Spotify ads: [uSpot - Spotify Ad Blocker](https://github.com/Myst1cX/uSpot/releases). Click [here](https://github.com/Myst1cX/uSpot/blob/main/README.md) for installation steps.   
> 5. Optional - for the lyrics translator inside the stock spotify lyrics view: [Cigi Spotify Translator](https://greasyfork.org/en/scripts/523415-cigi-spotify-translator)
> 6. Optional: [Spotify Lyrics+](https://raw.githubusercontent.com/Myst1cX/spotify-web-lyrics-plus/main/pip-gui-stable.user.js). Click [here](https://github.com/Myst1cX/spotify-web-lyrics-plus/blob/main/README.md) for the setup and feature list.    
> 7. Install your preferred mobile layout script:
> a) Spotifuck Userscript (best choice): [install](https://raw.githubusercontent.com/Myst1cX/spotifuck-userscript/main/spotifuck-mobile.user.js)     
> b) SpotiKitMobileDesktop (my 7.31.fork of SpotiKitUI, mobile-like layout + visual premium spoof): [install](https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitMobileDesktop.user.js)     
> c) SpotiKitUI (the successor of SpotiKitMobileDesktop, focus only on mobile-like layout enhancement): [install](https://raw.githubusercontent.com/kitbodega/SpotiKit/main/SpotiKitUI.user.js)    
> 8. Install [Chameleon](https://addons.mozilla.org/en-US/android/addon/chameleon-ext/) extension   
> 9. Chameleon extension settings > Profile Panel (globe icon) > Select Random Profile (Desktop)  
> 10. Chameleon extension settings > Options Panel > Select the 'Profile' option under the 'Screen size' option  
> 11. Go back to Firefox browser > Firefox Settings > Site settings > Click on "DRM-controlled content" and select "Allowed"  
> 12. Restart Firefox  
> 13. Open Spotify Web and login to your account  
> 14. The interface should be mobile friendly > If it ever resets, try redoing the Chameleon extension configuration and refreshing the Spotify page
> 15. NOTE: Keep Desktop Mode (browser setting) disabled.
> 16. Play a song  
> 17. Click on the Lyrics+ button to open the interface popup and see the song lyrics  

* * *

> **TIP:** Add Spotify Web Player to your home screen for a PWA-like experience.

* * *

## Ad-Blocking (actual audio ads)

> Neither script here blocks the ad audio itself — the ad-slot removal is just DOM cleanup. For true audio ad blocking, use **[uBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)** or **[uSpot](https://github.com/Myst1cX/uSpot/releases/)** alongside whichever script you picked. More on the difference [here](https://github.com/Myst1cX/uSpot/blob/main/README.md#uspot-vs-ublock-origin-what-is-the-difference).

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
