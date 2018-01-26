// ==UserScript==
// @name         MangaDex Reader fullscreen
// @namespace    Teasday
// @version      0.3
// @license      CC-BY-NC-SA-4.0
// @description  Adds a fullscreen viewer to MangaDex
// @author       Teasday, Eva
// @match        https://mangadex.com/chapter/*
// @icon         https://mangadex.com/favicon.ico
// @homepage     https://ewasion.github.io/userscripts/mangadex-fullscreen/
// @updateURL    https://raw.githubusercontent.com/ewasion/userscripts/master/mangadex-fullscreen/mangadex-fullscreen.meta.js
// @downloadURL  https://raw.githubusercontent.com/ewasion/userscripts/master/mangadex-fullscreen/mangadex-fullscreen.user.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // add css

  const addStyle = function (css) {
    const head = document.getElementsByTagName('head')[0];
    if (!head) return;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
  };

  addStyle(`
#reader-container {
  position: relative;
  width: calc(100vw - 15px);
  left: calc(-50vw + 50%);
  padding: 0 5px;
}
#reader-container.fullscreen {
  z-index: 2000;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0;
  margin: 0;
  background: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100%;
  width: auto;
}
#reader-container.fullscreen.fitwidth {
  height: auto;
}
img.reader {
  width: auto;
  max-height: calc(100vh - 50px);
}
#reader-container.fullscreen img.reader {
  height: 100%;
  max-height: 100%;
  max-width: none;
}
#reader-container.fitwidth img.reader {
  height: auto;
  max-height: none;
  max-width: 100%;
}

#reader-size-controls {
  display: none;
  cursor: pointer;
  float: right;
  text-align: right;
  margin: 5px;
  font-size: 2em;
  color: #ddd;
  text-shadow: #000 1px 1px 4px;
}
#reader-container.fullscreen ~ #reader-size-controls {
  z-index: 2020;
  position: fixed;
  display: block;
  top: 5px;
  right: 5px;
  opacity: 0.3;
  transition: all 0.4s;
}
#reader-container.fullscreen ~ #reader-size-controls:hover {
  opacity: 1;
  background: rgba(0, 0, 0, .4);
  box-shadow: 0 0 25px 15px rgba(0, 0, 0, .4);
}
#reader-container.fullscreen ~ #reader-size-controls > div:hover {
  color: #fff;
  text-shadow: #fff 0 0 10px;
  transition: all 0.25s;
}

#reader-page-controls,
#reader-page-controls div {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
}
#reader-page-controls .prev-page { left: 0;  width: 50%; }
#reader-page-controls .next-page { right: 0; width: 50%; }
#reader-page-controls .prev-chapter { left: 0;  width: 20%; }
#reader-page-controls .next-chapter { right: 0; width: 20%; }

#reader-page-controls .prev-chapter,
#reader-page-controls .next-chapter {
  opacity: 0;
  font-weight: bold;
  font-size: 5vh;
  background: radial-gradient(ellipse at center, rgba(10, 10, 10, .6) 0%, rgba(10, 10, 10, 0) 60%);
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, .8);
}
#reader-page-controls .prev-chapter:before {
  content: '\xAB';
  left: 0;
}
#reader-page-controls .next-chapter:before {
  content: '\xBB';
  right: 0;
}
#reader-page-controls .prev-chapter:hover,
#reader-page-controls .next-chapter:hover {
  opacity: 0.9;
}

.footer { height: auto; }
.footer > p { margin-bottom: 0; }
`);

  // control button data

  const controls = {
    fullscreen: {
      icon: 'expand-arrows-alt',
      titles: ['Enter fullscreen', 'Exit fullscreen']
    },
    fitwidth: {
      icon: 'expand',
      titles: ['Fit to width (or auto)', 'Fit to height']
    }
  };

  // add html

  const content = document.getElementById('content');

  const sizeControls = document.createElement('div');
  sizeControls.id = 'reader-size-controls';
  sizeControls.innerHTML = Object.entries(controls).reduce(function(acc, ctrl) {
    return `${acc}<div class="control-${ctrl[0]}"><i class="fas fa-${ctrl[1].icon}"></i></div>`;
  }, '');

  const newCol = document.createElement('div');
  newCol.classList.add('col-sm-2');
  newCol.innerHTML = Object.entries(controls).reduce(function(acc, ctrl, i) {
    return `${acc}<button type="button" role="button" class="btn btn-default pull-right control-${ctrl[0]}"><i class="fas fa-${ctrl[1].icon}"></i></button>`;
  }, '');

  content.children[0].children[2].classList.replace('col-sm-3', 'col-sm-2');
  content.children[0].children[3].classList.replace('col-sm-3', 'col-sm-2');
  content.children[0].appendChild(newCol);

  const readerContainer = document.createElement('div');
  readerContainer.id = 'reader-container';
  readerContainer.appendChild(document.getElementById('current_page'));
  content.insertBefore(readerContainer, content.firstElementChild.nextSibling);
  content.appendChild(sizeControls);

  const pageControls = document.createElement('div');
  pageControls.id = 'reader-page-controls';
  pageControls.innerHTML = `<div class="prev-page"><div class="prev-chapter"></div></div><div class="next-page"><div class="next-chapter"></div></div>`;
  readerContainer.appendChild(pageControls);

  pageControls.querySelector('.prev-page').addEventListener('click', function(evt) {
    const cur = document.querySelector('[data-id="jump_page"] + .dropdown-menu .selected');
    if (cur.previousElementSibling) {
      cur.previousElementSibling.firstElementChild.click();
    } else {
      this.firstElementChild.click();
    }
  });
  pageControls.querySelector('.prev-chapter').addEventListener('click', function(evt) {
    evt.stopPropagation();
    const cur = document.querySelector('[data-id="jump_chapter"] + .dropdown-menu .selected');
    if (cur.previousElementSibling) {
      cur.previousElementSibling.firstElementChild.click();
    } else {
      content.firstElementChild.firstElementChild.firstElementChild.nextElementSibling.click();
    }
  });
  pageControls.querySelector('.next-page').addEventListener('click', function(evt) {
    const cur = document.querySelector('[data-id="jump_page"] + .dropdown-menu .selected');
    if (cur.nextElementSibling) {
      cur.nextElementSibling.firstElementChild.click();
    } else {
      this.firstElementChild.click();
    }
  });
  pageControls.querySelector('.next-chapter').addEventListener('click', function(evt) {
    evt.stopPropagation();
    const cur = document.querySelector('[data-id="jump_chapter"] + .dropdown-menu .selected');
    if (cur.nextElementSibling) {
      cur.nextElementSibling.firstElementChild.click();
    } else {
      content.firstElementChild.firstElementChild.firstElementChild.nextElementSibling.click();
    }
  });

  // actual js

  const updateCtrl = function(ctrl, val) {
    localStorage.setItem(`reader.${ctrl}`, val);
    for (const btn of document.querySelectorAll(`.control-${ctrl}`)) {
      btn.title = controls[ctrl].titles[val ? 1 : 0];
      readerContainer.classList.toggle(`${ctrl}`, val);
    }
  };
  const updateAll = function() {
    for (let ctrl of Object.keys(controls)) {
      updateCtrl(ctrl, localStorage.getItem(`reader.${ctrl}`) === 'true');
    }
  };
  const listenBtnClick = function(ctrl) {
    for (const btn of document.querySelectorAll(`.control-${ctrl}`)) {
      btn.addEventListener('click', function() {
        updateCtrl(ctrl, localStorage.getItem(`reader.${ctrl}`) !== 'true');
      }, false);
    }
  };

  Object.keys(controls).map(listenBtnClick);
  window.addEventListener('focus', updateAll, false);
  updateAll();
})();