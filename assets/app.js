/* ==========================================================================
   Albertini Tuning — behaviour.
   Everything degrades safely: no GSAP, no vendor deps. If JS fails entirely
   the .no-js CSS keeps every section visible.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches ||
               root.getAttribute('data-motion') === 'off';
  var fine = matchMedia('(pointer: fine)').matches;

  /* ---------- loader ----------
     Skips entirely on a backgrounded tab, and always has a hard timeout so
     the page can never stay behind the curtain. */
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
    window.addEventListener('load', function () { setTimeout(finish, 500); });
    setTimeout(finish, 2600);              // safety net
  }

  /* ---------- hero kinetic reveal ----------
     setTimeout (not rAF) so a backgrounded tab still reveals the headline. */
  function initHero() {
    var run = function () {
      document.querySelectorAll('.hero__h1, .cta__h').forEach(function (el) { el.classList.add('is-live'); });
    };
    if (reduce) { run(); return; }
    setTimeout(run, 420);
    setTimeout(function () {                // safety: force-show if anything stalled
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
      img.style.transform = 'translate3d(0,' + (y * 0.18).toFixed(1) + 'px,0) scale(1.06)';
    };
    img.style.transform = 'scale(1.06)';
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var sel = '.head, .sv, .tint__demo, .shot, .q, .card, .place__map, .cta__in p, .cta__in .btn, .hero__facts, .foot__col, .foot__brand';
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
        el.style.transitionDelay = Math.min(Math.max(sibs, 0), 6) * 0.05 + 's';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
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
    var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    var dist = track.scrollWidth + gap;       // measure ONE set BEFORE duplicating
    track.innerHTML += track.innerHTML;       // duplicate the items, not the track
    track.style.setProperty('--marq-d', dist + 'px');
    if (reduce) track.style.animation = 'none';
  }

  /* ---------- tint visualiser ---------- */
  var LEVELS = [
    { vlt: 70, a: 0.30, name: 'בהיר מאוד',
      desc: 'כמעט שקוף מבחוץ. מוריד סינוור קל ושומר על ראות מלאה גם בנסיעת לילה.' },
    { vlt: 50, a: 0.52, name: 'בהיר',
      desc: 'מרגישים את ההבדל בחום ובסינוור, והרכב עדיין נראה פתוח ובהיר מבפנים.' },
    { vlt: 35, a: 0.68, name: 'בינוני',
      desc: 'האיזון הפופולרי — מראה נקי מבחוץ, הפחתת חום משמעותית ופרטיות סבירה.' },
    { vlt: 20, a: 0.82, name: 'כהה',
      desc: 'פרטיות גבוהה לנוסעים ולציוד שבתא המטען, עם מראה ספורטיבי בולט.' },
    { vlt: 5,  a: 0.93, name: 'כהה מאוד',
      desc: 'הכי כהה שיש — מבחוץ כמעט לא רואים פנימה. מתאים לחלונות אחוריים.' }
  ];

  function initTint() {
    var slider = document.getElementById('vlt');
    var film = document.getElementById('paneFilm');
    var num = document.getElementById('vltNum');
    var name = document.getElementById('vltName');
    var desc = document.getElementById('vltDesc');
    var badge = document.getElementById('paneBadge');
    if (!slider || !film) return;

    function paint() {
      var L = LEVELS[parseInt(slider.value, 10)] || LEVELS[0];
      film.style.opacity = L.a;
      num.textContent = L.vlt;
      name.textContent = L.name;
      desc.textContent = L.desc;
      badge.textContent = L.vlt + '%';
      slider.setAttribute('aria-valuetext', L.vlt + ' אחוז אור עובר — ' + L.name);
    }
    slider.addEventListener('input', paint);
    paint();
  }

  /* ---------- opening hours: live status + today ---------- */
  // index 0 = Sunday … 6 = Saturday, in minutes from midnight
  var HOURS = [
    [540, 1320], [540, 1320], [540, 1320], [540, 1320], [540, 1320],
    [540, 1110],            // Friday  09:00–18:30
    [1200, 1440]            // Saturday 20:00–24:00
  ];
  var DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  function fmt(min) {
    var h = Math.floor(min / 60) % 24, m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function initHours() {
    var chip = document.getElementById('statusChip');
    var txt = document.getElementById('statusTxt');
    var hrs = document.getElementById('statusHrs');
    var list = document.getElementById('hrs');

    var now = new Date();
    var d = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var today = HOURS[d];
    var open = !!today && mins >= today[0] && mins < today[1];

    if (list) {
      var li = list.querySelector('[data-day="' + d + '"]');
      if (li) li.classList.add('today');
    }

    if (!chip || !txt) return;
    chip.classList.add(open ? 'open' : 'shut');

    if (open) {
      txt.textContent = 'פתוח עכשיו';
      if (hrs) hrs.textContent = '· נסגר ב-' + fmt(today[1]);
    } else {
      txt.textContent = 'סגור כרגע';
      // find the next opening slot
      if (today && mins < today[0]) {
        if (hrs) hrs.textContent = '· נפתח היום ב-' + fmt(today[0]);
      } else {
        for (var i = 1; i <= 7; i++) {
          var nd = (d + i) % 7;
          if (HOURS[nd]) {
            if (hrs) hrs.textContent = '· נפתח ביום ' + DAY_NAMES[nd] + ' ב-' + fmt(HOURS[nd][0]);
            break;
          }
        }
      }
    }
  }

  /* ---------- work rail: drag to scroll ---------- */
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
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.14).toFixed(1) + 'px,' +
                                            ((e.clientY - r.top - r.height / 2) * 0.2).toFixed(1) + 'px)';
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
    initMarquee(); initReveals(); initTint(); initHours();
    initRail(); initMagnetic(); initAnchors();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
