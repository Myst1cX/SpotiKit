// ==UserScript==
// @name         Spotifuck 7.1
// @namespace    https://github.com/Myst1cX/spotifuck-userscript
// @version      6.7
// @description  Full Spotifuck 1.6.4 UI hack (with minor tweaks) + playback control + force English UI + visual premium spoof + bottom nav bar
// @author       Myst1cX (adapted from Spotifuck app)
// @match        *://open.spotify.com/*
// @match        https://www.spotify.com/*/account/*
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
// @homepageURL  https://github.com/Myst1cX/spotifuck-userscript
// @supportURL   https://github.com/Myst1cX/spotifuck-userscript/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/spotifuck-userscript/main/spotifuck-v6.user.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/spotifuck-userscript/main/spotifuck-v6.user.js
// ==/UserScript==

/*
 * Spotifuck v6 - Accurate port from reverse-engineered v1.6.4 APK
 * Based on r0/e.java from classes1.dex
 *
 * Features from APK:
 * - Library button toggle (expand 100%×100% / collapse 48×48px)
 * - Pure black AMOLED mode for playback controls
 * - Auto-close library on playlist selection (and load the playlist)
 * - UI improvements (sidebar, search bar, playback controls)
 * - CSS hacks for better mobile experience

 * Fixed from APK:
  * - Library folder navigation (original behavior auto-closed library on any item selection, including folders.

 * Newly added (v6.3):
 * - Browser-side equivalent of Spotifuck's ForceEn that forces Android app locale to English before loading its WebView
 * - (Forces English on open.spotify.com: overrides navigator.language/languages,
 *   and strips a non-English /intl-xx/ locale prefix from the URL if present.)
 * - The feature is a functional dependency because of the following buttons hardcoded to English aria-label text:
 * const libBtn = document.querySelector('#Desktop_LeftSidebar_Id header button[aria-label*="Your Library"]:not(.fuckd)');
 * if (libBtn.getAttribute('aria-label') === 'Collapse Your Library') {

 * Newly added (v6.4) - Fixed "Force English" (v6.3 was not working at all)
 * - forceEnglish() actually forces English now. The v6.3 version only overrode
 *   navigator.language and stripped the /intl-xx/ URL prefix, both of which only
 *   affect a single page load - the aria-labels Spotify actually renders (e.g.
 *   "Open Your Library") are driven by the account-level language preference at
 *   open.spotify.com/preferences, which is saved server-side. forceEnglish() now
 *   also flips that setting to "en" once, via a hidden iframe so it doesn't
 *   disrupt whatever the user is looking at, then reloads the page so the change
 *   actually takes effect. A localStorage flag means this only runs once ever, and skips the reload
 *   entirely if the account was already set to English.

 * Newly added (v6.4.fix) - Fixed "Force English" again (v6.4 had some bug cases)
 * - Fixed a case where, if a user landed directly on /preferences (rather than
 *   via the hidden iframe), the code that watches for the language <select> to
 *   appear never actually started watching - it silently did nothing and timed
 *   out. Now it waits for the page to finish loading first if needed.
 * - Removed the old "only ever run once" localStorage flag. It assumed the
 *   account language setting only ever changes via this script, so once set,
 *   it stopped checking forever - meaning if the user manually changed the
 *   account language afterward, the script would never notice or fix it again.
 *   It now re-checks the actual setting on every real page load instead.
 * - The dispatched change event is no longer trusted as proof the setting
 *   actually saved. It's now verified on the next load before being treated as
 *   done, with a capped number of retries if it didn't stick.

 * Newly added (v6.5) - Fixed "Force English" again (:D)
 * - Fixed a race where the hidden iframe's "did it finish loading" check and
 *   its 15-second give-up timer could both fire for the same attempt if the
 *   timing landed close together, causing the same logic to run twice. Now
 *   whichever one happens first is the only one that's acted on.
 * - Fixed a race where redirecting away from a non-English /intl-xx/ URL
 *   didn't stop the rest of forceEnglish() from also running against that
 *   same (already-leaving) page. It now stops immediately after triggering
 *   that redirect instead.

 * Newly added (v6.6):
 * a) Improved forceEnglish() to now also redirect www.spotify.com off non-English region path segments (e.g. /mx/ -> /us/)
 * b) Ported the visual premium spoof & payment-page blockers from Spotikit/SpotiwebJS.user.js (v7.0.fork)
 * - CREDITS TO: kitbodega for the code logic - kitbodega/SpotiKit/SpotiwebJS(obsolete).user.js
 * - Added the PINK/GREEN constants, REPLACE text-swap map, and runPremium()) from SpotiwebJS
 * - Fork's expansion: the scan/replace pass is now MutationObserver-driven (only re-scans changed
 *   nodes) instead of a full document.body walk on a timer, and every swap is logged (selector, before/after, times applied);
 *   viewable via a new "Show everything replaced so far" userscript menu command.
 * - Added the @match lines for www.spotify.com/*account,premium,duo,student,family/*
 *   and payments.spotify.com/* so the spoof/blockers actually have pages to run on.
 * - Added two independent userscript-manager menu toggles (via
 *   GM_registerMenuCommand + GM_setValue/GM_getValue), since the spoof
 *   behaves differently depending on which site it's touching:
 *   1. "Visual Premium Spoof (open.spotify.com)" - the in-player text/badge
 *       relabeling and the account widgets that render inside the web player.
 *   HOW DOES IT WORK: Ad-slot removal MutationObserver (ordinary ad-banner DOM removal, same idea as a standard ad-blocker filter;
 *   can't touch anything server-enforced), scoped to open.spotify.com)
 *   2. "Visual Premium Spoof (www.spotify.com)" - the account site
 *       (spotify.com /premium, /duo, /student, /family, purchase pages) and the payments.spotify.com blockers/redirects
 *   HOW DOES IT WORK: Text nodes are taken over by overlays that affirm you do not need Premium.
 *   Each toggle is independent, persists via GM storage, and reloads the page to apply. Both toggles are enabled by default.

 * Newly added (v6.7) - Bottom nav bar (ported from SpotiKit 7.3.2.fork):
 * - Added a fixed Home/Search/Library bottom nav bar (#sp-bottom-nav), taking the place of
 *   Spotifuck's old always-docked library button as the primary way to reach Home, Search and
 *   the Library. Home/Search tabs push / and /search via history.pushState.
 * - The now-playing-bar (player) is repositioned to sit directly above the new bottom nav
 *   (bottom:56px instead of normal flow) - everything else about the player (AMOLED colors,
 *   control layout/scaling) is untouched, still 100% Spotifuck's own styling.
 * - .Root__main-view/#main-view is turned into a clipped flex column (height: 100dvh minus the
 *   bottom nav's 56px minus the player's live-measured height, tracked via a ResizeObserver into
 *   --sp-np-bar-height, same technique SpotiKit uses) so the scrollable content area now actually
 *   stops above the player+nav instead of scrolling on behind them.
 * - Library opening no longer uses Spotifuck's original always-visible-collapsed-to-48x48/
 *   expand-to-fixed-fullscreen switchLs(). It's replaced with SpotiKit's overlay-based switchLs():
 *   the sidebar is display:none by default (only reachable via the new bottom nav's Library tab
 *   or the in-sidebar header button once opened) and expands via a [data-overlay="true"] attribute
 *   to a full 100vw/100vh overlay, tracked with sidebarOverlayActive + sessionStorage so it
 *   survives SPA navigation the same way SpotiKit's does. The only thing kept from Spotifuck's
 *   original switchLs() is the injected header label text ("✖  Close Library") instead of
 *   SpotiKit's "← Library".
 * - Removed the old "collapse library on startup if it's expanded" behavior (used to click the
 *   library button once on load to force Spotifuck's docked-48x48 collapsed state) - that initial
 *   state doesn't exist anymore now that the sidebar is display:none by default until opened via
 *   the bottom nav.
 */

(function() {
    'use strict';

    console.log('🎵 Spotifuck v6 - APK v1.6.4 Port');

    // Global state variables
    let ulFlag = false;  // Unlock flag
    let ffDone = false;  // First fuck done (firstFuck initialization complete)
    let pfint = null;    // Primary features interval

    // --- Per-site visual premium spoof toggles (v6.6) ---
    const SPOOF_OPEN_KEY = 'spotifuck_premSpoofOpen';
    const SPOOF_WWW_KEY = 'spotifuck_premSpoofWWW';
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

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand(
            (getFlag(SPOOF_OPEN_KEY) ? '✅' : '❌') + ' Visual Premium Spoof (open.spotify.com)',
            () => { setFlag(SPOOF_OPEN_KEY, !getFlag(SPOOF_OPEN_KEY)); location.reload(); }
        );
        GM_registerMenuCommand(
            (getFlag(SPOOF_WWW_KEY) ? '✅' : '❌') + ' Visual Premium Spoof (www.spotify.com)',
            () => { setFlag(SPOOF_WWW_KEY, !getFlag(SPOOF_WWW_KEY)); location.reload(); }
        );
    }

    /**
     * forceEnglish - Force the web player to render in English.
     * open.spotify.com localizes via an /intl-xx/ URL prefix.
     * www.spotify.com localizes via a leading region path segment (e.g. /mx/, /es/).
     * Runs at document-start, before Spotify's own scripts get a chance to read navigator.language.
     */
    function forceEnglish() {
        try {
            Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
        } catch (e) {}

        // www.spotify.com: redirect off any non-English-region path segment so the
        // marketing/account pages themselves load in English (ported from
        // SpotiwebJS.js's forceEnglish, v6.6).
        if (location.hostname === 'www.spotify.com') {
            const ENGLISH_REGIONS = ['us', 'gb', 'ca', 'au', 'ie', 'nz'];
            const wm = location.pathname.match(/^\/([a-z]{2})(\/.*)?$/i);
            if (wm && !ENGLISH_REGIONS.includes(wm[1].toLowerCase())) {
                location.replace(location.origin + '/us' + (wm[2] || '/') + location.search + location.hash);
                return;
            }
        }

        const m = location.pathname.match(/^\/intl-([a-z]{2})(\/.*)?$/i);
        if (m && m[1].toLowerCase() !== 'en') {
            location.replace(location.origin + (m[2] || '/') + location.search + location.hash);
            return; // navigation is pending - don't run forceEnglishAccountSetting()
                     // against a page that's about to be torn down; it'll run
                     // fresh on the load this redirect produces instead.
        }

        forceEnglishAccountSetting();
    }

    /**
     * forceEnglishAccountSetting - Flip the account-level language preference
     * (open.spotify.com/preferences, <select id="desktop.settings.selectLanguage">)
     * to "en" (the "English (English)" option - the base/US-flavored English;
     * "en-GB" is a separate option and NOT what this targets).
     * navigator.language and the /intl-xx/ URL prefix above only affect this one
     * page load - the aria-labels Spotify actually renders (e.g. "Open Your
     * Library") are driven by this account setting, which is saved server-side.
     * Because the user can change this setting manually at any time, this
     * re-checks the current value on every real page load rather than trusting
     * a one-time flag - the check itself is cheap (one hidden-iframe load) when
     * the setting is already English, and only triggers a flip + reload when
     * it's actually wrong. A flip is verified on the following load before
     * being treated as done, with a capped number of retries if it didn't
     * stick server-side.
     */
    function forceEnglishAccountSetting() {
        // NOTE: there used to be a permanent "spotifuckForcedEnglishAccountSetting"
        // flag here that, once set, skipped this function forever. That assumed
        // the account setting only ever changes via this script. It doesn't -
        // the user can change it manually (e.g. via /preferences directly), and
        // a permanent flag would then never notice and never re-apply English.
        // So this now re-checks the actual setting on every real page load
        // instead of trusting a one-time flag. The "already English" case is
        // cheap (one iframe load, no reload triggered), so this is fine to run
        // every time; only an actual mismatch triggers the flip+reload below.

        // Set right before we dispatch the change event and reload - tells the
        // *next* load to verify the setting actually saved instead of blindly
        // dispatching again.
        const PENDING_KEY = 'spotifuckEnglishFlipPending';
        // Caps how many times we'll retry a flip that doesn't stick within one
        // correction cycle, so a broken selector can't cause endless reloads.
        const ATTEMPTS_KEY = 'spotifuckEnglishFlipAttempts';
        const MAX_ATTEMPTS = 3;

        if (window.top !== window.self) return; // only the top frame drives this

        const verifying = localStorage.getItem(PENDING_KEY) === 'true';
        if (verifying) localStorage.removeItem(PENDING_KEY);

        // Runs `callback(doc, cleanup)` against the /preferences document,
        // either the current page (if we're already there) or a hidden iframe.
        // `cleanup()` removes the iframe if one was created; call it once done.
        const withPreferencesDoc = (callback) => {
            let settled = false;
            const fire = (doc, cleanup) => {
                if (settled) return; // guards against load/error/timeout all racing to call this
                settled = true;
                callback(doc, cleanup);
            };

            if (location.pathname.startsWith('/preferences')) {
                fire(document, () => {});
                return;
            }

            // Same-origin (open.spotify.com -> open.spotify.com), so
            // contentDocument access is allowed.
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
                    console.log('Spotifuck: could not access preferences iframe', e);
                    cleanup();
                    fire(null, cleanup);
                }
            });

            // Safety net in case the select never appears (layout change, slow load, etc.)
            setTimeout(() => { cleanup(); fire(null, cleanup); }, 15000);
        };

        const giveUp = (reason) => {
            // Just stops this correction cycle's automatic retries - no permanent
            // flag is set, so the next real page load will simply check again.
            console.log('Spotifuck: ' + reason + ' - not retrying automatically');
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
                        console.log('Spotifuck: account language already English - no reload needed');
                        return;
                    }
                    // Dispatched the change event, but that only proves React
                    // saw it - not that Spotify's backend actually saved it.
                    // Reload and verify on the next load before trusting this.
                    localStorage.setItem(PENDING_KEY, 'true');
                    console.log('Spotifuck: dispatched English change - reloading to verify it saved');
                    setTimeout(() => { cleanup(); location.reload(); }, 1000);
                });
            });
        };

        if (!verifying) {
            attemptFlip();
            return;
        }

        // Verification pass: re-read (never re-dispatch blindly) the setting
        // to confirm the flip from last load actually persisted.
        withPreferencesDoc((doc, cleanup) => {
            if (!doc) { cleanup(); giveUp('could not reload preferences document to verify'); return; }
            applyEnglishToLanguageSelect(doc, (result) => {
                cleanup();
                if (result.found && result.value === 'en') {
                    localStorage.removeItem(ATTEMPTS_KEY);
                    console.log('Spotifuck: verified account language is now English');
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
                console.log('Spotifuck: flip did not stick yet, retrying (' + attempts + '/' + MAX_ATTEMPTS + ')');
                attemptFlip();
            }, { readOnly: true });
        });
    }

    /**
     * applyEnglishToLanguageSelect - Read or set the given document's language
     * <select>. In write mode (default) it flips the value to "en" and
     * dispatches a real change event so Spotify's own (React-controlled)
     * handler picks it up - a plain .value assignment gets silently overwritten
     * by React's next render, so this goes through the native property setter
     * first, same trick needed for any React-controlled input. In read-only
     * mode it just reports the current value without touching anything, used
     * to verify a previous flip actually saved.
     * @param {Document} doc - document to operate on (main doc or iframe's)
     * @param {Function} onDone - called once with a single result object:
     *   { found: boolean, value: string|null, changed: boolean }
     *   - found: whether the <select> was located at all
     *   - value: its current value ('en' on success), or null if not found
     *   - changed: true only if this call just dispatched a change (write mode)
     * @param {Object} [options]
     * @param {boolean} [options.readOnly=false] - never modify the select, just report its value
     */
    function applyEnglishToLanguageSelect(doc, onDone, { readOnly = false } = {}) {
        let settled = false;
        const resolve = (result) => {
            if (settled) return; // guards against double-fire (mutation callback racing the timeout)
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

            console.log('Spotifuck: dispatched English change on language selector');
            resolve({ found: true, value: 'en', changed: true });
            return true;
        };

        if (trySelect()) return;

        const win = doc.defaultView || window;
        const startObserving = () => {
            if (trySelect()) return; // may have appeared while we were waiting for <body>
            const observer = new win.MutationObserver(() => {
                if (trySelect()) observer.disconnect();
            });
            observer.observe(doc.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                resolve({ found: false, value: null, changed: false }); // timed out - selector genuinely missing
            }, 12000);
        };

        if (doc.body) {
            // Normal case: iframe 'load' event already guarantees <body> exists.
            startObserving();
        } else {
            // document-start on the /preferences route itself, reached by
            // direct navigation - <body> hasn't been parsed yet. Previously
            // this silently skipped setting up the observer entirely and just
            // timed out doing nothing. Wait for DOMContentLoaded instead.
            doc.addEventListener('DOMContentLoaded', startObserving, { once: true });
        }
    }

    forceEnglish();

    // Note: Class name ".fuckd" used throughout is from original APK source (r0/e.java)
    // It marks elements as "already processed" to prevent duplicate event handlers

    // --- Bottom-nav-driven library overlay state (ported from SpotiKit 7.3.2.fork) ---
    // Replaces the old always-docked-collapsed-to-48x48/expand-to-fixed-fullscreen
    // switchLs(). The sidebar now lives display:none by default (see injectCSS's
    // #Desktop_LeftSidebar_Id rule) and only appears as a full-viewport overlay,
    // toggled by the new #sp-bottom-nav Library tab (see createBottomNav below).
    let sidebarOverlayActive = false;
    let originalHeaderText = null;
    const layoutCache = {
        leftSidebar: null,
        rootContainer: null,
        bottomNav: null
    };

    function getLeftSidebar() {
        if (!layoutCache.leftSidebar || !document.contains(layoutCache.leftSidebar)) {
            layoutCache.leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
        }
        return layoutCache.leftSidebar;
    }

    function getRootContainer() {
        if (!layoutCache.rootContainer || !document.contains(layoutCache.rootContainer)) {
            layoutCache.rootContainer = document.querySelector('.Root__top-container') || document.querySelector('div[data-testid=root]');
        }
        return layoutCache.rootContainer;
    }

    // --- Silent one-time library prewarm ---
    // The sidebar's virtualized list/grid measures its container on mount, but
    // it's sitting at display:none up to that point (see the #Desktop_LeftSidebar_Id
    // CSS rule) - so its actual first real expand always measured a stale
    // zero-size box and rendered broken, only fixing itself once toggled again.
    // Rather than let the user see that broken-then-fixed flash on their first
    // click, this runs the exact same expand/settle/collapse cycle once, fully
    // invisibly (visibility:hidden + pointer-events:none via the .sp-prewarm
    // class, layered on the real [data-overlay="true"] styling so it's laid out
    // identically to a genuine open), before the user ever touches the Library
    // tab. By the time they do click it for real, the container's already been
    // through one real layout pass and renders correctly right away.
    let libraryPrewarmed = false;
    let libraryPrewarmAttempts = 0;
    function prewarmLibrarySidebar() {
        if (libraryPrewarmed) return;
        const leftSidebar = getLeftSidebar();
        if (!leftSidebar) {
            libraryPrewarmAttempts++;
            if (libraryPrewarmAttempts < 100) setTimeout(prewarmLibrarySidebar, 100);
            return;
        }
        libraryPrewarmed = true;

        leftSidebar.classList.add('sp-prewarm');
        leftSidebar.dataset.overlay = 'true';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const list = leftSidebar.querySelector('[role="list"],[role="grid"],div[class*="view-container"]');
                if (list) {
                    list.scrollBy(0, 1);
                    list.scrollBy(0, -1);
                }
                window.dispatchEvent(new Event('resize'));

                setTimeout(() => {
                    delete leftSidebar.dataset.overlay;
                    leftSidebar.classList.remove('sp-prewarm');
                    window.dispatchEvent(new Event('resize'));
                    console.log('#Library: pre-warmed silently - first real open should render correctly now');
                }, 60);
            });
        });
    }

    /**
     * switchLs - Toggle the library sidebar between hidden and a full-screen overlay.
     * Opening/closing mechanics ported from SpotiKit's switchLs (data-overlay attribute
     * + CSS overlay + sessionStorage persistence across SPA navigation); the injected
     * header label text is kept as Spotifuck's original "✖  Close Library".
     * @param {boolean} forceCollapse - If true, force-close regardless of current state
     */
    window.switchLs = function(forceCollapse = false) {
        const leftSidebar = getLeftSidebar();
        if (!leftSidebar) return;

        const rootContainer = getRootContainer();

        if (forceCollapse || sidebarOverlayActive) {
            console.log('#Library: Collapsed');
            delete leftSidebar.dataset.overlay;
            sidebarOverlayActive = false;
            sessionStorage.removeItem('sp_library_open');
            if (rootContainer) {
                rootContainer.style.removeProperty('--left-sidebar-width');
                rootContainer.style.removeProperty('--nav-bar-width');
            }
            const headerH1 = leftSidebar.querySelector('header>div>div:first-child h1');
            if (headerH1 && originalHeaderText !== null) {
                headerH1.textContent = originalHeaderText;
            }
            window.dispatchEvent(new Event('resize'));
        } else {
            console.log('#Library: Expanded');
            leftSidebar.dataset.overlay = 'true';
            sidebarOverlayActive = true;
            sessionStorage.setItem('sp_library_open', 'true');

            if (rootContainer) {
                rootContainer.style.setProperty('--left-sidebar-width', window.innerWidth + 'px');
                rootContainer.style.setProperty('--nav-bar-width', window.innerWidth + 'px');
            }

            const headerH1 = leftSidebar.querySelector('header>div>div:first-child h1');
            if (headerH1) {
                if (originalHeaderText === null) {
                    originalHeaderText = headerH1.textContent;
                }
                // Using textContent for security, then manually adding close icon
                headerH1.textContent = '✖ \u00A0 Close Library';
            }

            const list = leftSidebar.querySelector('[role="list"],[role="grid"],div[class*="view-container"]');
            // The dataset.overlay flip above only just changed this container from
            // display:none to visible - the browser hasn't committed a layout pass
            // for it yet at this point in the same synchronous tick. Spotify's own
            // virtualized library list/grid measures its container on mount, so
            // firing the resize event + scrollBy nudge immediately here has it
            // measure a still-stale (zero-size) box, producing a broken first
            // render that only fixes itself the next time it's toggled. Deferring
            // both to after two animation frames (one for the display change to
            // actually paint, one more margin for the measurement to settle)
            // gives it a real, already-laid-out container to measure instead.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (list) {
                        list.scrollBy(0, 1);
                        list.scrollBy(0, -1);
                    }
                    window.dispatchEvent(new Event('resize'));
                });
            });
        }
        if (typeof updateActiveTab === 'function') updateActiveTab();
    };

    /**
     * closeNowPlay - Close the now-playing right panel if open
     * From r0/e.java line 200: window.closeNowPlay=function(){...}
     */
    window.closeNowPlay = function() {
        const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
        if (panelContainer && panelContainer.parentNode.parentNode.ariaHidden === 'false') {
            console.log('#Close NowPlaying');
            const toggleBtn = panelContainer.parentNode.parentNode.nextElementSibling?.querySelector('button');
            if (toggleBtn) toggleBtn.click();
        }
    };

    // --- Bottom nav bar (Home/Search/Library), ported from SpotiKit 7.3.2.fork ---
    const FALLBACK_SVGS = {
        home: '<svg role="img" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732z"/></svg>',
        search: '<svg role="img" aria-hidden="true" viewBox="0 0 24 24"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.057l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.817c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.279 7.407-7.279s7.407 3.273 7.407 7.279-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.279z"/></svg>',
        library: '<svg role="img" aria-hidden="true" viewBox="0 0 24 24"><path d="M14.5 2.134a1 1 0 0 1 1 0l6 3.464a1 1 0 0 1 .5.866V21a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V3a1 1 0 0 1 .5-.866M16 4.732V20h4V7.041zM3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1m6 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1"/></svg>'
    };

    function createBottomNav() {
        if (document.getElementById('sp-bottom-nav')) return;

        const nav = document.createElement('div');
        nav.id = 'sp-bottom-nav';
        layoutCache.bottomNav = nav;

        const tabs = [
            { name: 'home', label: 'Home' },
            { name: 'search', label: 'Search' },
            { name: 'library', label: 'Library' }
        ];

        const frag = document.createDocumentFragment();
        tabs.forEach(({ name, label }) => {
            const btn = document.createElement('button');
            btn.dataset.tab = name;
            btn.innerHTML = `${FALLBACK_SVGS[name]}<span>${label}</span>`;
            btn.addEventListener('click', () => handleTabClick(name));
            frag.appendChild(btn);
        });

        nav.appendChild(frag);
        const mainView = document.querySelector('.Root__main-view') || document.querySelector('div[data-testid=main-view]') || document.body;
        mainView.appendChild(nav);
        updateActiveTab();
    }

    // Makes sure the native sidebar "Your Library" header button (the one
    // setupLibraryButton wires up inside addCSSJSHack) has our click listener
    // attached, even if firstFuck/addCSSJSHack hasn't run yet by the time the
    // bottom nav's Library tab gets tapped. Mirrors setupLibraryButton's own
    // wiring exactly so there's only ever one listener attached either way.
    function ensureLibButtonWired() {
        const libBtn = document.querySelector('#Desktop_LeftSidebar_Id header button[aria-label*="Your Library"]');
        if (libBtn && !libBtn.classList.contains('fuckd')) {
            window.lBtn = libBtn;
            libBtn.classList.add('fuckd', 'lbtn');
            libBtn.style.padding = '0';
            libBtn.style.height = '20px';
            libBtn.addEventListener('click', function() {
                setTimeout(() => switchLs(), 0);
            });
        }
        return libBtn || window.lBtn || null;
    }

    function handleTabClick(name) {
        if (name === 'library') {
            // Dispatch a real click on the native library button instead of
            // calling switchLs() ourselves directly. That button already has
            // our listener attached (ensureLibButtonWired/setupLibraryButton),
            // which calls switchLs() on click - so clicking it here achieves
            // the same open/close, but through Spotify's actual button element
            // rather than our own CSS-attribute shortcut. Do NOT also call
            // switchLs() here directly - that would fire it twice (once here,
            // once from the button's own listener), instantly undoing whatever
            // it just did. switchLs() with no forceCollapse arg toggles based
            // on the current state, so clicking this same button again while
            // the overlay is open correctly collapses it back.
            const libBtn = ensureLibButtonWired();
            if (libBtn) {
                libBtn.click();
            } else {
                // Sidebar not mounted yet - fall back to our own overlay
                // toggle so the tab still does something.
                switchLs();
            }
            return;
        }

        if (sidebarOverlayActive) switchLs(true);

        if (name === 'search') {
            if (!location.pathname.startsWith('/search')) {
                history.pushState(null, '', '/search');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
            return;
        }

        if (name === 'home') {
            if (location.pathname !== '/') {
                history.pushState(null, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
            return;
        }
    }

    let lastActiveTab = null;
    function updateActiveTab() {
        const path = location.pathname;
        let active = null;
        if (sidebarOverlayActive) active = 'library';
        else if (path === '/' || path === '/home') active = 'home';
        else if (path.startsWith('/search')) active = 'search';
        else if (path.startsWith('/collection')) active = 'library';

        if (active === lastActiveTab) return;
        lastActiveTab = active;

        const nav = layoutCache.bottomNav || document.getElementById('sp-bottom-nav');
        if (!nav) return;
        const buttons = nav.children;
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            btn.classList.toggle('active', btn.dataset.tab === active);
        }
    }

    let lastPath = '';
    function onLocationChange() {
        if (location.pathname === lastPath) return;
        lastPath = location.pathname;
        updateActiveTab();

        if (sessionStorage.getItem('sp_library_open') === 'true' && !sidebarOverlayActive && !location.pathname.startsWith('/collection')) {
            const leftSidebar = getLeftSidebar();
            if (leftSidebar) {
                leftSidebar.dataset.overlay = 'true';
                sidebarOverlayActive = true;
                const rootContainer = getRootContainer();
                if (rootContainer) {
                    rootContainer.style.setProperty('--left-sidebar-width', window.innerWidth + 'px');
                    rootContainer.style.setProperty('--nav-bar-width', window.innerWidth + 'px');
                }
                window.dispatchEvent(new Event('resize'));
                updateActiveTab();
            }
        }
    }

    function hookHistory() {
        const origPush = history.pushState;
        const origReplace = history.replaceState;
        history.pushState = function() {
            origPush.apply(this, arguments);
            onLocationChange();
        };
        history.replaceState = function() {
            origReplace.apply(this, arguments);
            onLocationChange();
        };
        window.addEventListener('popstate', onLocationChange);
    }

    // Collapsed/"minimized" mini-player state doesn't exist here - Spotifuck's
    // playback controls card is always shown expanded. Its real height still
    // varies with content though, so this keeps --sp-np-bar-height in sync via
    // a live ResizeObserver - the main-view clip CSS (injectCSS) subtracts that
    // variable, plus the bottom nav's fixed 56px, from 100dvh.
    let npBarResizeObserver = null;
    function updateNPBarHeightVar() {
        const player = document.querySelector('aside[data-testid=now-playing-bar]');
        if (player) {
            document.documentElement.style.setProperty('--sp-np-bar-height', player.offsetHeight + 'px');
        }
    }
    function setupNPBarHeightSync() {
        const player = document.querySelector('aside[data-testid=now-playing-bar]');
        if (!player) return;
        updateNPBarHeightVar();
        if (!npBarResizeObserver && typeof ResizeObserver !== 'undefined') {
            npBarResizeObserver = new ResizeObserver(() => updateNPBarHeightVar());
            npBarResizeObserver.observe(player);
        }
        if (!player.dataset.heightSyncReady) {
            player.dataset.heightSyncReady = '1';
            window.addEventListener('resize', updateNPBarHeightVar);
        }
    }

    /**
     * firstFuck - Main initialization and monitoring loop
     * From r0/e.java line 178: window.firstFuck=function(){...}
     */
    window.firstFuck = function() {
        if (pfint) clearInterval(pfint);

        pfint = setInterval(() => {
            // Find and setup play button
            const playBtn = document.querySelector('aside button[data-testid=control-button-playpause]:not(.fuckd)');
            if (playBtn) {
                console.log('#pBtn fuckd');
                playBtn.classList.add('fuckd');
                window.pBtn = playBtn;

                // Add click handler
                window.pBtn.addEventListener('click', () => {
                    console.log('PlayClicked');
                    if (window.pBtn && window.pBtn.getAttribute('aria-label') !== 'Play') {
                        console.log('Pause Req');
                        ulFlag = false;
                    } else if (!ulFlag) {
                        console.log('Play Req');
                        ulFlag = true;
                        setTimeout(() => {
                            console.log('Unlocker Timeout Reached');
                            // Add null check for pBtn in timeout callback
                            if (window.pBtn && ulFlag && window.pBtn.getAttribute('aria-label') === 'Play') {
                                console.log('#Unlocking!');
                                ulFlag = false;
                            } else if (ulFlag) {
                                console.log('Playing, Removing Unlocker');
                                ulFlag = false;
                            }
                        }, 10000);
                    }
                });

                // First initialization
                if (!ffDone) {
                    ffDone = true;
                    console.log('FirstFuck Adding All Features');
                    addCSSJSHack();
                }
            }
        }, 5000);
    };

    /**
     * addCSSJSHack - Add CSS modifications and event listeners
     * From r0/e.java line 200: window.addCSSJSHack=function(){...}
     */
    window.addCSSJSHack = function() {
        // Setup library button once
        const setupLibraryButton = () => {
            // Use aria-label to identify the correct library button (not back button)
            // Library button has aria-label containing "Your Library" (either "Open Your Library" or "Collapse Your Library")
            // Back button has aria-label="Go back" which doesn't contain "Your Library"
            const libBtn = document.querySelector('#Desktop_LeftSidebar_Id header button[aria-label*="Your Library"]:not(.fuckd)');

            if (libBtn && !libBtn.classList.contains('fuckd')) {
                console.log('LibBtnFuckd');
                window.lBtn = libBtn;
                libBtn.classList.add('fuckd', 'lbtn');
                libBtn.style.padding = '0';
                libBtn.style.height = '20px';
                libBtn.addEventListener('click', function() {
                    setTimeout(() => switchLs(), 0);
                });

                // No startup auto-collapse here anymore: the sidebar is display:none
                // by default (see injectCSS), so there's no docked-48x48 state left
                // to force it back into - it simply stays hidden until switchLs()
                // opens it as the full overlay.
            }
        };

        // Setup library grid click handler once
        const setupLibraryGrid = () => {
            const libGrid = document.querySelector('#Desktop_LeftSidebar_Id div[role=grid]:not(.fuckd)');
            if (libGrid) {
                libGrid.classList.add('fuckd');

                libGrid.addEventListener('click', (event) => {
                    // Check if clicked element or its parent is a folder
                    let target = event.target;
                    let isFolder = false;

                    // Traverse up to 5 levels to find the button element
                    for (let i = 0; i < 5 && target; i++) {
                        // Check aria-labelledby for :folder: pattern (verified from Spotify DOM)
                        const ariaLabelledBy = target.getAttribute('aria-labelledby');
                        if (ariaLabelledBy && ariaLabelledBy.includes(':folder:')) {
                            isFolder = true;
                            console.log('Folder clicked (aria-labelledby contains ":folder:"), keeping library open');
                            break;
                        }

                        // Check aria-describedby for :folder: pattern
                        const ariaDescribedBy = target.getAttribute('aria-describedby');
                        if (ariaDescribedBy && ariaDescribedBy.includes(':folder:')) {
                            isFolder = true;
                            console.log('Folder clicked (aria-describedby contains ":folder:"), keeping library open');
                            break;
                        }

                        target = target.parentElement;
                    }

                    // Only auto-close library if it's NOT a folder
                    if (!isFolder) {
                        console.log('AutoCloseLib (playlist/item clicked)');
                        // Add delay to allow Spotify's navigation to complete first
                        // IMPORTANT: Use switchLs(true) for direct CSS collapse, NOT lBtn.click()
                        // Clicking lBtn inside folders triggers "back" navigation which cancels playlist navigation
                        setTimeout(() => {
                            switchLs(true);  // Direct collapse without clicking button
                            closeNowPlay();
                        }, 150);  // 150ms allows playlist navigation to initiate
                    }
                });
            }
        };

        // Setup home button once
        const setupHomeButton = () => {
            const homeBtn = document.querySelector('#global-nav-bar button[data-testid=home-button]:not(.fuckd)');
            if (homeBtn) {
                homeBtn.classList.add('fuckd');
                homeBtn.addEventListener('click', () => { closeNowPlay(); });
            }
        };

        // Setup search input once
        const setupSearchInput = () => {
            const searchInput = document.querySelector('input[data-testid=search-input]:not(.fuckd)');
            if (searchInput) {
                searchInput.classList.add('fuckd');
                searchInput.addEventListener('focus', () => {
                    const npBar = document.querySelector('aside[data-testid=now-playing-bar]');
                    if (npBar) npBar.style.display = 'none';
                    closeNowPlay();
                });
                searchInput.addEventListener('blur', () => {
                    const npBar = document.querySelector('aside[data-testid=now-playing-bar]');
                    if (npBar) npBar.style.display = 'flex';
                });
            }
        };

        // Setup user button once
        const setupUserButton = () => {
            const userBtn = document.querySelector('button[data-testid=user-widget-link]:not(.fuckd)');
            if (userBtn) {
                userBtn.classList.add('fuckd');
                userBtn.addEventListener('click', () => { closeNowPlay(); });
            }
        };

        // Try to setup all elements immediately
        setupLibraryButton();
        setupLibraryGrid();
        setupHomeButton();
        setupSearchInput();
        setupUserButton();
        setupNPBarHeightSync();

        // Use a short retry mechanism for elements that might not be ready yet
        // Check once more after 2 seconds for any missed elements
        setTimeout(() => {
            setupLibraryButton();
            setupLibraryGrid();
            setupHomeButton();
            setupSearchInput();
            setupUserButton();
            setupNPBarHeightSync();
        }, 2000);
    };

    /**
     * Inject CSS styles from APK
     * From r0/e.java line 204: let st=document.createElement('style');st.textContent='...'
     */
    function injectCSS() {
        const style = document.createElement('style');
        // CSS content from r0/e.java (line 204)
        style.textContent = `
body{min-width:100%!important;min-height:100%!important}
.os-scrollbar{--os-size:6px!important}
.contentSpacing{padding:0}
div[data-testid=root]{--panel-gap:0!important}
#main-view+div,#main-view+div>div{overflow:hidden!important;width:auto}
#main-view+div>div>div>div:nth-child(2)>div{width:100vw!important}
div[data-encore-id=banner],#global-nav-bar>div:first-of-type,#global-nav-bar a[href="/download"],button[data-testid=fullscreen-mode-button],div.main-view-container__mh-footer-container{display:none!important}
section[data-testid=artist-page]>div>div:first-child:not([data-encore-id]){height:25vh}
div[data-testid=tracklist-row]{padding:0 10px 0 0;grid-gap:0}
div[data-testid=tracklist-row] button:not([data-testid=add-to-playlist-button]){transform:scale(1.3)!important;opacity:0.6!important}
div[data-testid=tracklist-row] button:hover{color:#2d6!important}
div[data-testid=tracklist-row]>div:first-child>div:first-child{height:24px;min-height:24px;min-width:24px;margin:0 8px!important}
[aria-colcount="3"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,4fr)) [last] minmax(82px,var(--col2,1fr))!important}
[aria-colcount="4"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,4fr)) [var1] minmax(120px,var(--col2,2fr)) [last] minmax(82px,var(--col3,1fr))!important}
[aria-colcount="5"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,6fr)) [var1] minmax(120px,var(--col2,4fr)) [var2] minmax(120px,var(--col3,3fr)) [last] minmax(82px,var(--col4,1fr))!important}
section[data-testid=track-page]>div.contentSpacing>div:nth-child(2) [aria-colcount="2"] div[data-testid=tracklist-row]{grid-template-columns:[first] minmax(120px,var(--col0,4fr)) [last] minmax(82px,var(--col1,1fr))!important}
section[data-testid=track-page]>div.contentSpacing>div:nth-child(2) [aria-colcount="3"] div[data-testid=tracklist-row]{grid-template-columns:[first] minmax(120px,var(--col0,4fr)) [var1] minmax(120px,var(--col1,2fr)) [last] minmax(82px,var(--col2,1fr))!important}
*{--content-spacing:10px}
section[data-testid=home-page] .contentSpacing{padding:0 10px!important;overflow:hidden}
div[data-testid=grid-container]{margin-inline:0!important;column-gap:0!important;overflow:hidden!important}
div[data-testid=action-bar-row],div[data-testid=topbar-content]{padding:5px 10px}
div[data-testid=track-list]>div:first-child,div[data-testid=playlist-tracklist]>div:first-child{margin:0!important;padding:0!important}
main>section:not([data-testid=artist-page])>div:first-child{height:auto!important;min-height:auto!important;padding:10px}
section[data-testid=track-page]>div>div.contentSpacing>div:last-child{overflow:hidden}
section[data-testid=artist-page]>div>div:first-child>div.contentSpacing{padding:10px}
section[data-testid=artist-page] div[data-testid=grid-container] h2,section[data-testid=artist-page] section[data-testid=component-shelf]{padding:0 10px}
main>section h1.encore-text-headline-large{font-size:22px!important}
section[data-testid=artist-page] span.encore-text-headline-large{font-size:26px!important}
section[data-testid=track-page] h1{font-size:20px!important}
aside[data-testid=now-playing-bar]{min-width:100%!important;box-shadow:0 0 6px #440000;background:linear-gradient(to bottom,#770000,#330000)!important}
aside[data-testid=now-playing-bar]>div:first-child{margin-top:2px;flex-direction:column!important;height:auto!important}
aside[data-testid=now-playing-bar]>div>div{width:100%!important}
aside[data-testid=now-playing-bar]>div>div:last-child>div{min-height:32px;margin:5px 10px}
aside[data-testid=now-playing-bar]>div>div:last-child button{transform:scale(1.15);margin:0 5px}
div[data-testid=general-controls]{margin:15px 0 25px}
div[data-testid=general-controls] button{transform:scale(1.4)!important;margin:0 8px!important}
div[data-testid=player-controls]{margin:5px 0}
div[data-testid=now-playing-widget]{justify-content:center;overflow:hidden}
form[role=search]{z-index:10;margin-left:48px;max-width:88%}
div[data-testid=now-playing-widget]>div:last-child>button{transform:scale(1.3)}
div[data-testid=now-playing-widget]>div:first-child{display:none!important}
div[data-testid=now-playing-widget]>div:nth-child(2){display:flex!important;overflow:hidden!important}
div[data-testid=now-playing-widget]>div:nth-child(2) span{font-size:13px!important;height:20px!important;margin:0!important}
div[data-testid=now-playing-widget]>div:nth-child(2)>div{min-width:auto;max-width:66%}
[data-tippy-root]{overflow:hidden!important}
[data-tippy-root],[data-tippy-root] *{transition:none!important;transform:none!important}
div[data-testid=hover-or-focus-tooltip],#Desktop_LeftSidebar_Id header>div>div:last-child{display:none!important}
#Desktop_LeftSidebar_Id>nav>div{min-height:48px;border-radius:25px}
.YourLibraryX{overflow:hidden;background:var(--background-elevated-base)!important}
.YourLibraryX header{padding:14px}
        `;
        document.head.appendChild(style);

        // AMOLED pure black mode (from r0/e.java line 207)
        const amoled = document.createElement('style');
        amoled.textContent = `
.encore-dark-theme{--background-base:#000;--background-highlight:#000;--background-elevated-base:#000;--background-elevated-highlight:#000;--background-elevated-press:#000;--background-tinted-base:#000}
aside[data-testid=now-playing-bar]{background:#000!important;box-shadow:none;border-top:1px solid #666}
        `;
        document.head.appendChild(amoled);

        // --- Bottom nav bar + library-overlay layout (ported from SpotiKit 7.3.2.fork) ---
        const bottomNavLayout = document.createElement('style');
        bottomNavLayout.textContent = `
.Root__top-container{grid-template-columns:auto 1fr auto!important}

/* Sidebar is reached only through the bottom nav's Library tab now - hidden by
   default, full-viewport overlay once switchLs() sets data-overlay="true". */
#Desktop_LeftSidebar_Id{
  display:none!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"]{
  cursor:default!important;
  pointer-events:auto!important;
  width:100vw!important;
  min-width:100vw!important;
  max-width:100vw!important;
  height:100vh!important;
  bottom:0!important;
  left:0!important;
  border-radius:0!important;
  background:#121212!important;
  backdrop-filter:none!important;
  -webkit-backdrop-filter:none!important;
  border:none!important;
  box-shadow:none!important;
  z-index:999!important;
  display:flex!important;
  flex-direction:column!important;
  overflow:hidden!important
}
/* Silent-prewarm pass (see prewarmLibrarySidebar): same [data-overlay="true"]
   layout as a real open, laid out identically, but invisible and inert - so
   the very first time the user actually opens it, it's already had a real
   layout/measure pass and renders correctly instead of broken. */
#Desktop_LeftSidebar_Id.sp-prewarm[data-overlay="true"]{
  visibility:hidden!important;
  pointer-events:none!important;
}
#Desktop_LeftSidebar_Id[data-overlay="true"]>*{
  pointer-events:auto!important;
  width:100vw!important;
  min-width:100vw!important;
  max-width:100vw!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] .YourLibraryX,
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="YourLibraryX"]{
  width:100vw!important;
  min-width:100vw!important;
  max-width:100vw!important;
  background:transparent!important;
  height:100%!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] nav{width:100vw!important;max-width:100vw!important}
#Desktop_LeftSidebar_Id[data-overlay="true"] header button[aria-label*="Create"]{
  position:absolute!important;
  top:14px!important;
  right:14px!important;
  width:36px!important;
  height:36px!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] [data-testid="resize-bar"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="ResizeBar"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="resize-bar"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="Resizer"]{
  display:none!important;
  width:0!important;
  pointer-events:none!important
}
[data-testid="resize-bar"],[class*="ResizeBar"]{display:none!important}
#Desktop_LeftSidebar_Id[data-overlay="true"] [data-overlayscrollbars-viewport],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="os-viewport"],
#Desktop_LeftSidebar_Id[data-overlay="true"] div[role="grid"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [data-testid="LibraryRoot"]{padding-bottom:80px!important}

/* Nothing here is taken out of grid flow, so nothing needs its height measured
   or subtracted at this level - .Root__main-view becomes a column flexbox and
   its normal-flow children (the real page content) share the flexible space,
   scrolling internally, while #sp-bottom-nav (fixed, see below) reserves its
   own space via the height calc on the actual scroll container. */
.Root__main-view,
div[data-testid=main-view],
#main-view{
  display:flex!important;
  flex-direction:column!important;
  min-height:0!important;
  overflow:hidden!important;
}

/* clip the real scroll container itself so it stops above the player + nav
   instead of scrolling on behind them */
div[data-testid=main-view],
#main-view{
  height:calc(100dvh - var(--sp-np-bar-height, 0px) - 56px)!important;
  max-height:calc(100dvh - var(--sp-np-bar-height, 0px) - 56px)!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  padding-bottom:0!important;
}
@supports not (height: 100dvh) {
  div[data-testid=main-view],
  #main-view{
    height:calc(100vh - var(--sp-np-bar-height, 0px) - 56px)!important;
    max-height:calc(100vh - var(--sp-np-bar-height, 0px) - 56px)!important;
  }
}

#sp-bottom-nav{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  width:100%!important;
  height:56px;
  background:#000!important;
  border:none!important;
  border-top:1px solid #666!important;
  box-shadow:none!important;
  display:flex;
  align-items:center;
  justify-content:space-around;
  padding:0 8px;
  z-index:9999!important;
  contain:layout style paint
}
#sp-bottom-nav button{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:2px;
  background:none!important;
  border:none;
  color:#b3b3b3;
  cursor:pointer;
  padding:4px 0;
  transition:color 0.15s;
  height:100%
}
#sp-bottom-nav button.active{color:#fff}
#sp-bottom-nav button svg{width:24px;height:24px;fill:currentColor}
#sp-bottom-nav button span{font-size:10px;letter-spacing:0.5px}

/* Player position only - colors/layout above (background, box-shadow, border,
   control scaling, etc.) are untouched Spotifuck styling. It now sits fixed,
   directly above the new bottom nav, instead of in normal document flow. */
aside[data-testid=now-playing-bar]{
  margin:0!important;
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:56px!important;
  z-index:9998!important;
  border-radius:0!important;
  max-height:40vh!important;
  overflow-y:auto!important;
  contain:layout style paint
}
        `;
        document.head.appendChild(bottomNavLayout);

        console.log('#CSS Injected');
    }

    // Initialize immediately
    if (HOST_IS_OPEN) {
        injectCSS();
        firstFuck();

        // Bottom nav bar init - independent of firstFuck's playBtn-gated pass,
        // so Home/Search/Library are available as soon as the body exists,
        // same as SpotiKit. Also clears any stale library-open flag from a
        // previous tab/session before onLocationChange can act on it.
        sessionStorage.removeItem('sp_library_open');
        const waitForBottomNavBody = setInterval(() => {
            if (document.body) {
                clearInterval(waitForBottomNavBody);
                lastPath = location.pathname;
                createBottomNav();
                hookHistory();
                prewarmLibrarySidebar();
            }
        }, 100);
    }

    // Add cleanup on page unload to prevent memory leaks
    window.addEventListener('beforeunload', () => {
        if (pfint) {
            clearInterval(pfint);
            pfint = null;
        }
        console.log('#Cleanup: Interval cleared');
    });

    console.log('🚀 Spotifuck v6 Ready (APK v1.6.4 Port)');

    // --- Visual premium spoof & payment-page takeovers (ported from Myst1cX/SpotiwebJS.js, v7.0.fork)
    const PINK = '#FFD2D7';
    const GREEN = '#1ed760';
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
        const key = `${selector}\u0000${from}\u0000${to}`;
        const existing = replacementLog.get(key);
        if (existing) existing.times_applied++;
        else replacementLog.set(key, { selector, old_text: from, new_text: to, times_applied: 1 });
    }
    function printReplacementLog() {
        if (replacementLog.size === 0) {
            console.log('[Spotifuck] Nothing has been replaced yet.');
            return;
        }
        console.log(`[Spotifuck] ${replacementLog.size} distinct change(s) made so far:`);
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
        if (c) node.nodeValue = v;
    }
    function scanText(root) {
        if (!root) return;
        const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while (n = w.nextNode()) applyReplacements(n);
    }

    function runPremium() {
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
                el.onclick = e => { e.preventDefault(); e.stopPropagation(); };
            }

            if (/^(explore|view)\s*plans/.test(t)) {
                logChange('a, button, [role="button"]', orig, 'Manage plan');
                el.textContent = 'Manage plan';
                el.style.cssText += `background:transparent!important;color:#fff!important;border:1px solid #727272!important;border-radius:20px!important;font-weight:700!important;pointer-events:none!important;cursor:default!important;`;
                el.onclick = e => { e.preventDefault(); e.stopPropagation(); };
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
                if (!t || t === '\u2014' || t === '-' || t === 'no' || /free/.test(t)) {
                    logChange('table td, th', t || '(empty)', '\u2713');
                    cell.innerHTML = `<span style="color:${GREEN};font-weight:700;">\u2713</span>`;
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
            const nd = planesXpath.snapshotItem(i);
            if (nd && nd.nodeType === 1 && !nd.dataset.spDone) {
                logChange('(xpath) Premium Plans text', nd.textContent.trim(), '(hidden)');
                nd.style.display = 'none';
                nd.dataset.spDone = '1';
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
                window.location.href = 'https://www.spotify.com/us/account/profile/';
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
                window.location.href = 'https://www.spotify.com/us/account/saved-payment-cards/';
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
            document.querySelectorAll('form, button[type="submit"], [data-testid*="pay"], [data-testid*="checkout"]').forEach(el => {
                el.onclick = e => { e.preventDefault(); e.stopPropagation(); };
            });
        }
    }

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

    let premTimer;
    let pendingNodes = new Set();
    let pendingTextNodes = new Set();
    let premiumObserver = null;

    function handlePremiumMutations(mutations) {
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
        clearTimeout(premTimer);
        premTimer = setTimeout(() => {
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

    function startPremiumObserver() {
        if (premiumObserver) premiumObserver.disconnect();
        premiumObserver = new MutationObserver(handlePremiumMutations);
        premiumObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }
    startPremiumObserver();

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('\ud83d\udccb Show everything replaced so far (console)', () => {
            printReplacementLog();
            alert('Current text replacements have been logged to the console. Open DevTools (Press F12 or Right click and Inspect), then select the Logs tab under Console to view it.');
        });
    }

    // --- Ad-slot banner removal (ported from SpotiwebJS.user.js's second IIFE, v7.0.fork) ---
    // Real DOM removal of ad-banner containers on the free/ad-supported tier -
    // this is ordinary ad-block behavior (comparable to a standard ad-blocker
    // filter rule), not a premium-entitlement bypass: it can't touch anything
    // server-enforced like bitrate, offline downloads, or skip limits.
    // Scoped to open.spotify.com (where the web player's ad slots actually
    // render) and gated by the same open.spotify.com toggle as the rest of
    // the spoof, since it ships bundled with it in the source.
    if (HOST_IS_OPEN) {
        const removeAdElements = () => {
            if (!premiumSpoofEnabledHere()) return;
            document.querySelectorAll('[data-testid="ad-slot-container"], [class*="ad-"]').forEach(el => el.remove());
            document.querySelectorAll('.ButtonInner-sc-14ud5tc-0.fcsOIN').forEach(el => el.remove());
        };
        const adObserver = new MutationObserver(removeAdElements);
        adObserver.observe(document.body, { childList: true, subtree: true });
        window.addEventListener('beforeunload', () => adObserver.disconnect());
    }
})();
