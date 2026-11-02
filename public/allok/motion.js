/* allok · motion.js — every motion closes a loop.
   No dependencies. It reads data attributes and adds classes; allok.css (bundle.css) does the moving.
   Load it once, deferred. It starts by itself; after rendering new markup call AllokMotion.init(root).

   data-reveal[="up|row|fade|rise|window|stage|field|route|close|none"]  .is-in once, when 15% is in view
   data-stagger          on a parent: its reveals get --i = 0, 1, 2…  (delay = --i × duration-stagger)
   data-run [data-hold]  a scripted demo. Children data-step, in order (or by data-order):
                         data-wait="ms" before it · data-add="class" (default is-on) · data-type="ms" typing beat
                         data-for="ms" switches it off again · data-count="0:42" counts up (data-count-ms)
   data-run-toggle       the Pause / Play button of a run
   data-tick="ISO date"  countdown; digits roll as they change
   data-reading          a list: the item nearest the middle of the screen gets .is-lit
   data-parallax="0.06"  drifts against the scroll, ±24 px at most
   data-hide-on-scroll   a sticky header that slides away going down and comes back going up
   data-loop="ms"        replays its reveals every ms while in view (spec cards)
   data-replay           click to replay its reveals
   data-cycle="class"    toggles a class while in view (data-cycle-ms, data-cycle-on) (spec cards)
   data-autoscroll="ms"  scrolls itself down and back up; reveals inside use it as their viewport (spec cards)

   With prefers-reduced-motion: reduce nothing moves: everything is shown in its final state. */
(function (w, d) {
  'use strict';
  if (w.AllokMotion) return;
  var html = d.documentElement;
  var REDUCE = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MOVE = !REDUCE && 'IntersectionObserver' in w;
  if (MOVE) html.classList.add('motion'); else html.classList.remove('motion');

  function all(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function num(v, f) { var n = parseFloat(v); return isNaN(n) ? f : n; }
  function rootOf(el) { return (el.parentElement && el.parentElement.closest('[data-autoscroll]')) || null; }
  function frame(fn) { requestAnimationFrame(function () { requestAnimationFrame(fn); }); }

  /* One IntersectionObserver per viewport and threshold. */
  var pools = [];
  function watch(el, threshold, cb) {
    var root = rootOf(el), key = JSON.stringify(threshold), pool = null, i;
    for (i = 0; i < pools.length; i++) if (pools[i].root === root && pools[i].key === key) pool = pools[i];
    if (!pool) {
      pool = { root: root, key: key, cbs: new Map() };
      var p = pool;
      p.io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { (p.cbs.get(e.target) || []).slice().forEach(function (f) { f(e); }); });
      }, { root: root, threshold: threshold });
      pools.push(p);
    }
    var q = pool, list = q.cbs.get(el);
    if (!list) { list = []; q.cbs.set(el, list); q.io.observe(el); }
    list.push(cb);
    return function () {
      var l = q.cbs.get(el); if (!l) return;
      var k = l.indexOf(cb); if (k > -1) l.splice(k, 1);
      if (!l.length) { q.cbs.delete(el); q.io.unobserve(el); }
    };
  }
  /* A stage starts fully clipped, and IntersectionObserver sees clipped boxes as empty:
     what's inside a stage that hasn't arrived is watched through the stage's parent. */
  function watchTarget(el) {
    var t = el, a = el;
    while (a && a.nodeType === 1 && a !== d.body) {
      if (a.getAttribute('data-reveal') === 'stage' && !a.classList.contains('is-in')) t = a.parentElement;
      a = a.parentElement;
    }
    return t || el;
  }

  /* ── Reveal ── */
  function stagger(root) {
    all('[data-stagger]', root).reverse().forEach(function (box) {
      var i = 0;
      all('[data-reveal]', box).forEach(function (el) {
        if (el.parentElement.closest('[data-stagger]') !== box) return;
        if (el.style.getPropertyValue('--i') === '') el.style.setProperty('--i', i);
        i++;
      });
    });
  }
  function reveal(el) {
    if (el.__akR) return; el.__akR = 1;
    if (!MOVE) { el.classList.add('is-in'); return; }
    var stop = watch(watchTarget(el), num(el.getAttribute('data-threshold'), 0.15), function (e) {
      if (e.isIntersecting) { el.classList.add('is-in'); el.__akInAt = performance.now(); stop(); el.__akStop = null; }
    });
    el.__akStop = stop;
  }
  function targets(box) { var els = all('[data-reveal]', box); if (box.hasAttribute && box.hasAttribute('data-reveal')) els.unshift(box); return els; }
  /* Replay: everything inside goes back to its start and enters again. */
  function replay(box, fade) {
    var els = targets(box);
    function go() {
      els.forEach(function (el) { el.classList.add('is-reset'); el.classList.remove('is-in'); });
      box.classList.remove('is-replaying');
      void box.offsetWidth;
      frame(function () { els.forEach(function (el) { el.classList.remove('is-reset'); el.classList.add('is-in'); }); });
    }
    if (fade && MOVE) { box.classList.add('is-replaying'); setTimeout(go, 240); } else go();
  }
  /* Rewatch: back to the start, and enter again when seen. */
  function rewatch(box) {
    var els = targets(box);
    els.forEach(function (el) {
      if (el.__akStop) { el.__akStop(); el.__akStop = null; }
      el.classList.add('is-reset'); el.classList.remove('is-in'); el.__akR = 0;
    });
    void box.offsetWidth;
    frame(function () { els.forEach(function (el) { el.classList.remove('is-reset'); reveal(el); }); });
  }
  function loop(box) {
    if (box.__akL || !MOVE) return; box.__akL = 1;
    var every = num(box.getAttribute('data-loop'), 5000), timer = 0;
    watch(box, 0.25, function (e) {
      if (e.isIntersecting && !timer) timer = setInterval(function () { if (!d.hidden) replay(box, true); }, every);
      else if (!e.isIntersecting && timer) { clearInterval(timer); timer = 0; }
    });
  }
  function clickReplay(box) {
    if (box.__akC || !MOVE) return; box.__akC = 1;
    box.addEventListener('click', function (e) { if (e.target.closest('a, button, input, [data-run]')) return; replay(box, true); });
  }

  /* ── Run: the work, working. Only the most visible demo runs; the others hold their frame. ── */
  var RUNS = [], ACTIVE = null, STEPS = [];
  for (var t = 0; t <= 20; t++) STEPS.push(t / 20);
  /* The most visible demo runs. The one running keeps the turn until another is clearly more in view. */
  function pick() {
    var b = null;
    RUNS.forEach(function (r) { if (r.ratio >= 0.35 && (!b || r.ratio > b.ratio + 0.001)) b = r; });
    if (ACTIVE && ACTIVE.ratio >= 0.35 && b && b !== ACTIVE && b.ratio < ACTIVE.ratio + 0.15) b = ACTIVE;
    ACTIVE = b;
    RUNS.forEach(function (r) { r.box.classList.toggle('is-holding', r !== ACTIVE); });
  }
  function bestRun() { return ACTIVE; }
  function countOf(s) {
    var v = s.getAttribute('data-count') || '0';
    return v.indexOf(':') > -1 ? { time: true, n: v.split(':').reduce(function (a, b) { return a * 60 + (+b); }, 0) } : { time: false, n: +v };
  }
  function fmt(c, v) { return c.time ? Math.floor(v / 60) + ':' + ('0' + (v % 60)).slice(-2) : String(v); }
  function count(s, final) {
    var c = countOf(s), dur = num(s.getAttribute('data-count-ms'), 1400), id = s.__akN = (s.__akN || 0) + 1, t0 = performance.now();
    if (final || !MOVE) { s.textContent = fmt(c, c.n); return; }
    (function step(now) {
      if (s.__akN !== id) return;
      var p = Math.min(1, (now - t0) / dur);
      s.textContent = fmt(c, Math.round(c.n * p));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  function run(box) {
    if (box.__akRun) return; box.__akRun = 1;
    var steps = all('[data-step]', box).filter(function (s) { return s.closest('[data-run]') === box; });
    if (steps.some(function (s) { return s.hasAttribute('data-order'); }))
      steps.sort(function (a, b) { return num(a.getAttribute('data-order'), 0) - num(b.getAttribute('data-order'), 0); });
    var btn = box.querySelector('[data-run-toggle]');
    function on(s, final) { s.classList.add(s.getAttribute('data-add') || 'is-on'); if (s.hasAttribute('data-count')) count(s, final); }
    function off(s) {
      s.classList.remove(s.getAttribute('data-add') || 'is-on', 'is-typing');
      if (s.hasAttribute('data-count')) { s.__akN = (s.__akN || 0) + 1; s.textContent = fmt(countOf(s), 0); }
    }
    if (!MOVE) { steps.forEach(function (s) { if (!s.hasAttribute('data-for')) on(s, true); }); if (btn) btn.hidden = true; return; }
    var me = { box: box, ratio: 0, paused: false, token: 0 };
    RUNS.push(me);
    function live() { return !me.paused && !d.hidden && bestRun() === me && (!box.hasAttribute('data-reveal') || box.classList.contains('is-in')); }
    function wait(t, tok) {
      return new Promise(function (res, rej) {
        var left = t, last = performance.now();
        (function tick() {
          if (tok !== me.token) { rej('stop'); return; }
          var now = performance.now(); if (live()) left -= now - last; last = now;
          if (left <= 0) { res(); return; }
          setTimeout(tick, Math.min(left, live() ? 40 : 200));
        })();
      });
    }
    function later(s, t, tok) { wait(t, tok).then(function () { off(s); }, function () {}); }
    /* Until its turn, a demo shows its finished frame. When its turn comes it starts clean:
       at once if it has only just arrived, after a short fade if it was already on screen. */
    function play() {
      var tok = ++me.token, i = 0;
      function stop() {}
      steps.forEach(function (s) { if (!s.hasAttribute('data-for')) on(s, true); });
      wait(1, tok).then(function () {
        if (performance.now() - (box.__akInAt || -1e9) < 900) {
          steps.forEach(function (s) { s.classList.add('is-reset'); off(s); });
          void box.offsetWidth;
          steps.forEach(function (s) { s.classList.remove('is-reset'); });
          return wait(120, tok);
        }
        box.classList.add('is-rewinding');
        return wait(320, tok).then(function () { steps.forEach(off); box.classList.remove('is-rewinding'); return wait(240, tok); });
      }).then(next).catch(stop);
      function next() {
        if (i >= steps.length) {
          wait(num(box.getAttribute('data-hold'), 2600), tok)
            .then(function () { box.classList.add('is-rewinding'); return wait(320, tok); })
            .then(function () { steps.forEach(off); box.classList.remove('is-rewinding'); return wait(240, tok); })
            .then(function () { i = 0; next(); })
            .catch(stop);
          return;
        }
        var s = steps[i++];
        wait(num(s.getAttribute('data-wait'), 700), tok)
          .then(function () {
            if (!s.hasAttribute('data-type')) return;
            s.classList.add('is-typing');
            return wait(num(s.getAttribute('data-type'), 900), tok).then(function () { s.classList.remove('is-typing'); });
          })
          .then(function () {
            on(s);
            if (s.hasAttribute('data-for')) later(s, num(s.getAttribute('data-for'), 400), tok);
            next();
          })
          .catch(stop);
      }
    }
    watch(box, STEPS, function (e) { me.ratio = e.isIntersecting ? e.intersectionRatio : 0; pick(); });
    if (btn) btn.addEventListener('click', function () {
      me.paused = !me.paused;
      box.classList.toggle('is-paused', me.paused);
      btn.setAttribute('aria-pressed', me.paused ? 'true' : 'false');
      btn.textContent = me.paused ? 'Play' : 'Pause';
    });
    play();
  }

  /* ── Tick: the next ship date, counting down. ── */
  function tick(el) {
    if (el.__akT) return; el.__akT = 1;
    var end = Date.parse(el.getAttribute('data-tick')); if (isNaN(end)) return;
    var U = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]], spans = [], timer = 0;
    el.textContent = ''; el.setAttribute('role', 'timer');
    U.forEach(function (u, i) {
      var s = d.createElement('span'); s.className = 'tick-unit'; el.appendChild(s); spans.push(s);
      if (i < U.length - 1) el.appendChild(d.createTextNode(' '));
    });
    function render() {
      var left = Math.floor((end - Date.now()) / 1000);
      if (left <= 0) { clearInterval(timer); el.textContent = el.getAttribute('data-tick-done') || 'today'; return; }
      U.forEach(function (u, i) {
        var v = Math.floor(left / u[1]); left -= v * u[1];
        var txt = (i ? ('0' + v).slice(-2) : v) + u[0], s = spans[i];
        if (s.textContent === txt) return;
        var first = !s.textContent; s.textContent = txt;
        if (MOVE && !first) { s.classList.remove('is-rolling'); void s.offsetWidth; s.classList.add('is-rolling'); }
      });
    }
    render(); timer = setInterval(render, 1000);
  }

  /* ── Scroll: the reading line, depth, the header stepping aside. ── */
  function scrollOf(sc) { return sc ? sc.scrollTop : (w.scrollY || html.scrollTop); }
  function viewOf(sc) { return sc ? { top: sc.getBoundingClientRect().top, h: sc.clientHeight } : { top: 0, h: w.innerHeight }; }
  function onScroll(sc, fn) {
    var raf = 0;
    (sc || w).addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; fn(); }); }, { passive: true });
  }
  function reading(list) {
    if (list.__akRd || !MOVE) return; list.__akRd = 1;
    var sc = rootOf(list), items = Array.prototype.slice.call(list.children);
    onScroll(sc, function () {
      var v = viewOf(sc), mid = v.top + v.h / 2, best = null, bd = Infinity;
      items.forEach(function (it) { var r = it.getBoundingClientRect(), dd = Math.abs(r.top + r.height / 2 - mid); if (dd < bd) { bd = dd; best = it; } });
      list.classList.add('is-reading');
      items.forEach(function (it) { it.classList.toggle('is-lit', it === best); });
    });
  }
  function parallax(el) {
    if (el.__akP || !MOVE) return; el.__akP = 1;
    var sc = rootOf(el), k = num(el.getAttribute('data-parallax'), 0.06);
    function drift() {
      var v = viewOf(sc), r = el.getBoundingClientRect(), y = (r.top + r.height / 2 - (v.top + v.h / 2)) * k;
      el.style.setProperty('--drift', Math.max(-24, Math.min(24, y)).toFixed(1) + 'px');
    }
    onScroll(sc, drift);
    var box = sc || html;
    if (box.scrollHeight > (sc ? sc.clientHeight : w.innerHeight) + 1) drift(); // only where the page actually scrolls
  }
  function header(h) {
    if (h.__akH || !MOVE) return; h.__akH = 1;
    var sc = rootOf(h), last = 0;
    onScroll(sc, function () {
      var y = scrollOf(sc);
      if (y < h.offsetHeight) h.classList.remove('is-hidden');
      else if (y > last + 4) h.classList.add('is-hidden');
      else if (y < last - 4) h.classList.remove('is-hidden');
      if (Math.abs(y - last) > 4) last = y;
    });
  }

  /* ── Spec cards: cycles and a page that scrolls itself. ── */
  function cycle(el) {
    if (el.__akCy || !MOVE) return; el.__akCy = 1;
    var cls = el.getAttribute('data-cycle'), every = num(el.getAttribute('data-cycle-ms'), 1600), hold = num(el.getAttribute('data-cycle-on'), every / 2), timer = 0;
    function beat() { if (d.hidden) return; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, hold); }
    watch(el, 0.2, function (e) {
      if (e.isIntersecting && !timer) { beat(); timer = setInterval(beat, every); }
      else if (!e.isIntersecting && timer) { clearInterval(timer); timer = 0; }
    });
  }
  function autoscroll(sc) {
    if (sc.__akA || !MOVE) return; sc.__akA = 1;
    var down = num(sc.getAttribute('data-autoscroll'), 7000), up = down * 0.35, hold = 1400, vis = false, phase = 0, t = 0, last = performance.now();
    watch(sc, 0.3, function (e) { vis = e.isIntersecting; });
    function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
    (function step(now) {
      var dt = Math.min(64, now - last); last = now;
      if (vis && !d.hidden) {
        t += dt;
        var max = sc.scrollHeight - sc.clientHeight;
        if (phase === 0 && t >= hold) { phase = 1; t = 0; }
        else if (phase === 1) { var p = Math.min(1, t / down); sc.scrollTop = ease(p) * max; if (p >= 1) { phase = 2; t = 0; } }
        else if (phase === 2 && t >= hold) { phase = 3; t = 0; }
        else if (phase === 3) { var q = Math.min(1, t / up); sc.scrollTop = (1 - ease(q)) * max; if (q >= 1) { phase = 0; t = 0; rewatch(sc); } }
      }
      requestAnimationFrame(step);
    })(last);
  }

  function init(root) {
    root = root || d;
    stagger(root);
    all('[data-reveal]', root).forEach(reveal);
    all('[data-loop]', root).forEach(loop);
    all('[data-replay]', root).forEach(clickReplay);
    all('[data-run]', root).forEach(run);
    all('[data-tick]', root).forEach(tick);
    all('[data-reading]', root).forEach(reading);
    all('[data-parallax]', root).forEach(parallax);
    all('[data-hide-on-scroll]', root).forEach(header);
    all('[data-cycle]', root).forEach(cycle);
    all('[data-autoscroll]', root).forEach(autoscroll);
  }
  w.AllokMotion = { init: init, replay: replay, reduced: REDUCE };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { init(); }); else init();
})(window, document);
