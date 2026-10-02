/* pampawarro.org: the one script. No dependencies. Four independent parts:
   1. the MENU bar (phones): toggles the collapsed panel above it
   2. the home video: a click on the thumbnail swaps in the YouTube player
   3. the gallery strip slider (the 7 gallery pages)
   4. the "Crew" card on /ethos: sizing fallback for browsers without CSS round() */
(function () {
  'use strict';

  // runs once per page: a second <script> tag would otherwise bind every listener twice
  if (document.documentElement.hasAttribute('data-site-js')) return;
  document.documentElement.setAttribute('data-site-js', '');

  /* ---------- 1. mobile menu ---------- */
  var toggle = document.querySelector('.menu-bar__toggle');
  var panel = document.getElementById('mobile-menu');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- 2. video ----------
     A click anywhere on the overlay (or Enter / Space on the Play button) inserts the YouTube
     iframe right after the overlay, with the attributes the original embed used, and the
     overlay fades out (1s, see .video__overlay). */
  Array.prototype.forEach.call(document.querySelectorAll('.video'), function (video) {
    var overlay = video.querySelector('.video__overlay');
    if (!overlay) return;
    overlay.addEventListener('click', function (e) {
      if (video.classList.contains('is-playing')) return;
      var iframe = document.createElement('iframe');
      iframe.src = video.getAttribute('data-embed-src');
      iframe.width = '854';
      iframe.height = '480';
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('title', video.getAttribute('data-embed-title') || 'Video');
      overlay.parentNode.insertBefore(iframe, overlay.nextSibling);
      video.classList.add('is-playing');
      // Enter / Space on the Play button arrive as a click with detail 0: the overlay is about to
      // leave the tab order, so keyboard focus moves into the player. A mouse click leaves focus
      // where it was, as on the original.
      if (e.detail === 0) iframe.focus({ preventScroll: true });
    });
  });

  /* ---------- 3. gallery strip ----------
     One slide is active. The track is shifted so the active slide is centred, clamped so the
     first slide sits flush left and the last flush right. Click a slide to activate it, click
     the active one for the next; ArrowLeft / ArrowRight work anywhere on the page while the
     strip is on screen. Every move is a 500ms ease-out-quart animation of `left`, and input
     that arrives while the track is moving is dropped (not queued). Next after the last slide
     wraps to the first, previous before the first wraps to the last. No swipe, drag or wheel. */
  var strip = document.querySelector('[data-strip]');
  var slides = strip ? Array.prototype.slice.call(strip.querySelectorAll('[data-slide]')) : [];
  if (slides.length) {                                               // a strip emptied of its slides is left alone
    var track = strip.querySelector('[data-track]');
    var n = slides.length;
    var DURATION = 500;                                              // ms
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    var index = 0;
    var inMotion = false;
    var anim = null;                                                 // { raf, to }
    var left = 0;

    var ease = function (p) { return 1 - Math.pow(1 - p, 4); };     // ease-out quart

    var setLeft = function (v) { left = v; track.style.left = v + 'px'; };

    // Integer widths (offsetWidth), exactly like the original: the offsets come out identical.
    var targetOffset = function () {
      var cw = strip.offsetWidth;
      var total = 0;
      var before = 0;
      for (var i = 0; i < n; i++) {
        var w = slides[i].offsetWidth;
        if (i < index) before += w;
        total += w;
      }
      var off = before - (cw - slides[index].offsetWidth) / 2;       // centre the active slide
      if (off < 0) off = 0;                                          // first slides: flush left
      if (total < cw) off = (cw - total) / -2;                       // track shorter than the strip
      else if (off > total - cw) off = total - cw;                   // last slides: flush right
      return { off: off, total: total };
    };

    var finishAnim = function () {
      if (!anim) return;
      cancelAnimationFrame(anim.raf);
      setLeft(anim.to);
      anim = null;
      inMotion = false;
    };

    // animated: index changes and the end of a resize. Not animated: first layout and whenever a
    // slide changes width because its image (or a larger variant of it) has loaded.
    var sync = function (animated) {
      var t = targetOffset();
      track.style.width = 2 * t.total + 'px';                        // as the original: room for twice the slides
      var to = -t.off;
      if (!animated || (reduceMotion && reduceMotion.matches)) {
        if (anim) anim.to = to;                                      // retarget, do not restart
        else setLeft(to);
        return;
      }
      finishAnim();                                                  // a running animation jumps to its end first
      var from = left;
      var start = performance.now();
      inMotion = true;
      anim = { to: to, raf: 0 };
      var step = function (now) {
        var p = (now - start) / DURATION;
        if (p >= 1) { finishAnim(); return; }
        setLeft(from + (anim.to - from) * ease(p < 0 ? 0 : p));
        anim.raf = requestAnimationFrame(step);
      };
      anim.raf = requestAnimationFrame(step);
    };

    var mark = function () {
      for (var i = 0; i < n; i++) slides[i].setAttribute('aria-current', i === index ? 'true' : 'false');
    };

    var go = function (i) {
      if (inMotion) return;                                          // input is ignored while the track moves
      index = ((i % n) + n) % n;                                     // wraps in both directions
      mark();
      sync(true);
    };

    var resizeTimer = null;                                          // the pending resize re-sync, see below

    slides.forEach(function (img, k) {
      img.addEventListener('click', function () { go(k === index ? index + 1 : k); });
      // A slide changes width when its image loads (or fails and shows its alt text): re-sync.
      // A resize makes the browser fetch larger variants at once; one that arrives (from the
      // cache, in a few ms) before the debounced animated re-sync must not re-sync first, or the
      // track would jump to the new offset instead of gliding. A variant that arrives during
      // the glide retargets it (sync above).
      ['load', 'error'].forEach(function (type) {
        img.addEventListener(type, function () { if (resizeTimer === null) sync(false); });
      });
    });

    window.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;                // leave the browser's own shortcuts alone
      var t = e.target;
      if (t && t.closest && t.closest('textarea,input,[contenteditable]')) return;
      if (inMotion) return;
      var r = strip.getBoundingClientRect();
      var visible = r.bottom >= 0 && r.top <= window.innerHeight && r.right >= 0 && r.left <= window.innerWidth;
      if (!visible) return;
      e.preventDefault();
      go(index + (e.key === 'ArrowRight' ? 1 : -1));
    });

    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { resizeTimer = null; sync(true); }, 100);
    });

    mark();
    sync(false);
  }

  /* ---------- 4. "Crew" card sizing fallback ----------
     Modern browsers size the card text and switch to the stacked variant in CSS alone
     (site.css, section 7). Where CSS round() / container units are missing this does both,
     with the arithmetic the original used. (?fit=js forces this path, for testing.) */
  if (document.querySelector('.collage')) {
    var forced = /[?&]fit=js\b/.test(location.search);
    var native = window.CSS && CSS.supports && CSS.supports('font-size', 'round(down, 1cqw, 1px)');
    if (!native || forced) {
      document.documentElement.setAttribute('data-collage', 'js');   // switches the CSS path off
      var fit = function () {
        var vw = window.innerWidth;
        var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        var i;
        var boxes = document.querySelectorAll('.collage');
        for (i = 0; i < boxes.length; i++) boxes[i].classList.toggle('is-stacked', boxes[i].offsetWidth < 415);
        var els = document.querySelectorAll('.collage__title, .collage__subtitle');
        for (i = 0; i < els.length; i++) {
          var el = els[i];
          var k = el.classList.contains('collage__title') ? 0.12 : 0.044;
          var pct = Math.floor((el.offsetWidth / vw) * 1e3) / 10;    // % of the viewport, one decimal, floored
          var px = Math.max(0.75 * rem, (pct / 100) * k * vw);       // max(.75rem, pct% of 12vw | 4.4vw)
          el.style.fontSize = (Math.floor(px) <= 13 ? 13 : px) + 'px';
        }
      };
      fit();
      window.addEventListener('resize', fit);
    }
  }
})();
