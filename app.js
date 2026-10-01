/* Recno site interactions.
   Every demo on this page is a local illustration of an app behaviour.
   Nothing here contacts a server, and no visitor data is collected or stored
   remotely. Each block is wrapped so a failure in one cannot take down the rest. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function prefersReduced() {
    return reduceMotion.matches;
  }

  function guard(name, fn) {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) console.warn('Recno site: ' + name + ' failed', err);
    }
  }

  /* ---------- Sifter scan demo ----------
     Mirrors the real flow: photos near a saved job are matched and queued,
     everything else is left alone. The pattern is fixed so the count is honest. */

  guard('scan', function () {
    var ROLL = [
      'other', 'site', 'other', 'site', 'other', 'other',
      'site', 'other', 'other', 'site', 'other', 'site',
      'other', 'other', 'site', 'other', 'other', 'other'
    ];
    var PHOTOS = [
      'assets/tile-1.webp', 'assets/tile-2.webp', 'assets/tile-3.webp',
      'assets/tile-4.webp', 'assets/tile-5.webp', 'assets/tile-6.webp'
    ];
    var MATCH_LABEL = 'Henderson';

    var grid = document.getElementById('scan-grid');
    var scanRoot = document.getElementById('scan');
    if (!grid || !scanRoot) return;

    var countOut = scanRoot.querySelector('[data-scan-count]');
    var noteOut = scanRoot.querySelector('[data-scan-note]');
    var runBtn = scanRoot.querySelector('[data-scan-run]');
    var running = false;
    var runId = 0;
    var photoAt = 0;

    ROLL.forEach(function (kind) {
      var tile = document.createElement('div');
      tile.className = 'tile';
      tile.setAttribute('data-kind', kind);
      var art = document.createElement('span');
      art.className = 'tile__art';
      if (kind === 'site') {
        art.style.backgroundImage = 'url("' + PHOTOS[photoAt % PHOTOS.length] + '")';
        photoAt += 1;
      }
      var tag = document.createElement('span');
      tag.className = 'tile__tag';
      tile.appendChild(art);
      tile.appendChild(tag);
      grid.appendChild(tile);
    });

    var tiles = Array.prototype.slice.call(grid.children);
    var matchTotal = ROLL.filter(function (k) { return k === 'site'; }).length;

    function resetScan() {
      tiles.forEach(function (tile) {
        tile.classList.remove('is-matched', 'is-passed', 'is-scanning');
        tile.querySelector('.tile__tag').textContent = '';
      });
      countOut.textContent = '0';
      noteOut.textContent = 'Press run scan';
    }

    function settle(tile) {
      tile.classList.remove('is-scanning');
      if (tile.getAttribute('data-kind') === 'site') {
        tile.classList.add('is-matched');
        tile.querySelector('.tile__tag').textContent = MATCH_LABEL;
      } else {
        tile.classList.add('is-passed');
      }
    }

    function finish() {
      running = false;
      runBtn.textContent = 'Run scan again';
      countOut.textContent = String(matchTotal);
      noteOut.textContent = 'matches queued for review, out of ' + ROLL.length + ' photos';
    }

    function runScan() {
      if (running) return;

      running = true;
      runId += 1;
      var id = runId;
      resetScan();
      runBtn.textContent = 'Scanning';
      noteOut.textContent = 'checking photos against saved jobs';

      if (prefersReduced()) {
        tiles.forEach(settle);
        finish();
        return;
      }

      var found = 0;
      tiles.forEach(function (tile, i) {
        window.setTimeout(function () {
          if (id !== runId) return;
          tile.classList.add('is-scanning');
          window.setTimeout(function () {
            if (id !== runId) return;
            settle(tile);
            if (tile.getAttribute('data-kind') === 'site') {
              found += 1;
              countOut.textContent = String(found);
            }
            if (i === tiles.length - 1) finish();
          }, 240);
        }, i * 90);
      });
    }

    runBtn.addEventListener('click', runScan);

  });

  /* ---------- photo stamp builder ---------- */

  guard('stamp', function () {
    var stampOut = document.getElementById('stamp-out');
    if (!stampOut) return;
    var chips = document.querySelectorAll('[data-stamp-toggle]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var field = chip.getAttribute('data-stamp-toggle');
        var on = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', String(on));
        var line = stampOut.querySelector('[data-stamp="' + field + '"]');
        if (line) line.classList.toggle('is-off', !on);
      });
    });
  });

})();
