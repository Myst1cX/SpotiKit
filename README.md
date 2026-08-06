## SpotiwebJS

A desktop-layout userscript for the Spotify Web Player: spoofs Spotify Premium visually, strips ad-slot elements from the free-tier UI, forces the player to render in English, restores a real "Now Playing View" toggle button with its own guard system, and adds a pure-black AMOLED theme. No mobile-layout changes.  Works on desktop or on an actual phone browser if you just prefer the desktop-style layout.

> **Recommended userscript manager:** [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/)    
> Want a mobile-layout version instead?    
> See [Spotifuck Mobile](https://github.com/Myst1cX/spotifuck-userscript/blob/main/spotifuck-mobile/README.md) in this same repo.

## Index

- [Features](#features)
  - [Now Playing View, Queue, and Connect panel guard system](#now-playing-view-queue-and-connect-panel-guard-system)
  - [AMOLED mode](#amoled-mode)
  - [Force English](#force-english)
  - [Visual Premium Spoof](#visual-premium-spoof)
  - [Ad-Slot Cleanup (DOM only, doesn't touch actual audio ads)](#ad-slot-cleanup-dom-only-doesnt-touch-actual-audio-ads)
  - [Debug Logging & Replacement Log](#debug-logging--replacement-log)
  - [Efficient Scanning](#efficient-scanning)
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
a) Because `npBtn` is our own restored button rather than a live Spotify control, nothing else is listening for clicks on it - so clicking it just calls our own `clickNP()`, which does two things back-to-back: first it tells the guard this open/close is authorized (`setAuthorizedPanel('npv'|null)`), then it clicks Spotify's actual (hidden) native toggle button on the person's behalf to make the panel really open or close. Since both steps are our own code running one after the other, there's no race to worry about. The player-bar album art, the Queue button, and the Connect button are different - those are Spotify's real, currently-live buttons, already wired with Spotify's own click handler, so our script adds one more listener on top rather than replacing anything. That extra listener runs in the capture phase (`{ capture: true }`), which always fires before the normal listener Spotify itself uses, and calls `setAuthorizedPanel('npv'|'queue'|'connect'|null)` there - the panel name if this click is about to open it, `null` if it's about to close whichever one is currently open - so the guard already knows it was authorized a beat before Spotify's own handler even starts opening the panel.    
b) `panelGuardObserver` (renamed from `npvGuardObserver` once it grew to cover all three) decides whether to auto-close a panel purely from whether the shared container is open at all (`isAnyPanelOpen()`, read off its `inert` attribute) and whether any of the three was authorized (`isAnyPanelAuthorized()`) - not from label-matching against a specific panel type, because Spotify briefly renders the shared container with its default "Now playing view" label for the very first tick after Queue or Connect opens too, before it settles to the correct "Queue"/"Connect to a device" value a moment later; checking the label on that first tick would misread a legitimate Queue/Connect open as an unauthorized NPV open. `isNpvOpen()`/`isQueueOpen()`/`isConnectOpen()` are still used throughout - by `clickNP()` and the album art/Queue/Connect listeners, to work out whether a given click is opening or closing that specific panel, and by the guard's own `dbg()` diagnostics - just no longer to decide whether `panelGuardObserver` auto-closes something.      
c) Since the panel's own in-panel close button closes it through Spotify's native handler directly and never touches this script's `closeNowPlay()`, the observer also watches for a genuine open-to-closed transition and clears a lingering authorized flag the moment it sees one that didn't go through `closeNowPlay()`, so a later, unrelated native open (a playlist auto-opening NPV, say) isn't wrongly trusted just because the previous session was never explicitly closed.         
d) `setupNpvButton()` also runs its own cleanup check the moment it inserts `npBtn`, closing anything already left open from before the guard existed. It deliberately checks the same way `panelGuardObserver` does - `isAnyPanelOpen()`/`isAnyPanelAuthorized()` - rather than checking `isNpvOpen()` specifically. The reason: this cleanup only ever runs once, right when `npBtn` first gets inserted, and if that moment happens to coincide with someone freshly opening Queue or Connect, `isNpvOpen()` could get fooled by the same stale label issue from (b) - it would see the generic "Now playing view" label still lingering and wrongly conclude NPV was open, and then close the Queue/Connect panel the person just opened on purpose. Checking "is *any* panel open, and was it authorized" instead avoids that entirely. Separately, the cold-load setup poll itself doesn't stop until it's wired all four triggers - `npBtn`, album art, Queue, and Connect - since the latter two can take longer to become reliably queryable than the player-bar elements, and stopping early would leave them stuck on Spotify's own native, unauthorized handling for the rest of the session.      
e) `npBtn` also shows whether NPV specifically is open right now - a green icon plus a small dot underneath, values chosen to match the small indicator dot Spotify's own toggle used to show. This isn't set at click time by `npBtn`'s own handler; it's kept in sync by the same `panelGuardObserver` mutation callback that drives everything else above, reading straight off `userOpenedNPV` rather than off Spotify's DOM/aria-label (for the same reason as (b) - that label can't reliably tell NPV apart from a freshly-opening Queue/Connect on the first tick), so the icon only ever turns green when NPV specifically, not Queue or Connect, was the thing authorized open, and it re-syncs on its own the moment Spotify's real DOM changes rather than needing another click to catch up. `npBtn` is built once by cloning the lyrics button's own classes, which is what gives it Spotify's real button sizing, padding, and hover/focus feedback for free instead of needing to be hand-styled from scratch - but its resting-state color, and the dot's presence, are pinned directly by this script's own CSS with `!important` rather than left to whatever classes happen to be riding along on that clone. That matters because those classes are Spotify's own internal, hashed build output, not a stable public API - they can be renamed on any Spotify deploy - and if `npBtn` happened to be cloned at the exact moment the lyrics button was transiently carrying whatever class Spotify currently uses to mark that state, Spotify's own stylesheet would style `npBtn` off of that instead of anything this script controls, making the icon look "open" even while NPV is genuinely closed. The green/active-state color and the dot itself don't need that same `!important` treatment: the cloned Spotify classes on `npBtn` are only ever set once, at that same clone moment, and never touched again afterward (only `npBtn`'s own `.active` class keeps changing, via `classList.toggle`) - so the only way a leaked class could ever be present at all is if NPV genuinely was open at clone time, in which case the leaked class and a later authorized `.active` toggle both agree the icon should be green, rather than fighting over it. The resting state is the only one a leaked class can actually contradict, which is exactly the state pinned with `!important`.    

### AMOLED mode

Pure-black AMOLED theme, ported from the same Spotifuck apk (`r0/e.java` line 207) - also later carried over into SpotiwebJS. Forces the player bar and the app's dark-theme background variables to pure black. Always on, not tied to either spoof toggle. Later widened to cover some overlays which would previously fail to inherit the style and fall back to Spotify's default dark gray theme (Spotifuck Mobile userscript also covers its own Library overlay with the patch).

### Force English

Originally added in v6.3 of spotifuck-mobile.user.js as the browser-side equivalent of the reverse-engineered Spotifuck app's own locale-forcing (its `ForceEn` behavior, which forces the app's Android Configuration locale to English before loading its WebView) - there's no app Configuration to set in a browser, so this spoofs `navigator.language`/`navigator.languages` to `en-US` at document-start, redirects `www.spotify.com` off non-English `xx-yy` region-language paths (e.g. `/si-sl/` &rarr; `/si-en/`) and off `/intl-xx/` prefixes, and flips the account's actual language setting at `open.spotify.com/preferences` through a hidden iframe - then verifies the change stuck on the next load and retries a capped number of times if it didn't. The region-code table this relies on (which countries have no English storefront, which ones use a bare country code for English, etc.) is hand-checked against Spotify's own `/spotify.com/select-your-country-region/` listing and then ported back here, replacing the script's own initially smaller allowlist. The `www.spotify.com` region-path redirect is gated behind the "Visual Premium Spoof (www.spotify.com)" toggle - turning that off also stops this redirect. The `/intl-xx/` URL correction and the account-setting flip don't run immediately at document-start; they wait for the player's Play/Pause button (or, for signed-out sessions, the `sign-up bar` prompt) to actually exist first, since running that correction before Spotify's own SPA has started hydrating could leave the page stuck mid-load.

Everything else here is keyed off English aria-labels, so without this the script just silently stops matching on non-English accounts.

### Visual Premium Spoof

Adopted from SpotiwebJS/kitbodega's original SpotiKit code and extended independently since. Rewrites the free-tier UI to look like a Premium account: swaps "Free"/"Spotify Free"/"Free plan" text for "Premium Individual" and "1 Free account" copy for "1 Premium account" wherever it appears in headings, spans, badges, and plan cards, recoloring the matched elements pink. Relabels "Get/Buy/Join Premium" buttons to a disabled "DONT JOIN PREMIUM", and "Explore/View plans" to a disabled "Manage plan" - both click-blocked, not just relabeled. Hides the upgrade button, the install-app link, "Premium Plans" menu links, and any "Try"-prefixed buttons, and turns empty/"—"/"No"/"Free"-containing pricing-table cells into green checkmarks. Rebuilds the account page's compact upgrade banner into "Edit profile"/"Payment method" buttons that link to the account's own region-correct URL (`https://www.spotify.com/<region>/account/...`, derived from the account's actual locale rather than hardcoded), instead of an upgrade nag. On `www.spotify.com`'s Premium/Duo/Student/Family plan pages, replaces the entire page content with a "You dont need Spotify Premium. Trust me." message and a link home, and on `payments.spotify.com`, replaces the checkout page with a "DONT WASTE YOUR MONEY ON SPOTIFY" message and disables the checkout/payment buttons (forms, submit buttons, and the "Add new card" button) so they no-op instead of submitting. The "Add new card" button is also blocked separately on `www.spotify.com`'s own account payment-methods page (`/account/payment-methods/`, aliased with `/account/saved-payment-cards/`), since that's a different host than the checkout blocker above and needs its own gate.

Toggleable per site (one switch for `open.spotify.com`, a second for `www.spotify.com` **and** `payments.spotify.com` together) from the userscript-manager menu, saved via GM storage, enabled by default.

### Ad-Slot Cleanup (DOM only, doesn't touch actual audio ads)

Removes ad-slot-container elements (and a couple of specific ad-button classes) from the DOM on `open.spotify.com`, via a `MutationObserver` on `document.body`. Cosmetic only - ordinary ad-blocker-style DOM removal, not a way around anything server-enforced (bitrate, offline downloads, skip limits) - and doesn't touch the actual audio ad requests (see [Ad-Blocking (actual audio ads)](#ad-blocking-actual-audio-ads) below for that). Ships bundled with the premium spoof and is gated behind the same "Visual Premium Spoof (open.spotify.com)" toggle - turning that off also turns this off.

### Debug Logging & Replacement Log

Every text swap the premium spoof makes is recorded (selector, before/after text, times applied); a "📋 Show everything replaced so far" menu command dumps it as a table in the console. Separately, a "Debug Logging (console)" menu toggle (off by default) turns on verbose `[SPFDBG]` console logging for every click handler, selector match, and state change the script makes - filter your browser console by `SPFDBG` to isolate it.

### Efficient Scanning

The text-replacement pass only re-scans nodes that actually changed (via a debounced `MutationObserver` watching both added/removed nodes and in-place text updates), not a blind full-page walk on a timer.

## Installation

> 1. Install [Violentmonkey](https://violentmonkey.github.io/)
> 2. Recommended: [Ublock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)
> 3. Alternative to Ublock Origin for blocking Spotify ads: [uSpot - Spotify Ad Blocker](https://github.com/Myst1cX/uSpot/releases). Click [here](https://github.com/Myst1cX/uSpot/blob/main/README.md) for installation steps.
> 4. Optional - for the lyrics translator inside the stock spotify lyrics view: [Cigi Spotify Translator (fork)](https://raw.githubusercontent.com/Myst1cX/cigi-spotify-translator-fork/main/cigi-spotify-translator-fork.user.js). Click [here](https://github.com/Myst1cX/cigi-spotify-translator-fork/blob/main/README.md) for the setup and feature list.
> 5. Install [SpotiwebJS](https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.user.js) (ad-slot removal, visual premium and forced English locale spoof, restoration of the old Now Playing View button)
> 6. Optional: [Spotify Lyrics+](https://raw.githubusercontent.com/Myst1cX/spotify-web-lyrics-plus/main/pip-gui-stable.user.js). Click [here](https://github.com/Myst1cX/spotify-web-lyrics-plus/blob/main/README.md) for the setup and feature list.
> 7. Open [Spotify Web Player](https://open.spotify.com/)

## Ad-Blocking (actual audio ads)

> SpotiwebJS doesn't block the ad audio itself - the ad-slot removal function is just DOM cleanup. Aims to remove Spotify's client-side ad-slot container (data-testid="ad-slot-container"), related ad-* UI wrappers, and an associated button from the DOM as they appear, using a MutationObserver. For true audio ad blocking, use a reliable adblocker depending on yoor browser. On Firefox and its non-chromium forks (no MV3 support), use: **[uBlock Origin](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/)** or **[uSpot](https://github.com/Myst1cX/uSpot/releases/)** alongside it. More on the difference [here](https://github.com/Myst1cX/uSpot/blob/main/README.md#uspot-vs-ublock-origin-what-is-the-difference). On Chromium browsers without MV2 support (MV3 only), use: **[Spotify Ad Blocker - Blockify](https://chromewebstore.google.com/detail/spotify-ad-blocker-blocki/nfmlkliedggdodlbgghmmchhgckjoaml).**

## Notes

> - Client-side only, doesn't touch Spotify's servers.
> - Doesn't change any account data except the language setting, and only if Force English needs to flip it.
> - Needs a userscript manager (Tampermonkey or Violentmonkey preferably).
> - This is the desktop-layout option.

## Feedback

> Open an issue at [https://github.com/Myst1cX/SpotiKit/issues](https://github.com/Myst1cX/SpotiKit/issues)

## Credits

1. **Forked from** [kitbodega/SpotiKit](https://github.com/kitbodega/SpotiKit) v7.0 - the original Visual Premium Spoof (text/badge replacement, plan-page/checkout overlays) and Ad-Slot DOM Cleanup engine build on kitbodega's own code.
2. **Now Playing View button restoration, its guard system, and AMOLED mode are ported from [Spotifuck Mobile](https://github.com/Myst1cX/spotifuck-userscript)** (this repo's other script) - both trace back to the reverse-engineered Android Spotifuck mod's own panel-toggle and AMOLED logic, and were carried over here after Spotifuck Mobile had them first.
3. **Force English is likewise carried over from Spotifuck Mobile**, where it started as a browser-side equivalent of the Android app's own locale-forcing; not part of kitbodega's original SpotiKit.
4. **All porting, adaptation, bug fixes (including the account-page banner links, which kitbodega's original v7.0 hardcoded to a single region rather than the account's own), the toggle/debug-logging/replacement-log system, and independent extensions from v7.0 onward by** Myst1cX.
5. **Powered by** [Spotify](https://open.spotify.com/).

## License

> Licensed under the [MIT License](https://github.com/Myst1cX/SpotiKit/blob/main/LICENSE) (the original author's license is attached in that repo).
