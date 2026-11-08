## SpotiwebJS

_Applies to script version **7.0.28**._

A desktop-layout userscript for the Spotify Web Player: spoofs Spotify Premium visually, forces the player to render in English, restores a real "Now Playing View" toggle button with its own guard system, and adds a pure-black AMOLED theme. No mobile-layout changes.  Works on desktop or on an actual phone browser if you just prefer the desktop-style layout. It's also the script the Spotifuck Spotify Web app loads when its Spotifuck Mode is switched off (see [Spotify Web app integration](#spotify-web-app-integration-windowandbridge)).

> **Recommended userscript manager:** [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)    
> Want a mobile-layout version instead?    
> See [Spotifuck Mobile](https://github.com/Myst1cX/spotifuck-userscript/blob/main/spotifuck-mobile/README.md) in this same repo.

## Index

- [Features](#features)
  - [Now Playing View, Queue, and Connect panel guard system](#now-playing-view-queue-and-connect-panel-guard-system)
  - [AMOLED mode](#amoled-mode)
  - [Force English](#force-english)
  - [Visual Premium Spoof](#visual-premium-spoof)
  - [Debug Logging & Replacement Log](#debug-logging--replacement-log)
  - [Efficient Scanning](#efficient-scanning)
  - [Spotify Web app integration (`window.AndBridge`)](#spotify-web-app-integration-windowandbridge)
- [Installation](#installation)
- [Ad-Blocking (actual audio ad blocking)](#ad-blocking-actual-audio-ads)
- [Notes](#notes)
- [Feedback](#feedback)
- [Credits](#credits)
- [License](#license)

## Features

> Matches the whole `open.spotify.com`, `www.spotify.com`, and `payments.spotify.com` origins.

### Now Playing View, Queue, and Connect panel guard system

The old `Now Playing View` button toggle was ported directly from the reverse-engineered Spotifuck APK (`r0/e.java`) and enrichened with a guard system. `npBtn` is that restored toggle, built to sit and look exactly where the button used to live, next to the lyrics button - it exists specifically to replace Spotify's own current native arrow toggle in the sidebar, which is redundant now and gets hidden separately: a CSS block (`styleId 'npv-guard-hide-native-toggle-style'`) squeezes the ancestor region that native arrow lives in down to zero effective width and force-expands the freed space to `100vw`, scoped behind `html:not(.fuckd-panel-open)` so it doesn't also crush a legitimately open NPV/Queue/Connect panel. The guard itself treats Now Playing View, Queue, and Connect to a Device as three interchangeable panels sharing a single DOM slot, and authorizes opens/closes per-panel instead of only recognizing NPV.   
a) Because `npBtn` is our own restored button rather than a live Spotify control, nothing else is listening for clicks on it - so clicking it just calls our own `clickNP()`, which does two things back-to-back: first it tells the guard this open/close is authorized (`setAuthorizedPanel('npv'|null)`), then it clicks Spotify's actual (hidden) native toggle button on the person's behalf to make the panel really open or close. Since both steps are our own code running one after the other, there's no race to worry about. The Queue button and the Connect button are different - those are Spotify's real, currently-live buttons, already wired with Spotify's own click handler, so our script adds one more listener on top rather than replacing anything. The player-bar album art works the same way, except the listener is delegated from the persistent `now-playing-widget` container (checking that the click landed on `cover-art-button`) rather than attached to the button itself, because React can replace that button on a track change and take a direct listener with it. That extra listener runs in the capture phase (`{ capture: true }`), which always fires before the normal listener Spotify itself uses, and calls `setAuthorizedPanel('npv'|'queue'|'connect'|null)` there - the panel name if this click is about to open it, `null` if it's about to close whichever one is currently open - so the guard already knows it was authorized a beat before Spotify's own handler even starts opening the panel.    
b) `panelGuardObserver` (renamed from `npvGuardObserver` once it grew to cover all three) decides whether to auto-close a panel purely from whether the shared container is open at all (`isAnyPanelOpen()`, read off its `inert` attribute) and whether any of the three was authorized (`isAnyPanelAuthorized()`) - not from label-matching against a specific panel type, because Spotify briefly renders the shared container with its default "Now playing view" label for the very first tick after Queue or Connect opens too, before it settles to the correct "Queue"/"Connect to a device" value a moment later; checking the label on that first tick would misread a legitimate Queue/Connect open as an unauthorized NPV open. `isNpvOpen()`/`isQueueOpen()`/`isConnectOpen()` are still used throughout - by `clickNP()` and the album art/Queue/Connect listeners, to work out whether a given click is opening or closing that specific panel, and by the guard's own `dbg()` diagnostics - just no longer to decide whether `panelGuardObserver` auto-closes something.      
c) Since the panel's own in-panel close button closes it through Spotify's native handler directly and never touches this script's `closeNowPlay()`, the observer also watches for a genuine open-to-closed transition and clears a lingering authorized flag the moment it sees one that didn't go through `closeNowPlay()`, so a later, unrelated native open (a playlist auto-opening NPV, say) isn't wrongly trusted just because the previous session was never explicitly closed.         
d) `setupNpvButton()` also runs its own cleanup check the moment it inserts `npBtn`, closing anything already left open from before the guard existed. It deliberately checks the same way `panelGuardObserver` does - `isAnyPanelOpen()`/`isAnyPanelAuthorized()` - rather than checking `isNpvOpen()` specifically. The reason: this cleanup only ever runs once, right when `npBtn` first gets inserted, and if that moment happens to coincide with someone freshly opening Queue or Connect, `isNpvOpen()` could get fooled by the same stale label issue from (b) - it would see the generic "Now playing view" label still lingering and wrongly conclude NPV was open, and then close the Queue/Connect panel the person just opened on purpose. Checking "is *any* panel open, and was it authorized" instead avoids that entirely. Separately, the cold-load setup poll itself doesn't stop until it's wired all four triggers - `npBtn`, album art, Queue, and Connect - since the latter two can take longer to become reliably queryable than the player-bar elements, and stopping early would leave them stuck on Spotify's own native, unauthorized handling for the rest of the session.      
e) `npBtn` also shows whether NPV specifically is open right now - a green icon plus a small dot underneath, values chosen to match the small indicator dot Spotify's own toggle used to show. This isn't set at click time by `npBtn`'s own handler; it's kept in sync by the same `panelGuardObserver` mutation callback that drives everything else above, reading straight off `userOpenedNPV` rather than off Spotify's DOM/aria-label (for the same reason as (b) - that label can't reliably tell NPV apart from a freshly-opening Queue/Connect on the first tick), so the icon only ever turns green when NPV specifically, not Queue or Connect, was the thing authorized open, and it re-syncs on its own the moment Spotify's real DOM changes rather than needing another click to catch up. `npBtn` is built once by cloning the lyrics button's own classes, which is what gives it Spotify's real button sizing, padding, and hover/focus feedback for free instead of needing to be hand-styled from scratch - but its resting-state color, and the dot's presence, are pinned directly by this script's own CSS with `!important` rather than left to whatever classes happen to be riding along on that clone. That matters because those classes are Spotify's own internal, hashed build output, not a stable public API - they can be renamed on any Spotify deploy - and if `npBtn` happened to be cloned at the exact moment the lyrics button was transiently carrying whatever class Spotify currently uses to mark that state, Spotify's own stylesheet would style `npBtn` off of that instead of anything this script controls, making the icon look "open" even while NPV is genuinely closed. The green/active-state color and the dot itself don't need that same `!important` treatment: the cloned Spotify classes on `npBtn` are only ever set once, at that same clone moment, and never touched again afterward (only `npBtn`'s own `.active` class keeps changing, via `classList.toggle`) - so the only way a leaked class could ever be present at all is if NPV genuinely was open at clone time, in which case the leaked class and a later authorized `.active` toggle both agree the icon should be green, rather than fighting over it. The resting state is the only one a leaked class can actually contradict, which is exactly the state pinned with `!important`.    

### AMOLED mode

Pure-black AMOLED theme, ported from the same Spotifuck apk (`r0/e.java` line 207) - also later carried over into SpotiwebJS. Forces the player bar and the app's dark-theme background variables (declared with `!important`, so Spotify's own closer redeclarations can't win) to pure black. Always on, not tied to either spoof toggle, and injected on every matched host, so the `www.spotify.com` account pages and `payments.spotify.com` are black too, not just `open.spotify.com` (the account page's "Edit profile / Payment method" banner is pinned black to match). The avatar/user menu on `open.spotify.com` doesn't read those variables, so it is pinned black directly (`#context-menu ul[role="menu"]`). Later widened to cover some overlays which would previously fail to inherit the style and fall back to Spotify's default dark gray theme (Spotifuck Mobile userscript also covers its own Library overlay with the patch).

### Force English

Originally added in v6.3 of spotifuck-mobile.user.js as the browser-side equivalent of the reverse-engineered Spotifuck app's own locale-forcing (its `ForceEn` behavior, which forces the app's Android Configuration locale to English before loading its WebView) - there's no app Configuration to set in a browser, so this spoofs `navigator.language`/`navigator.languages` to `en-US` at document-start, redirects `www.spotify.com` off non-English `xx-yy` region-language paths (e.g. `/si-sl/` &rarr; `/si-en/`) and off `/intl-xx/` prefixes, and flips the account's actual language setting at `open.spotify.com/preferences` through a hidden iframe - then verifies the change stuck on the next load and retries a capped number of times if it didn't. The region-code table this relies on (which countries have no English storefront, which ones use a bare country code for English, etc.) is hand-checked against Spotify's own `/spotify.com/select-your-country-region/` listing and then ported back here, replacing the script's own initially smaller allowlist. Force English doesn't depend on either spoof toggle: the `www.spotify.com` region-path redirect, the `/intl-xx/` correction and the account-language flip all run whether the spoof is on or off. The `/intl-xx/` URL correction and the account-setting flip don't run immediately at document-start; they wait for the player's Play/Pause button to actually exist first, since running that correction before Spotify's own SPA has started hydrating could leave the page stuck mid-load.

Everything else here is keyed off English aria-labels, so without this the script just silently stops matching on non-English accounts.

### Visual Premium Spoof

Adopted from SpotiwebJS/kitbodega's original SpotiKit code and extended independently since. Rewrites the free-tier UI to look like a Premium account, handled per page so that as little as possible runs in the background:

- **`open.spotify.com` - CSS only.** The "Explore Premium" upgrade button, the "Upgrade to Premium" link in the avatar menu (which only appears after the avatar is clicked), the install-app link, and the whole page footer (which holds the "Spotify Plans" list) are hidden by one CSS rule injected as soon as `<head>` exists. No observer, no timed pass, no text replacement. Each hidden element is still reported once in the replacement log (see [Debug Logging & Replacement Log](#debug-logging--replacement-log)).
- **`www.spotify.com` account and other pages - a JS pass.** Swaps "Free"/"Spotify Free"/"Free plan" text for "Premium Individual" and "1 Free account" copy for "1 Premium account" wherever it appears in headings, spans, badges, and plan cards, recoloring the matched elements pink. A table of plan-comparison phrases is rewritten the same way ("Music with ads" → "Listen to music ad-free", "Shuffle play" → "Play any song", "Limited skips" → "Unlimited skips", the audio-quality and offline-listening lines), "Download for offline listening" then becomes "Spotify wont fuck you", and badges reading "Free" become a pink "PREMIUM". The plan card also gets a small logo and a "Your Premium Individual NEVER expires…" message above its buttons. Relabels "Get/Buy/Join Premium" buttons to a disabled "DONT JOIN PREMIUM", and "Explore/View plans" to a disabled "Manage plan" - both click-blocked, not just relabeled. Hides "Premium Plans" menu links and any "Try"-prefixed buttons, and turns empty/"—"/"No"/"Free"-containing pricing-table cells into green checkmarks. Rebuilds the account page's compact upgrade banner into "Edit profile"/"Payment method" buttons that link to the account's own region-correct URL (`https://www.spotify.com/<region>/account/...`, derived from the account's actual locale rather than hardcoded), instead of an upgrade nag. The "Add new card" button is blocked on the account payment-methods page (`/account/payment-methods/`, aliased with `/account/saved-payment-cards/`).
- **`www.spotify.com` plan pages (`/premium/`, `/duo/`, `/student/`, `/family/`) - a CSS cover.** The whole page, header and footer included, is replaced with "You dont need Spotify Premium. Trust me." and a "Back to Spotify" button that goes straight to `open.spotify.com`.
- **`payments.spotify.com` checkout - a CSS cover.** Everything Spotify renders is hidden under a "DONT WASTE YOUR MONEY ON SPOTIFY" / "Dont give them a cent. Use Spotifuck for free." page with the same "Back to Spotify" button. Because the checkout is display-hidden rather than patched, nothing on it can be clicked and no JavaScript runs on that host beyond adding the one link.

Toggleable per site (one switch for `open.spotify.com`, a second for `www.spotify.com` **and** `payments.spotify.com` together) from the userscript-manager menu, saved via GM storage, enabled by default. Toggling reloads the page.

### Debug Logging & Replacement Log

Every text swap the premium spoof makes, and every element it hides with CSS, is recorded (selector, before/after text, times applied); a "📋 Show everything replaced so far" menu command dumps it as a table in the console. Separately, a "Debug Logging (console)" menu toggle (off by default) turns on verbose `[SPFDBG]` console logging for every click handler, selector match, and state change the script makes - filter your browser console by `SPFDBG` to isolate it. Coverage includes the injected style blocks (logged once, with their size), the class changes that switch layout on and off (panel-open state, the Now Playing button's active state), and a `selector MISS (outdated?)` warning when one of Spotify's generated class names the spoof relies on stops matching after a Spotify deploy. Inside the Spotifuck Spotify Web app the same lines also go to the app's Logger (see below).

### Efficient Scanning

Nothing here does a blind full-page walk on a timer. `open.spotify.com` and `payments.spotify.com` run no text scanning at all (CSS does the work). On the `www.spotify.com` pages that use the text pass, it runs once shortly after load, retries once more only if the first pass changed nothing (page not rendered yet), and then a debounced `MutationObserver` re-scans only the nodes that changed for content added later; the script's own edits are discarded from the observer's queue so they don't trigger another pass. The "Add new card" watcher is only created on the payment-methods pages, and every observer waits for `<body>`/`<head>` to exist, so a missing one at document-start can no longer abort the script.

### Spotify Web app integration (`window.AndBridge`)

The same script runs inside the Spotifuck Spotify Web Android app's WebView: the app loads SpotiwebJS (shown as "Spotifuck Desktop") instead of Spotifuck Mobile when its Spotifuck Mode is switched off (app 1.25+). The script detects the app by the presence of `window.AndBridge` (Force English specifically checks that `AndBridge.isLoggedIn` is a function), an object that only exists there (never in a normal browser or userscript manager). Each bridge method is feature-detected, so an older app just falls back to the browser behavior. What the two do together:

- **Force English:** the app already forces an English locale natively (`Accept-Language: en` on every request), so the `navigator.language` spoof is skipped. The `www.spotify.com` region-path redirect (kept as a harmless safety net) and the account-language flip still run, which also stops the interface language from being switched away from English, since the script's selectors depend on English labels.
- **Debug logging:** when the app's Settings > Debug Logging is on (app 1.52+), `dbg()` lines are also forwarded through `AndBridge.dbgt` under the tag `us.SpotiwebJS` and show up in the app's Logger (filter by that tag or pick the Spotifuck Desktop source). Nothing is stored while it's off.
- **Userscript-manager features:** inside the app `GM_registerMenuCommand` does nothing, so the two spoof toggles, the debug toggle and the replacement-log command are only available in a real userscript manager; inside the app the toggles keep their default (on).

In a normal browser none of this runs.

## Installation

> 1. Install [Violentmonkey](https://violentmonkey.github.io/)
> 2. Recommended: [Ublock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)
> 3. Alternative to Ublock Origin for blocking Spotify ads: [uSpot - Spotify Ad Blocker](https://github.com/Myst1cX/uSpot/releases). Click [here](https://github.com/Myst1cX/uSpot/blob/main/README.md) for installation steps.
> 4. Optional - for the lyrics translator inside the stock spotify lyrics view: [Cigi Spotify Translator (fork)](https://raw.githubusercontent.com/Myst1cX/cigi-spotify-translator-fork/main/cigi-spotify-translator-fork.user.js). Click [here](https://github.com/Myst1cX/cigi-spotify-translator-fork/blob/main/README.md) for the setup and feature list.
> 5. Install [SpotiwebJS](https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.user.js) (visual premium and forced English locale spoof, AMOLED theme, restoration of the old Now Playing View button)
> 6. Optional: [Spotify Lyrics+](https://raw.githubusercontent.com/Myst1cX/spotify-web-lyrics-plus/main/pip-gui-stable.user.js). Click [here](https://github.com/Myst1cX/spotify-web-lyrics-plus/blob/main/README.md) for the setup and feature list.
> 7. Open [Spotify Web Player](https://open.spotify.com/)

## Ad-Blocking (actual audio ads)

> SpotiwebJS doesn't block ads. An earlier DOM ad-slot cleanup was removed in the 25th change because its observer rescanned the whole page on every change and didn't remove ads reliably. For real ad blocking, use a reliable adblocker depending on your browser. On Firefox and its non-chromium forks (no MV3 support), use: **[uBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)** or **[uSpot](https://github.com/Myst1cX/uSpot/releases/)** alongside it. More on the difference [here](https://github.com/Myst1cX/uSpot/blob/main/README.md#uspot-vs-ublock-origin-what-is-the-difference). On Chromium browsers without MV2 support (MV3 only), use: **[Spotify Ad Blocker - Blockify](https://chromewebstore.google.com/detail/spotify-ad-blocker-blocki/nfmlkliedggdodlbgghmmchhgckjoaml).**

## Notes

> - Client-side only, doesn't touch Spotify's servers.
> - Doesn't change any account data except the language setting, and only if Force English needs to flip it.
> - Needs a userscript manager (Tampermonkey or Violentmonkey preferably).
> - This is the desktop-layout option.

## Feedback

> Open an issue at [https://github.com/Myst1cX/SpotiKit/issues](https://github.com/Myst1cX/SpotiKit/issues)

## Credits

1. **Forked from** [kitbodega/SpotiKit](https://github.com/kitbodega/SpotiKit) v7.0 - the original Visual Premium Spoof (text/badge replacement, plan-page/checkout overlays) builds on kitbodega's own code.
2. **Now Playing View button restoration, its guard system, AMOLED mode, and the per-page rework of the premium spoof (CSS-only on `open.spotify.com`, covers for the plan and checkout pages) are ported from [Spotifuck Mobile](https://github.com/Myst1cX/spotifuck-userscript)** (this repo's other script) - both trace back to the reverse-engineered Android Spotifuck mod's own panel-toggle and AMOLED logic, and were carried over here after Spotifuck Mobile had them first.
3. **Force English is likewise carried over from Spotifuck Mobile**, where it started as a browser-side equivalent of the Android app's own locale-forcing; not part of kitbodega's original SpotiKit.
4. **All porting, adaptation, bug fixes (including the account-page banner links, which kitbodega's original v7.0 hardcoded to a single region rather than the account's own), the toggle/debug-logging/replacement-log system, and independent extensions from v7.0 onward by** Myst1cX.
5. **Powered by** [Spotify](https://open.spotify.com/).

## License

> Licensed under the [MIT License](https://github.com/Myst1cX/SpotiKit/blob/main/LICENSE) (the original author's license is attached in that repo).
