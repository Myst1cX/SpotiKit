// ==UserScript==
// @name         Spotifuck Desktop
// @namespace    https://github.com/Myst1cX/SpotiKit
// @version      7.0.19
// @description  SpotiKit - Visual premium UI overlay for Spotify and ad banner blocking. Amoled theme. Restores the old Now Playing View button.
// @author       kit_fogos, Myst1cX (fork)
// @match        *://open.spotify.com/*
// @match        *://www.spotify.com/*
// @match        *://payments.spotify.com/*
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @homepageURL  https://github.com/Myst1cX/SpotiKit
// @supportURL   https://github.com/Myst1cX/SpotiKit/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.user.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.user.js
// ==/UserScript==

// RESOLVED (7.0.fork, Myst1cX):

// First change:
// Added proper linking for installing the script via an userscript manager
// Removed obsolete function that attempted to intercept and block audio ads.

// Second big change:
// Text-replacement pass is now scoped to changed nodes instead of walking
// the whole document on every mutation, and also catches in-place text
// updates (characterData), not just added/removed nodes.
// Removed the redundant setInterval ad-cleanup now that the MutationObserver
// covers the same ground on its own.
// Every swap the script makes is now recorded (selector, before/after text,
// times applied) and can be printed as a table from the userscript-manager
// menu.
// Added "already done" guards to every hide-only action (upgrade button,
// install link, premium menu link, Planes Premium/Premium Plans sweeps,
// compact-banner rebuild, and the Try/Prueba button) so each is only
// touched and logged once per element instead of re-firing on every tick.

// Third change:
// Added forceEnglish(), which overrides navigator.language/languages to
// en-US and, on www.spotify.com, redirects non-English-region locale paths
// (e.g. /mx/, /es/) to /us/ so the page itself loads in English instead of
// relying on text-replacement afterward. Runs once on script start.
// Since the site now always renders in English, dropped the Spanish
// alternatives from the button/table/XPath matchers (obtener, conseguir,
// explorar, ver, prueba, gratuito, "Planes Premium") and the Spanish
// "Descarga canciones..." string check — they're dead weight now.
// Updated the two hardcoded account-page redirect URLs from /mx/ to /us/
// to match.

// Fourth big change:
// Added two independent userscript-manager menu toggles (via
// GM_registerMenuCommand + GM_setValue/GM_getValue). One toggle covers
// open.spotify.com, the other covers www.spotify.com and payments.spotify.com (plan payment blockers/redirects),
// each independent and GM-storage-backed, both enabled by default.
// Added the missing @grant GM_setValue / @grant GM_getValue lines these need.
// Also fixed forceEnglish(): it previously only spoofed
// navigator.language/languages and redirected non-English www.spotify.com
// paths, both of which only affect a single page load. It never touched
// the account-level language setting saved server-side at
// open.spotify.com/preferences, which is what actually drives the English
// aria-labels (e.g. "Open Your Library") this script's selectors depend
// on. Added forceEnglishAccountSetting(), which flips that setting to
// English via a hidden iframe, verifies the flip stuck on the next load,
// and retries a capped number of times if it didn't.

// Fifth big change:
// Replaced the NPV block ported from spotify-web-lyrics-plus (zero-width
// collapse of `.zjCIcN96KsMfWwRo`) with Spotifuck's real guard system,
// ported 1:1: clickNP()/closeNowPlay()/isNpvOpen()/npvGuardObserver, plus
// our own npBtn (next to the lyrics button) and an album-art click listener.
// NPV now opens/closes for real via the native toggle instead of staying
// squashed - only npBtn/album-art clicks are authorized opens, anything
// else gets auto-closed.
// Also swapped the direct `.wJiY1vDfuci2a4db` hide (unreliable here) for
// Spotifuck's actual method - forcing #main-view/--panel-gap/100vw, which
// crops the native toggle off-screen as a side effect - turns out that CSS
// does relate to the toggle staying hidden after all, just indirectly.
// Scoped it behind `html:not(.npv-open)` (unlike spotifuck's unconditional
// version) so it doesn't squash NPV's own panel while legitimately open.

// Sixth big change:
// Fixed setupNpvWidgetTrigger (the player-bar album art click listener):
// it unconditionally set userOpenedNPV=true on every click, but the album
// art is a native TOGGLE - the second click closes NPV, and that close
// never runs through closeNowPlay() (the only other place that resets the
// flag), so userOpenedNPV was left stuck true after closing via album art.
// The next unrelated native NPV open (e.g. a playlist's play button
// auto-opening NPV) was then wrongly trusted as authorized and never
// auto-closed by the guard. Now computes willOpen from isNpvOpen() before
// the click, same as clickNP() already did, and sets the flag to match
// either direction.
// Ported Spotifuck's SPFDBG debug-logging system (dbg(event, selector,
// details), off by default, toggled via its own userscript-manager menu
// command) into every click handler and NPV-guard state-change function:
// the two spoofed premium buttons, the Edit profile/Payment method banner
// buttons, the payments-page blocker, closeNowPlay(), clickNP(),
// npvGuardObserver's autoclose branch, setupNpvButton, the album-art
// listener above, and the Queue/Connect panel-trigger listeners. Declared
// at module scope (outside both IIFEs and the NPV guard block) so all
// three sections can log through it.
// Investigated the Queue/Connect panel's close (X) button being scrolled
// out of the visible viewport (present in the DOM, just off-screen) -
// attempted porting Spotifuck's #main-view height-clipping CSS
// (min-height:0 + overflow:hidden, without Spotifuck's bottom-nav/player
// height subtraction, which doesn't apply here) but this did NOT fix it in
// testing. Reverted; root cause still open.

// Seventh big change:
// Finished the dbg() debug-logging coverage: logChange, applyReplacements,
// scanText, run()'s DOM-scanning pass, handleMutations/startObserver (the
// actual debounce), forceEnglish, forceEnglishAccountSetting,
// applyEnglishToLanguageSelect, and the ad-slot-removal observer didn't log
// through dbg() yet - they now do.
// forceEnglish/forceEnglishAccountSetting/applyEnglishToLanguageSelect used
// to trace via plain console.log('SpotiwebJS: ...') instead - refactored
// those into dbg() so they're gated behind the same toggle and filterable
// by "SPFDBG" like everything else.
// Moved the "Debug Logging (console)" menu command to the bottom of the
// userscript-manager menu (was 3rd, now 4th/last, after the two spoof
// toggles and "Show everything replaced so far").

// Eighth big change - unionized three places that had drifted from Spotifuck:
// a) Renamed run() to runPremium() to match Spotifuck's name for the same
//    DOM-scan pass - purely cosmetic, no behavior change.
// b) Tried making forceEnglish() call forceEnglishAccountSetting()
//    unconditionally, same as Spotifuck, instead of only on
//    open.spotify.com. Confirmed it added no real behavior on
//    www.spotify.com/payments.spotify.com (that function's hidden iframe is
//    hardcoded to https://open.spotify.com/preferences, so calling it from
//    those hosts just hits the existing cross-origin catch block and gives
//    up) - a silent no-op, not an error, so it went unnoticed until now.
//    NOTE: this comment previously claimed a hostname gate was already
//    "kept" around the call, but the call itself was actually unconditional
//    at the time - now fixed for real (see the tenth change below), so this
//    entry is corrected to describe what was actually true then vs. now.
// c) Ad-slot removal was previously ungated by host here - it ran on every
//    matched page (open/www/payments) and relied solely on the runtime
//    premiumSpoofEnabledHere() check to no-op elsewhere, meaning a live
//    MutationObserver plus repeated no-op queries on www/payments pages
//    where these ad selectors can never match anything (they're specific to
//    the open.spotify.com web player). Now wrapped in the same
//    `if (HOST_IS_OPEN)` gate Spotifuck uses, so the observer isn't even
//    created on hosts where it can never do anything.
// d) Switched @run-at from document-idle to document-start (matching
//    Spotifuck) so the navigator.language/navigator.languages spoof at the
//    top of forceEnglish() actually runs before Spotify's own scripts read
//    it on open.spotify.com - at document-idle that spoof was set too late
//    to affect anything Spotify computed from it during load.

// Ninth big change:
// a) add-new-card-button (on the "Add new card"/payment method flow) also
//    appears on www.spotify.com's own account pages
//    (/account/payment-methods/, aliased to/from
//    /account/saved-payment-cards/ - confirmed same page reachable under
//    either path), entirely separate from payments.spotify.com (the actual
//    checkout flow already blocked below via BLOCK_SELECTOR). The
//    payments.spotify.com blocker is gated by
//    `window.location.hostname === 'payments.spotify.com'`, so it never ran
//    on www.spotify.com at all - wrong host, regardless of which regional
//    locale prefix was in the path (si-en, us, mx-es, etc). Added a second,
//    narrower blocker scoped to HOST_IS_WWW for this case: no "DONT WASTE
//    YOUR MONEY" overlay (this is account management, not checkout -
//    replacing the whole page would be overkill), just the same
//    preventDefault/stopPropagation no-op on the button, gated behind the
//    same www.spotify.com toggle (premiumSpoofEnabledHere()) as everything
//    else scoped to that host. Path-matched via
//    location.pathname.includes(...) against both known paths rather than
//    a hardcoded locale segment, since the region prefix varies per account
//    and forceEnglish()/getCurrentRegionPrefix() deliberately leave bare
//    codes alone in places - a fixed '/si-en/' or '/us/' check would miss
//    every other region.
// b) forceEnglishAccountSetting() was being called unconditionally at the
//    bottom of forceEnglish() (no hostname check around the call itself) -
//    it fired on every matched host, including www.spotify.com and
//    payments.spotify.com, where its hidden iframe (hardcoded to
//    https://open.spotify.com/preferences) is cross-origin and can never
//    succeed - it always hit the catch block and gave up, silently, doing
//    nothing but wasting an iframe load every page load on those two hosts.
//    Now gated behind `if (HOST_IS_OPEN)`, with an `else` branch logging
//    the skip via dbg(), so the call - and its iframe - only happens on
//    open.spotify.com, where it can actually do something. No behavior
//    change on open.spotify.com; www/payments simply stop paying for a call
//    that never accomplished anything. Scope note: this only affects the
//    ACCOUNT-LEVEL language setting (open.spotify.com/preferences), which
//    drives the English aria-labels the open.spotify.com selectors depend
//    on - it has nothing to do with the region/locale-PATH redirect for
//    www.spotify.com (e.g. /si-sl/ -> /si-en/), which is the separate block
//    covered in (d) below.
// c) dbg() coverage audit - checked every click handler,
//    GM_registerMenuCommand callback, and state-changing function against
//    the Sixth/Seventh change's dbg() coverage claims. Found and fixed two
//    real gaps: forceEnglish()'s skip of forceEnglishAccountSetting() on
//    non-open.spotify.com hosts (from (b) above) wasn't logged, and the two
//    "Visual Premium Spoof" GM_registerMenuCommand toggles
//    (open.spotify.com / www.spotify.com) flipped a persisted flag and
//    reloaded but never logged the toggle itself - the one user-triggered
//    write in the whole script with zero trace. Added dbg() calls for both.
//    Deliberately NOT adding dbg() to setupNpvButton/setupNpvWidgetTrigger/
//    setupOtherPanelTriggers' "target not found yet" early returns - those
//    three run on a 1-second polling loop while the page is still loading,
//    so logging every failed poll would spam the console every second
//    until the player bar renders. Left unlogged on purpose, not a missed
//    spot.
// d) Region-code data audit against Spotify's real
//    /select-your-country-region/ listing (uploaded 2026-07-14 snapshot,
//    184 countries). Verified NO_ENGLISH_VARIANT (9: ad, be, cd, ch, dz, es,
//    lu, ma, tn) and ENGLISH_BARE_CODES (42 entries) both exactly match the
//    real data - every entry checks out, and every excluded ambiguous bare
//    country (ar, at, fr, jp, pl, etc. - 35 of them) is correctly left out
//    to fall back to /us. Found one real bug: getCurrentRegionPrefix() only
//    checked ENGLISH_BARE_CODES for bare-path URLs, never ENGLISH_IS_BARE.
//    "ba" (Bosnia) and "mk" (North Macedonia) are bare+dash countries where
//    the BARE code is the English one (ba-bs/mk-mk are the local-language
//    variants) - forceEnglish() already redirects those countries TO their
//    bare form for exactly that reason, but getCurrentRegionPrefix() didn't
//    recognize it, so the Edit profile/Payment method banner buttons would
//    send a just-correctly-redirected Bosnian/Macedonian user to
//    /us/account/... instead of /ba/... or /mk/.... Fixed by also checking
//    ENGLISH_IS_BARE.has(country) alongside ENGLISH_BARE_CODES.has(country).
// e) The region-path redirect inside forceEnglish() (the www.spotify.com
//    locale-suffix redirect, e.g. /si-sl/ -> /si-en/) was gated only by
//    `location.hostname === 'www.spotify.com'`, with no
//    premiumSpoofEnabledHere() check - so turning "Visual Premium Spoof
//    (www.spotify.com)" off correctly stopped/reverted page modifications,
//    but this redirect kept firing regardless of the toggle. Decided the
//    toggle should mean "don't touch this site at all" rather than
//    narrowly "don't spoof premium status/UI", so this block now also
//    checks premiumSpoofEnabledHere() and no-ops (with a dbg() log) when
//    the www.spotify.com toggle is off. Left the navigator.language/
//    navigator.languages spoof at the top of forceEnglish() unconditional,
//    since other selectors may depend on it regardless of this toggle (and
//    it's harmless/inert on its own - it doesn't touch the page or
//    redirect anywhere). The /intl-xx/ prefix redirect further down and the
//    open.spotify.com account-setting flip from (b) are untouched by this.
//    Considered and declined: reverting a URL that was already redirected
//    before the toggle was turned off (e.g. sending /si-en/ back to
//    /si-sl/). The redirect is one-directional by design and keeps no
//    record of what a URL was before it fired, so "back-pedaling" would
//    mean adding new state (e.g. stashing the pre-redirect path in
//    sessionStorage) purely to support reverting - and even then it'd only
//    work within the same tab/session, and couldn't tell a script-driven
//    redirect apart from a URL the user genuinely navigated to on purpose.
//    Not worth the complexity for a case that resolves itself the next
//    time the user naturally lands on a non-English URL anyway. If this
//    becomes a real pain point later, the sessionStorage approach above is
//    the way to do it - not implemented here.

// Tenth change:
// Corrected a stale/inaccurate claim in the comment above
// setupNpvButton()/setupNpvWidgetTrigger()/setupOtherPanelTriggers()'s
// npvSetupInterval poll: it said Spotifuck Mobile's own indefinite pfint
// polling already gave those two elements equivalent coverage there, so
// SpotiwebJS needed its own loop only because it runs at document-idle with
// no equivalent loop in place. Checked Mobile directly - pfint polls
// indefinitely, but only for the play button; once that's found, ffDone
// latches true and Mobile's addCSSJSHack() (which wires these three) never
// runs again, so Mobile was actually only giving them one fixed 2s retry,
// not indefinite coverage. Comment corrected, and Spotifuck Mobile (v.7.1) has since been
// given this same indefinite-poll pattern for real (see its own changelog).
// No code change here - SpotiwebJS's own npvSetupInterval was already
// correct; only the comment's claim about Mobile was wrong.

// Eleventh change:
// Ported Spotifuck Mobile's AMOLED pure-black CSS block (from r0/e.java line
// 207), which had been missed until now despite everything else on this
// list being a deliberate 1:1 port from Spotifuck. Added as its own
// GM_addStyle call right after the existing .__sp_curr one below: overrides
// the Encore dark-theme background custom properties (--background-base,
// --background-highlight, --background-elevated-base,
// --background-elevated-highlight, --background-elevated-press,
// --background-tinted-base) to #000, and force-blacks
// aside[data-testid=now-playing-bar] the same way Mobile does. Unconditional
// and always-on, same as Mobile - not gated behind either premium-spoof
// toggle, since it's pure cosmetic theming with no relation to what those
// toggles control.
// A straight copy of Mobile's block (without !important on the six custom
// properties) left almost everything grey except the exact elements the
// rule's other selector touched directly (the player bar via
// aside[data-testid=now-playing-bar]) - not just the sidebar/library, but
// the main container view too. Root cause: custom properties cascade
// from the nearest ancestor that declares them, not by selector
// specificity - Spotify's own code redeclares some of these vars locally on
// panels closer to the main view/sidebar/library roots than this rule sits,
// so a plain override loses that proximity race regardless of how the
// selector is written.
// Mobile itself was never broken this way and needed no change here: its
// Sixth big change (bottom-nav/library-overlay) block already carries
// `.YourLibraryX{background:var(--background-elevated-base)!important}`,
// an explicit !important pin on exactly the surface that would otherwise
// lose the same proximity race - added for unrelated bottom-nav-overlay
// reasons, but it happens to solve this exact cascade problem for Mobile's
// library/sidebar. SpotiwebJS has no equivalent of that block (desktop
// doesn't use Mobile's bottom-nav-driven library overlay), so it had no
// comparable !important anywhere pinning those surfaces. Fixed here by
// adding !important directly to all six custom properties instead - a
// blanket fix at the source rather than Mobile's narrower per-surface one,
// appropriate since desktop lacks the overlay code Mobile's fix piggybacks
// on.

// Twelfth change: A feature I later scrapped (ignore)

// Thirteenth change:
// Re-checked every GM_registerMenuCommand callback and click handler
// against the Ninth change's (c) coverage audit. Found two real gaps
// that audit missed: "Show everything replaced so far" and
// "Debug Logging (console)" themselves - the very act of printing the
// replacement log or flipping the debug flag was never logged, the
// same "one user-triggered action with zero trace" problem the Ninth
// change already fixed for the two Visual Premium Spoof toggles. Both
// now log via dbg() (Debug Logging's own toggle logs via a raw
// console.log matching dbg()'s exact output shape instead of dbg()
// itself, since dbg() is gated behind debugLoggingEnabled() and would
// otherwise never print the one line that announces logging just turned on).

// Fourteenth change - metadata fix:
// www.spotify.com was only matched on five narrow paths (*/account/*,
// */premium/*, */duo/*, */student/*, */family/*). Since www.spotify.com routes
// client-side (pushState, no full reload), landing anywhere else first (e.g.
// the homepage) meant the script never got injected at all, even after
// navigating into a matched path. Fixed by matching the whole www.spotify.com
// origin. payments.spotify.com already matched its whole origin and is only
// ever reached via a real (non-SPA) navigation, so it didn't have this bug -
// left as-is aside from the @match style pass below.
// Side effect: the premium-spoof text/badge replacements and forceEnglish()'s
// region redirect now also run on other www.spotify.com pages, not just the
// original five.
// All three @match lines now use *:// instead of https://, purely cosmetic
// (Spotify enforces HTTPS on all three anyway).

// Fifteenth change:
// forceEnglish()'s /intl-xx/ URL correction and account-setting flip
// (forceEnglishAccountSetting()) used to run immediately at document-start,
// before Spotify's own SPA had even started hydrating. A user reported
// open.spotify.com getting permanently stuck never finishing its initial
// load with the script enabled; disabling the script, letting the page load
// fully, manually setting the account language to English, then re-enabling
// fixed it for them - consistent with the location.replace() call inside
// forceEnglish() racing Spotify's own startup rather than a logic bug in the
// correction itself. That work now lives in a new function,
// runIntlCorrectionOnceReady(), which waits for
// [data-testid="control-button-playpause"] to exist (the persistent
// player-bar's play/pause button, present as soon as the app shell mounts,
// even before anything is playing, and not localized like its aria-label
// is) and only then runs the correction, exactly once. navigator.language
// spoofing and the separate www.spotify.com region-path redirect are
// untouched and still run immediately at document-start as before.
//
// What runIntlCorrectionOnceReady() actually does on a mismatched /intl-xx/
// load: the page still renders in the account's saved language for a moment
// (unavoidable - we can't know whether the account setting needs flipping
// without checking it first, via a hidden /preferences iframe, which takes
// a moment). Previously that check was preceded by a separate, usually
// pointless location.replace() that stripped the /intl-xx/ prefix from the
// URL before the check even started - pointless because if the account
// setting really was still non-English, the server just redirected straight
// back to /intl-xx/ on the very next load anyway, wasting a navigation. That
// strip is gone now; the script goes straight to the account-setting check
// via forceEnglishAccountSetting(), which takes the /intl-xx/-stripped
// target path as a new optional parameter. Whatever that check decides to
// do next - flip the setting and verify, or just confirm it's already
// English, or give up because the check itself failed - it now navigates
// straight to the stripped target path in a single location.replace(),
// instead of reloading back onto the still-prefixed /intl-xx/ URL and
// relying on a later load to strip it. Net effect: one navigation off
// /intl-xx/ instead of two, and the page is never left stuck on /intl-xx/
// even in the failure cases.

// Sixteenth change:
// Rebuilt the Queue/Connect side of the NPV guard system into full parity
// with NPV's own authorized-open/auto-close handling, fixing four related
// gaps that only ever surfaced once Queue or Connect (not NPV) was the
// panel actually in play.
// a) Opening Queue or Connect used to expand that panel to the full
//    main-view width instead of its normal narrow sidebar. The
//    native-toggle-hiding CSS (styleId 'npv-guard-hide-native-toggle-style')
//    forces a shared ancestor region to 100vw whenever the panel is scoped
//    as "closed", and was gated purely by isNpvOpen(), which by design only
//    recognizes NPV - opening Queue/Connect never set the .npv-open class
//    that scoping relies on, so the 100vw rule kept firing on their shared
//    container too. Fixed by adding isAnyPanelOpen(), which checks
//    #Desktop_PanelContainer_Id.closest('[inert]') and returns true for any
//    of the three panel types (NPV, Queue, or Connect alike, confirmed via
//    real DOM captures - all three flip the same [inert] attribute on the
//    same wrapper when opened), and switching updateNpvLayoutState() to
//    toggle that class off isAnyPanelOpen() instead of isNpvOpen(). The
//    class itself was renamed .npv-open -> .fuckd-panel-open once it
//    stopped meaning "NPV specifically", and the guard's own
//    attributeFilter was widened from ['aria-hidden'] to
//    ['aria-hidden', 'inert'] so a bare inert flip alone triggers a
//    recheck. The style block's selectors kept their original simple
//    html:not(.fuckd-panel-open) scoping - no extra CSS-side logic needed,
//    since the broadened signal already does that job in JS.
// b) Clicking Queue or Connect could still get the panel closed almost
//    immediately by the guard, logged as an unauthorized NPV open even
//    though the click had genuinely been authorized:
//    #Desktop_PanelContainer_Id's aria-label reads Spotify's generic "Now
//    playing view" default for one tick before settling to the real
//    "Queue"/"Connect to a device" value, and the guard's close decision
//    used to be driven by that label match. Replaced the old time-boxed
//    otherPanelOpening flag (a fixed 500ms window with no way to know
//    whether the panel had actually finished opening - Connect's
//    device-discovery mount in particular can keep mutating the DOM well
//    past that window) with full authorized-opener parity for all three
//    panel types: setAuthorizedPanel('npv'|'queue'|'connect'|null) is now
//    the single place that sets/clears userOpenedNPV/userOpenedQueue/
//    userOpenedConnect, called synchronously - before Spotify's own click
//    handling runs - from clickNP(), the album-art listener, and new
//    capture-phase listeners on the Queue and Connect buttons themselves.
//    The guard now gates purely on isAnyPanelOpen() (the inert-based
//    signal from (a), immune to the stale-label issue) combined with
//    isAnyPanelAuthorized() (true if any of the three flags is set), never
//    on label matching - isNpvOpen()/isQueueOpen()/isConnectOpen() still
//    exist and are used elsewhere (clickNP(), the panel-trigger listeners,
//    and the guard's own dbg() diagnostics), just no longer decide whether
//    to close. setupNpvButton's own init-close (which only ever runs once,
//    right when npBtn first gets inserted) deliberately uses the same
//    isAnyPanelOpen()/isAnyPanelAuthorized() combo as panelGuardObserver
//    instead of isNpvOpen(): if that one-time insertion happens to land in
//    the same narrow window as someone freshly opening Queue or Connect,
//    isNpvOpen() could get fooled by the same stale-label issue as (b)
//    above - it would still see the generic "Now playing view" default,
//    wrongly conclude NPV was open, and close the Queue/Connect panel the
//    person had just legitimately opened. Checking "is ANY panel open, and
//    was it authorized" instead of "is NPV specifically open" sidesteps
//    that entirely. Since the observer now genuinely covers all three
//    panel types rather than just NPV, renamed it (and its dbg() label)
//    from npvGuardObserver/"NPV guard" to panelGuardObserver/"Panel guard"
//    throughout.
// c) Closing the panel via its own in-panel X button - Spotify's native
//    close control, wired to Spotify's own handler - never ran through
//    closeNowPlay(), the only place that used to clear the authorized
//    flags, so the panel closed for real but the guard kept believing it
//    was still authorized; every later unrelated native open (another
//    playlist's play button, playing a search result) was then wrongly
//    trusted and never auto-closed. panelGuardObserver now also detects
//    the close side reactively: a lastPanelOpen flag tracks
//    isAnyPanelOpen()'s value across callbacks, and only a genuine
//    open-to-closed transition (isAnyPanelOpen() now false, lastPanelOpen
//    was true last tick, isAnyPanelAuthorized() still true) clears the
//    flags via setAuthorizedPanel(null) - distinguishing a real X-button
//    close from the ordinary tick or two between an authorized click and
//    Spotify's own (not-synchronous) opening transition, which briefly
//    look the same ("currently reads closed while a flag is true") but
//    aren't; without the lastPanelOpen check those pre-open ticks would
//    get misread as a close and clear the flag before the panel had even
//    finished opening.
// d) On a cold page load, the first native click on the Queue or Connect
//    button could still get auto-closed because npvSetupInterval's polling
//    loop stopped as soon as npBtn and the album-art listener were wired,
//    without waiting for setupOtherPanelTriggers() to actually find and
//    attach capture-phase listeners (.fuckd-other-panel) to the Queue/
//    Connect buttons themselves - those two can take longer to become
//    reliably queryable than the player-bar elements the poll was
//    checking. The clear condition now also requires
//    button[data-testid="control-button-queue"].fuckd-other-panel and
//    button[aria-label="Connect to a device"].fuckd-other-panel before
//    stopping, so the poll keeps retrying until all four triggers - npBtn,
//    album art, Queue button, Connect button - are actually wired. Also
//    added dbg() logging for each individual Queue/Connect listener
//    attach and for the interval's own clear event, so a future repro can
//    show exactly when each trigger got wired relative to the click that
//    failed.
// Full investigation notes and DOM-capture evidence for all of the above
// live in maintaining-npv-queue-connect-guard.md (kept versioned alongside
// this script).

// Seventeenth change:
// npBtn now reliably shows a green "active" look - icon color plus a small
// bottom dot - whenever NPV is genuinely open, and only then; previously it
// never visually reflected NPV state at all (always looked the same
// regardless of open/closed), since setupNpvButton() clones lyBtn's
// className as a one-time static snapshot at insertion and nothing ever
// touched npBtn again afterward.
// a) Added syncNpBtnVisualState(), which toggles a self-owned `.active`
//    class on npBtn based on userOpenedNPV - the same authorized-open flag
//    setAuthorizedPanel() already sets synchronously, before Spotify's own
//    click handling runs, and which is only ever true when NPV specifically
//    (not Queue or Connect, which share the same panel container and can
//    briefly cause a mismatch if state is read off the container's
//    aria-label instead) was the authorized open. It's called from
//    updateNpvLayoutState() - already the single hook that runs on every
//    panelGuardObserver tick and on init - so no new observer was needed.
// b) `.npbtn.active` is styled entirely by this script's own CSS via
//    GM_addStyle, not by cloning any of Spotify's own hashed Encore
//    classes: `color:#1db954` for the icon (with a `:hover`/`:focus`
//    override of the same color, since Spotify's own hover rule on the
//    cloned Encore button classes would otherwise win and wash the icon
//    back to its default subdued/white hover color while still "active"),
//    plus a 4x4px `#1db954` circular dot on `::after` (position:absolute;
//    bottom:0; left:50%) matching the small dot Spotify itself shows under
//    lyBtn while its own panel is open - both values taken from a live
//    DevTools capture of Spotify's actual CSS rather than guessed.
//    `position:relative` was added on `.npbtn` itself so the dot's
//    `position:absolute` has something to anchor bottom/left against - a
//    plain <button> is position:static by default, unlike lyBtn which gets
//    that for free from Spotify's own Encore classes. Ported from
//    Spotifuck Mobile's original npBtn implementation
//    (java_src/p032R0/C0363e.java, clickNP()) for the overall approach of a
//    self-owned `.active` class rather than Spotify's own classes, which
//    are hashed and can silently change (and break the sync) on any
//    Spotify deploy.
// c) setupNpvButton()'s initial clone of lyBtn's className originally strips
//    two of Spotify's own hashed Encore classes (kept as
//    SPOTIFY_LYBTN_STATE_CLASSES) defensively - if lyBtn happens to be
//    transiently carrying them at clone-time (Spotify's own hydration
//    race), Spotify's stylesheet would still apply its own styling for
//    them to npBtn since the classes would physically be present, even
//    though nothing in this script reads them for state anymore. Superseded
//    by the Eighteenth change below.

// Eighteenth change:
// npBtn's defense against the hydration-race leak described in point (c)
// above is now enforced at the CSS property level instead of by denylisting
// Spotify's two hashed class names, so it no longer depends on those names
// staying the same across Spotify deploys.
// a) A live classList capture of lyBtn in both states confirmed the leak
//    surface exactly: Spotify's "open" state is precisely the two classes
//    SPOTIFY_LYBTN_STATE_CLASSES already named, added on top of an otherwise
//    identical closed-state list. That same capture also showed two other
//    20-char hashed classes present in both states - structural/instance
//    styling that setupNpvButton()'s clone still needs for its free sizing
//    and hover behavior, not state that should be stripped. That rules out
//    matching by shape (e.g. any 20-char hashed class) as a more durable
//    alternative to the old literal-string list: it can't tell the two real
//    state classes apart from these other same-shaped ones by name alone,
//    so it would have stripped styling npBtn is supposed to keep.
// b) Instead, `.npbtn:not(.active)` now pins the two properties those hashed
//    classes are actually capable of setting - icon color and the ::after
//    dot - directly, with !important: color falls back to Spotify's own
//    subdued/base text-color tokens for the resting/hover look, and the dot
//    is forced off via `content: none`. Scoping this to `:not(.active)`
//    means it only ever overrides a leaked state class; it never fights the
//    `.active` rules below it, and it never touches the size, padding,
//    hover-circle background, or focus ring still coming for free from the
//    rest of lyBtn's cloned classes. [`.active:hover`/`:focus` also forces
//    color with !important, but that's unchanged carryover from the
//    Seventeenth entry's point (b) - it exists to beat Spotify's own hover
//    rule while active, not to guard against a leaked class, and isn't part
//    of this change.]
// c) The `.active::after` dot itself still gets its color from a plain
//    `background-color: #1db954`, with no !important needed. npBtn's
//    className is set once, at clone/insertion time, and never modified
//    again afterward (unchanged since the Seventeenth change). If NPV is
//    closed at that moment - the overwhelmingly common case - lyBtn isn't
//    carrying the two hashed classes yet, so npBtn never has them, and
//    there's nothing for `.active`'s rules to conflict with. If NPV
//    happened to be open at that exact moment (the actual hydration race),
//    npBtn would carry those classes permanently, but a later `.active`
//    toggle and Spotify's frozen-in leaked rule would then both be asserting
//    the same green dot - agreement, not a fight. The only state that can
//    ever see a leaked class contradicting the correct look is the
//    non-active one, which point (b) already covers with !important.
// d) With (a)-(c) in place, setupNpvButton()'s clone no longer strips
//    SPOTIFY_LYBTN_STATE_CLASSES from lyBtn's className - the constant and
//    the strip call were removed, since a leaked class can now be physically
//    present on npBtn without being able to paint anything.

// Nineteenth change:
// Ported Spotifuck Mobile's window.AndBridge guard (added v7.19, ported the
// v7.21 which excludes the forceEnglish() function. window.AndBridge only ever exists inside
// the Spotifuck Android app's WebView (added via addJavascriptInterface,
// never present in a real desktop browser/userscript-manager context, which
// is the only place this script itself runs) - added defensively in case
// this file's forceEnglish() ever ends up loaded inside that WebView too,
// same as Spotifuck Mobile's own copy already is. When present, it signals
// that app's native-side fix (item 22, Locale.setDefault(new Locale("en"))
// in MainActivity) is already forcing Accept-Language: en at the HTTP layer
// for every request, which structurally covers the navigator.language/
// languages spoof and the www.spotify.com region-path redirect just below -
// so window.AndBridge now gates just those two, matching Spotifuck Mobile
// v7.21 (not its original v7.19, which also gated the account-setting flip;
// v7.21 found that skipping the flip inside the app allows user to change their 
// interface language and reload the page which we don't want because we use
// certain English selectors to accomplish some of the modifications.


// --- Per-site visual premium spoof toggles ---
// Declared at module scope (not inside either IIFE below) because both the
// text/badge-spoof IIFE and the separate ad-slot-removal IIFE need to read
// premiumSpoofEnabledHere() - it's the single switch that gates both.
// Mirrors Spotifuck v6.6's split: the in-player spoof (open.spotify.com)
// and the account-site/payments spoof (www.spotify.com, payments.spotify.com)
// are independent, GM-storage-backed, and default to enabled.
const SPOOF_OPEN_KEY = 'spotiweb_premSpoofOpen';
const SPOOF_WWW_KEY = 'spotiweb_premSpoofWWW';
const HOST_IS_OPEN = location.hostname === 'open.spotify.com';
const HOST_IS_WWW = location.hostname === 'www.spotify.com' || location.hostname === 'payments.spotify.com';

function getFlag(key) {
    try { return typeof GM_getValue === 'function' ? GM_getValue(key, true) : true; }
    catch (e) { return true; }
}
function setFlag(key, val) {
    try { if (typeof GM_setValue === 'function') GM_setValue(key, val); } catch (e) {}
}
function premiumSpoofEnabledHere() {
    if (HOST_IS_OPEN) return getFlag(SPOOF_OPEN_KEY);
    if (HOST_IS_WWW) return getFlag(SPOOF_WWW_KEY);
    return false;
}

// --- Debug logging (ported from Spotifuck) ---
// Off by default; console.log spam would otherwise fire on every click for
// every ordinary user. Declared at module scope (not inside either IIFE
// below, and not inside the NPV guard block) since all three sections need
// it. Every click handler / state-change function logs through dbg() with
// the same shape: dbg('event name', 'selector used to find the element',
// { ...state/details }). Filter your console by "SPFDBG" to isolate just
// this script's activity.
const DEBUG_KEY = 'spotiweb_debugLog';
let printReplacementLog; // assigned inside the first IIFE below; forward-declared here so the module-scope menu command can call it
function debugLoggingEnabled() {
    try { return typeof GM_getValue === 'function' ? GM_getValue(DEBUG_KEY, false) : false; }
    catch (e) { return false; }
}
function dbg(event, selector, details) {
    if (!debugLoggingEnabled()) return;
    console.log(`%c[SPFDBG] ${event}`, 'color:#1ed760;font-weight:bold;', 'selector:', selector, details || '');
}

console.log('%c[SPFDBG] filter this console by "SPFDBG" to see every button click, selector, and resulting view change', 'color:#1ed760;font-weight:bold;');

if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(
        (getFlag(SPOOF_OPEN_KEY) ? '✅' : '❌') + ' Visual Premium Spoof (open.spotify.com)',
        () => {
            const next = !getFlag(SPOOF_OPEN_KEY);
            dbg('menu: Visual Premium Spoof (open.spotify.com) toggled', 'GM_registerMenuCommand', { from: getFlag(SPOOF_OPEN_KEY), to: next, action: 'reloading' });
            setFlag(SPOOF_OPEN_KEY, next);
            location.reload();
        }
    );
    GM_registerMenuCommand(
        (getFlag(SPOOF_WWW_KEY) ? '✅' : '❌') + ' Visual Premium Spoof (www.spotify.com)',
        () => {
            const next = !getFlag(SPOOF_WWW_KEY);
            dbg('menu: Visual Premium Spoof (www.spotify.com) toggled', 'GM_registerMenuCommand', { from: getFlag(SPOOF_WWW_KEY), to: next, action: 'reloading' });
            setFlag(SPOOF_WWW_KEY, next);
            location.reload();
        }
    );
    GM_registerMenuCommand('📋 Show everything replaced so far (console)', () => {
        dbg('menu: Show everything replaced so far (console) clicked', 'GM_registerMenuCommand', {});
        printReplacementLog();
        alert('Current text replacements have been logged to the console. Open DevTools (Press F12 or Right click and Inspect), then select the Logs tab under Console to view it.');
    });
    GM_registerMenuCommand(
        (debugLoggingEnabled() ? '✅' : '❌') + ' Debug Logging (console)',
        () => {
            const next = !debugLoggingEnabled();
            // Not dbg() - dbg() is gated behind debugLoggingEnabled(), which is
            // still false at the moment logging gets turned on, so it would
            // swallow the one line that announces logging just turned on.
            // Raw console.log matching dbg()'s exact output shape instead.
            console.log('%c[SPFDBG] menu: Debug Logging (console) toggled', 'color:#1ed760;font-weight:bold;', 'selector:', 'GM_registerMenuCommand', { from: debugLoggingEnabled(), to: next, action: 'reloading' });
            setFlag(DEBUG_KEY, next);
            location.reload();
        }
    );
}

(function() {
    'use strict';

    const PINK = '#FFD2D7';
    const GREEN = '#1ed760';

    GM_addStyle(`
        .__sp_curr {
            display:inline-block;
            background:#535353;
            color:#fff;
            font-size:11px;
            font-weight:700;
            padding:3px 8px;
            border-radius:3px;
            text-transform:uppercase;
            letter-spacing:.4px;
        }
    `);

    // AMOLED pure black mode - ported from Spotifuck Mobile (r0/e.java line 207).
    // Was missing here; the rest of SpotiwebJS ports Spotifuck 1:1 but this
    // small self-contained block got skipped. Overrides the Encore dark-theme
    // background variables to true #000 and force-blacks the player bar,
    // same as spotifuck-mobile.
    // AMOLED pure black mode - ported from Spotifuck Mobile (r0/e.java line
    // 207). IMPORTANT: the six custom properties below MUST carry
    // !important. Custom properties resolve from the NEAREST ancestor that
    // declares them, not by selector specificity - Spotify's own code
    // redeclares some of these same vars locally on panels closer to the
    // main view/sidebar/library roots than this rule sits, so a plain
    // declaration here loses that proximity race even though the selector
    // itself is fine. !important is the one thing that wins regardless of
    // proximity, since importance is weighed before specificity/origin/order
    // in the cascade. Confirmed by testing: without !important, only the
    // literal elements the other selector here touches directly (the player
    // bar) went black - the main container view, sidebar, and library panel
    // all stayed grey; adding !important to just these six lines - no extra
    // per-element rules needed - made every themed surface black.
    // Mobile itself doesn't need this: its Sixth big change block already
    // has `.YourLibraryX{background:var(--background-elevated-base)
    // !important}`, which independently pins its library/sidebar surface
    // against the same proximity race. SpotiwebJS has no equivalent of that
    // block (desktop doesn't use Mobile's bottom-nav-driven library
    // overlay), so !important on the six vars here is doing the job that
    // rule does for Mobile - just as a blanket fix at the source instead of
    // a narrower per-surface one.
    // (An earlier version of this block also force-set
    // #Desktop_LeftSidebar_Id/.YourLibraryX directly as a belt-and-suspenders
    // measure; removed since !important alone was sufficient.)
    GM_addStyle(`
        .encore-dark-theme {
            --background-base: #000 !important;
            --background-highlight: #000 !important;
            --background-elevated-base: #000 !important;
            --background-elevated-highlight: #000 !important;
            --background-elevated-press: #000 !important;
            --background-tinted-base: #000 !important;
        }
        aside[data-testid=now-playing-bar] {
            background: #000 !important;
            box-shadow: none;
            border-top: 1px solid #666;
        }
    `);

    const REPLACE = {
        "Spotify Free": "Premium Individual",
        "1 Free account": "1 Premium account",
        "1 free account": "1 Premium account",
        "Music with ads": "Listen to music ad-free",
        "Music listening with ad breaks": "Listen to music ad-free",
        "Shuffle play": "Play any song",
        "Songs play in shuffle": "Play any song",
        "Online only": "Download for offline listening",
        "Streaming only": "Download for offline listening",
        "No downloads": "Download for offline listening",
        "Basic audio quality": "Very high audio quality",
        "Normal audio quality": "Very high audio quality",
        "Limited skips": "Unlimited skips",
        "Free plan": "Premium Individual",
    };

    const replacementLog = new Map();

    function logChange(selector, from, to) {
        dbg('logChange: replacement recorded', selector, { from, to });
        const key = `${selector}\u0000${from}\u0000${to}`;
        const existing = replacementLog.get(key);
        if (existing) {
            existing.times_applied++;
        } else {
            replacementLog.set(key, { selector, old_text: from, new_text: to, times_applied: 1 });
        }
    }

    printReplacementLog = function() {
        if (replacementLog.size === 0) {
            console.log('[SpotiKit] Nothing has been replaced yet.');
            return;
        }
        console.log(`[SpotiKit] ${replacementLog.size} distinct change(s) made so far:`);
        console.table(Array.from(replacementLog.values()));
    }

    function applyReplacements(node) {
        let v = node.nodeValue;
        if (v == null) return;
        let c = false;
        for (const [from, to] of Object.entries(REPLACE)) {
            if (v.includes(from)) {
                v = v.replaceAll(from, to);
                c = true;
                logChange('(page text)', from, to);
            }
        }
        if (c) {
            dbg('applyReplacements: text node updated', '(text node)', { before: node.nodeValue, after: v });
            node.nodeValue = v;
        }
    }

    function scanText(root) {
        if (!root) return;
        dbg('scanText: DOM scan pass', 'TreeWalker(root, SHOW_TEXT)', { root: root === document.body ? 'document.body' : (root.id || root.className || root.nodeName) });
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while (n = w.nextNode()) applyReplacements(n);
    }

    // Ported from Spotifuck's ForceEn (Android forces the app locale to
    // English before loading its WebView). There's no app Configuration to
    // set here, so the browser-side equivalent is: spoof navigator's
    // reported language, and — on www.spotify.com, where locale is a path
    // segment (e.g. /mx/, /es/) — redirect off any non-English region so
    // the page itself renders in English rather than relying on the
    // find-and-replace pass to catch up after the fact.
    // Shared between forceEnglish()'s redirect decision and
    // getCurrentRegionPrefix()'s button-URL decision, so both use the same
    // facts rather than duplicating/drifting apart.
    //
    // NO_ENGLISH_VARIANT / ENGLISH_IS_BARE: verified against Spotify's own
    // /select-your-country-region/ listing (2026-07-14) - covers countries
    // that DO have an xx-yy dash variant, where "yy=en" or "append -en"
    // isn't the right answer.
    //   - 9 have NO English variant at all, dash or bare: ad, be, cd, ch,
    //     dz, es, lu, ma, tn.
    //   - 2 have English as the BARE code, not "-en": ba, mk.
    const NO_ENGLISH_VARIANT = new Set(['ad', 'be', 'cd', 'ch', 'dz', 'es', 'lu', 'ma', 'tn']);
    const ENGLISH_IS_BARE = new Set(['ba', 'mk']);

    // ENGLISH_BARE_CODES: countries whose ONLY storefront is a bare code
    // (no dash variant exists to compare against) that is confirmed
    // English - either the region page is explicitly labelled "(English)",
    // or the country's official/majority language is verifiably English
    // (Commonwealth Caribbean, Anglophone Africa, Anglophone Oceania).
    // Deliberately excludes bare codes where the language is ambiguous or
    // unverified from the listing alone (e.g. cy, ge, am, bt, mn, la, uz,
    // al, mc, li) - those fall through to the /us fallback below rather
    // than being guessed at.
    const ENGLISH_BARE_CODES = new Set([
        'us', 'uk', 'au', 'nz', 'ie', 'mt', 'kh',
        'ag', 'bb', 'bs', 'dm', 'gd', 'gy', 'jm', 'kn', 'lc', 'tt', 'vc',
        'bw', 'gh', 'gm', 'lr', 'ls', 'mu', 'mw', 'ng', 'rw', 'sl', 'sz', 'zm', 'zw',
        'fj', 'fm', 'ki', 'mh', 'nr', 'pg', 'pw', 'sb', 'to', 'tv', 'ws',
    ]);

    /**
     * getCurrentRegionPrefix - Returns the region path segment (e.g. "us",
     * "si-en", "mk", "hk-zh") that should prefix any www.spotify.com/account
     * link we build ourselves.
     *
     * For dash-suffixed URLs (xx-yy), this trusts the current URL as-is,
     * since forceEnglish() runs at @run-at document-start and will have
     * already corrected it before this code executes.
     *
     * For bare-code URLs (xx, no suffix), forceEnglish() deliberately
     * leaves those untouched (see its comment), so a bare code in the URL
     * is NOT proof it's English - e.g. /jp/ or /de/ would reach here
     * unmodified. So this function checks the bare code against
     * ENGLISH_BARE_CODES (plain English-only countries) and ENGLISH_IS_BARE
     * (countries like "ba"/"mk" whose bare code IS the English variant,
     * distinct from their own dash variant, e.g. "ba" vs "ba-bs") - both
     * are cases forceEnglish() itself already treats as landing correctly
     * on English. Everything else (including ambiguous/unverified ones)
     * falls back to /us so the buttons always land somewhere readable
     * rather than carrying forward an unconfirmed or non-English locale.
     */
    function getCurrentRegionPrefix() {
        const m = location.pathname.match(/^\/([a-z]{2})(-[a-z]{2})?\//i);
        if (!m) return 'us';
        const country = m[1].toLowerCase();
        if (m[2]) return country + m[2].toLowerCase(); // dash variant, already corrected upstream
        // Bare path: valid if it's a plain English-only country (ENGLISH_BARE_CODES)
        // OR a country whose bare code IS the English variant, distinct from its own
        // dash variant (ENGLISH_IS_BARE, e.g. "ba" English vs "ba-bs" Bosnian) -
        // forceEnglish() redirects those countries TO their bare form precisely
        // because it's the English one, so this has to recognize it too or button
        // URLs built here would wrongly fall back to /us right after that redirect.
        return (ENGLISH_BARE_CODES.has(country) || ENGLISH_IS_BARE.has(country)) ? country : 'us';
    }

    function forceEnglish() {
        // Ported from Spotifuck Mobile (v7.19/v7.21). The Spotifuck Android app
        // (the WebView wrapper Spotifuck Mobile's userscript targets) has a
        // native-side fix (item 22, Locale.setDefault(new Locale("en")) in
        // MainActivity's onCreate()/onResume()) that makes Chromium WebView derive
        // Accept-Language: en for every request it makes at the HTTP layer,
        // structurally covering the navigator.language/languages spoof and the
        // www.spotify.com region-path redirect just below - so running this
        // script's own JS-layer spoof/redirect alongside it is redundant there.
        // window.AndBridge only ever exists inside that app's WebView
        // (addJavascriptInterface-only, never present in a real desktop
        // browser/userscript-manager context, which is the only place SpotiwebJS
        // itself runs) - kept here regardless in case this file's forceEnglish()
        // ever ends up loaded inside that WebView too, same as Spotifuck Mobile's.
        //
        // v7.19 originally had this guard cover the account-setting iframe flip
        // (forceEnglishAccountSetting(), below via runIntlCorrectionOnceReady()) too,
        // on the theory that Accept-Language: en on that hidden iframe's request would
        // make Spotify itself report the account language as English and avoid the
        // false "not English" read that caused the reload-on-login bug. In practice
        // the whole WebView is indeed rendered in English, but skipping the flip inside
        // the app allows user to change their interface language and reload the page which 
        // we don't want because we use certain English selectors to accomplish some of the modifications.
        const nativeForceEnActive = window.AndBridge && typeof window.AndBridge.isLoggedIn === 'function';
        if (nativeForceEnActive) {
            dbg('forceEnglish: skipping navigator.language spoof + region redirect', 'window.AndBridge present', { reason: 'native app-layer ForceEn (item 22) already active - Accept-Language covers these at the HTTP layer; account-setting flip below still runs' });
        } else {
        dbg('forceEnglish: spoofing navigator.language', 'navigator.language/languages', { value: 'en-US' });
        try {
            Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
        } catch (e) {}

        if (location.hostname === 'www.spotify.com') {
            // Gated behind the same www.spotify.com toggle
            // (premiumSpoofEnabledHere()) as everything else scoped to this
            // host. Previously this redirect ran unconditionally regardless
            // of the toggle, so turning "Visual Premium Spoof
            // (www.spotify.com)" off correctly stopped/reverted page
            // modifications but still silently redirected e.g. /si-sl/ to
            // /si-en/ - the one piece of www.spotify.com behavior that
            // wasn't actually off when the toggle said it was.
            if (!premiumSpoofEnabledHere()) {
                dbg('forceEnglish: skipping region-path redirect', location.pathname, { reason: 'Visual Premium Spoof (www.spotify.com) is off' });
            } else {
            // Trust the language suffix when the URL has one (xx-yy, e.g.
            // /si-sl/, /de-en/, /hk-zh/) - Spotify's own site consistently
            // uses a 2-letter language code there, so `yy !== 'en'` is a
            // reliable signal regardless of which country `xx` is.
            // Bare codes (no suffix, e.g. /jp/, /de/, /us/) are left alone
            // here: whether a bare code is English-language varies country
            // by country with no clean pattern, so there's no safe way to
            // redirect the whole PAGE on those without assuming something
            // unverified. (getCurrentRegionPrefix() above handles this
            // differently for button URLs specifically, where landing
            // somewhere readable matters more than preserving locale.)
            const m = location.pathname.match(/^\/([a-z]{2})-([a-z]{2})(\/.*)?$/i);
            if (m) {
                const country = m[1].toLowerCase();
                const lang = m[2].toLowerCase();
                if (lang !== 'en') {
                    let target;
                    if (NO_ENGLISH_VARIANT.has(country)) {
                        // No English storefront exists for this country at
                        // all (dash or bare) - fall back to /us rather than
                        // leaving the user on a non-English page.
                        target = '/us' + (m[3] || '/');
                    } else if (ENGLISH_IS_BARE.has(country)) {
                        target = '/' + country + (m[3] || '/');
                    } else {
                        target = '/' + country + '-en' + (m[3] || '/');
                    }
                    dbg('forceEnglish: redirecting off non-English language suffix', location.pathname, { to: target });
                    location.replace(location.origin + target + location.search + location.hash);
                    return;
                }
            }
            }
        }
        }

        // The /intl-xx/ URL check and account-setting flip used to run right
        // here, immediately, at document-start - before Spotify's own SPA
        // had even started hydrating. A user reported open.spotify.com
        // getting permanently stuck never finishing its initial load with
        // the script enabled; disabling the script, letting the page load
        // fully, manually setting the account language to English, then
        // re-enabling fixed it for them - consistent with this code's own
        // location.replace() call racing Spotify's startup rather than a
        // logic bug in the correction itself. See
        // runIntlCorrectionOnceReady() below for the fix: it now waits for
        // the player UI to actually exist before doing any of this.
        runIntlCorrectionOnceReady();
    }

    // Guards so a MutationObserver storm (or multiple forceEnglish() calls,
    // if that ever happens) can't spawn overlapping waits or run the
    // correction more than once.
    let intlCorrectionRun = false;

    /**
     * runIntlCorrectionOnceReady - Waits for
     * [data-testid="control-button-playpause"] to exist in the DOM - the
     * persistent player-bar's play/pause button, present as soon as
     * Spotify's app shell has mounted, even before anything is playing, and
     * not localized (data-testid is an internal test hook, unlike its
     * aria-label) - then runs the /intl-xx/ URL correction and
     * account-setting flip exactly once. This is what forceEnglish() used to
     * do immediately at document-start; see the comment above its call to
     * this function for why that was moved here instead.
     */
    function runIntlCorrectionOnceReady() {
        if (intlCorrectionRun) return;

        const run = () => {
            if (intlCorrectionRun) return;
            intlCorrectionRun = true;

            const m2 = location.pathname.match(/^\/intl-([a-z]{2})(\/.*)?$/i);
            // Some account languages (e.g. Italian) get server-redirected to an
            // /intl-xx/ URL on every load; others (e.g. Slovenian) never do. The
            // real cause, when it happens, is the saved account-level language
            // setting (forceEnglishAccountSetting() below) - so rather than
            // stripping the URL as its own navigation and only falling through to
            // the account fix on a later load, the stripped target path is handed
            // straight to forceEnglishAccountSetting(). If it needs to flip the
            // setting, its own verification redirect lands directly on that
            // stripped path - one navigation does both jobs instead of two. If the
            // setting turns out to already be English (or the flip can't be
            // attempted at all), forceEnglishAccountSetting() falls back to
            // stripping the URL itself so this load still isn't left on
            // /intl-xx/.
            const onIntlPrefix = m2 && m2[1].toLowerCase() !== 'en';
            const strippedTarget = onIntlPrefix ? (m2[2] || '/') : null;

            if (HOST_IS_OPEN) {
                forceEnglishAccountSetting(strippedTarget);
            } else if (onIntlPrefix) {
                // Can't flip the account setting cross-origin from here, so the
                // cheap URL strip is the only correction available.
                dbg('forceEnglish: redirecting off /intl-xx/ prefix', location.pathname, { to: strippedTarget });
                location.replace(location.origin + strippedTarget + location.search + location.hash);
            } else {
                dbg('forceEnglish: skipping account-setting flip', 'forceEnglishAccountSetting()', { reason: 'not open.spotify.com - iframe to open.spotify.com/preferences would be cross-origin and always fail here' });
            }
        };

        if (document.querySelector('[data-testid="control-button-playpause"]')) {
            run();
            return;
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector('[data-testid="control-button-playpause"]')) {
                observer.disconnect();
                run();
            }
        });
        const startObserving = () => observer.observe(document.body, { childList: true, subtree: true });
        if (document.body) {
            startObserving();
        } else {
            // document-start - <body> hasn't been parsed yet.
            document.addEventListener('DOMContentLoaded', startObserving, { once: true });
        }
    }

    /**
     * forceEnglishAccountSetting - Flip the account-level language preference
     * (open.spotify.com/preferences, <select id="desktop.settings.selectLanguage">)
     * to "en". navigator.language and the /intl-xx/ URL prefix above only
     * affect this one page load - the aria-labels Spotify actually renders
     * (e.g. "Open Your Library") are driven by this account setting, which is
     * saved server-side. Ported from Spotifuck v6.5, since without it,
     * anything in this script keyed off an English aria-label
     * (e.g. the "Collapse Your Library" checks) silently stops matching for
     * any account not already set to English.
     */
    function forceEnglishAccountSetting(stripTarget = null) {
        const PENDING_KEY = 'spotiwebEnglishFlipPending';
        const ATTEMPTS_KEY = 'spotiwebEnglishFlipAttempts';
        const MAX_ATTEMPTS = 3;

        // When called from an /intl-xx/ URL, stripTarget is the path we'd land
        // on with that prefix removed. Any navigation this function makes below
        // (the verify-reload after a flip, or the fallback strip when no flip
        // was possible) goes to this URL instead of a bare reload, so the
        // /intl-xx/ correction and the account-setting fix collapse into a
        // single navigation instead of two.
        const stripUrl = stripTarget ? (location.origin + stripTarget + location.search + location.hash) : null;
        const navigateAfter = (cleanup) => {
            cleanup();
            if (stripUrl) location.replace(stripUrl); else location.reload();
        };

        if (window.top !== window.self) return;

        const verifying = localStorage.getItem(PENDING_KEY) === 'true';
        if (verifying) localStorage.removeItem(PENDING_KEY);

        const withPreferencesDoc = (callback) => {
            let settled = false;
            const fire = (doc, cleanup) => {
                if (settled) return;
                settled = true;
                callback(doc, cleanup);
            };

            if (location.pathname.startsWith('/preferences')) {
                fire(document, () => {});
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = 'https://open.spotify.com/preferences';
            (document.documentElement || document.body).appendChild(iframe);

            let removed = false;
            const cleanup = () => {
                if (removed) return;
                removed = true;
                iframe.remove();
            };

            iframe.addEventListener('load', () => {
                try {
                    fire(iframe.contentDocument, cleanup);
                } catch (e) {
                    dbg('forceEnglishAccountSetting: could not access preferences iframe', 'iframe.contentDocument', { error: String(e) });
                    cleanup();
                    fire(null, cleanup);
                }
            });

            setTimeout(() => { cleanup(); fire(null, cleanup); }, 15000);
        };

        const giveUp = (reason) => {
            dbg('forceEnglishAccountSetting: giving up', '(language flip retry)', { reason });
        };

        const attemptFlip = () => {
            withPreferencesDoc((doc, cleanup) => {
                if (!doc) {
                    if (stripUrl) {
                        dbg('forceEnglish: redirecting off /intl-xx/ prefix', location.pathname, { to: stripTarget, reason: 'account flip unavailable - could not load preferences document' });
                        navigateAfter(cleanup);
                    } else {
                        cleanup();
                        giveUp('could not load preferences document');
                    }
                    return;
                }
                applyEnglishToLanguageSelect(doc, (result) => {
                    if (!result.found) {
                        if (stripUrl) {
                            dbg('forceEnglish: redirecting off /intl-xx/ prefix', location.pathname, { to: stripTarget, reason: 'account flip unavailable - language selector not found' });
                            navigateAfter(cleanup);
                        } else {
                            cleanup();
                            giveUp('language selector not found - Spotify may have changed the settings page');
                        }
                        return;
                    }
                    if (!result.changed) {
                        localStorage.removeItem(ATTEMPTS_KEY);
                        dbg('forceEnglishAccountSetting: language already English', '#desktop.settings.selectLanguage', { reload: false });
                        if (stripUrl) {
                            dbg('forceEnglish: redirecting off /intl-xx/ prefix', location.pathname, { to: stripTarget });
                            navigateAfter(cleanup);
                        } else {
                            cleanup();
                        }
                        return;
                    }
                    localStorage.setItem(PENDING_KEY, 'true');
                    dbg('forceEnglishAccountSetting: dispatched change, navigating to verify', '#desktop.settings.selectLanguage', { to: stripTarget || location.pathname });
                    setTimeout(() => navigateAfter(cleanup), 1000);
                });
            });
        };

        if (!verifying) {
            attemptFlip();
            return;
        }

        withPreferencesDoc((doc, cleanup) => {
            if (!doc) { cleanup(); giveUp('could not reload preferences document to verify'); return; }
            applyEnglishToLanguageSelect(doc, (result) => {
                cleanup();
                if (result.found && result.value === 'en') {
                    localStorage.removeItem(ATTEMPTS_KEY);
                    dbg('forceEnglishAccountSetting: verified language is English', '#desktop.settings.selectLanguage', {});
                    return;
                }
                if (!result.found) {
                    giveUp('language selector not found during verification - Spotify may have changed the settings page');
                    return;
                }
                const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
                if (attempts >= MAX_ATTEMPTS) {
                    giveUp('English flip did not stick after ' + attempts + ' attempt(s) - clear localStorage "' + ATTEMPTS_KEY + '" to retry');
                    return;
                }
                localStorage.setItem(ATTEMPTS_KEY, String(attempts));
                dbg('forceEnglishAccountSetting: flip did not stick, retrying', '#desktop.settings.selectLanguage', { attempts, max: MAX_ATTEMPTS });
                attemptFlip();
            }, { readOnly: true });
        });
    }

    /**
     * applyEnglishToLanguageSelect - Read or set the given document's language
     * <select>. In write mode it flips the value to "en" and dispatches a
     * real change event so Spotify's React handler picks it up. In read-only
     * mode it just reports the current value.
     */
    function applyEnglishToLanguageSelect(doc, onDone, { readOnly = false } = {}) {
        let settled = false;
        const resolve = (result) => {
            if (settled) return;
            settled = true;
            onDone(result);
        };

        const trySelect = () => {
            const select = doc.getElementById('desktop.settings.selectLanguage');
            if (!select) return false;

            if (readOnly || select.value === 'en') {
                resolve({ found: true, value: select.value, changed: false });
                return true;
            }

            const win = doc.defaultView || window;
            const nativeSetter = Object.getOwnPropertyDescriptor(win.HTMLSelectElement.prototype, 'value').set;
            nativeSetter.call(select, 'en');
            select.dispatchEvent(new Event('change', { bubbles: true }));

            dbg('applyEnglishToLanguageSelect: dispatched change event', '#desktop.settings.selectLanguage', {});
            resolve({ found: true, value: 'en', changed: true });
            return true;
        };

        if (trySelect()) return;

        const win = doc.defaultView || window;
        const startObserving = () => {
            if (trySelect()) return;
            const observer = new win.MutationObserver(() => {
                if (trySelect()) observer.disconnect();
            });
            observer.observe(doc.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                resolve({ found: false, value: null, changed: false });
            }, 12000);
        };

        if (doc.body) {
            startObserving();
        } else {
            doc.addEventListener('DOMContentLoaded', startObserving, { once: true });
        }
    }

    function runPremium() {
        dbg('runPremium: DOM scan pass running', 'document', {});

        document.querySelectorAll('.encore-text-title-medium, [class*="title-medium"]').forEach(el => {
            if ((el.textContent || '').trim() === 'Premium Individual') {
                el.style.color = window.location.href.includes('/subscription/manage/') ? '#000' : PINK;
                const parent = el.closest('[class*="Hjkjj"], [class*="hjkjj"]');
                if (parent) {
                    parent.style.background = PINK;
                    parent.style.color = '#000';
                }
            }
        });

        const planCard = document.querySelector('[data-testid="plan-card"]');
        if (planCard && !planCard.querySelector('.__sp_logo')) {
            planCard.style.position = 'relative';
            const logo = document.createElement('img');
            logo.className = '__sp_logo';
            logo.src = 'https://i.ibb.co/jPMD5S3K/3-sin-t-tulo-20260704011012.png';
            logo.style.cssText = 'position:absolute;top:8px;right:8px;width:24px;height:24px;z-index:10;pointer-events:none;';
            planCard.appendChild(logo);

            const msg = document.createElement('p');
            msg.textContent = 'Your Premium Individual NEVER expires. Dont pay Spotify, fuck their monopoly!';
            msg.style.cssText = 'color:#B3B3B3;font-size:14px;margin:8px 0;text-align:left;line-height:1.4;padding:0 4px;';
            const btnRow = planCard.querySelector('[class*="dCZPlm"], .sc-3b07dd39-3');
            if (btnRow) btnRow.parentNode.insertBefore(msg, btnRow);
        }

        document.querySelectorAll('h1, h2, h3, h4, strong, span, div[class*="plan"], div[class*="Plan"]').forEach(el => {
            const t = (el.textContent || '').trim();
            if (t === 'Free' || t === 'Spotify Free' || t === 'Free plan') {
                logChange('h1,h2,h3,h4,strong,span,div[class*="plan"]', t, 'Premium Individual');
                el.textContent = 'Premium Individual';
                el.style.color = PINK;
                el.style.fontWeight = '700';
            }
        });

        document.querySelectorAll('a, button, [role="button"]').forEach(el => {
            const orig = (el.innerText || el.textContent || '').trim();
            const t = orig.toLowerCase();
            if (/^(get|buy|join)\s*premium/.test(t)) {
                logChange('a, button, [role="button"]', orig, 'DONT JOIN PREMIUM');
                el.textContent = 'DONT JOIN PREMIUM';
                el.style.cssText += `background:${PINK}!important;color:#000!important;border:none!important;border-radius:20px!important;font-weight:700!important;pointer-events:none!important;cursor:default!important;`;
                el.onclick = e => {
                    dbg('spoofed "DONT JOIN PREMIUM" button: clicked', 'a, button, [role="button"] (originally Get/Buy/Join Premium)', { action: 'preventDefault + stopPropagation (click is a no-op)' });
                    e.preventDefault(); e.stopPropagation();
                };
            }
            if (/^(explore|view)\s*plans/.test(t)) {
                logChange('a, button, [role="button"]', orig, 'Manage plan');
                el.textContent = 'Manage plan';
                el.style.cssText += `background:transparent!important;color:#fff!important;border:1px solid #727272!important;border-radius:20px!important;font-weight:700!important;pointer-events:none!important;cursor:default!important;`;
                el.onclick = e => {
                    dbg('spoofed "Manage plan" button: clicked', 'a, button, [role="button"] (originally Explore/View plans)', { action: 'preventDefault + stopPropagation (click is a no-op)' });
                    e.preventDefault(); e.stopPropagation();
                };
            }
            if (/^try/.test(t) && !el.dataset.spDone) {
                logChange('a, button, [role="button"]', orig, '(hidden)');
                el.style.display = 'none';
                el.dataset.spDone = '1';
            }
        });

        document.querySelectorAll('[class*="badge"], [class*="Badge"]').forEach(el => {
            if (/^free$/i.test(el.textContent.trim())) {
                logChange('[class*="badge"]', el.textContent.trim(), 'PREMIUM');
                el.textContent = 'PREMIUM';
                el.style.background = PINK;
                el.style.color = '#000';
            }
        });

        document.querySelectorAll('table').forEach(tbl => {
            tbl.querySelectorAll('td, th').forEach(cell => {
                const t = cell.textContent.trim().toLowerCase();
                if (!t || t === '—' || t === '-' || t === 'no' || /free/.test(t)) {
                    logChange('table td, th', t || '(empty)', '✓');
                    cell.innerHTML = `<span style="color:${GREEN};font-weight:700;">✓</span>`;
                }
            });
        });

        document.querySelectorAll('span[data-encore-id="text"]').forEach(el => {
            const t = el.textContent.trim();
            if (t === 'Download for offline listening') {
                logChange('span[data-encore-id="text"]', t, 'Spotify wont fuck you');
                el.textContent = 'Spotify wont fuck you';
            }
        });

        const upgradeBtn = document.querySelector('[data-testid="upgrade-button"]:not([data-sp-done])');
        if (upgradeBtn) { logChange('[data-testid="upgrade-button"]', upgradeBtn.textContent.trim(), '(hidden)'); upgradeBtn.style.display = 'none'; upgradeBtn.dataset.spDone = '1'; }
        const installBtn = document.querySelector('a[href="/download"]:not([data-sp-done])');
        if (installBtn) { logChange('a[href="/download"]', 'install app link', '(hidden)'); installBtn.style.display = 'none'; installBtn.dataset.spDone = '1'; }
        const premiumMenu = document.querySelector('a[href*="premium/?ref=web_loggedin_upgrade_menu"]:not([data-sp-done])');
        if (premiumMenu) { logChange('a[href*="premium/?ref=web_loggedin_upgrade_menu"]', premiumMenu.textContent.trim(), '(hidden)'); premiumMenu.style.display = 'none'; premiumMenu.dataset.spDone = '1'; }

        const planesXpath = document.evaluate(
            '//a[text()="Premium Plans"] | //span[text()="Premium Plans"] | //div[text()="Premium Plans"]',
            document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
        );
        for (let i = 0; i < planesXpath.snapshotLength; i++) {
            const n = planesXpath.snapshotItem(i);
            if (n && n.nodeType === 1 && !n.dataset.spDone) {
                logChange('(xpath) Premium Plans text', n.textContent.trim(), '(hidden)');
                n.style.display = 'none';
                n.dataset.spDone = '1';
            }
        }

        document.querySelectorAll('[aria-label*="Premium Plans"], [data-ga-action="premium"], [data-ga-category="menu"] a, a[href*="/premium/"]').forEach(el => {
            if (el.dataset.spDone) return;
            const t = el.textContent.trim();
            if (t === 'Premium Plans') {
                logChange('[aria-label*="Premium Plans"] / [data-ga-action="premium"] / a[href*="/premium/"]', t, '(hidden)');
                el.style.display = 'none';
                el.dataset.spDone = '1';
            }
        });

        const premiumBanner = document.querySelector('[data-testid="compact-banner"]:not([data-sp-done])');
        if (premiumBanner) {
            logChange('[data-testid="compact-banner"]', '(original upgrade banner)', 'Edit profile / Payment method buttons');
            premiumBanner.dataset.spDone = '1';
            const wrapper = premiumBanner.closest('.sc-dad329a7-0, [class*="dad329a7"]');
            if (wrapper) {
                wrapper.style.width = '100%';
            }


            premiumBanner.style.cssText += `
                display:flex !important;
                flex-direction:row !important;
                background:#2A2A2A !important;
                cursor:default !important;
                padding:0 !important;
                border-radius:8px !important;
                overflow:hidden !important;
                min-width:unset !important;
                width:100% !important;
            `;


            const left = document.createElement('div');
            left.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;row-gap:var(--encore-spacing-tighter-2);padding:var(--encore-spacing-looser) var(--encore-spacing-tighter-2);cursor:pointer;';
            const pencilSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            pencilSvg.setAttribute('viewBox', '0 0 16 16');
            pencilSvg.setAttribute('role', 'img');
            pencilSvg.setAttribute('aria-hidden', 'true');
            pencilSvg.style.cssText = 'width:var(--encore-graphic-size-decorative-base);height:var(--encore-graphic-size-decorative-base);';
            pencilSvg.innerHTML = `<path fill="white" d="M11.838.714a2.438 2.438 0 0 1 3.448 3.448l-9.841 9.841c-.358.358-.79.633-1.267.806l-3.173 1.146a.75.75 0 0 1-.96-.96l1.146-3.173c.173-.476.448-.909.806-1.267l9.84-9.84zm2.387 1.06a.94.94 0 0 0-1.327 0l-9.84 9.842a1.95 1.95 0 0 0-.456.716L2 14.002l1.669-.604a1.95 1.95 0 0 0 .716-.455l9.841-9.841a.94.94 0 0 0 0-1.327z"/>`;
            const leftText = document.createElement('span');
            leftText.className = 'e-10561-text encore-text-body-small-bold';
            leftText.style.cssText = 'color:var(--text-base);text-align:center;';
            leftText.textContent = 'Edit profile';
            left.appendChild(pencilSvg);
            left.appendChild(leftText);
            left.onclick = e => {
                e.stopPropagation();
                const profileUrl = `https://www.spotify.com/${getCurrentRegionPrefix()}/account/profile/`;
                dbg('premiumBanner left (Edit profile): clicked', '.__sp custom div (replaces [data-testid="compact-banner"])', {
                    action: 'redirecting to ' + profileUrl
                });
                window.location.href = profileUrl;
            };


            const right = document.createElement('div');
            right.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;row-gap:var(--encore-spacing-tighter-2);padding:var(--encore-spacing-looser) var(--encore-spacing-tighter-2);cursor:pointer;border-left:1px solid #404040;';
            const cardSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            cardSvg.setAttribute('viewBox', '0 0 16 16');
            cardSvg.setAttribute('role', 'img');
            cardSvg.setAttribute('aria-hidden', 'true');
            cardSvg.style.cssText = 'width:var(--encore-graphic-size-decorative-base);height:var(--encore-graphic-size-decorative-base);';
            cardSvg.innerHTML = `<path fill="white" d="M4 11.5h4V10H4z"/><path fill="white" d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v9.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25zm1.75-.25a.25.25 0 0 0-.25.25V6h13V3.75a.25.25 0 0 0-.25-.25zm-.25 9.75c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V7.5h-13z"/>`;
            const rightText = document.createElement('span');
            rightText.className = 'e-10561-text encore-text-body-small-bold';
            rightText.style.cssText = 'color:var(--text-base);text-align:center;';
            rightText.textContent = 'Payment method';
            right.appendChild(cardSvg);
            right.appendChild(rightText);
            right.onclick = e => {
                e.stopPropagation();
                const paymentUrl = `https://www.spotify.com/${getCurrentRegionPrefix()}/account/saved-payment-cards/`;
                dbg('premiumBanner right (Payment method): clicked', '.__sp custom div (replaces [data-testid="compact-banner"])', {
                    action: 'redirecting to ' + paymentUrl
                });
                window.location.href = paymentUrl;
            };


            premiumBanner.innerHTML = '';
            premiumBanner.appendChild(left);
            premiumBanner.appendChild(right);
        }

        if (/\/premium\/|\/duo\/|\/student\/|\/family\//.test(window.location.href) && !document.querySelector('.__sp_premium_done')) {
            logChange('main / #__next (plan purchase page)', '(original plan page content)', '"You dont need Premium" overlay');
            const main = document.querySelector('main') || document.getElementById('__next') || document.body;
            const wrapper = document.createElement('div');
            wrapper.className = '__sp_premium_done';
            wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:40px;background:#121212;color:#fff;';
            wrapper.innerHTML = `
                <h1 style="font-size:32px;font-weight:700;margin-bottom:16px;color:#fff;">You dont need Spotify Premium. Trust me.</h1>
                <a href="https://www.spotify.com/" style="display:inline-block;padding:14px 40px;background:#1ed760;color:#000;border-radius:20px;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer;">Back to home</a>
            `;
            main.innerHTML = '';
            main.appendChild(wrapper);
        }

        if (window.location.hostname === 'payments.spotify.com' && !document.querySelector('.__sp_pay_done')) {
            logChange('main / #root (payments page)', '(original checkout page content)', '"DONT WASTE YOUR MONEY" overlay');
            const main = document.querySelector('main') || document.getElementById('root') || document.body;
            const wrapper = document.createElement('div');
            wrapper.className = '__sp_pay_done';
            wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:40px;background:#121212;color:#fff;';
            wrapper.innerHTML = `
                <h1 style="font-size:36px;font-weight:700;margin-bottom:16px;color:#fff;">DONT WASTE YOUR MONEY ON SPOTIFY</h1>
                <p style="font-size:18px;margin-bottom:24px;color:#b3b3b3;">Dont give them a cent. Use Spotifuck for free.</p>
                <a href="https://open.spotify.com/" style="display:inline-block;padding:14px 40px;background:#1ed760;color:#000;border-radius:20px;font-weight:700;font-size:16px;text-decoration:none;cursor:pointer;">Back to free Spotify</a>
            `;
            main.innerHTML = '';
            main.appendChild(wrapper);
            // [data-testid*="pay"] and [data-testid*="checkout"] don't catch
            // everything - e.g. data-testid="add-new-card-button" contains
            // neither substring. Adding it as an exact match rather than
            // widening to [data-testid*="card"], since that broader pattern
            // would also match unrelated things like a "discard-button"
            // testid (the substring "card-button" sits inside "discard-
            // button" too).
            const BLOCK_SELECTOR = 'form, button[type="submit"], [data-testid*="pay"], [data-testid*="checkout"], [data-testid="add-new-card-button"]';
            document.querySelectorAll(BLOCK_SELECTOR).forEach(el => {
                el.onclick = e => {
                    dbg('payments page blocker: clicked', BLOCK_SELECTOR, {
                        'element tag': el.tagName, action: 'preventDefault + stopPropagation (click is a no-op)'
                    });
                    e.preventDefault(); e.stopPropagation();
                };
            });
        }
    }

    forceEnglish();

    // Single gated entry point: both the timed passes below and the mutation
    // observer funnel through this so premiumSpoofEnabledHere() is the one
    // switch that turns the whole spoof pass on/off for the current host.
    function premiumPass(changedRoot) {
        if (!premiumSpoofEnabledHere()) return;
        if (changedRoot) scanText(changedRoot);
        else scanText(document.body);
        runPremium();
    }

    setTimeout(() => premiumPass(document.body), 300);
    setTimeout(() => premiumPass(document.body), 1200);

    let timer;
    let pendingNodes = new Set();
    let pendingTextNodes = new Set();
    let mainObserver = null;

    function handleMutations(mutations) {
        if (!premiumSpoofEnabledHere()) return;
        for (const m of mutations) {
            if (m.type === 'childList') {
                m.addedNodes.forEach(node => {
                    if (node.nodeType === 1) pendingNodes.add(node);
                });
            } else if (m.type === 'characterData') {
                pendingTextNodes.add(m.target);
            }
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
            dbg('handleMutations: debounced scan running', 'MutationObserver(document.body)', { pendingNodes: pendingNodes.size, pendingTextNodes: pendingTextNodes.size });
            if (pendingNodes.size > 0 && pendingNodes.size <= 20) {
                pendingNodes.forEach(node => scanText(node));
            } else if (pendingNodes.size > 20) {
                scanText(document.body);
            }
            pendingNodes.clear();
            pendingTextNodes.forEach(node => applyReplacements(node));
            pendingTextNodes.clear();
            runPremium();
        }, 400);
    }

    function startObserver() {
        if (mainObserver) mainObserver.disconnect();
        mainObserver = new MutationObserver(handleMutations);
        mainObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });
        dbg('startObserver: MutationObserver (re)started', 'document.body', { childList: true, subtree: true, characterData: true });
    }

    startObserver();
})();


(function() {
    'use strict';

    // Real DOM removal of ad-banner containers on the free/ad-supported tier -
    // this is ordinary ad-block behavior (comparable to a standard ad-blocker
    // filter rule), not a premium-entitlement bypass: it can't touch anything
    // server-enforced like bitrate, offline downloads, or skip limits.
    // Scoped to open.spotify.com (where the web player's ad slots actually
    // render) and gated by the same open.spotify.com toggle as the rest of
    // the spoof, since it ships bundled with it in the source. Ported from
    // Spotifuck v6.9: previously this ran unconditionally on every matched
    // host (open/www/payments) and relied only on the runtime
    // premiumSpoofEnabledHere() check to no-op elsewhere, which still meant
    // a live MutationObserver and repeated no-op queries on www/payments
    // pages where these ad selectors can never match anything.
    if (HOST_IS_OPEN) {
        const removeAdElements = () => {
            if (!premiumSpoofEnabledHere()) return;
            const adSlots = document.querySelectorAll('[data-testid="ad-slot-container"], [class*="ad-"]');
            const adButtons = document.querySelectorAll('.ButtonInner-sc-14ud5tc-0.fcsOIN');
            if (adSlots.length || adButtons.length) {
                dbg('removeAdElements: ad elements removed', '[data-testid="ad-slot-container"], [class*="ad-"], .ButtonInner-sc-14ud5tc-0.fcsOIN', { adSlots: adSlots.length, adButtons: adButtons.length });
            }
            adSlots.forEach(el => el.remove());
            adButtons.forEach(el => el.remove());
        };
        const adObserver = new MutationObserver(removeAdElements);
        adObserver.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => adObserver.disconnect());
    }
})();

// add-new-card-button blocker for www.spotify.com's own account pages
// (/account/payment-methods/, aliased with /account/saved-payment-cards/ -
// same page reachable under either path). Entirely separate from the
// payments.spotify.com checkout blocker above (BLOCK_SELECTOR inside
// runPremium()), which is gated to that different hostname and so never
// touches this page. No overlay here (account management, not checkout) -
// just the same preventDefault/stopPropagation no-op on the button, gated
// behind HOST_IS_WWW + premiumSpoofEnabledHere() (the www.spotify.com
// toggle), matching everything else scoped to that host. Path-matched via
// location.pathname.includes(...) against both known paths rather than a
// hardcoded locale segment, since the region prefix varies per account
// (si-en, us, mx-es, etc) and isn't always normalized to a fixed value.
if (HOST_IS_WWW) {
    const blockWwwAddCardButton = () => {
        if (!premiumSpoofEnabledHere()) return;
        if (!location.pathname.includes('/account/payment-methods/') &&
            !location.pathname.includes('/account/saved-payment-cards/')) return;
        document.querySelectorAll('[data-testid="add-new-card-button"]:not([data-sp-done])').forEach(el => {
            el.dataset.spDone = '1';
            el.onclick = e => {
                dbg('www add-new-card-button: clicked', '[data-testid="add-new-card-button"]', { action: 'preventDefault + stopPropagation (click is a no-op)' });
                e.preventDefault(); e.stopPropagation();
            };
        });
    };
    blockWwwAddCardButton();
    const wwwCardObserver = new MutationObserver(blockWwwAddCardButton);
    wwwCardObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('beforeunload', () => wwwCardObserver.disconnect());
}

if (HOST_IS_OPEN) {
    /* NowPlayingView guard system - ported 1:1 from Spotifuck's clickNP() /
        closeNowPlay() / isNpvOpen() / panelGuardObserver (renamed from
        npvGuardObserver once it grew to cover all three panel types - see
        the Sixteenth change entry above), replacing the old standalone
        `.zjCIcN96KsMfWwRo` zero-width-collapse block. NPV now opens/closes
        for real (visible, not permanently collapsed) through the same
        native toggle-button-click Spotify itself uses, and can only be
        opened via one of two authorized paths - our own npBtn (inserted
        next to the native lyrics button) or a genuine click on the
        player-bar album art. Any other open (a stray native toggle,
        Spotify itself, another script) gets auto-closed by
        panelGuardObserver. NPV's own DOM (#Desktop_PanelContainer_Id) is
        never removed, only shown/hidden via Spotify's own aria-hidden
        mechanism, so it stays fully accessible to JS for track info/
        lyrics fetching even while closed.
    */
    let userOpenedNPV = false; // true right after an authorized open (npBtn or album
    // art click). closeNowPlay() resets this to false on every close, and
    // panelGuardObserver auto-closes the panel any time it becomes visible while false.

    // Queue and Connect used to get a second-class version of this - a time-boxed
    // `otherPanelOpening` flag that expired on a fixed 500ms timer instead of on a
    // confirmed close. That was the actual cause of the "Connect/Queue auto-close
    // unless NPV was opened first" bug: the guard's MutationObserver keeps firing on
    // unrelated DOM churn for as long as Spotify's app keeps mutating (Connect's
    // device-discovery mount is the slowest of the three), and if any of those
    // callbacks lands after the 500ms window has already expired, the guard has no
    // record that this open was authorized and closes it - exactly the "unauthorized
    // native open" case it's designed to catch, just triggered by our own flag
    // lapsing rather than by an actual stray toggle. It only ever seemed to "need NPV
    // opened first" because .fuckd-panel-open being already true from a prior NPV
    // open (see updateNpvLayoutState() below) happened to mask the underlying gap,
    // not because that gap was fixed.
    //
    // Queue and Connect are now full authorized-opener types, structurally identical
    // to NPV: userOpenedQueue/userOpenedConnect persist until a real close is
    // confirmed (closeNowPlay() below clears all three together), no timer involved.
    // setAuthorizedPanel() is the single place that sets/clears these three flags -
    // every trigger (npBtn, album art, Queue button, Connect button) calls it with
    // the panel it's about to open (or null if this click is closing one), so at most
    // one of the three is ever true at once, mirroring the "only one of NPV/Queue/
    // Connect can be genuinely open at a time" invariant of the shared container
    // itself. It also folds in a CSS-squeeze timing fix (still needed separately from
    // the guard fix above - see the style block below): flipping .fuckd-panel-open on
    // synchronously, at click time, before Spotify's own handler runs, rather than
    // waiting for panelGuardObserver's mutation callback to react after the fact.
    let userOpenedQueue = false;
    let userOpenedConnect = false;
    function setAuthorizedPanel(which) { // which: 'npv' | 'queue' | 'connect' | null
        userOpenedNPV = which === 'npv';
        userOpenedQueue = which === 'queue';
        userOpenedConnect = which === 'connect';
        if (which) {
            document.documentElement.classList.add('fuckd-panel-open');
            dbg('[PanelGuard] setAuthorizedPanel: class forced on', 'html', { which });
        }
    }
    // True whenever ANY of the three panel types was opened through an authorized
    // trigger (npBtn/album art for NPV, the Queue button, or the Connect button) and
    // hasn't been closed since. Deliberately doesn't care WHICH of the three - that's
    // the whole point (see the Sixteenth change entry above): the shared
    // #Desktop_PanelContainer_Id's aria-label can still read Spotify's generic "Now
    // playing view" default on the very first mutation tick after Queue/Connect opens,
    // so label-matching isNpvOpen()/isQueueOpen()/isConnectOpen() checks are not a
    // reliable way to ask "was THIS open authorized" - only the flags themselves are.
    function isAnyPanelAuthorized() {
        return userOpenedNPV || userOpenedQueue || userOpenedConnect;
    }

    window.closeNowPlay = function(source = 'unknown') {
        setAuthorizedPanel(null); // any close (any source) disarms all three "user opened it" flags
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (!panelContainer) {
            dbg('[PanelGuard] closeNowPlay: no-op - #Desktop_PanelContainer_Id not found', '#Desktop_PanelContainer_Id', { source });
            return;
        }
        const ariaHidden = panelContainer.parentNode.parentNode.ariaHidden;
        if (ariaHidden === 'false') {
            const toggleBtn = panelContainer.parentNode.parentNode.nextElementSibling?.querySelector('button');
            dbg('[PanelGuard] closeNowPlay: view manipulated', '#Desktop_PanelContainer_Id parent parent nextElementSibling button', {
                source,
                'panel ariaHidden (before)': ariaHidden,
                action: toggleBtn ? 'clicked the toggle button to close the panel' : 'toggle button NOT FOUND - could not close',
                'toggleBtn aria-label': toggleBtn ? toggleBtn.getAttribute('aria-label') : null
            });
            if (toggleBtn) toggleBtn.click();
        } else {
            dbg('[PanelGuard] closeNowPlay: no-op - panel already hidden', '#Desktop_PanelContainer_Id', { source, ariaHidden });
        }
    };

    function isNpvOpen() {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (!panelContainer) return false;
        if (panelContainer.parentNode.parentNode.ariaHidden !== 'false') return false;
        // #Desktop_PanelContainer_Id is shared by NPV, Queue, and Connect to a Device -
        // all three flip the same ariaHidden flag, so check the container's own
        // aria-label/class (not a descendant) to tell NPV apart from the other two.
        return panelContainer.getAttribute('aria-label') === 'Now playing view'
            || panelContainer.classList.contains('NowPlayingView');
    }

    // npBtn's green "active" look (icon color + bottom dot) is driven off
    // userOpenedNPV rather than isNpvOpen() - see the Seventeenth change entry
    // above for why (isNpvOpen()'s aria-label check can't reliably tell "NPV
    // specifically" apart from a freshly-opening Queue/Connect on the first
    // tick, the same stale-label issue the Sixteenth change entry's point (b)
    // already worked around for the guard's close decision). The
    // `.npbtn:not(.active)` rules below are the Eighteenth change entry's
    // property-override defense, replacing SPOTIFY_LYBTN_STATE_CLASSES - see
    // that entry above for the full reasoning.
    GM_addStyle(`
        .npbtn { position: relative; }
        .npbtn:not(.active) {
            color: var(--text-subdued, #b3b3b3) !important;
        }
        .npbtn:not(.active)::after {
            content: none !important;
        }
        .npbtn:not(.active):hover,
        .npbtn:not(.active):focus {
            color: var(--text-base, #fff) !important;
        }
        .npbtn.active { color: #1db954; }
        .npbtn.active:hover, .npbtn.active:focus {
            color: #1db954 !important;
        }
        .npbtn.active::after {
            content: "";
            background-color: #1db954;
            border-radius: 50%;
            width: 4px;
            height: 4px;
            display: block;
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translate(-50%);
        }
    `);
    function syncNpBtnVisualState() {
        const npBtn = document.querySelector('.npbtn');
        if (!npBtn) return;
        npBtn.classList.toggle('active', userOpenedNPV);
    }

    // Same shared-container pattern as isNpvOpen() above, checking the container's own
    // aria-label for the other two panel types (confirmed via DOM capture - see
    // connect_to_a_device__nowplayingview__queue_selectors.txt - "Queue" and "Connect
    // to a device" respectively, with no NPV-style extra class to fall back on since
    // those don't carry one).
    function isQueueOpen() {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (!panelContainer) return false;
        if (panelContainer.parentNode.parentNode.ariaHidden !== 'false') return false;
        return panelContainer.getAttribute('aria-label') === 'Queue';
    }
    function isConnectOpen() {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (!panelContainer) return false;
        if (panelContainer.parentNode.parentNode.ariaHidden !== 'false') return false;
        return panelContainer.getAttribute('aria-label') === 'Connect to a device';
    }

    function clickNP(source = 'npBtn-click') {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        const toggleBtn = panelContainer?.parentNode.parentNode.nextElementSibling?.querySelector('button');
        if (!toggleBtn) {
            dbg('[PanelGuard] clickNP: no-op - toggle button not found', '#Desktop_PanelContainer_Id parent parent nextElementSibling button', { source });
            return;
        }
        const willOpen = !isNpvOpen();
        setAuthorizedPanel(willOpen ? 'npv' : null); // set BEFORE the click - panelGuardObserver's
        // mutation microtask fires before a setTimeout(0) macrotask would, so this has to be set
        // first or the guard sees the open with the flag still false and undoes it.
        dbg('[PanelGuard] clickNP: clicking toggle', '#Desktop_PanelContainer_Id parent parent nextElementSibling button', { source, willOpen });
        toggleBtn.click();
    }

    // Only allow opens via an authorized path - npBtn/album art for NPV, or the Queue/
    // Connect buttons for those two (setupOtherPanelTriggers below). Anything else that
    // makes the shared panel container visible gets auto-closed, since userOpenedNPV/
    // userOpenedQueue/userOpenedConnect only ever become true via setAuthorizedPanel(),
    // called from one of those four triggers.
    //
    // Gates on isAnyPanelOpen() + isAnyPanelAuthorized() (any one of the three flags),
    // not on isNpvOpen()/isQueueOpen()/isConnectOpen() label-matching against a
    // specific panel type - see the Sixteenth change entry above for why those three
    // checks can't reliably tell "was this specific open authorized" apart on the
    // first tick. isNpvOpen()/isQueueOpen()/isConnectOpen() are still called below,
    // but only to report which panel it turned out to be in the debug log, not to
    // decide whether to close it.
    //
    // Also tracks the panel's open state across callbacks (lastPanelOpen below) so
    // the stale-flag branch a few lines down only fires on a genuine open->closed
    // TRANSITION - see that branch's own comment for why a plain "currently reads
    // closed" check would be wrong.
    // v-next: panelGuardObserver's attributeFilter (['aria-hidden', 'inert']) fires on
    // every matching mutation anywhere in document.body - Connect's device-discovery
    // mount alone can throw dozens of these while it settles. Previously every single
    // tick logged a 'syncing' line regardless of whether anything about the panel's
    // state had actually changed, so one Connect open could spam dozens of near-
    // identical lines. lastLoggedPanelState caches a fingerprint of the state actually
    // worth knowing about (open/closed + which of the three is authorized) and only
    // calls dbg() when that fingerprint changes - the guard's own open/close/clear-flag
    // decisions below are untouched, this only gates the log line at the bottom of the
    // callback. All panel/NPV-guard dbg() calls in this block are also now tagged with
    // the literal string '[PanelGuard]' so they can be isolated from the rest of the
    // script's SPFDBG output by filtering the console on that string.
    let lastPanelOpen = false;
    let lastLoggedPanelState = null;
    const panelGuardObserver = new MutationObserver(() => {
        const anyOpenNow = isAnyPanelOpen();
        if (anyOpenNow) {
            if (!isAnyPanelAuthorized()) {
                const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
                dbg('[PanelGuard] autoclose: panel opened without an authorized trigger click - closing', '#Desktop_PanelContainer_Id', {
                    'panelContainer aria-label': panelContainer?.getAttribute('aria-label') ?? null,
                    isNpvOpen: isNpvOpen(), isQueueOpen: isQueueOpen(), isConnectOpen: isConnectOpen()
                });
                window.closeNowPlay('panel-guard-autoclose');
            }
        } else if (lastPanelOpen && isAnyPanelAuthorized()) {
            // The panel just transitioned from open to closed (lastPanelOpen was
            // true, isAnyPanelOpen() now reads false), but one of the three
            // authorized flags is still true. That only happens when something
            // closed the panel WITHOUT going through closeNowPlay() - the confirmed
            // real-world case is the panel's own in-panel X/close button, which
            // triggers Spotify's native close handler directly and never touches any
            // of our code, so setAuthorizedPanel(null) never ran. Without this branch
            // the stale `true` flag persists indefinitely and the guard wrongly
            // treats the NEXT open - even a totally unrelated native one, e.g.
            // clicking another playlist's play button or playing a search result,
            // both of which auto-open NPV on their own - as still-authorized, and
            // never auto-closes it.
            //
            // Requiring `lastPanelOpen` (true only once the panel has been genuinely
            // seen open, rather than just checking `!isAnyPanelOpen() &&
            // isAnyPanelAuthorized()` on its own) matters because that plain check
            // would also match the very FIRST callback tick(s) right after an
            // authorized click, before Spotify's (multi-tick) opening transition had
            // made the panel visible yet - "hasn't opened yet" would get misread as
            // "closed via X button", clearing the just-set authorized flag mid-open,
            // which would then make the panel's real opening tick a moment later look
            // unauthorized to the branch above and get it closed right after being
            // told to open. The pre-open ticks correctly fall through instead
            // (lastPanelOpen is still false, since the panel was never open before
            // this click), and only a real open->closed transition matches.
            dbg('[PanelGuard] stale-flag: panel closed via a path that bypassed closeNowPlay() (e.g. in-panel X button) - clearing stale authorized flag', 'html', {
                userOpenedNPV, userOpenedQueue, userOpenedConnect
            });
            setAuthorizedPanel(null);
        }
        lastPanelOpen = anyOpenNow;
        const currentPanelState = `open:${anyOpenNow}|npv:${userOpenedNPV}|queue:${userOpenedQueue}|connect:${userOpenedConnect}`;
        if (currentPanelState !== lastLoggedPanelState) {
            dbg('[PanelGuard] state changed', 'html', { isNpvOpen: isNpvOpen(), isQueueOpen: isQueueOpen(), isConnectOpen: isConnectOpen(), isAnyPanelOpen: anyOpenNow });
            lastLoggedPanelState = currentPanelState;
        }
        updateNpvLayoutState();
    });
    panelGuardObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-hidden', 'inert'] });

    // On load, close it if it's already open before any authorized trigger has fired.
    setTimeout(() => {
        if (isAnyPanelOpen() && !isAnyPanelAuthorized()) window.closeNowPlay('panel-guard-initial');
        const initialPanelState = `open:${isAnyPanelOpen()}|npv:${userOpenedNPV}|queue:${userOpenedQueue}|connect:${userOpenedConnect}`;
        if (initialPanelState !== lastLoggedPanelState) {
            dbg('[PanelGuard] initial: syncing fuckd-panel-open layout class', 'html', { isNpvOpen: isNpvOpen(), isAnyPanelOpen: isAnyPanelOpen() });
            lastLoggedPanelState = initialPanelState;
        }
        updateNpvLayoutState();
    }, 1000);

    // Builds our own Now Playing view toggle button next to the native lyrics button,
    // since Spotify's own native NPV toggle is unreliable/often absent (and is hidden
    // below regardless, since npBtn + album art are the authorized ways to open NPV now).
    const setupNpvButton = () => {
        if (document.querySelector('.npbtn')) return; // already inserted
        const lyBtn = document.querySelector('button[data-testid="lyrics-button"]:not(.fuckd-npv)');
        if (!lyBtn) return;
        lyBtn.classList.add('fuckd-npv');

        const npBtn = document.createElement('button');
        // Clone lyBtn's own classes (Spotify's real Encore button classes) so npBtn
        // automatically gets the same size/padding/hover/scale as every other
        // player-bar button instead of rendering as an unstyled native <button>.
        // No defensive strip needed here anymore - see the Eighteenth change entry
        // above: `.npbtn:not(.active)` now pins color/::after with !important, so
        // it no longer matters whether lyBtn's hashed "open" state classes happen
        // to be physically present on npBtn at clone-time.
        npBtn.className = lyBtn.className.replace('fuckd-npv', '').trim() + ' npbtn';
        npBtn.setAttribute('aria-label', 'Now Playing view');
        npBtn.title = 'Now Playing view';
        npBtn.innerHTML = `<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><rect x="1.25" y="0.75" width="13.5" height="14.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 4.5v7l5.5-3.5z" fill="currentColor"/></svg>`;
        npBtn.addEventListener('click', () => clickNP('npBtn-click'));
        lyBtn.parentNode.insertBefore(npBtn, lyBtn);
        syncNpBtnVisualState(); // set the correct initial look immediately, in case
        // NPV is (unusually) already open-and-authorized at insertion time.

        // Make sure nothing is left open from before npBtn/album-art/Queue/Connect were
        // wired up. Uses the same isAnyPanelOpen()/isAnyPanelAuthorized() combo as
        // panelGuardObserver (not isNpvOpen()) since this can run while a fresh Queue/
        // Connect open is still showing the stale default aria-label - see the
        // Sixteenth change entry above.
        if (isAnyPanelOpen() && !isAnyPanelAuthorized()) window.closeNowPlay('panel-guard-init');

        dbg('[PanelGuard] setupNpvButton: button inserted', 'button[data-testid="lyrics-button"]', {});
    };

    // The player-bar album art (div[data-testid=now-playing-widget]>div:first-child)
    // natively TOGGLES the Now Playing view on click - a real, reliable Spotify
    // affordance. A capture-phase listener sets the authorized-panel state to match
    // what this click is about to do - open or close, computed from isNpvOpen() same
    // as clickNP() - strictly before Spotify's own bubble-phase handler runs, so by
    // the time panelGuardObserver's mutation microtask fires, the flag already reflects
    // the correct state. This must mirror both directions (not just set true): since
    // it's a native toggle, the closing click never goes through our closeNowPlay()
    // (one of the places that resets the flags - panelGuardObserver's stale-flag
    // branch is now a backstop for exactly this kind of native close, but this
    // listener still computes willOpen/clears the flag proactively here rather than
    // relying on that backstop, since doing it synchronously at click time is what
    // keeps .fuckd-panel-open's CSS-squeeze timing correct - see the note in the style
    // block below), so an unconditional `true` here would leave userOpenedNPV stuck
    // true after a close and cause the guard to wrongly trust the next unrelated
    // native open (e.g. a playlist's play button auto-opening NPV).
    const setupNpvWidgetTrigger = () => {
        const artEl = document.querySelector('div[data-testid="now-playing-widget"]>div:first-child:not(.fuckd-npv-art)');
        if (!artEl) return;
        artEl.classList.add('fuckd-npv-art');
        artEl.addEventListener('click', () => {
            const willOpen = !isNpvOpen();
            setAuthorizedPanel(willOpen ? 'npv' : null);
            dbg('[PanelGuard] npvWidget: album art clicked', 'div[data-testid="now-playing-widget"]>div:first-child', {
                willOpen,
                note: willOpen
                    ? 'authorized panel set to npv before Spotify\'s own click handling runs, so panelGuardObserver allows this open'
                    : 'panel was open - this click closes it natively (closeNowPlay() never runs for this path), so the authorized-panel flags are cleared here to keep guard state in sync'
            });
        }, { capture: true });
        dbg('[PanelGuard] setupNpvWidgetTrigger: listener attached', 'div[data-testid="now-playing-widget"]>div:first-child', {});
    };

    // Queue and Connect are now full authorized-opener types, same pattern as the
    // album art trigger above - compute willOpen from each panel's own
    // isQueueOpen()/isConnectOpen() check, and call setAuthorizedPanel() synchronously
    // in a capture-phase listener before Spotify's own handler runs. This replaced the
    // old time-boxed otherPanelOpening flag, which was the actual cause of Queue/
    // Connect auto-closing on a cold first click (see the block above userOpenedNPV's
    // declaration for the full explanation) - these two buttons are also real native
    // toggles like the album art, so both directions need to be computed here for the
    // same reason: an unconditional `true` would leave the flag stuck after a close.
    const setupOtherPanelTriggers = () => {
        const queueBtn = document.querySelector('button[data-testid="control-button-queue"]:not(.fuckd-other-panel)');
        if (queueBtn) {
            queueBtn.classList.add('fuckd-other-panel');
            queueBtn.addEventListener('click', () => {
                const willOpen = !isQueueOpen();
                setAuthorizedPanel(willOpen ? 'queue' : null);
                dbg('[PanelGuard] otherPanel: Queue button clicked', 'button[data-testid="control-button-queue"]', { willOpen });
            }, { capture: true });
            dbg('[PanelGuard] setupOtherPanelTriggers: Queue listener attached', 'button[data-testid="control-button-queue"]', {});
        }
        const connectBtn = document.querySelector('button[aria-label="Connect to a device"]:not(.fuckd-other-panel)');
        if (connectBtn) {
            connectBtn.classList.add('fuckd-other-panel');
            connectBtn.addEventListener('click', () => {
                const willOpen = !isConnectOpen();
                setAuthorizedPanel(willOpen ? 'connect' : null);
                dbg('[PanelGuard] otherPanel: Connect button clicked', 'button[aria-label="Connect to a device"]', { willOpen });
            }, { capture: true });
            dbg('[PanelGuard] setupOtherPanelTriggers: Connect listener attached', 'button[aria-label="Connect to a device"]', {});
        }
    };

    // Poll indefinitely (not just once) until both are set up - the player bar can
    // take longer than a couple seconds to render on open.spotify.com's SPA,
    // especially on a cold load, and a single retry isn't enough to catch that.
    // Both setup functions already no-op harmlessly once already-inserted, so
    // repeated calls are safe. (Spotifuck Mobile's own pfint loop polls
    // indefinitely too, but only for the play button - it doesn't cover these
    // two, which is why Mobile was previously giving them just one fixed 2s
    // retry via addCSSJSHack's single one-shot call. Mobile now runs this same
    // indefinite poll for them instead - see its firstFuck/addCSSJSHack.)
    setupNpvButton();
    setupNpvWidgetTrigger();
    setupOtherPanelTriggers();
    // The clear condition below used to check ONLY .npbtn/.fuckd-npv-art - never
    // .fuckd-other-panel (what setupOtherPanelTriggers() adds once Queue/Connect are
    // wired). npBtn is our own element, created the instant the native lyrics button
    // exists, so it (and the album art, generally present at the same time) are
    // often wired on an earlier tick than Queue/Connect's aria-label/data-testid
    // become reliably queryable. If that happens, the OLD condition below was
    // already satisfied and clearInterval() fired - permanently stopping the poll
    // before setupOtherPanelTriggers() ever got another chance to find and wire
    // Queue/Connect, leaving them stuck relying on Spotify's own native (unauthorized,
    // per panelGuardObserver) click handling for the rest of the session. Now requires
    // all four - npBtn, album art, Queue button, AND Connect button - to be wired
    // before stopping (see the Sixteenth change entry above).
    const npvSetupInterval = setInterval(() => {
        setupNpvButton();
        setupNpvWidgetTrigger();
        setupOtherPanelTriggers();
        if (document.querySelector('.npbtn') && document.querySelector('.fuckd-npv-art')
            && document.querySelector('button[data-testid="control-button-queue"].fuckd-other-panel')
            && document.querySelector('button[aria-label="Connect to a device"].fuckd-other-panel')) {
            dbg('[PanelGuard] npvSetupInterval: all four triggers wired - stopping poll', 'setInterval', {});
            clearInterval(npvSetupInterval);
        }
    }, 1000);

    /* Hide Spotify's own native "Show Now Playing view" toggle - redundant now
        that npBtn/album art are the authorized ways to open NPV. Confirmed via
        live DOM inspection: `.wJiY1vDfuci2a4db` is the button's own WRAPPER div
        (a plain flex sibling of the NPV panel's ancestor, not nested inside it -
        hiding it is what lets the rest of the UI resize to fill the freed
        width), and the button itself carries a stable aria-label. Both
        selectors below resolve to that same wrapper - the hashed class (known
        to work) plus an aria-label-based :has() as a hash-rotation-proof
        fallback. NPV's own DOM (#Desktop_PanelContainer_Id) lives entirely
        outside this wrapper and is untouched by this rule.
    */
    // Tracks whether ANY of the three views sharing #Desktop_PanelContainer_Id -
    // NPV, Queue, or Connect - is currently open, as a class on <html>
    // (fuckd-panel-open - not NPV-specific despite the file's older "npv-open" name
    // for the same class; this flag means "some panel is open" and drives the
    // width-squeeze CSS the same way for all three, not just NPV). Driven off the
    // [inert] attribute directly in JS via closest() - confirmed via DOM capture (see
    // maintaining-npv-queue-connect-guard.md) that all three panel types flip the same
    // [inert] attribute on the same wrapper when opened. isAnyPanelOpen() below is
    // deliberately broader than isNpvOpen() (which stays NPV-only - it's still used
    // for logging/diagnostics and by clickNP()/the album-art trigger, but no longer
    // gates panelGuardObserver's close-or-not decision by itself; see the Sixteenth
    // change entry above - isAnyPanelOpen() is what the guard actually gates on now,
    // paired with isAnyPanelAuthorized()). Hooked into the same panelGuardObserver
    // mutation callback, which also watches the inert attribute (see its observe()
    // call above) - no separate observer needed.
    function isAnyPanelOpen() {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (!panelContainer) return false;
        return !panelContainer.closest('[inert]');
    }
    function updateNpvLayoutState() {
        document.documentElement.classList.toggle('fuckd-panel-open', isAnyPanelOpen());
        syncNpBtnVisualState();
    }
    updateNpvLayoutState(); // reflect default (closed) state before the panel even exists

    /* Hide Spotify's own native "Show Now Playing view" toggle - ported from
        Spotifuck's actual working approach (injectCSS) instead of targeting
        the toggle's own wrapper directly, since that (both the hashed class
        and the aria-label :has() fallback) didn't reliably hide it here.
        Spotifuck doesn't hide that wrapper by name at all - it forces
        #main-view to 100vw with overflow:hidden on the dock region beside it,
        which crops the toggle (and anything else in that region) off-screen
        as a side effect. Ported verbatim (native Spotify data-testid/id
        selectors, not hashed classes) but scoped to html:not(.fuckd-panel-open) here,
        unlike Spotifuck's unconditional version - without that scoping this
        also forces NPV itself to full-width the moment it's legitimately
        opened, squeezing its own panel out instead of giving it room. NPV's
        own DOM (#Desktop_PanelContainer_Id) is untouched by this rule.

        Scoped to html:not(.fuckd-panel-open), which is true for NPV, Queue, OR
        Connect (see isAnyPanelOpen()/updateNpvLayoutState() above), so this
        plain scoping already keeps the width:100vw rule below off NPV just as
        much as Queue/Connect once any of the three is genuinely open - there
        is no NPV-specific width override left anywhere in this file.

        Every authorized trigger (npBtn, album art, Queue button, Connect
        button) flips .fuckd-panel-open on synchronously at click time, via
        setAuthorizedPanel() above, the same "beat the mutation microtask"
        trick used for userOpenedNPV/userOpenedQueue/userOpenedConnect - this
        matters because panelGuardObserver's mutation callback is the only
        other place that flips the class, and reacting to a mutation alone
        would leave a real window between a click landing and the observer
        reacting where this whole squeeze (including the 100vw rule) stays
        armed while Spotify is actively mounting the panel into the shared
        slot. Flipping it synchronously guarantees the squeeze is off before
        Spotify starts rendering the panel, for all three panels uniformly.
    */
    const styleId = 'npv-guard-hide-native-toggle-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            html:not(.fuckd-panel-open) div[data-testid=root] {
                --panel-gap: 0 !important;
            }
            html:not(.fuckd-panel-open) #main-view+div,
            html:not(.fuckd-panel-open) #main-view+div>div {
                overflow: hidden !important;
                width: auto !important;
            }
            html:not(.fuckd-panel-open) #main-view+div>div>div>div:nth-child(2)>div {
                width: 100vw !important;
            }
        `;
        document.head.appendChild(style);
    }
}
