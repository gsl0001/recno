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

  /* ---------- scroll reveals ---------- */

  guard('reveal', function () {
    var revealables = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window) || prefersReduced()) {
      Array.prototype.forEach.call(revealables, function (el) { el.classList.add('is-in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    Array.prototype.forEach.call(revealables, function (el) { observer.observe(el); });
  });

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
    var autoTimer = null;
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
      // A manual run cancels the pending auto-run, so scrolling can never wipe
      // a result the visitor asked for.
      window.clearTimeout(autoTimer);
      autoTimer = null;
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

    if ('IntersectionObserver' in window && !prefersReduced()) {
      var scanObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          scanObserver.disconnect();
          autoTimer = window.setTimeout(runScan, 350);
        });
      }, { threshold: 0.4 });
      scanObserver.observe(scanRoot);
    }
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

  /* ---------- report builder ---------- */

  guard('report', function () {
    var report = document.getElementById('report');
    if (!report) return;

    var sheet = document.getElementById('sheet');
    var csvBlock = sheet.querySelector('[data-block="csv"]');
    var emptyNote = sheet.querySelector('[data-empty]');
    var footOut = report.querySelector('[data-report-foot]');
    var blockChips = document.querySelectorAll('[data-block-toggle]');
    var format = 'pdf';

    function chipFor(name) {
      return document.querySelector('[data-block-toggle="' + name + '"]');
    }

    function wants(name) {
      var chip = chipFor(name);
      return !chip || chip.getAttribute('aria-pressed') === 'true';
    }

    function render() {
      var isCsv = format === 'csv';
      var shown = 0;

      Array.prototype.forEach.call(sheet.querySelectorAll('.sheet__block'), function (block) {
        var visible = wants(block.getAttribute('data-block')) && !isCsv;
        block.hidden = !visible;
        if (visible) shown += 1;
      });

      csvBlock.hidden = !isCsv;
      emptyNote.hidden = isCsv || shown > 0;

      // CSV carries only the hours table, so the section chips have nothing to
      // act on. Disable them rather than let them confirm a change that is not
      // happening.
      Array.prototype.forEach.call(blockChips, function (chip) { chip.disabled = isCsv; });

      if (isCsv) {
        footOut.textContent = 'CSV · crew hours and cost · opens in a spreadsheet';
      } else if (shown === 0) {
        footOut.textContent = format.toUpperCase() + ' · nothing selected yet';
      } else {
        footOut.textContent = format.toUpperCase() + ' · ' +
          (wants('photos') ? '8 photos · ' : 'no photos · ') + 'ready to share';
      }
    }

    Array.prototype.forEach.call(blockChips, function (chip) {
      chip.addEventListener('click', function () {
        chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
        render();
      });
    });

    var tabs = report.querySelectorAll('[data-fmt]');
    Array.prototype.forEach.call(tabs, function (tab) {
      tab.addEventListener('click', function () {
        format = tab.getAttribute('data-fmt');
        Array.prototype.forEach.call(tabs, function (other) {
          other.setAttribute('aria-pressed', String(other === tab));
        });
        render();
      });
    });

    render();
  });

})();
