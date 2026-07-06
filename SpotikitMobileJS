// ==UserScript==
// @name         Spotikit++
// @namespace    http://tampermonkey.net/
// @version      7.0
// @description  Spotikit + adblock + premium spoof + unlock web mobile player likes
// @author       kit_fogos
// @match        https://www.spotify.com/*/account/*
// @match        https://open.spotify.com/*
// @match        https://www.spotify.com/*/premium/*
// @match        https://www.spotify.com/*/duo/*
// @match        https://www.spotify.com/*/student/*
// @match        https://www.spotify.com/*/family/*
// @match        https://payments.spotify.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const PINK = '#FFD2D7';
    const GREEN = '#1ed760';

    if (window.location.hostname === 'open.spotify.com') {

        // === FEATURES FROM v6 (Myst1cX port) ===

        let ulFlag = false;
        let ffDone = false;
        let pfint = null;

        window.switchLs = function(forceCollapse = false) {
            const leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
            if (!leftSidebar) return;

            const navFirstChild = leftSidebar.querySelector('nav>div>div:first-child');
            if (!navFirstChild) return;

            const isExpanded = navFirstChild.classList.length === 2;

            if (!forceCollapse && isExpanded) {
                leftSidebar.style.position = 'fixed';
                leftSidebar.style.width = '100%';
                leftSidebar.style.height = '100%';
                leftSidebar.style.left = '0';
                leftSidebar.style.top = '0';
                leftSidebar.style.zIndex = '20';

                const headerH1 = leftSidebar.querySelector('header>div>div:first-child h1');
                if (headerH1) {
                    headerH1.textContent = '\u2716 \u00A0 Close Library';
                }
            } else {
                leftSidebar.style.zIndex = '1';
                leftSidebar.style.position = 'fixed';
                leftSidebar.style.top = '0';
                leftSidebar.style.left = '60px';
                leftSidebar.style.width = '48px';
                leftSidebar.style.height = '48px';
            }
        };

        window.closeNowPlay = function() {
            const panelContainer = document.querySelector('#Desktop_PanelContainer_Id');
            if (panelContainer && panelContainer.parentNode.parentNode.ariaHidden === 'false') {
                const toggleBtn = panelContainer.parentNode.parentNode.nextElementSibling?.querySelector('button');
                if (toggleBtn) toggleBtn.click();
            }
        };

        window.firstFuck = function() {
            if (pfint) clearInterval(pfint);

            pfint = setInterval(() => {
                const playBtn = document.querySelector('aside button[data-testid=control-button-playpause]:not(.fuckd)');
                if (playBtn) {
                    playBtn.classList.add('fuckd');
                    window.pBtn = playBtn;

                    window.pBtn.addEventListener('click', () => {
                        if (window.pBtn && window.pBtn.getAttribute('aria-label') !== 'Play') {
                            ulFlag = false;
                        } else if (!ulFlag) {
                            ulFlag = true;
                            setTimeout(() => {
                                if (window.pBtn && ulFlag && window.pBtn.getAttribute('aria-label') === 'Play') {
                                    ulFlag = false;
                                } else if (ulFlag) {
                                    ulFlag = false;
                                }
                            }, 10000);
                        }
                    });

                    if (!ffDone) {
                        ffDone = true;
                        addCSSJSHack();
                    }
                }
            }, 5000);
        };

        window.addCSSJSHack = function() {
            const setupLibraryButton = () => {
                const libBtn = document.querySelector('#Desktop_LeftSidebar_Id header button[aria-label*="Your Library"]:not(.fuckd)');
                if (libBtn && !libBtn.classList.contains('fuckd')) {
                    window.lBtn = libBtn;
                    libBtn.classList.add('fuckd', 'lbtn');
                    libBtn.style.padding = '0';
                    libBtn.style.height = '20px';
                    libBtn.addEventListener('click', function() {
                        setTimeout(() => switchLs(), 0);
                    });

                    if (libBtn.getAttribute('aria-label') === 'Collapse Your Library') {
                        libBtn.click();
                    }
                }
            };

            const setupLibraryGrid = () => {
                const libGrid = document.querySelector('#Desktop_LeftSidebar_Id div[role=grid]:not(.fuckd)');
                if (libGrid) {
                    libGrid.classList.add('fuckd');

                    libGrid.addEventListener('click', (event) => {
                        let target = event.target;
                        let isFolder = false;

                        for (let i = 0; i < 5 && target; i++) {
                            const ariaLabelledBy = target.getAttribute('aria-labelledby');
                            if (ariaLabelledBy && ariaLabelledBy.includes(':folder:')) {
                                isFolder = true;
                                break;
                            }

                            const ariaDescribedBy = target.getAttribute('aria-describedby');
                            if (ariaDescribedBy && ariaDescribedBy.includes(':folder:')) {
                                isFolder = true;
                                break;
                            }

                            target = target.parentElement;
                        }

                        if (!isFolder) {
                            setTimeout(() => {
                                switchLs(true);
                                closeNowPlay();
                            }, 150);
                        }
                    });
                }
            };

            const setupHomeButton = () => {
                const homeBtn = document.querySelector('#global-nav-bar button[data-testid=home-button]:not(.fuckd)');
                if (homeBtn) {
                    homeBtn.classList.add('fuckd');
                    homeBtn.addEventListener('click', () => { closeNowPlay(); });
                }
            };

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

            const setupUserButton = () => {
                const userBtn = document.querySelector('button[data-testid=user-widget-link]:not(.fuckd)');
                if (userBtn) {
                    userBtn.classList.add('fuckd');
                    userBtn.addEventListener('click', () => { closeNowPlay(); });
                }
            };

            setupLibraryButton();
            setupLibraryGrid();
            setupHomeButton();
            setupSearchInput();
            setupUserButton();

            setTimeout(() => {
                setupLibraryButton();
                setupLibraryGrid();
                setupHomeButton();
                setupSearchInput();
                setupUserButton();
            }, 2000);
        };

        function injectCSS() {
            const style = document.createElement('style');
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

            const amoled = document.createElement('style');
            amoled.textContent = `
.encore-dark-theme{--background-base:#000;--background-highlight:#000;--background-elevated-base:#000;--background-elevated-highlight:#000;--background-elevated-press:#000;--background-tinted-base:#000}
aside[data-testid=now-playing-bar]{background:#000!important;box-shadow:none;border-top:1px solid #666}
            `;
            document.head.appendChild(amoled);
        }

        injectCSS();
        firstFuck();

        // === END v6 FEATURES ===

        const isMobileWebPlayer = document.documentElement.classList.contains('mobile-web-player')
            || !!document.querySelector('[data-testid="bottom-tab-navigation"]');

        if (isMobileWebPlayer) {
            console.log('[SpotiKit] MOBILE WEB PLAYER - script active, registering handlers');
            GM_addStyle(`
                [data-tippy-root] { display:none !important; }
                [data-testid="mobile-upsell"],
                #onetrust-consent-sdk { display:none !important; }
            `);

            const dismissTippy = () => {
                document.querySelectorAll('[data-tippy-root]').forEach(el => el.remove());
            };
            setInterval(dismissTippy, 300);



            document.addEventListener('click', e => {
                const nav = document.querySelector('[data-testid="bottom-tab-navigation"]');
                if (!nav || !nav.contains(e.target)) return;
                const tab = e.target.closest('a');
                if (!tab) return;
                const text = (tab.textContent || '').trim().toLowerCase();
                if (!text.includes('biblioteca') && !text.includes('library')) return;
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                dismissTippy();
                history.pushState(null, '', '/collection/tracks');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }, true);

            new MutationObserver(() => {
                document.querySelectorAll('[data-context-menu-open]').forEach(el => {
                    const text = (el.textContent || '').trim().toLowerCase();
                    if (text.includes('biblioteca') || text.includes('library')) {
                        el.removeAttribute('data-context-menu-open');
                    }
                });
            }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-context-menu-open'] });
        }

        GM_addStyle(`
            [data-testid="playback-progressbar"] .x-progressBar-fillColor {
                background: linear-gradient(
                    to bottom,
                    #ff0000 0%, #ff0000 16.5%,
                    #ff9900 16.5%, #ff9900 33%,
                    #ffff00 33%, #ffff00 50%,
                    #33ff00 50%, #33ff00 66%,
                    #0099ff 66%, #0099ff 83.5%,
                    #6633ff 83.5%, #6633ff 100%
                ) !important;
            }
            [data-testid="playback-progressbar"] .x-progressBar-progressBarBg {
                background: rgba(255,255,255,0.1) !important;
            }
            [data-testid="playback-progressbar"] .progress-bar__slider {
                width: 34px !important;
                height: 21px !important;
                border: none !important;
                margin-left: -18px !important;
                visibility: visible !important;
                display: block !important;
                transform: translateY(-50%) scale(0.8);
                border-radius: 0 !important;
                box-shadow: none !important;
                transition: transform 0.1s cubic-bezier(0, 0, 0.2, 1) !important;
            }
            [data-testid="playback-progressbar"] .progress-bar__slider::after {
                display: none !important;
            }
            [data-testid="playback-progressbar"] .progress-bar {
                --progress-bar-height: 8px !important;
            }
        `);
    }

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
            const btnRow = planCard.querySelector('[class*="dCZPlm"]');
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
            if (/^(try|pru[eǸ]ba)/.test(t)) el.style.display = 'none';
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
                if (!t || t === '\u2014' || t === '-' || t === 'no' || /gratuito|free/.test(t)) {
                    cell.innerHTML = `<span style="color:${GREEN};font-weight:700;">\u2713</span>`;
                }
            });
        });

        document.querySelectorAll('span[data-encore-id="text"]').forEach(el => {
            const t = el.textContent.trim();
            if (t === 'Download for offline listening' || t === 'Descarga canciones para disfrutarlas sin conexi\u00f3n' || t === 'Descarga canciones para disfrutarlas sin conexi��n') {
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
            if (/open (in|the) (app|desktop|spotify)|install|download (the )?app|get the app|launch|listen in app|listen on desktop|use (the )?(app|desktop)|abrir en (la )?(aplicaci[óo]n|app)|abrir en ordenador|instalar|descargar (la )?app/.test(t)) {
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


(async function() {
    'use strict';

    const removeElements = selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
    };

    const handleAudioAds = () => {
        const audioAd = document.querySelector('audio[src*="spotify.com/ad"]');
        if (audioAd) {
            audioAd.src = "";
            audioAd.pause();
        }
    };

    const inject = ({ ctx, fn, transform }) => {
        const original = ctx[fn];
        ctx[fn] = function () {
            const result = original.apply(this, arguments);
            return transform ? transform.call(this, result, ...arguments) : result;
        };
    };

    const observer = new MutationObserver(() => {
        removeElements('[data-testid="ad-slot-container"], [class*="ad-"]');
        handleAudioAds();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    const adRemovalInterval = setInterval(() => {
        removeElements('[data-testid="ad-slot-container"], [class*="ad-"]');
        handleAudioAds();
    }, 1000);

    const queryAsync = (query, interval = 250) => new Promise(resolve => {
        const checkInterval = setInterval(() => {
            const element = document.querySelector(query);
            if (element) {
                clearInterval(checkInterval);
                resolve(element);
            }
        }, interval);
    });

    const nowPlayingBar = await queryAsync(".now-playing-bar");
    const playButton = await queryAsync("button[title=Play], button[title=Pause]");
    let audio;

    inject({
        ctx: document,
        fn: "createElement",
        transform(result, type) {
            if (type === "audio") {
                audio = result;
            }
            return result;
        },
    });

    new MutationObserver(() => {
        if (audio && playButton && document.querySelector(".now-playing > a")) {
            audio.src = "";
            playButton.click();
        }
    }).observe(nowPlayingBar, {
        childList: true,
        subtree: true,
    });

    window.addEventListener('beforeunload', () => {
        observer.disconnect();
        clearInterval(adRemovalInterval);
    });


})();
