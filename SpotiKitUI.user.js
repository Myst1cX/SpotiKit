// ==UserScript==
// @name         SpotiKitUI maybe
// @namespace    https://github.com/Myst1cX/SpotiKit
// @version      7.3.2.fork
// @description  Mobile-like layout for Spotify Web, plus visual premium spoof & ad-slot removal
// @author       kitbodega, Myst1cX (fork)
// @icon         https://i.ibb.co/YF1nLPfK/2eca7229-ca6a-4ad6-8653-b80a6a0f8586.png
// @match        https://open.spotify.com/*
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
// @homepageURL  https://github.com/Myst1cX/SpotiKit
// @supportURL   https://github.com/Myst1cX/SpotiKit/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitUI.user.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitUI.user.js
// ==/UserScript==

// RESOLVED (7.3.2.fork, Myst1cX):

// First batch:
// Restored extra features from the MobileDesktop 7.3.1.fork: the visual premium spoof (badge/text relabeling,
// replaced-text logging, forced-English locale spoof) and the account/payments-site blockers & redirects

// Second batch:
// Ported spotifuck's AMOLED playback-controls styling (pure #000 background, column-stacked
// general-controls/player-controls rows, its button scale/margin values) onto SpotiKit's
// floating player card.

// Third batch:
// Removed the collapsed/"minimized" mini-player state entirely - the playback controls card
// is now always shown expanded, matching spotifuck.

// Fourth batch:
// Fixed the main scrollable view (homepage, lyrics, etc.) rendering all the way down behind
// the bottom nav bar and playback controls instead of stopping above them. Root cause: making
// the now-playing-bar and #sp-bottom-nav position:fixed takes them out of the Root__top-container
// grid, so the grid row they used to occupy collapses and the main-view row (1fr) silently
// expands to fill the freed space - main-view's box became full-viewport-tall regardless of
// what was in it. The previous attempted fix added padding-bottom to main-view sized to the
// controls' measured height; that only added extra scrollable space at the end of the content,
// it never actually shrank main-view's own box, so the container kept extending (and painting/
// scrolling) behind the fixed controls exactly as before - just with more scroll room past the
// point it should've stopped. That padding-bottom rule has been removed and replaced with an
// explicit height/max-height clip (100vh minus the nav bar and the controls' live-measured
// height, still tracked via the existing --sp-np-bar-height ResizeObserver) plus overflow-y:auto,
// so the container's actual box now ends above the controls instead of merely scrolling further
// inside an oversized one. spotifuck doesn't need any of this because it never takes the player
// out of grid flow (no position:fixed on the aside, no extra fixed bottom nav), so its grid
// naturally keeps reserving the right amount of space with zero JS/CSS workarounds.

(function() {
    'use strict';

    const PINK = '#FFD2D7';
    const GREEN = '#1ed760';

    // --- Per-site visual premium spoof toggles ---
    const SPOOF_OPEN_KEY = 'spotikitPremSpoofOpen';
    const SPOOF_WWW_KEY = 'spotikitPremSpoofWWW';
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
            (getFlag(SPOOF_OPEN_KEY) ? '\u2705' : '\u274c') + ' Visual Premium Spoof (open.spotify.com)',
            () => { setFlag(SPOOF_OPEN_KEY, !getFlag(SPOOF_OPEN_KEY)); location.reload(); }
        );
        GM_registerMenuCommand(
            (getFlag(SPOOF_WWW_KEY) ? '\u2705' : '\u274c') + ' Visual Premium Spoof (www.spotify.com)',
            () => { setFlag(SPOOF_WWW_KEY, !getFlag(SPOOF_WWW_KEY)); location.reload(); }
        );
    }

    function forceEnglish() {
        try {
            Object.defineProperty(navigator, 'language', { get: () => 'en-US', configurable: true });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'], configurable: true });
        } catch (e) {}

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
            return;
        }

        forceEnglishAccountSetting();
    }

    function forceEnglishAccountSetting() {
        const PENDING_KEY = 'spotikitEnglishFlipPending';
        const ATTEMPTS_KEY = 'spotikitEnglishFlipAttempts';
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
                    cleanup();
                    fire(null, cleanup);
                }
            });

            setTimeout(() => { cleanup(); fire(null, cleanup); }, 15000);
        };

        const giveUp = () => {};

        const attemptFlip = () => {
            withPreferencesDoc((doc, cleanup) => {
                if (!doc) { cleanup(); giveUp(); return; }
                applyEnglishToLanguageSelect(doc, (result) => {
                    if (!result.found) {
                        cleanup();
                        giveUp();
                        return;
                    }
                    if (!result.changed) {
                        cleanup();
                        localStorage.removeItem(ATTEMPTS_KEY);
                        return;
                    }
                    localStorage.setItem(PENDING_KEY, 'true');
                    setTimeout(() => { cleanup(); location.reload(); }, 1000);
                });
            });
        };

        if (!verifying) {
            attemptFlip();
            return;
        }

        withPreferencesDoc((doc, cleanup) => {
            if (!doc) { cleanup(); giveUp(); return; }
            applyEnglishToLanguageSelect(doc, (result) => {
                cleanup();
                if (result.found && result.value === 'en') {
                    localStorage.removeItem(ATTEMPTS_KEY);
                    return;
                }
                if (!result.found) {
                    giveUp();
                    return;
                }
                const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
                if (attempts >= MAX_ATTEMPTS) {
                    giveUp();
                    return;
                }
                localStorage.setItem(ATTEMPTS_KEY, String(attempts));
                attemptFlip();
            }, { readOnly: true });
        });
    }

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

    forceEnglish();

    // --- Visual premium spoof: badge/text relabeling + replaced-text logging ---
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
        if (existing) existing.times_applied++;
        else replacementLog.set(key, { selector, old_text: from, new_text: to, times_applied: 1 });
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
            const logo = document.createElement('span');
            logo.className = '__sp_logo';
            logo.style.cssText = 'position:absolute;top:8px;right:8px;width:24px;height:24px;z-index:10;pointer-events:none;display:flex;align-items:center;justify-content:center;background:#FFD2D7;border-radius:50%;font-size:12px;font-weight:700;color:#000;';
            logo.textContent = 'SP';
            planCard.appendChild(logo);
            const msg = document.createElement('p');
            msg.textContent = 'Your Premium Individual NEVER expires. Dont pay Spotify, fuck their monopoly!';
            msg.style.cssText = 'color:#B3B3B3;font-size:14px;margin:8px 0;text-align:left;line-height:1.4;padding:0 4px;';
            const btnRow = planCard.querySelector('[class*="dCZPlm"]');
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
        const DESKTOP_SELECTORS = [
            '[data-testid="open-in-app-button"]',
            '[data-testid="install-app-button"]',
            '[data-testid="download-button"]',
            '[aria-label*="open in app"]',
            '[aria-label*="install app"]',
            '[aria-label*="download app"]',
            '[class*="open-in-app"]',
            '[class*="install-app"]',
            '[class*="get-the-app"]',
            '[class*="view-in-app"]',
            '[class*="desktop-app"]',
        ];
        DESKTOP_SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => el.style.display = 'none');
        });
        document.querySelectorAll('a, button, [role="button"]').forEach(el => {
            const t = (el.textContent || '').trim().toLowerCase();
            if (/open (in|the) (app|desktop|spotify)|install|download (the )?app|get the app|launch|listen in app|listen on desktop|use (the )?(app|desktop)/.test(t)) {
                el.style.display = 'none';
            }
        });
        const premiumBanner = document.querySelector('[data-testid="compact-banner"]');
        if (premiumBanner) {
            const wrapper = premiumBanner.closest('[class*="dad329a7"]');
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
            window.location.replace('https://open.spotify.com/');
        }
        if (window.location.hostname === 'payments.spotify.com' && !document.querySelector('.__sp_pay_done')) {
            window.location.replace('https://open.spotify.com/');
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
    setTimeout(() => premiumPass(document.body), 2000);

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
    if (document.body) {
        startPremiumObserver();
    } else {
        document.addEventListener('DOMContentLoaded', startPremiumObserver, { once: true });
    }

    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('\ud83d\udccb Show everything replaced so far (console)', () => {
            printReplacementLog();
            alert('Current text replacements have been logged to the console. Open DevTools (Press F12 or Right click and Inspect), then select the Logs tab under Console to view it.');
        });
    }

    // --- Mobile-like layout (open.spotify.com only) ---
    if (!HOST_IS_OPEN) return;

    let initDone = false;
    let sidebarOverlayActive = false;
    let domObserver = null;

    const cache = {
        leftSidebar: null,
        rootContainer: null,
        bottomNav: null
    };

    function getLeftSidebar() {
        if (!cache.leftSidebar || !document.contains(cache.leftSidebar)) {
            cache.leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
        }
        return cache.leftSidebar;
    }

    function getRootContainer() {
        if (!cache.rootContainer || !document.contains(cache.rootContainer)) {
            cache.rootContainer = document.querySelector('.Root__top-container') || document.querySelector('div[data-testid=root]');
        }
        return cache.rootContainer;
    }

    let originalHeaderText = null;

    window.switchLs = function(forceCollapse = false) {
        const leftSidebar = getLeftSidebar();
        if (!leftSidebar) return;

        const rootContainer = getRootContainer();

        if (forceCollapse || sidebarOverlayActive) {
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
                headerH1.textContent = '\u2190  Library';
            }

            const list = leftSidebar.querySelector('[role="list"],[role="grid"],div[class*="view-container"]');
            if (list) {
                list.scrollBy(0, 1);
                list.scrollBy(0, -1);
            }
            window.dispatchEvent(new Event('resize'));
        }
        updateActiveTab();
    };

    function initFeatures() {
        const setupLibraryButton = () => {
            const libBtn = document.querySelector('#Desktop_LeftSidebar_Id header button[aria-label*="Your Library"]:not(.processed)');
            if (libBtn && !libBtn.classList.contains('processed')) {
                window.lBtn = libBtn;
                libBtn.classList.add('processed', 'lbtn');
                libBtn.style.padding = '0';
                libBtn.style.height = '20px';
                libBtn.addEventListener('click', function() {
                    setTimeout(() => switchLs(), 0);
                });
            }
        };

        const setupLibraryGrid = () => {
            const libGrid = document.querySelector('#Desktop_LeftSidebar_Id div[role=grid]:not(.processed)');
            if (libGrid) {
                libGrid.classList.add('processed');
                libGrid.addEventListener('click', (event) => {
                    let target = event.target;
                    let isFolder = false;
                    for (let i = 0; i < 5 && target; i++) {
                        const ariaLabelledBy = target.getAttribute('aria-labelledby');
                        if (ariaLabelledBy && ariaLabelledBy.includes(':folder:')) { isFolder = true; break; }
                        const ariaDescribedBy = target.getAttribute('aria-describedby');
                        if (ariaDescribedBy && ariaDescribedBy.includes(':folder:')) { isFolder = true; break; }
                        target = target.parentElement;
                    }
                    if (!isFolder) {
                        setTimeout(() => {
                            switchLs(true);
                        }, 300);
                    }
                });
            }
        };

        const setupSearchInput = () => {
            const searchInput = document.querySelector('input[data-testid=search-input]:not(.processed)');
            if (searchInput) {
                searchInput.classList.add('processed');
                searchInput.addEventListener('focus', () => {
                    const npBar = document.querySelector('aside[data-testid=now-playing-bar]');
                    if (npBar) npBar.style.display = 'none';
                });
                searchInput.addEventListener('blur', () => {
                    const npBar = document.querySelector('aside[data-testid=now-playing-bar]');
                    if (npBar) npBar.style.display = 'flex';
                });
            }
        };

        setupLibraryButton();
        setupLibraryGrid();
        setupSearchInput();
        setupNPBarHeightSync();
        setupSwipeGestures();

        setTimeout(() => {
            setupLibraryButton();
            setupLibraryGrid();
            setupSearchInput();
            setupNPBarHeightSync();
            setupSwipeGestures();
        }, 2000);
    }

    // Collapsed/"minimized" mini-player state has been removed - the playback
    // controls card is now always shown in its full (expanded) form, same as
    // spotifuck. What used to gate the mini-player's compact height (a hardcoded
    // 64px fallback for --sp-np-bar-height) no longer matches reality now that
    // the card's real height varies with its content, so we measure it for real
    // and keep --sp-np-bar-height in sync - that's what the CSS uses to reserve
    // exactly enough space at the bottom of the scrollable main view, instead of
    // main-view filling the whole viewport behind the (opaque) controls.
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

    function setupSwipeGestures() {
        const player = document.querySelector('aside[data-testid=now-playing-bar]');
        if (!player || player.dataset.swipeReady) return;
        const widget = player.querySelector('div[data-testid=now-playing-widget]');
        if (!widget) return;
        player.dataset.swipeReady = '1';
        let startX = 0, startY = 0;
        widget.addEventListener('touchstart', function(e) {
            startX = e.changedTouches[0].screenX;
            startY = e.changedTouches[0].screenY;
        }, {passive: true});
        widget.addEventListener('touchend', function(e) {
            const dx = e.changedTouches[0].screenX - startX;
            const dy = e.changedTouches[0].screenY - startY;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
            e.preventDefault();
            if (dx < 0) {
                const nextBtn = document.querySelector('button[data-testid="control-button-skip-forward"]');
                if (nextBtn) nextBtn.click();
            } else {
                const prevBtn = document.querySelector('button[data-testid="control-button-skip-back"]');
                if (prevBtn) prevBtn.click();
            }
        }, {passive: false});
        widget.style.touchAction = 'pan-y';
    }

    function startDOMObserver() {
        if (domObserver) return;
        domObserver = new MutationObserver(() => {
            const playBtn = document.querySelector('aside button[data-testid=control-button-playpause]:not(.processed)');
            if (playBtn) {
                playBtn.classList.add('processed');
                window.pBtn = playBtn;
                if (!initDone) {
                    initDone = true;
                    initFeatures();
                }
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });
    }

    function injectMobileCSS() {
        const style = document.createElement('style');
        style.textContent = `
body{min-width:100%!important;min-height:100%!important}
.os-scrollbar{--os-size:6px!important}
.contentSpacing{padding:0}
div[data-testid=root]{--panel-gap:0!important;--content-spacing:10px}
#main+div,#main+div>div{overflow:hidden!important;width:auto}
#main+div>div>div>div:nth-child(2)>div{width:100vw!important}

#global-nav-bar>div:first-of-type,
#global-nav-bar a[href="/download"],
button[data-testid=fullscreen-mode-button],
div.main-view-container__mh-footer-container,
a[href="/download"],
button[aria-label="Show Now Playing view"],
button[aria-label="Hide Now Playing view"]
{display:none!important}

/* Superseded by visual premium spoof (runPremium/premiumPass JS logic, which already
   hides button[data-testid=upgrade-button] with logChange logging, and rebuilds
   [data-testid=compact-banner] into Edit profile/Payment method buttons instead of
   just hiding it). Kept here for reference, not applied.
div[data-encore-id=banner],
button[data-testid=upgrade-button]
{display:none!important}
*/

#global-nav-bar{display:none!important}
body.sp-search #global-nav-bar{display:flex!important}
#global-nav-bar button[data-testid=home-button],
#global-nav-bar a[aria-label*="Home"]{display:none!important}

/* spotifuck's way: nothing here is taken out of flow, so nothing needs its
   height measured or subtracted. .Root__main-view becomes a column flexbox;
   its normal-flow children (the real page content) share the flexible space
   and scroll internally, while #sp-bottom-nav - also just a normal last
   child now, not position:fixed - keeps its natural height and the browser
   reserves that space for free. */
.Root__main-view,
div[data-testid=main-view]{
  display:flex!important;
  flex-direction:column!important;
  height:100%!important;
  overflow:hidden!important
}
.Root__main-view>*:not(#sp-bottom-nav),
div[data-testid=main-view]>*:not(#sp-bottom-nav){
  flex:1 1 auto!important;
  min-height:0!important;
  overflow-y:auto!important;
  overflow-x:hidden!important;
  padding-bottom:calc(var(--sp-np-bar-height, 0px) + 56px)!important;
}
#sp-bottom-nav{
  position:fixed!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  width:100%!important;
  height:56px;
  background:#000!important; /* keep non-transparent */
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

/* Collapsed/"minimized" mini-player state removed - always shown expanded, like spotifuck. */
aside[data-testid=now-playing-bar]{
  min-width:100%!important;
  margin:0!important;
  flex:0 0 auto!important;
  box-shadow:none!important;
  background:#000!important;
  border:none!important;
  border-top:1px solid #666!important;
  border-radius:0!important;
  max-height:40vh!important;
  overflow-y:auto!important;
  contain:layout style paint
}

aside[data-testid=now-playing-bar] button[aria-label*="scroll"],
aside[data-testid=now-playing-bar] button[aria-label*="info"],
aside[data-testid=now-playing-bar] [class*="chevron"],
aside[data-testid=now-playing-bar] [class*="Chevron"],
aside[data-testid=now-playing-bar] button[aria-label*="Play from"],
aside[data-testid=now-playing-bar] button[aria-label*="Queue"]{display:none!important}

/* --- AMOLED playback controls (ported from spotifuck) --- */
aside[data-testid=now-playing-bar]>div:first-child{
  flex-direction:column!important;
  height:auto!important;
  margin-top:2px;
  padding:6px 8px 4px!important
}
aside[data-testid=now-playing-bar]>div>div{width:100%!important}
aside[data-testid=now-playing-bar]>div>div:last-child>div{min-height:32px;margin:5px 10px}
aside[data-testid=now-playing-bar]>div>div:last-child button{transform:scale(1.15);margin:0 5px}
aside[data-testid=now-playing-bar] div[data-testid=general-controls]{margin:15px 0 25px!important}
aside[data-testid=now-playing-bar] div[data-testid=general-controls] button{transform:scale(1.4)!important;margin:0 8px!important}
aside[data-testid=now-playing-bar] div[data-testid=player-controls]{margin:5px 0!important}
aside[data-testid=now-playing-bar] div[data-testid=now-playing-widget]{justify-content:center;overflow:hidden}
aside[data-testid=now-playing-bar] div[data-testid=now-playing-widget]>div:last-child>button{transform:scale(1.3)}
aside[data-testid=now-playing-bar] div[data-testid=now-playing-widget]>div:nth-child(2){display:flex!important;overflow:hidden!important}
aside[data-testid=now-playing-bar] div[data-testid=now-playing-widget]>div:nth-child(2) span{font-size:13px!important;height:20px!important;margin:0!important}
aside[data-testid=now-playing-bar] div[data-testid=now-playing-widget]>div:nth-child(2)>div{min-width:auto;max-width:66%}
/* pip-toggle-button is intentionally NOT touched here, so it stays visible/usable exactly
   like upstream Spotify. */

input[data-testid="search-input"],
input[aria-label="What do you want to play?"]{display:none!important}
body.sp-search input[data-testid="search-input"],
body.sp-search input[aria-label="What do you want to play?"]{display:flex!important}
body.sp-collection main>section>div:first-child{height:auto!important;min-height:auto!important;padding:10px}

form[role=search]{z-index:10;max-width:88%}

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
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Collapse Your Library"],
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Expand Your Library"]{display:none!important}
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

#Desktop_LeftSidebar_Id>nav>div{min-height:48px;border-radius:25px}
.YourLibraryX{background:var(--background-elevated-base)!important}
.YourLibraryX header{padding:14px}

#main-view,div[data-testid=main-view],.Root__main-view,
#main-view+div,#main-view+div>div,#main-view+div>div>div,
div[data-testid=root]>div:first-child>div:first-child{margin-left:0!important;padding-left:0!important}

section[data-testid=artist-page]>div>div:first-child:not([data-encore-id]){height:25vh}
div[data-testid=tracklist-row]{padding:0 10px 0 0;grid-gap:0}
div[data-testid=tracklist-row] button:not([data-testid=add-to-playlist-button]){transform:scale(1.3)!important;opacity:0.6!important}
div[data-testid=tracklist-row] button:hover{color:#2d6!important}
div[data-testid=tracklist-row]>div:first-child>div:first-child{height:24px;min-height:24px;min-width:24px;margin:0 8px!important}
[aria-colcount="3"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,4fr)) [last] minmax(82px,var(--col2,1fr))!important}
[aria-colcount="4"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,4fr)) [var1] minmax(120px,var(--col2,2fr)) [last] minmax(82px,var(--col3,1fr))!important}
[aria-colcount="5"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,6fr)) [var1] minmax(120px,var(--col2,4fr)) [var2] minmax(120px,var(--col3,3fr)) [last] minmax(82px,var(--col4,1fr))!important}
section[data-testid=home-page] .contentSpacing{padding:0 10px!important;overflow:hidden}
div[data-testid=grid-container]{margin-inline:0!important;column-gap:0!important;overflow:hidden!important}
div[data-testid=action-bar-row],div[data-testid=topbar-content]{padding:5px 10px}
div[data-testid=track-list]>div:first-child,div[data-testid=playlist-tracklist]>div:first-child{margin:0!important;padding:0!important}
main>section:not([data-testid=artist-page])>div:first-child{height:auto!important;min-height:auto!important;padding:10px}
main>section h1.encore-text-headline-large{font-size:22px!important}
section[data-testid=artist-page] span.encore-text-headline-large{font-size:26px!important}
section[data-testid=artist-page] div[data-testid=grid-container] h2,section[data-testid=artist-page] section[data-testid=component-shelf]{padding:0 10px}
.Root__top-container{grid-template-columns:auto 1fr auto!important}
#Desktop_PanelContainer_Id{display:flex!important;flex-direction:column!important;overflow-y:auto!important}
div.IPnR0MPdiJw3m3C8.rd25SoWs7Y4T40c7,
button[aria-label="Comprimir Tu biblioteca"],
button[aria-label="Collapse Your library"]{display:none!important}
button[data-testid="npv-artist-bio-button"],.tDBAoTKiCjMk1wxv{display:none!important;height:0px!important}
.qy8cKKS5c5Y24cTG{display:none!important}
.lhB5KQbFP8BJIgvI{flex:1!important;overflow-y:auto!important}
ul.oPf3qKGRkUM3T0bK{display:block!important;overflow-y:auto!important}
        `;
        document.head.appendChild(style);
    }

    const FALLBACK_SVGS = {
        home: '<svg role="img" aria-hidden="true" viewBox="0 0 24 24"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732z"/></svg>',
        search: '<svg role="img" aria-hidden="true" viewBox="0 0 24 24"><path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.057l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.817c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.279 7.407-7.279s7.407 3.273 7.407 7.279-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.279z"/></svg>',
        library: '<svg role="img" aria-hidden="true" viewBox="0 0 24 24"><path d="M14.5 2.134a1 1 0 0 1 1 0l6 3.464a1 1 0 0 1 .5.866V21a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V3a1 1 0 0 1 .5-.866M16 4.732V20h4V7.041zM3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1m6 0a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1"/></svg>'
    };

    function createBottomNav() {
        if (document.getElementById('sp-bottom-nav')) return;

        const nav = document.createElement('div');
        nav.id = 'sp-bottom-nav';
        cache.bottomNav = nav;

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

    function handleTabClick(name) {
        if (name === 'library') {
            if (!sidebarOverlayActive) {
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

        const nav = cache.bottomNav || document.getElementById('sp-bottom-nav');
        if (!nav) return;
        const buttons = nav.children;
        for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i];
            btn.classList.toggle('active', btn.dataset.tab === active);
        }
    }

    let lastBodyClass = '';
    function updateBodyClass() {
        const path = location.pathname;
        let cls = '';
        if (path === '/' || path === '/home') cls = 'sp-home';
        else if (path.startsWith('/search')) cls = 'sp-search';
        else if (path.startsWith('/collection')) cls = 'sp-collection';
        else if (path.startsWith('/playlist')) cls = 'sp-playlist';
        else if (path.startsWith('/album')) cls = 'sp-album';
        else if (path.startsWith('/artist')) cls = 'sp-artist';
        else if (path.startsWith('/track')) cls = 'sp-track';

        if (cls === lastBodyClass) return;

        if (lastBodyClass) document.body.classList.remove(lastBodyClass);
        if (cls) document.body.classList.add(cls);
        lastBodyClass = cls;
    }

    let lastPath = '';
    function onLocationChange() {
        if (location.pathname === lastPath) return;
        lastPath = location.pathname;
        updateBodyClass();
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

    injectMobileCSS();
    sessionStorage.removeItem('sp_library_open');

    const waitForBody = setInterval(() => {
        if (document.body) {
            clearInterval(waitForBody);
            lastPath = location.pathname;
            updateBodyClass();
            createBottomNav();
            startDOMObserver();
            hookHistory();
        }
    }, 100);
})();
