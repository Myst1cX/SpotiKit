// ==UserScript==
// @name         SpotiKit
// @namespace    https://github.com/kitbodega/SpotiKit
// @version      7.3.fork
// @description  SpotiKit — Mobile‑like layout for Spotify Web. Floating player, bottom nav, library overlay, and more.
// @author       kitbodega
// @match        https://open.spotify.com/*
// @match        https://www.spotify.com/*/account/*
// @match        https://www.spotify.com/*/premium/*
// @match        https://www.spotify.com/*/duo/*
// @match        https://www.spotify.com/*/student/*
// @match        https://www.spotify.com/*/family/*
// @match        https://payments.spotify.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// @homepageURL  https://github.com/Myst1cX/SpotiKit
// @supportURL   https://github.com/Myst1cX/SpotiKit/issues
// @updateURL    https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitMobileDesktop.user.js
// @downloadURL  https://raw.githubusercontent.com/Myst1cX/SpotiKit/main/SpotiKitMobileDesktop.user.js
// @icon         https://i.ibb.co/YF1nLPfK/2eca7229-ca6a-4ad6-8653-b80a6a0f8586.png
// ==/UserScript==

// RESOLVED (7.3.fork, Myst1cX):
// Added proper linking for installing the script via an userscript manager 

(function() {
    'use strict';

    const PINK = '#FFD2D7';
    const GREEN = '#1ed760';

    if (window.location.hostname === 'open.spotify.com') {

        let ulFlag = false;
        let ffDone = false;
        let pfint = null;

        let sidebarOverlayActive = false;

        window.switchLs = function(forceCollapse = false) {
            const leftSidebar = document.querySelector('#Desktop_LeftSidebar_Id');
            if (!leftSidebar) return;

            if (forceCollapse || sidebarOverlayActive) {
                delete leftSidebar.dataset.overlay;
                sidebarOverlayActive = false;
            } else {
                leftSidebar.dataset.overlay = 'true';
                sidebarOverlayActive = true;
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
                }, 100);
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
                            if (ariaLabelledBy && ariaLabelledBy.includes(':folder:')) { isFolder = true; break; }
                            const ariaDescribedBy = target.getAttribute('aria-describedby');
                            if (ariaDescribedBy && ariaDescribedBy.includes(':folder:')) { isFolder = true; break; }
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
            setupPlayerToggle();

            setTimeout(() => {
                setupLibraryButton();
                setupLibraryGrid();
                setupHomeButton();
                setupSearchInput();
                setupUserButton();
                setupPlayerToggle();
            }, 2000);

            const panelObserver = new MutationObserver(() => {
                const panel = document.querySelector('#Desktop_PanelContainer_Id');
                if (panel && panel.parentNode?.parentNode?.ariaHidden === 'false') {
                    const toggleBtn = panel.parentNode.parentNode.nextElementSibling?.querySelector('button');
                    if (toggleBtn) toggleBtn.click();
                }
            });
            const panelTarget = document.querySelector('#Desktop_PanelContainer_Id');
            if (panelTarget?.parentNode?.parentNode) {
                panelObserver.observe(panelTarget.parentNode.parentNode, { attributes: true, attributeFilter: ['aria-hidden'] });
            }
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
div[data-testid=root]{--panel-gap:0!important}
#main+div,#main+div>div{overflow:hidden!important;width:auto}
#main+div>div>div>div:nth-child(2)>div{width:100vw!important}

div[data-encore-id=banner],
#global-nav-bar>div:first-of-type,
#global-nav-bar a[href="/download"],
button[data-testid=fullscreen-mode-button],
div.main-view-container__mh-footer-container,
button[data-testid=upgrade-button],
a[href="/download"],
.wJiY1vDfuci2a4db,
button[aria-label="Expandir la vista Estás escuchando"],
button[aria-label="Ocultar la vista Estás escuchando"]
{display:none!important}

#sp-bottom-nav{
  position:fixed;
  bottom:0;
  left:0;
  right:0;
  height:56px;
  background:linear-gradient(to top,rgba(0,0,0,0.85),rgba(0,0,0,0.3),transparent)!important;
  border:none!important;
  display:flex;
  align-items:center;
  justify-content:space-around;
  z-index:9999;
  padding:0 8px;
}
#sp-bottom-nav button{
  flex:1;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:2px;
  background:none;
  border:none;
  color:#b3b3b3;
  cursor:pointer;
  padding:4px 0;
  transition:color 0.15s;
  height:100%;
  position:relative;
}
#sp-bottom-nav button.active{color:#fff}
#sp-bottom-nav button.active::after{
  display:none!important
}
#sp-bottom-nav button svg{width:24px;height:24px;fill:currentColor}
#sp-bottom-nav button span{font-size:10px;letter-spacing:0.5px;text-transform:none}

aside[data-testid=now-playing-bar]{
  min-width:calc(100% - 16px)!important;
  margin:0 8px!important;
  position:fixed!important;
  box-shadow:0 -4px 30px rgba(0,0,0,0.5)!important;
  background:rgba(40,8,8,0.65)!important;
  backdrop-filter:blur(20px)!important;
  -webkit-backdrop-filter:blur(20px)!important;
  border:1px solid rgba(255,255,255,0.06)!important;
  bottom:56px!important;
  z-index:30!important;
  border-radius:16px!important;
  transition:all 0.3s cubic-bezier(0.4,0,0.2,1)!important;
  overflow:hidden!important
}
aside[data-testid=now-playing-bar].minimized{
  max-height:52px!important;
  border-radius:26px!important;
  background:rgba(40,8,8,0.75)!important
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
aside[data-testid=now-playing-bar].minimized button._U5JgmMqsaP5tUK,
aside[data-testid=now-playing-bar].minimized>div:first-child>div:last-child{
  display:none!important
}
aside[data-testid=now-playing-bar].minimized>div:first-child{
  flex-direction:row!important;
  flex-wrap:nowrap!important;
  align-items:center!important;
  gap:6px!important;
  padding:0 38px 0 4px!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]{
  flex:1!important;
  min-width:0!important;
  flex-direction:row!important;
  align-items:center!important;
  gap:8px!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:first-child{
  width:36px!important;
  height:36px!important;
  min-width:36px!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:nth-child(2){
  overflow:hidden!important;
  max-width:55vw!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=now-playing-widget]>div:nth-child(2) span{
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  max-width:100%!important;
  font-size:12px!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=player-controls]{
  width:auto!important;
  margin:0!important;
  flex:none!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=player-controls]>div{
  min-height:0!important;
  margin:0!important
}
aside[data-testid=now-playing-bar].minimized div[data-testid=player-controls] button{
  transform:scale(0.9)!important;
  margin:0!important
}
#sp-player-toggle{
  position:absolute;
  right:8px;
  top:50%;
  transform:translateY(-50%);
  background:rgba(255,255,255,0.1);
  border:1px solid rgba(255,255,255,0.08);
  color:#fff;
  width:26px;
  height:26px;
  border-radius:50%;
  cursor:pointer;
  z-index:5;
  font-size:11px;
  line-height:1;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  opacity:0.6;
  transition:opacity 0.2s
}
#sp-player-toggle:hover{opacity:1;background:rgba(255,255,255,0.2)}
aside[data-testid=now-playing-bar] button[aria-label*="scroll"],
aside[data-testid=now-playing-bar] button[aria-label*="info"],
aside[data-testid=now-playing-bar] [class*="chevron"],
aside[data-testid=now-playing-bar] [class*="Chevron"],
aside[data-testid=now-playing-bar] button[aria-label*="Play from"],
aside[data-testid=now-playing-bar] button[aria-label*="Queue"]{
  display:none!important
}
aside[data-testid=now-playing-bar]>div:first-child{
  flex-direction:column!important;
  height:auto!important;
  padding:8px 8px 6px!important
}
aside[data-testid=now-playing-bar]>div>div{width:100%!important}
aside[data-testid=now-playing-bar]>div>div:last-child>div{min-height:28px;margin:3px 6px}
aside[data-testid=now-playing-bar]>div>div:last-child button{transform:scale(1.1);margin:0 4px}
div[data-testid=general-controls]{margin:6px 0 8px!important}
div[data-testid=general-controls] button{transform:scale(1.2)!important;margin:0 6px!important}
div[data-testid=player-controls]{margin:2px 0!important}
div[data-testid=now-playing-widget]{justify-content:center;overflow:hidden}
div[data-testid=now-playing-widget]>div:last-child>button{transform:scale(1.15)}
div[data-testid=now-playing-widget]>div:nth-child(2){display:flex!important;overflow:hidden!important}
div[data-testid=now-playing-widget]>div:nth-child(2) span{font-size:13px!important;height:20px!important;margin:0!important}
div[data-testid=now-playing-widget]>div:nth-child(2)>div{min-width:auto;max-width:66%}
aside[data-testid=now-playing-bar]>div:first-child>div:last-child{
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  justify-content:center!important;
  gap:2px!important;
  padding:4px 0!important
}
aside[data-testid=now-playing-bar]>div:first-child>div:last-child button{
  transform:scale(0.85)!important
}
aside[data-testid=now-playing-bar]>div:first-child>div:last-child [data-testid=volume-bar]{
  max-width:100px!important
}

input[data-testid="search-input"],
input[aria-label="¿Qué quieres reproducir?"],
input[aria-label="What do you want to play?"]{
  display:none!important
}
body.sp-search input[data-testid="search-input"],
body.sp-search input[aria-label="¿Qué quieres reproducir?"],
body.sp-search input[aria-label="What do you want to play?"]{
  display:flex!important
}
body.sp-collection main>section>div:first-child{
  height:auto!important;
  min-height:auto!important;
  padding:10px
}

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
  width:100%!important;
  min-width:100%!important;
  height:calc(100vh - 56px)!important;
  z-index:999!important;
  background:#121212!important;
  flex-direction:column!important;
  overflow-y:auto!important;
  overflow-x:hidden!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] [data-encore-id="text"],
#Desktop_LeftSidebar_Id[data-overlay="true"] span[data-encore-id="text"],
#Desktop_LeftSidebar_Id[data-overlay="true"] *[class*="Text"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="item-title"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="item-subtitle"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="playlist"] a,
#Desktop_LeftSidebar_Id[data-overlay="true"] a[href*="/playlist"],
#Desktop_LeftSidebar_Id[data-overlay="true"] a[href*="/collection"]{
  display:block!important;
  width:auto!important;
  min-width:auto!important;
  max-width:none!important;
  opacity:1!important;
  visibility:visible!important;
  color:inherit!important;
  pointer-events:auto!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="row"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="listitem"],
#Desktop_LeftSidebar_Id[data-overlay="true"] .main-yourLibraryX-listItem,
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="gridcell"]{
  display:flex!important;
  flex-direction:row!important;
  align-items:center!important;
  width:100%!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] img[data-testid="cover-art-image"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="row"] img,
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="listitem"] img,
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="cover-art"] img{
  margin-right:12px!important;
  flex-shrink:0!important;
  width:48px!important;
  height:48px!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] .YourLibraryX,
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="listitem"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="row"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="listitem"]>div,
#Desktop_LeftSidebar_Id[data-overlay="true"] [role="row"]>div,
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="listItem"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="ListItem"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="Row"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="row"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="Card"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="card"]{
  background:transparent!important;
  background-color:transparent!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] [data-encore-id="text"],
#Desktop_LeftSidebar_Id[data-overlay="true"] span[class*="Text"],
#Desktop_LeftSidebar_Id[data-overlay="true"] div[class*="text"],
#Desktop_LeftSidebar_Id[data-overlay="true"] span[class*="type"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="title"],
#Desktop_LeftSidebar_Id[data-overlay="true"] [class*="subtitle"]{
  overflow:visible!important;
  position:relative!important;
  z-index:1!important;
  height:auto!important;
  min-height:18px!important
}
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Collapse"],
#Desktop_LeftSidebar_Id[data-overlay="true"] button[aria-label*="Expand"]{
  display:none!important
}
#Desktop_LeftSidebar_Id>nav>div{min-height:48px;border-radius:25px}
.YourLibraryX{background:var(--background-elevated-base)!important}
.YourLibraryX header{padding:14px}

#main-view,div[data-testid=main-view],.Root__main-view,
#main-view+div,#main-view+div>div,#main-view+div>div>div,
div[data-testid=root]>div:first-child>div:first-child{
  margin-left:0!important;
  padding-left:0!important
}
div[data-testid=root]{--panel-gap:0!important}

section[data-testid=artist-page]>div>div:first-child:not([data-encore-id]){height:25vh}
div[data-testid=tracklist-row]{padding:0 10px 0 0;grid-gap:0}
div[data-testid=tracklist-row] button:not([data-testid=add-to-playlist-button]){transform:scale(1.3)!important;opacity:0.6!important}
div[data-testid=tracklist-row] button:hover{color:#2d6!important}
div[data-testid=tracklist-row]>div:first-child>div:first-child{height:24px;min-height:24px;min-width:24px;margin:0 8px!important}
[aria-colcount="3"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,4fr)) [last] minmax(82px,var(--col2,1fr))!important}
[aria-colcount="4"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,4fr)) [var1] minmax(120px,var(--col2,2fr)) [last] minmax(82px,var(--col3,1fr))!important}
[aria-colcount="5"] div[data-testid=tracklist-row]{grid-template-columns:[index] var(--tracklist-index-column-width,40px) [first] minmax(120px,var(--col1,6fr)) [var1] minmax(120px,var(--col2,4fr)) [var2] minmax(120px,var(--col3,3fr)) [last] minmax(82px,var(--col4,1fr))!important}
*{--content-spacing:10px}
section[data-testid=home-page] .contentSpacing{padding:0 10px!important;overflow:hidden}
div[data-testid=grid-container]{margin-inline:0!important;column-gap:0!important;overflow:hidden!important}
div[data-testid=action-bar-row],div[data-testid=topbar-content]{padding:5px 10px}
div[data-testid=track-list]>div:first-child,div[data-testid=playlist-tracklist]>div:first-child{margin:0!important;padding:0!important}
main>section:not([data-testid=artist-page])>div:first-child{height:auto!important;min-height:auto!important;padding:10px}
main>section h1.encore-text-headline-large{font-size:22px!important}
section[data-testid=artist-page] span.encore-text-headline-large{font-size:26px!important}
section[data-testid=artist-page] div[data-testid=grid-container] h2,section[data-testid=artist-page] section[data-testid=component-shelf]{padding:0 10px}
.Root__top-container{
  grid-template-columns:auto 1fr auto!important
}
#Desktop_PanelContainer_Id{
  display:flex!important;
  flex-direction:column!important;
  overflow-y:auto!important
}
div.IPnR0MPdiJw3m3C8.rd25SoWs7Y4T40c7,
button[aria-label="Comprimir Tu biblioteca"],
button[aria-label="Collapse Your library"]{
  display:none!important
}
button[data-testid="npv-artist-bio-button"],
.tDBAoTKiCjMk1wxv{
  display:none!important;
  height:0px!important
}
.qy8cKKS5c5Y24cTG{
  display:none!important
}
.lhB5KQbFP8BJIgvI{
  flex:1!important;
  overflow-y:auto!important
}
ul.oPf3qKGRkUM3T0bK{
  display:block!important;
  overflow-y:auto!important
}
            `;
            document.head.appendChild(style);
        }

        function getSpotifySVG(tabName) {
            const selectors = {
                home: '#global-nav-bar button[data-testid=home-button] svg, nav a[href="/"] svg, [aria-label="Home"] svg',
                search: 'form[role=search] svg, a[href="/search"] svg, [aria-label="Search"] svg',
                library: '#Desktop_LeftSidebar_Id header button svg, [aria-label*="Library"] svg, [aria-label*="Biblioteca"] svg'
            };
            const el = document.querySelector(selectors[tabName]);
            return el ? el.outerHTML : null;
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

            const tabNames = ['home', 'search', 'library'];
            const tabLabels = { home: 'Home', search: 'Search', library: 'Library' };
            const tabPaths = { home: '/', search: '/search', library: '/collection/playlists' };

            tabNames.forEach(name => {
                const btn = document.createElement('button');
                btn.dataset.tab = name;
                const svg = getSpotifySVG(name) || FALLBACK_SVGS[name];
                btn.innerHTML = `${svg}<span>${tabLabels[name]}</span>`;
                btn.addEventListener('click', () => handleTabClick(name));
                nav.appendChild(btn);
            });

            document.body.appendChild(nav);
            updateActiveTab();

            setTimeout(() => {
                document.querySelectorAll('#sp-bottom-nav button').forEach(btn => {
                    const name = btn.dataset.tab;
                    const realSvg = getSpotifySVG(name);
                    if (realSvg) {
                        const existingSvg = btn.querySelector('svg');
                        if (existingSvg && existingSvg.outerHTML !== realSvg) {
                            existingSvg.outerHTML = realSvg;
                        }
                    }
                });
            }, 3000);
        }

        function handleTabClick(name) {
            const currentPath = window.location.pathname;

            if (name === 'library') {
                if (sidebarOverlayActive) {
                    switchLs(true);
                } else {
                    closeNowPlay();
                    switchLs();
                }
                return;
            }

            if (name === 'search') {
                if (sidebarOverlayActive) switchLs(true);
                closeNowPlay();
                if (!currentPath.startsWith('/search')) {
                    history.pushState(null, '', '/search');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }
                return;
            }

            if (name === 'home') {
                if (sidebarOverlayActive) switchLs(true);
                closeNowPlay();
                if (currentPath !== '/') {
                    history.pushState(null, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                }
                return;
            }
        }

        function updateActiveTab() {
            const path = window.location.pathname;
            let active = null;
            if (sidebarOverlayActive) active = 'library';
            else if (path === '/' || path === '/home') active = 'home';
            else if (path.startsWith('/search')) active = 'search';
            else if (path.startsWith('/collection')) active = 'library';
            document.querySelectorAll('#sp-bottom-nav button').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === active);
            });
        }

        function updateHomeVisibility() {
            const path = window.location.pathname;
            const isHome = path === '/' || path === '/home';
            const isSearch = path.startsWith('/search');
            const isCollection = path.startsWith('/collection');
            document.body.classList.toggle('sp-home', isHome);
            document.body.classList.toggle('sp-search', isSearch);
            document.body.classList.toggle('sp-collection', isCollection);
        }

        injectMobileCSS();

        const waitForBody = setInterval(() => {
            if (document.body) {
                clearInterval(waitForBody);
                updateHomeVisibility();
                createBottomNav();
                firstFuck();
                setInterval(() => {
                    updateActiveTab();
                    updateHomeVisibility();
                    setupPlayerToggle();
                }, 500);


            }
        }, 100);
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
            window.location.replace('https://open.spotify.com/');
        }

        if (window.location.hostname === 'payments.spotify.com' && !document.querySelector('.__sp_pay_done')) {
            window.location.replace('https://open.spotify.com/');
        }
    }

    setTimeout(run, 300);
    setTimeout(run, 2000);

    // Ad blocking — adapted from Spotify AdBlocker by Plancy
    const removeAdElements = () => {
        document.querySelectorAll('[data-testid="ad-slot-container"], [class*="ad-"]').forEach(el => el.remove());
        const audioAd = document.querySelector('audio[src*="spotify.com/ad"]');
        if (audioAd) {
            audioAd.src = "";
            audioAd.pause();
        }
    };

    const adObserver = new MutationObserver(removeAdElements);
    adObserver.observe(document.body, { childList: true, subtree: true });
    setInterval(removeAdElements, 1000);

    // Skip ads via player state
    setInterval(() => {
        let isAd = false;

        try {
            const state = window.sp?.player?._state || window.Spotify?.Player?._state;
            const track = state?.track || state?.item;
            if (track && track.id === "Spotify-Advertisement") {
                isAd = true;
            }
        } catch (e) {}

        if (!isAd) {
            const artistEl = document.querySelector('[data-testid="context-item-info-artist"]');
            if (artistEl && artistEl.textContent.trim() === 'Advertisement') {
                isAd = true;
            }
        }

        if (isAd) {
            const nextBtn = document.querySelector('button[data-testid="control-button-skip-forward"]');
            if (nextBtn) nextBtn.click();
        }
    }, 500);

})();
