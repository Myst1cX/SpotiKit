// ==UserScript==
// @name         SpotiKit++ desktop
// @namespace    https://github.com/Myst1cX/SpotiKit
// @version      7.0.12 - making amoled toggle but discarding. need proper original UI theme codes. 
// @description  SpotiKit - visual premium UI overlay for Spotify and ad banner blocking. Also restores the old Now Playing View button.
// @author       kit_fogos, Myst1cX (fork)
// @match        https://www.spotify.com/*/account/*
// @match        https://open.spotify.com/*
// @match        https://www.spotify.com/*/premium/*
// @match        https://www.spotify.com/*/duo/*
// @match        https://www.spotify.com/*/student/*
// @match        https://www.spotify.com/*/family/*
// @match        https://payments.spotify.com/*
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

// Twelfth change:
// a) AMOLED pure black mode is no longer unconditional. The Eleventh change
//    above ported it as always-on (matching Mobile at the time), but Mobile
//    itself never exposed a toggle either - both scripts just forced pure
//    black on every load with no way to turn it off. Added a new
//    "Enable AMOLED theme" userscript-manager menu toggle
//    (GM_registerMenuCommand + GM_setValue/GM_getValue, same ✅/❌
//    checkmark/cross style as the two "Visual Premium Spoof" toggles and
//    "Debug Logging"), off by default, GM-storage-backed via a new
//    AMOLED_KEY/amoledEnabled() pair declared at module scope right next to
//    DEBUG_KEY/debugLoggingEnabled(). The GM_addStyle call from the Eleventh
//    change is now wrapped in `if (amoledEnabled())` - this toggle is the
//    ONLY thing that invokes AMOLED mode now. Toggling reloads the page,
//    same as every other flag here.
// b) Registered as the FIRST userscript-manager menu command (previously
//    the two Visual Premium Spoof toggles were first) - order is now:
//    Enable AMOLED theme, Visual Premium Spoof (open.spotify.com),
//    Visual Premium Spoof (www.spotify.com), Show everything replaced so
//    far, Debug Logging (console).
// c) dbg() coverage audit for this change and one gap found in passing:
//    - The new AMOLED toggle logs from/to state before reload, same shape
//      as the two Visual Premium Spoof toggles.
//    - The AMOLED GM_addStyle call itself now logs through dbg() on both
//      branches (style injected / style skipped), same pattern as
//      forceEnglish()'s HOST_IS_OPEN gate logging its own skip.
//    - Re-checked every GM_registerMenuCommand callback and click handler
//      against the Ninth change's (c) coverage audit. Found two real gaps
//      that audit missed: "Show everything replaced so far" and
//      "Debug Logging (console)" themselves - the very act of printing the
//      replacement log or flipping the debug flag was never logged, the
//      same "one user-triggered action with zero trace" problem the Ninth
//      change already fixed for the two Visual Premium Spoof toggles. Both
//      now log via dbg() (Debug Logging's own toggle logs via a raw
//      console.log matching dbg()'s exact output shape instead of dbg()
//      itself, since dbg() is gated behind debugLoggingEnabled() and would
//      otherwise never print the one line that announces logging just
//      turned on).
//    - Everything else - every remaining click handler, state-change
//      function, and menu command - was already covered as of the Seventh/
//      Ninth changes. The setupNpvButton/setupNpvWidgetTrigger/
//      setupOtherPanelTriggers "target not found yet" early-return
//      exception from the Ninth change (c) still stands unchanged: those
//      three still run on a 1-second polling loop while the page loads, so
//      logging every failed poll would still spam the console every second
//      until the player bar renders. Left unlogged on purpose, same as
//      before - not a missed spot.

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

// --- AMOLED pure black mode toggle ---
// Off by default. This GM-storage-backed flag is now the ONLY thing that
// gates the AMOLED CSS block further down (see amoledEnabled() check around
// the GM_addStyle call inside the first IIFE) - previously that block
// injected unconditionally with no toggle at all.
const AMOLED_KEY = 'spotiweb_amoledMode';
function amoledEnabled() {
    try { return typeof GM_getValue === 'function' ? GM_getValue(AMOLED_KEY, false) : false; }
    catch (e) { return false; }
}

console.log('%c[SPFDBG] filter this console by "SPFDBG" to see every button click, selector, and resulting view change', 'color:#1ed760;font-weight:bold;');

if (typeof GM_registerMenuCommand === 'function') {
    GM_registerMenuCommand(
        (amoledEnabled() ? '✅' : '❌') + ' Enable AMOLED theme',
        () => {
            const next = !amoledEnabled();
            dbg('menu: Enable AMOLED theme toggled', 'GM_registerMenuCommand', { from: amoledEnabled(), to: next, action: 'reloading' });
            setFlag(AMOLED_KEY, next);
            location.reload();
        }
    );
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
        dbg('menu: Show everything replaced so far triggered', 'GM_registerMenuCommand', { action: 'printReplacementLog()' });
        printReplacementLog();
        alert('Current text replacements have been logged to the console. Open DevTools (Press F12 or Right click and Inspect), then select the Logs tab under Console to view it.');
    });
    GM_registerMenuCommand(
        (debugLoggingEnabled() ? '✅' : '❌') + ' Debug Logging (console)',
        () => {
            const next = !debugLoggingEnabled();
            // Logged BEFORE the flag flips (not gated behind debugLoggingEnabled()
            // like every other dbg() call) so turning debug logging ON always has
            // this toggle itself as the first line in the console - otherwise the
            // very act of enabling it would be the one action with zero trace.
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
    // Gated behind the "Enable AMOLED theme" userscript-manager menu toggle
    // (off by default, GM-storage-backed via AMOLED_KEY/amoledEnabled() -
    // declared at module scope above). Previously this block ran
    // unconditionally with no way to turn it off; the toggle is now the ONLY
    // way this CSS gets injected.
    if (amoledEnabled()) {
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
        dbg('AMOLED: pure black mode style injected', 'GM_addStyle', {});
    } else {
        dbg('AMOLED: pure black mode disabled, skipping style injection', 'GM_addStyle', {});
    }

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

        const m2 = location.pathname.match(/^\/intl-([a-z]{2})(\/.*)?$/i);
        if (m2 && m2[1].toLowerCase() !== 'en') {
            dbg('forceEnglish: redirecting off /intl-xx/ prefix', location.pathname, { to: m2[2] || '/' });
            location.replace(location.origin + (m2[2] || '/') + location.search + location.hash);
            return;
        }

        if (HOST_IS_OPEN) {
            forceEnglishAccountSetting();
        } else {
            dbg('forceEnglish: skipping account-setting flip', 'forceEnglishAccountSetting()', { reason: 'not open.spotify.com - iframe to open.spotify.com/preferences would be cross-origin and always fail here' });
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
    function forceEnglishAccountSetting() {
        const PENDING_KEY = 'spotiwebEnglishFlipPending';
        const ATTEMPTS_KEY = 'spotiwebEnglishFlipAttempts';
        const MAX_ATTEMPTS = 3;

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
                if (!doc) { cleanup(); giveUp('could not load preferences document'); return; }
                applyEnglishToLanguageSelect(doc, (result) => {
                    if (!result.found) {
                        cleanup();
                        giveUp('language selector not found - Spotify may have changed the settings page');
                        return;
                    }
                    if (!result.changed) {
                        cleanup();
                        localStorage.removeItem(ATTEMPTS_KEY);
                        dbg('forceEnglishAccountSetting: language already English', '#desktop.settings.selectLanguage', { reload: false });
                        return;
                    }
                    localStorage.setItem(PENDING_KEY, 'true');
                    dbg('forceEnglishAccountSetting: dispatched change, reloading to verify', '#desktop.settings.selectLanguage', { reload: true });
                    setTimeout(() => { cleanup(); location.reload(); }, 1000);
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
        closeNowPlay() / isNpvOpen() / npvGuardObserver, replacing the old
        standalone `.zjCIcN96KsMfWwRo` zero-width-collapse block. NPV now
        opens/closes for real (visible, not permanently collapsed) through
        the same native toggle-button-click Spotify itself uses, and can
        only be opened via one of two authorized paths - our own npBtn
        (inserted next to the native lyrics button) or a genuine click on
        the player-bar album art. Any other open (a stray native toggle,
        Spotify itself, another script) gets auto-closed by
        npvGuardObserver. NPV's own DOM (#Desktop_PanelContainer_Id) is
        never removed, only shown/hidden via Spotify's own aria-hidden
        mechanism, so it stays fully accessible to JS for track info/
        lyrics fetching even while closed.
    */
    let userOpenedNPV = false; // true right after an authorized open (npBtn or album
    // art click). closeNowPlay() resets this to false on every close, and
    // npvGuardObserver auto-closes the panel any time it becomes visible while false.

    let otherPanelOpening = false; // Queue/Connect guard: true for a short window after a
    // Queue or Connect click, set via capture-phase listener (same trick as the album-art
    // authorized-opener below) before Spotify's own handler runs. Needed because
    // npvGuardObserver's childList/subtree observation (below) fires on every DOM mutation
    // anywhere in document.body, not just the one aria-hidden flip - Spotify's app mutates
    // constantly, so a single click produces a burst of guard-callback invocations. The flag
    // can't be cleared after the first of those (that reopens the same race it's meant to
    // close), so markOtherPanelOpening() below lets it expire on its own short timer instead,
    // covering the whole opening transition regardless of how many mutations fire during it.
    let otherPanelOpeningTimer = null;
    function markOtherPanelOpening() {
        otherPanelOpening = true;
        clearTimeout(otherPanelOpeningTimer);
        otherPanelOpeningTimer = setTimeout(() => { otherPanelOpening = false; }, 500);
    }

    window.closeNowPlay = function(source = 'unknown') {
        userOpenedNPV = false; // NPV guard: any close (any source) disarms the "user opened it" flag
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (!panelContainer) {
            dbg('closeNowPlay: no-op - #Desktop_PanelContainer_Id not found', '#Desktop_PanelContainer_Id', { source });
            return;
        }
        const ariaHidden = panelContainer.parentNode.parentNode.ariaHidden;
        if (ariaHidden === 'false') {
            const toggleBtn = panelContainer.parentNode.parentNode.nextElementSibling?.querySelector('button');
            dbg('closeNowPlay: view manipulated', '#Desktop_PanelContainer_Id parent parent nextElementSibling button', {
                source,
                'panel ariaHidden (before)': ariaHidden,
                action: toggleBtn ? 'clicked the toggle button to close the panel' : 'toggle button NOT FOUND - could not close',
                'toggleBtn aria-label': toggleBtn ? toggleBtn.getAttribute('aria-label') : null
            });
            if (toggleBtn) toggleBtn.click();
        } else {
            dbg('closeNowPlay: no-op - panel already hidden', '#Desktop_PanelContainer_Id', { source, ariaHidden });
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

    function clickNP(source = 'npBtn-click') {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        const toggleBtn = panelContainer?.parentNode.parentNode.nextElementSibling?.querySelector('button');
        if (!toggleBtn) {
            dbg('clickNP: no-op - toggle button not found', '#Desktop_PanelContainer_Id parent parent nextElementSibling button', { source });
            return;
        }
        const willOpen = !isNpvOpen();
        userOpenedNPV = willOpen; // set BEFORE the click - npvGuardObserver's mutation
        // microtask fires before a setTimeout(0) macrotask would, so this has to be set
        // first or the guard sees the open with the flag still false and undoes it.
        dbg('clickNP: clicking toggle', '#Desktop_PanelContainer_Id parent parent nextElementSibling button', { source, willOpen });
        toggleBtn.click();
    }

    // Only allow opens via an authorized path - npBtn (clickNP, setupNpvButton) or the
    // native album art click (setupNpvWidgetTrigger). Anything else that makes the
    // panel visible gets auto-closed, since userOpenedNPV only ever becomes true via
    // one of those two paths.
    const npvGuardObserver = new MutationObserver(() => {
        if (isNpvOpen() && !userOpenedNPV && !otherPanelOpening) {
            const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
            dbg('NPV guard: panel opened without npBtn click - closing', '#Desktop_PanelContainer_Id', {
                'panelContainer aria-label': panelContainer?.getAttribute('aria-label') ?? null
            });
            window.closeNowPlay('npv-guard-autoclose');
        }
        dbg('npvGuardObserver: syncing npv-open layout class', 'html', { isNpvOpen: isNpvOpen() });
        updateNpvLayoutState();
    });
    npvGuardObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-hidden'] });

    // On load, close it if it's already open before any npBtn click has happened.
    setTimeout(() => {
        if (isNpvOpen() && !userOpenedNPV) window.closeNowPlay('npv-guard-initial');
        dbg('npv-guard-initial: syncing npv-open layout class', 'html', { isNpvOpen: isNpvOpen() });
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
        npBtn.className = lyBtn.className.replace('fuckd-npv', '').trim() + ' npbtn';
        npBtn.setAttribute('aria-label', 'Now Playing view');
        npBtn.title = 'Now Playing view';
        npBtn.innerHTML = `<svg data-encore-id="icon" role="img" aria-hidden="true" viewBox="0 0 16 16" style="width:16px;height:16px;fill:currentColor;"><rect x="1.25" y="0.75" width="13.5" height="14.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 4.5v7l5.5-3.5z" fill="currentColor"/></svg>`;
        npBtn.addEventListener('click', () => clickNP('npBtn-click'));
        lyBtn.parentNode.insertBefore(npBtn, lyBtn);

        // Make sure NPV starts closed - at this point only npBtn is wired as an
        // authorized opener (setupNpvWidgetTrigger runs separately).
        if (isNpvOpen() && !userOpenedNPV) window.closeNowPlay('npv-guard-init');

        dbg('setupNpvButton: button inserted', 'button[data-testid="lyrics-button"]', {});
    };

    // The player-bar album art (div[data-testid=now-playing-widget]>div:first-child)
    // natively TOGGLES the Now Playing view on click - a real, reliable Spotify
    // affordance. A capture-phase listener sets userOpenedNPV to match what this click
    // is about to do - open or close, computed from isNpvOpen() same as clickNP() -
    // strictly before Spotify's own bubble-phase handler runs, so by the time
    // npvGuardObserver's mutation microtask fires, userOpenedNPV already reflects the
    // correct state. This must mirror both directions (not just set true): since it's a
    // native toggle, the closing click never goes through our closeNowPlay() (which is
    // the only other place that resets the flag), so an unconditional `true` here would
    // leave the flag stuck true after a close and cause the guard to wrongly trust the
    // next unrelated native open (e.g. a playlist's play button auto-opening NPV).
    const setupNpvWidgetTrigger = () => {
        const artEl = document.querySelector('div[data-testid="now-playing-widget"]>div:first-child:not(.fuckd-npv-art)');
        if (!artEl) return;
        artEl.classList.add('fuckd-npv-art');
        artEl.addEventListener('click', () => {
            const willOpen = !isNpvOpen();
            userOpenedNPV = willOpen;
            dbg('npvWidget: album art clicked', 'div[data-testid="now-playing-widget"]>div:first-child', {
                willOpen,
                note: willOpen
                    ? 'userOpenedNPV set true before Spotify\'s own click handling runs, so npvGuardObserver allows this open'
                    : 'panel was open - this click closes it natively (closeNowPlay() never runs for this path), so userOpenedNPV reset to false here to keep guard state in sync'
            });
        }, { capture: true });
        dbg('setupNpvWidgetTrigger: listener attached', 'div[data-testid="now-playing-widget"]>div:first-child', {});
    };

    // Same authorized-opener trick as setupNpvWidgetTrigger above, but for Queue and
    // Connect - marks otherPanelOpening=true the instant the click lands (capture phase,
    // before Spotify's own handler runs), so npvGuardObserver's mutation callback sees it
    // already set and doesn't mistake the shared panel's still-stale "Now playing view"
    // label for an unauthorized NPV open.
    const setupOtherPanelTriggers = () => {
        const queueBtn = document.querySelector('button[data-testid="control-button-queue"]:not(.fuckd-other-panel)');
        if (queueBtn) {
            queueBtn.classList.add('fuckd-other-panel');
            queueBtn.addEventListener('click', () => {
                markOtherPanelOpening();
                dbg('otherPanel: Queue button clicked', 'button[data-testid="control-button-queue"]', {});
            }, { capture: true });
        }
        const connectBtn = document.querySelector('button[aria-label="Connect to a device"]:not(.fuckd-other-panel)');
        if (connectBtn) {
            connectBtn.classList.add('fuckd-other-panel');
            connectBtn.addEventListener('click', () => {
                markOtherPanelOpening();
                dbg('otherPanel: Connect button clicked', 'button[aria-label="Connect to a device"]', {});
            }, { capture: true });
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
    const npvSetupInterval = setInterval(() => {
        setupNpvButton();
        setupNpvWidgetTrigger();
        setupOtherPanelTriggers();
        if (document.querySelector('.npbtn') && document.querySelector('.fuckd-npv-art')) {
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
    // Tracks NPV's real open/closed state as a class on <html>, so the
    // width-forcing CSS below (which needs to squeeze the native toggle out
    // of view while NPV is closed) doesn't also squeeze NPV itself out when
    // it's legitimately open. Hooked into the same npvGuardObserver mutation
    // callback that already fires on every aria-hidden change - no separate
    // observer needed.
    function updateNpvLayoutState() {
        document.documentElement.classList.toggle('npv-open', isNpvOpen());
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
        selectors, not hashed classes) but scoped to html:not(.npv-open) here,
        unlike Spotifuck's unconditional version - without that scoping this
        also forces NPV itself to full-width the moment it's legitimately
        opened, squeezing its own panel out instead of giving it room. NPV's
        own DOM (#Desktop_PanelContainer_Id) is untouched by this rule.
    */
    const styleId = 'npv-guard-hide-native-toggle-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            html:not(.npv-open) div[data-testid=root] {
                --panel-gap: 0 !important;
            }
            html:not(.npv-open) #main-view+div,
            html:not(.npv-open) #main-view+div>div {
                overflow: hidden !important;
                width: auto !important;
            }
            html:not(.npv-open) #main-view+div>div>div>div:nth-child(2)>div {
                width: 100vw !important;
            }
        `;
        document.head.appendChild(style);
    }
}
