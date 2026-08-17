/* ==========================================================================
   Albertini Tuning — behaviour.
   No vendor dependencies. If JS fails entirely the .no-js CSS keeps every
   section visible.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches ||
               root.getAttribute('data-motion') === 'off';
  var fine = matchMedia('(pointer: fine)').matches;

  /* ---------- loader ----------
     Skipped on a backgrounded tab, and always has a hard timeout so the page
     can never stay stuck behind the curtain. */
  function initLoader() {
    var el = document.getElementById('ldr');
    if (!el) return;
    var done = false;
    var finish = function () {
      if (done) return;
      done = true;
      el.classList.add('done');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
    };
    if (reduce || document.hidden) { finish(); return; }
    window.addEventListener('load', function () { setTimeout(finish, 450); });
    setTimeout(finish, 2500);
  }

  /* ---------- hero reveal ----------
     setTimeout (not rAF) so a backgrounded tab still reveals the headline. */
  function initHero() {
    var run = function () {
      document.querySelectorAll('.hero__h1, .cta__h').forEach(function (el) { el.classList.add('is-live'); });
    };
    if (reduce) { run(); return; }
    setTimeout(run, 380);
    setTimeout(function () {
      document.querySelectorAll('.ln > i').forEach(function (i) { i.style.transform = 'none'; });
    }, 3200);
  }

  /* ---------- nav, drawer, sticky CTA ---------- */
  function initChrome() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    var drawer = document.getElementById('drawer');
    var mcta = document.getElementById('mcta');
    var hero = document.getElementById('top');

    function close() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      nav.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = !drawer.classList.contains('is-open');
        drawer.classList.toggle('is-open', open);
        nav.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
      });
      drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) { close(); burger.focus(); }
      });
    }

    var onScroll = function () {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('is-stuck', y > 12);
      if (mcta && hero) {
        var show = y > hero.offsetHeight * 0.7;
        mcta.classList.toggle('on', show);
        document.body.classList.toggle('mcta-on', show);
        mcta.setAttribute('aria-hidden', show ? 'false' : 'true');
        mcta.setAttribute('tabindex', show ? '0' : '-1');
      }
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- hero parallax ---------- */
  function initParallax() {
    var img = document.getElementById('heroImg');
    var hero = document.getElementById('top');
    if (!img || !hero || reduce) return;
    var raf = 0;
    var apply = function () {
      raf = 0;
      var y = window.scrollY;
      if (y > hero.offsetHeight) return;
      img.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(1) + 'px,0) scale(1.06)';
    };
    img.style.transform = 'scale(1.06)';
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var sel = '.work__title, .row__media, .row__body, .more, .gal__head, .shot, ' +
              '.rev__top, .q, .place__title, .card, .place__map, .cta__in p, .cta__in .btn, ' +
              '.foot__col, .foot__brand';
    var els = [].slice.call(document.querySelectorAll(sel));
    els.forEach(function (el) { el.classList.add('rise'); });

    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = el.parentElement ? [].slice.call(el.parentElement.children).indexOf(el) : 0;
        el.style.transitionDelay = Math.min(Math.max(sibs, 0), 5) * 0.06 + 's';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });

    // resilience: anything still hidden but on-screen after 3s gets shown
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 3000);
  }

  /* ---------- marquee: exact-pixel seamless loop ---------- */
  function initMarquee() {
    var track = document.getElementById('marqTrack');
    if (!track) return;

    var setCount = track.children.length;
    var html = track.innerHTML;

    // Repeat until two full sets comfortably exceed the viewport, otherwise a
    // wide screen runs out of content mid-cycle and the strip goes blank.
    var copies = 2;
    track.innerHTML = html + html;
    while (track.scrollWidth < window.innerWidth * 2 && copies < 6) {
      track.innerHTML += html;
      copies++;
    }

    // Measure the real distance between the start of copy 1 and copy 2 rather
    // than trusting scrollWidth — rounding across many items drifts, and any
    // drift shows up as a visible jump every cycle.
    function measure() {
      var a = track.children[0].getBoundingClientRect().left;
      var b = track.children[setCount].getBoundingClientRect().left;
      var dist = Math.abs(b - a);
      if (dist > 0) track.style.setProperty('--marq-d', dist + 'px');
    }
    measure();
    addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    if (reduce) track.style.animation = 'none';
  }

  /* ---------- before / after: dragged by hand ---------- */
  function initBA() {
    var stage = document.getElementById('baStage');
    if (!stage) return;

    var p = 0.5;
    function set(v) {
      p = v < 0 ? 0 : v > 1 ? 1 : v;
      stage.style.setProperty('--p', p.toFixed(4));
      stage.setAttribute('aria-valuenow', Math.round(p * 100));
    }
    // RTL: the divider travels from the right edge leftwards, so p is measured
    // from the right — dragging left uncovers the "after" frame.
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      set((r.right - e.clientX) / r.width);
    }

    var down = false;
    stage.addEventListener('pointerdown', function (e) {
      down = true;
      stage.classList.add('is-drag');
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      fromEvent(e);
      e.preventDefault();
    });
    stage.addEventListener('pointermove', function (e) { if (down) fromEvent(e); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
      stage.addEventListener(ev, function () { down = false; stage.classList.remove('is-drag'); });
    });

    // keyboard equivalent so the comparison isn't mouse-only
    stage.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 0.12 : 0.05;
      if (e.key === 'ArrowLeft') { set(p + step); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { set(p - step); e.preventDefault(); }
      else if (e.key === 'Home') { set(0); e.preventDefault(); }
      else if (e.key === 'End') { set(1); e.preventDefault(); }
    });

    set(0.5);
  }

  /* ---------- opening hours: highlight today ---------- */
  function initHours() {
    var list = document.getElementById('hrs');
    if (!list) return;
    var li = list.querySelector('[data-day="' + new Date().getDay() + '"]');
    if (li) li.classList.add('today');
  }

  /* ---------- gallery rail: drag to scroll ---------- */
  function initRail() {
    var rail = document.getElementById('rail');
    if (!rail || !fine) return;
    var down = false, startX = 0, startL = 0;
    rail.addEventListener('pointerdown', function (e) {
      down = true; startX = e.clientX; startL = rail.scrollLeft;
      rail.setPointerCapture(e.pointerId); rail.style.cursor = 'grabbing';
    });
    rail.addEventListener('pointermove', function (e) {
      if (!down) return;
      rail.scrollLeft = startL - (e.clientX - startX);
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      rail.addEventListener(ev, function () { down = false; rail.style.cursor = ''; });
    });
  }

  /* ---------- magnetic buttons (fine pointers only) ---------- */
  function initMagnetic() {
    if (!fine || reduce) return;
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.13).toFixed(1) + 'px,' +
                                            ((e.clientY - r.top - r.height / 2) * 0.18).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- anchors ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    var y = document.getElementById('yr');
    if (y) y.textContent = new Date().getFullYear();
    initLoader(); initChrome(); initHero(); initParallax();
    initMarquee(); initReveals(); initBA(); initHours(); initRail();
    initMagnetic(); initAnchors();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
