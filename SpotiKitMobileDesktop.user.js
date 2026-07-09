// ==UserScript==
// @name         SpotiKit
// @namespace    https://github.com/kitbodega/SpotiKit
// @version      7.3.1
// @description  SpotiKit — Mobile‑like layout for Spotify Web. Floating player, bottom nav, library overlay, and more.
// @author       kitbodega
// @icon         https://i.ibb.co/YF1nLPfK/2eca7229-ca6a-4ad6-8653-b80a6a0f8586.png
// @match        https://open.spotify.com/*
// @grant        GM_addStyle
// @run-at       document-start
// @homepageURL  https://github.com/kitbodega/SpotiKit
// @supportURL   https://github.com/kitbodega/SpotiKit/issues
// @updateURL   https://raw.githubusercontent.com/kitbodega/SpotiKit/refs/heads/main/SpotiKitMobileDesktop.user.js
// @downloadURL https://raw.githubusercontent.com/kitbodega/SpotiKit/refs/heads/main/SpotiKitMobileDesktop.user.js
// ==/UserScript==

(function() {
    'use strict';

    let ulFlag = false;
    let ffDone = false;
    let pfint = null;
    let sidebarOverlayActive = false;

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

    window.switchLs = function(forceCollapse = false) {
        const leftSidebar = getLeftSidebar();
        if (!leftSidebar) return;

        const rootContainer = getRootContainer();

        if (forceCollapse || sidebarOverlayActive) {
            delete leftSidebar.dataset.overlay;
            sidebarOverlayActive = false;
            if (rootContainer) {
                rootContainer.style.removeProperty('--left-sidebar-width');
                rootContainer.style.removeProperty('--nav-bar-width');
            }
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 50);
        } else {
            leftSidebar.dataset.overlay = 'true';
            sidebarOverlayActive = true;

            if (rootContainer) {
                rootContainer.style.setProperty('--left-sidebar-width', window.innerWidth + 'px');
                rootContainer.style.setProperty('--nav-bar-width', window.innerWidth + 'px');
            }

            const expandBtn = leftSidebar.querySelector(
                'button[aria-label*="Expand Your Library"], ' +
                'button[aria-label*="Expandir Tu biblioteca"], ' +
                'button[aria-label*="Expandir tu biblioteca"]'
            );
            if (expandBtn) {
                expandBtn.click();
            }

            const headerH1 = leftSidebar.querySelector('header>div>div:first-child h1');
            if (headerH1) {
                const lang = document.documentElement.lang || '';
                headerH1.textContent = lang.startsWith('es') ? 'Tu biblioteca' : 'Your library';
            }

            setTimeout(() => {
                const list = leftSidebar.querySelector('[role="list"],[role="grid"],div[class*="view-container"]');
                if (list) {
                    list.scrollBy(0, 1);
                    list.scrollBy(0, -1);
                }
                window.dispatchEvent(new Event('resize'));
            }, 100);
        }
        updateActiveTab();
    };

    window.firstFuck = function() {
        if (pfint) clearInterval(pfint);
        pfint = setInterval(() => {
            const playBtn = document.querySelector('aside button[data-testid=control-button-playpause]:not(.fuckd)');
            if (playBtn) {
                playBtn.classList.add('fuckd');
                window.pBtn = playBtn;
                if (!ffDone) {
                    ffDone = true;
                    clearInterval(pfint);
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
                        if (ariaLabelledBy && ariaLabelledBy.includes(':folder:')) { isFolder = true; break; }
                        const ariaDescribedBy = target.getAttribute('aria-describedby');
                        if (ariaDescribedBy && ariaDescribedBy.includes(':folder:')) { isFolder = true; break; }
                        target = target.parentElement;
                    }
                    if (!isFolder) {
                        setTimeout(() => {
                            switchLs(true);
                        }, 150);
                    }
                });
            }
        };

        const setupSearchInput = () => {
            const searchInput = document.querySelector('input[data-testid=search-input]:not(.fuckd)');
            if (searchInput) {
                searchInput.classList.add('fuckd');
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
        setupPlayerToggle();

        setTimeout(() => {
            setupLibraryButton();
            setupLibraryGrid();
            setupSearchInput();
            setupPlayerToggle();
        }, 2000);
    };

    function setupPlayerToggle() {
        const player = document.querySelector('aside[data-testid=now-playing-bar]:not(.fuckd)');
        if (!player || player.querySelector('#sp-player-toggle')) return;
        player.classList.add('fuckd');
        const btn = document.createElement('button');
        btn.id = 'sp-player-toggle';
        btn.textContent = '\u25BC';
        player.appendChild(btn);
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            player.classList.toggle('minimized');
            btn.textContent = player.classList.contains('minimized') ? '\u25B2' : '\u25BC';
        });
    }

    function injectMobileCSS() {
        const style = document.createElement('style');
        style.textContent = `
body{min-width:100%!important;min-height:100%!important;padding-bottom:56px!important}
body,div[data-testid=root],.Root__top-container,.Root__now-playing-bar{background:transparent!important}
aside[data-testid=now-playing-bar]>div,.Root__now-playing-bar>div,.Root__now-playing-bar{background:transparent!important}
.os-scrollbar{--os-size:6px!important}
.contentSpacing{padding:0}
div[data-testid=root]{--panel-gap:0!important;--content-spacing:10px}
#main+div,#main+div>div{overflow:hidden!important;width:auto}
#main+div>div>div>div:nth-child(2)>div{width:100vw!important}

div[data-encore-id=banner],
#global-nav-bar>div:first-of-type,
#global-nav-bar a[href="/download"],
button[data-testid=fullscreen-mode-button],
div.main-view-container__mh-footer-container,
button[data-testid=upgrade-button],
a[href="/download"],
button[aria-label="Expandir la vista Estás escuchando"],
button[aria-label="Ocultar la vista Estás escuchando"]
{display:none!important}

#global-nav-bar{display:none!important}
body.sp-search #global-nav-bar{display:flex!important}
#global-nav-bar button[data-testid=home-button],
#global-nav-bar a[aria-label*="Home"],
#global-nav-bar a[aria-label*="Inicio"]{display:none!important}

#sp-bottom-nav{
  position:fixed;
  bottom:0;
  left:0;
  right:0;
  height:56px;
  background:transparent!important;
  background-image:linear-gradient(to top,rgba(0,0,0,1) 0%,rgba(0,0,0,0.85) 40%,rgba(0,0,0,0.5) 75%,rgba(0,0,0,0) 100%)!important;
  border:none!important;
  box-shadow:none!important;
  display:flex;
  align-items:center;
  justify-content:space-around;
  z-index:9999;
  padding:0 8px;
  pointer-events:none;
  will-change:transform
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
  height:100%;
  pointer-events:auto
}
#sp-bottom-nav button.active{color:#fff}
#sp-bottom-nav button svg{width:24px;height:24px;fill:currentColor}
#sp-bottom-nav button span{font-size:10px;letter-spacing:0.5px}

aside[data-testid=now-playing-bar]{
  min-width:calc(100% - 16px)!important;
  margin:0 8px!important;
  position:fixed!important;
  box-shadow:0 -4px 30px rgba(0,0,0,0.5)!important;
  background:rgba(40,8,8,0.65)!important;
  backdrop-filter:blur(20px)!important;
  -webkit-backdrop-filter:blur(20px)!important;
  border:1px solid rgba(255,255,255,0.06)!important;
  bottom:64px!important;
  z-index:30!important;
  border-radius:16px!important;
  transition:transform 0.3s cubic-bezier(0.4,0,0.2,1),height 0.3s cubic-bezier(0.4,0,0.2,1)!important;
  overflow:hidden!important;
  will-change:transform
}

aside[data-testid=now-playing-bar].minimized{
  height:72px!important;
  min-height:72px!important;
  max-height:72px!important;
  border-radius:14px!important;
  background:rgba(40,8,8,0.85)!important;
  padding:0!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=general-controls],
aside[data-testid=now-playing-bar].minimized [data-testid=progress-bar],
aside[data-testid=now-playing-bar].minimized [role=progressbar],
aside[data-testid=now-playing-bar].minimized [data-testid=playback-position],
aside[data-testid=now-playing-bar].minimized [data-testid=playback-duration],
aside[data-testid=now-playing-bar].minimized [data-testid=playback-progressbar],
aside[data-testid=now-playing-bar].minimized button[aria-label*="Previous"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="Next"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="Skip"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="Aleatorio"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="repeat"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="Repetir"],
aside[data-testid=now-playing-bar].minimized button[data-testid="lyrics-button"],
aside[data-testid=now-playing-bar].minimized button[data-testid="control-button-queue"],
aside[data-testid=now-playing-bar].minimized button[data-testid="pip-toggle-button"],
aside[data-testid=now-playing-bar].minimized button[data-testid="fullscreen-mode-button"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="Conectar"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="conectar"],
aside[data-testid=now-playing-bar].minimized button[aria-label*="device"],
aside[data-testid=now-playing-bar].minimized [data-testid="volume-bar"],
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:last-child,
aside[data-testid=now-playing-bar].minimized>div:first-child>div:last-child{
  display:none!important
}
aside[data-testid=now-playing-bar].minimized>div:first-child{
  flex-direction:row!important;
  align-items:center!important;
  gap:10px!important;
  padding:8px 44px 8px 8px!important;
  height:100%!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]{
  flex:1!important;
  min-width:0!important;
  flex-direction:row!important;
  align-items:center!important;
  gap:12px!important;
  height:100%!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:first-child{
  width:56px!important;
  height:56px!important;
  min-width:56px!important;
  border-radius:6px!important;
  overflow:hidden!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:first-child img{
  width:100%!important;
  height:100%!important;
  border-radius:6px!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:nth-child(2){
  overflow:hidden!important;
  max-width:50vw!important;
  display:flex!important;
  flex-direction:column!important;
  justify-content:center!important;
  gap:2px!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:nth-child(2) a,
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:nth-child(2) span{
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:100%!important;
  font-size:14px!important;
  line-height:1.3!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:nth-child(2)>div:last-child span{
  font-size:12px!important;
  opacity:0.75!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=player-controls]{
  width:auto!important;
  margin:0!important;
  flex:none!important;
  height:100%!important;
  display:flex!important;
  align-items:center!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=player-controls]>div{
  min-height:0!important;
  margin:0!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=player-controls] button[data-testid=control-button-playpause]{
  transform:scale(1.15)!important;
  margin:0 6px!important
}

#sp-player-toggle{
  position:absolute;
  right:10px;
  top:50%;
  transform:translateY(-50%);
  background:rgba(255,255,255,0.1);
  border:1px solid rgba(255,255,255,0.08);
  color:#fff;
  width:28px;
  height:28px;
  border-radius:50%;
  cursor:pointer;
  z-index:5;
  font-size:11px;
  line-height:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  opacity:0.7;
  transition:opacity 0.2s
}
#sp-player-toggle:hover{opacity:1;background:rgba(255,255,255,0.2)}

aside[data-testid=now-playing-bar] button[aria-label*="scroll"],
aside[data-testid=now-playing-bar] button[aria-label*="info"],
aside[data-testid=now-playing-bar] [class*="chevron"],
aside[data-testid=now-playing-bar] [class*="Chevron"],
aside[data-testid=now-playing-bar] button[aria-label*="Play from"],
aside[data-testid=now-playing-bar] button[aria-label*="Queue"]{display:none!important}

aside[data-testid=now-playing-bar]:not(.minimized)>div:first-child{
  flex-direction:column!important;
  height:auto!important;
  padding:8px 8px 6px!important
}
aside[data-testid=now-playing-bar]>div>div{width:100%!important}
aside[data-testid=now-playing-bar]:not(.minimized)>div>div:last-child>div{min-height:28px;margin:3px 6px}
aside[data-testid=now-playing-bar]:not(.minimized)>div>div:last-child button{transform:scale(1.1);margin:0 4px}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=general-controls]{margin:6px 0 8px!important}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=general-controls] button{transform:scale(1.2)!important;margin:0 6px!important}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=player-controls]{margin:2px 0!important}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=now-playing-widget]{justify-content:center;overflow:hidden}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=now-playing-widget]>div:last-child>button{transform:scale(1.15)}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=now-playing-widget]>div:nth-child(2){display:flex!important;overflow:hidden!important}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=now-playing-widget]>div:nth-child(2) span{font-size:13px!important;height:20px!important;margin:0!important}
aside[data-testid=now-playing-bar]:not(.minimized) div[data-testid=now-playing-widget]>div:nth-child(2)>div{min-width:auto;max-width:66%}
aside[data-testid=now-playing-bar]:not(.minimized)>div:first-child>div:last-child{
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  justify-content:center!important;
  gap:2px!important;
  padding:4px 0!important
}
aside[data-testid=now-playing-bar]:not(.minimized)>div:first-child>div:last-child button{transform:scale(0.85)!important}
aside[data-testid=now-playing-bar]:not(.minimized)>div:first-child>div:last-child [data-testid=volume-bar]{max-width:100px!important}

input[data-testid="search-input"],
input[aria-label="¿Qué quieres reproducir?"],
input[aria-label="What do you want to play?"]{display:none!important}
body.sp-search input[data-testid="search-input"],
body.sp-search input[aria-label="¿Qué quieres reproducir?"],
body.sp-search input[aria-label="What do you want to play?"]{display:flex!important}
body.sp-collection main>section>div:first-child{height:auto!important;min-height:auto!important;padding:10px}

form[role=search]{z-index:10;max-width:88%}

#Desktop_LeftSidebar_Id{
  width:0!important;
  min-width:0!important;
  overflow:hidden!important;
  display:none!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"]{
  display:flex!important;
  position:fixed!important;
  top:0!important;
  left:0!important;
  width:100vw!important;
  min-width:100vw!important;
  max-width:100vw!important;
  height:calc(100vh - 56px)!important;
  z-index:999!important;
  background:#121212!important;
  flex-direction:column!important;
  overflow:hidden!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"]>*{
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
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Expand Your Library"],
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Comprimir"],
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Expandir"]{display:none!important}
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
        document.body.appendChild(nav);
        updateActiveTab();
    }

    function handleTabClick(name) {
        const currentPath = location.pathname;

        if (name === 'library') {
            if (sidebarOverlayActive) {
                switchLs(true);
            } else {
                switchLs();
            }
            return;
        }

        if (sidebarOverlayActive) switchLs(true);

        if (name === 'search') {
            if (!currentPath.startsWith('/search')) {
                history.pushState(null, '', '/search');
                window.dispatchEvent(new PopStateEvent('popstate'));
            }
            return;
        }

        if (name === 'home') {
            if (currentPath !== '/') {
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

    const waitForBody = setInterval(() => {
        if (document.body) {
            clearInterval(waitForBody);
            lastPath = location.pathname;
            updateBodyClass();
            createBottomNav();
            firstFuck();
            hookHistory();
        }
    }, 100);
})();
