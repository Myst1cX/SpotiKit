// ==UserScript==
// @name         SpotiKit++ desktop (old, archived version)
// @namespace    https://github.com/Myst1cX/SpotiKit
// @version      7.0.fork
// @description  SpotiKit (old npv function - archived version) — visual premium UI overlay for Spotify and ad banner blocking
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
// @run-at       document-idle
// @homepageURL  https://github.com/Myst1cX/SpotiKit
// @supportURL   https://github.com/Myst1cX/SpotiKit/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiWebJS-archived.user.js.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiWebJS-archived.user.js.js
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
// Ported the Now Playing View (NPV) hiding block (open.spotify.com only) 
// from spotify-web-lyrics-plus userscript, version 17.46. 
// This is just a hotfix since that script has been refactored to a different NPV approach. (
// The web version will eventually receive it aswell. Now I am doing further testing
// The method I just ported collapses the native `.zjCIcN96KsMfWwRo` right-side panel 
// container to zero width specifically when it's showing NPV (matched via
// aria-label="Now playing view" or a .NowPlayingView class, so Queue and
// Connect to a Device - which share the same container - are left alone),
// and hides Spotify's own native "Show Now Playing view" toggle button
// (`.wJiY1vDfuci2a4db`) so it's not left as a stray clickable/draggable
// element. Both are hardcoded hashed classes rather than stable
// aria-label-based selectors, so may need updating if Spotify changes its
// CSS-in-JS build. NPV's DOM stays fully present (not removed) - only
// visually collapsed - so it's still accessible to JS for track info/
// lyrics fetching (was once needed for Spotify provider but not anymore).

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
        if (existing) {
            existing.times_applied++;
        } else {
            replacementLog.set(key, { selector, old_text: from, new_text: to, times_applied: 1 });
        }
    }

    function printReplacementLog() {
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
        if (c) node.nodeValue = v;
    }

    function scanText(root) {
        if (!root) return;
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
    function forceEnglish() {
        try {
            Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
        } catch (e) {}

        if (location.hostname === 'www.spotify.com') {
            const ENGLISH_REGIONS = ['us', 'gb', 'ca', 'au', 'ie', 'nz'];
            const m = location.pathname.match(/^\/([a-z]{2})(\/.*)?$/i);
            if (m && !ENGLISH_REGIONS.includes(m[1].toLowerCase())) {
                location.replace(location.origin + '/us' + (m[2] || '/') + location.search + location.hash);
                return;
            }
        }

        if (location.hostname === 'open.spotify.com') {
            const m2 = location.pathname.match(/^\/intl-([a-z]{2})(\/.*)?$/i);
            if (m2 && m2[1].toLowerCase() !== 'en') {
                location.replace(location.origin + (m2[2] || '/') + location.search + location.hash);
                return;
            }
            forceEnglishAccountSetting();
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
                    console.log('SpotiwebJS: could not access preferences iframe', e);
                    cleanup();
                    fire(null, cleanup);
                }
            });

            setTimeout(() => { cleanup(); fire(null, cleanup); }, 15000);
        };

        const giveUp = (reason) => {
            console.log('SpotiwebJS: ' + reason + ' - not retrying automatically');
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
                        console.log('SpotiwebJS: account language already English - no reload needed');
                        return;
                    }
                    localStorage.setItem(PENDING_KEY, 'true');
                    console.log('SpotiwebJS: dispatched English change - reloading to verify it saved');
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
                    console.log('SpotiwebJS: verified account language is now English');
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
                console.log('SpotiwebJS: flip did not stick yet, retrying (' + attempts + '/' + MAX_ATTEMPTS + ')');
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

            console.log('SpotiwebJS: dispatched English change on language selector');
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

    function run() {
        const b = document.body;
        if (!b) return;

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

    forceEnglish();

    // Single gated entry point: both the timed passes below and the mutation
    // observer funnel through this so premiumSpoofEnabledHere() is the one
    // switch that turns the whole spoof pass on/off for the current host.
    function premiumPass(changedRoot) {
        if (!premiumSpoofEnabledHere()) return;
        if (changedRoot) scanText(changedRoot);
        else scanText(document.body);
        run();
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
            if (pendingNodes.size > 0 && pendingNodes.size <= 20) {
                pendingNodes.forEach(node => scanText(node));
            } else if (pendingNodes.size > 20) {
                scanText(document.body);
            }
            pendingNodes.clear();
            pendingTextNodes.forEach(node => applyReplacements(node));
            pendingTextNodes.clear();
            run();
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
    }

    startObserver();

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('📋 Show everything replaced so far (console)', () => {
            printReplacementLog();
            alert('Current text replacements have been logged to the console. Open DevTools (Press F12 or Right click and Inspect), then select the Logs tab under Console to view it.');
        });
    }
})();


(function() {
    'use strict';

    const removeElements = selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    };

    const observer = new MutationObserver(() => {
        if (!premiumSpoofEnabledHere()) return;
        removeElements('[data-testid="ad-slot-container"], [class*="ad-"]');
        removeElements('.ButtonInner-sc-14ud5tc-0.fcsOIN');
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    window.addEventListener('beforeunload', () => {
        observer.disconnect();
    });
})();

if (HOST_IS_OPEN) {
    /* NowPlayingView logic: Using the original `.zjCIcN96KsMfWwRo` container approach.
        The `.zjCIcN96KsMfWwRo` is the panel where NPV, Queue, and Connect a device are all displayed after clicking their respective buttons.
        We apply the hiding style ONLY when .zjCIcN96KsMfWwRo contains NowPlayingView (identified by aria-label="Now playing view" or .NowPlayingView class).
        This ensures Queue and Connect modals remain unaffected while NowPlayingView is hidden.
        The container is collapsed to zero width, allowing the rest of the UI to expand and fill the area.
        NowPlayingView and its DOM structure remain fully accessible to JavaScript for track information and lyrics fetching (ProviderSpotify needs it).
    */
    const styleId = 'lyricsplus-hide-npv-style';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .zjCIcN96KsMfWwRo:has([aria-label="Now playing view"]),
            .zjCIcN96KsMfWwRo:has(.NowPlayingView) {
                min-width: 0 !important;
                max-width: 0 !important;
                flex-basis: 0 !important;
                overflow: hidden !important;
            }
            .wJiY1vDfuci2a4db { /* The "Show Now Playing view" button */
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}
