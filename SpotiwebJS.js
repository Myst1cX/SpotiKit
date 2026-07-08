// ==UserScript==
// @name         SpotiKit++ desktop
// @namespace    https://github.com/Myst1cX/SpotiKit
// @version      7.1
// @description  SpotiKit — visual premium UI overlay for Spotify and ad banner blocking
// @author       kit_fogos, Myst1cX (forked)
// @match        https://www.spotify.com/*/account/*
// @match        https://open.spotify.com/*
// @match        https://www.spotify.com/*/premium/*
// @match        https://www.spotify.com/*/duo/*
// @match        https://www.spotify.com/*/student/*
// @match        https://www.spotify.com/*/family/*
// @match        https://payments.spotify.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// @homepageURL  https://github.com/Myst1cX/SpotiKit
// @supportURL   https://github.com/Myst1cX/SpotiKit/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiwebJS.js
// ==/UserScript==

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

    function run() {
        const b = document.body;
        if (!b) return;

        const w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while (n = w.nextNode()) {
            let v = n.nodeValue;
            let c = false;
            for (const [from, to] of Object.entries(REPLACE)) {
                if (v.includes(from)) {
                    v = v.replaceAll(from, to);
                    c = true;
                }
            }
            if (c) n.nodeValue = v;
        }

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
                el.textContent = 'Premium Individual';
                el.style.color = PINK;
                el.style.fontWeight = '700';
            }
        });

        document.querySelectorAll('a, button, [role="button"]').forEach(el => {
            const t = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (/^(get|buy|join|obtener|conseguir)\s*premium/.test(t)) {
                el.textContent = 'DONT JOIN PREMIUM';
                el.style.cssText += `background:${PINK}!important;color:#000!important;border:none!important;border-radius:20px!important;font-weight:700!important;pointer-events:none!important;cursor:default!important;`;
                el.onclick = e => { e.preventDefault(); e.stopPropagation(); };
            }
            if (/^(explore|view|explorar|ver)\s*(plans|planes)/.test(t)) {
                el.textContent = 'Manage plan';
                el.style.cssText += `background:transparent!important;color:#fff!important;border:1px solid #727272!important;border-radius:20px!important;font-weight:700!important;pointer-events:none!important;cursor:default!important;`;
                el.onclick = e => { e.preventDefault(); e.stopPropagation(); };
            }
            if (/^(try|pru[eé]ba)/.test(t)) el.style.display = 'none';
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
                if (!t || t === '—' || t === '-' || t === 'no' || /gratuito|free/.test(t)) {
                    cell.innerHTML = `<span style="color:${GREEN};font-weight:700;">✓</span>`;
                }
            });
        });

        document.querySelectorAll('span[data-encore-id="text"]').forEach(el => {
            const t = el.textContent.trim();
            if (t === 'Download for offline listening' || t === 'Descarga canciones para disfrutarlas sin conexi\u00f3n' || t === 'Descarga canciones para disfrutarlas sin conexión') {
                el.textContent = 'Spotify wont fuck you';
            }
        });

        const upgradeBtn = document.querySelector('[data-testid="upgrade-button"]');
        if (upgradeBtn) upgradeBtn.style.display = 'none';
        const installBtn = document.querySelector('a[href="/download"]');
        if (installBtn) installBtn.style.display = 'none';
        const premiumMenu = document.querySelector('a[href*="premium/?ref=web_loggedin_upgrade_menu"]');
        if (premiumMenu) premiumMenu.style.display = 'none';

        const planesXpath = document.evaluate(
            '//a[text()="Planes Premium"] | //span[text()="Planes Premium"] | //div[text()="Planes Premium"] | //a[text()="Premium Plans"] | //span[text()="Premium Plans"] | //div[text()="Premium Plans"]',
            document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null
        );
        for (let i = 0; i < planesXpath.snapshotLength; i++) {
            const n = planesXpath.snapshotItem(i);
            if (n) n.style.display = 'none';
        }

        document.querySelectorAll('[aria-label*="Planes Premium"], [aria-label*="Premium Plans"], [data-ga-action="premium"], [data-ga-category="menu"] a, a[href*="/premium/"]').forEach(el => {
            const t = el.textContent.trim();
            if (t === 'Planes Premium' || t === 'Premium Plans') el.style.display = 'none';
        });

        const premiumBanner = document.querySelector('[data-testid="compact-banner"]');
        if (premiumBanner) {
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
                window.location.href = 'https://www.spotify.com/mx/account/profile/';
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
                window.location.href = 'https://www.spotify.com/mx/account/saved-payment-cards/';
            };


            premiumBanner.innerHTML = '';
            premiumBanner.appendChild(left);
            premiumBanner.appendChild(right);
        }

        if (/\/premium\/|\/duo\/|\/student\/|\/family\//.test(window.location.href) && !document.querySelector('.__sp_premium_done')) {
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

    setTimeout(run, 300);
    setTimeout(run, 1200);

    let timer;
    new MutationObserver(() => {
        clearTimeout(timer);
        timer = setTimeout(run, 400);
    }).observe(document.body, { childList: true, subtree: true });
})();


(function() {
    'use strict';

    const removeElements = selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    };

    const observer = new MutationObserver(() => {
        removeElements('[data-testid="ad-slot-container"], [class*="ad-"]');
        removeElements('.ButtonInner-sc-14ud5tc-0.fcsOIN');
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    const adRemovalInterval = setInterval(() => {
        removeElements('[data-testid="ad-slot-container"], [class*="ad-"]');
        removeElements('.ButtonInner-sc-14ud5tc-0.fcsOIN');
    }, 1000);

    window.addEventListener('beforeunload', () => {
        observer.disconnect();
        clearInterval(adRemovalInterval);
    });
})();
