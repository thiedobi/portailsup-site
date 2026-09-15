/* Portail2 — animations douces et chiffres réels.
   - Respecte « prefers-reduced-motion » : la classe p2-motion n'est posée sur <html>
     que si la personne accepte les animations (voir functions.php).
   - Sans JavaScript, rien n'est masqué : les éléments ne reçoivent .p2-anim qu'ici. */
(function () {
  'use strict';
  var MOTION = document.documentElement.classList.contains('p2-motion');

  /* ===== Images : fondu à l'apparition + fin du shimmer ===== */
  document.addEventListener('load', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG') { t.classList.add('is-loaded'); }
  }, true);
  function markLoaded() {
    document.querySelectorAll('img').forEach(function (i) {
      if (i.complete && i.naturalWidth > 0) { i.classList.add('is-loaded'); }
    });
  }

  /* ===== Compteur animé ===== */
  function countUp(el, to, fmt) {
    if (!MOTION || !window.requestAnimationFrame || to <= 0) { el.textContent = fmt(to); return; }
    var t0 = null, dur = 900;
    function step(ts) {
      if (!t0) { t0 = ts; }
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * eased));
      if (p < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  /* ===== Chiffres réels (p2Stats est fourni par WordPress) ===== */
  var counters = [];
  function applyStats() {
    var s = window.p2Stats || {};
    document.querySelectorAll('.p2-statnum[data-stat]').forEach(function (el) {
      var n = parseInt(s[el.getAttribute('data-stat')], 10);
      if (!isNaN(n) && n > 0) {
        el.textContent = n;
        counters.push({ el: el, to: n, fmt: function (v) { return String(v); } });
      }
    });
    var doms = s.domaines || {};
    document.querySelectorAll('.p2-count[data-domcount]').forEach(function (el) {
      var n = parseInt(doms[el.getAttribute('data-domcount')], 10);
      if (!isNaN(n) && n > 0) {
        var fmt = function (v) { return v + (v <= 1 ? ' formation' : ' formations'); };
        el.textContent = fmt(n);
        counters.push({ el: el, to: n, fmt: fmt });
      }
    });
  }
  function counterFor(el) {
    for (var i = 0; i < counters.length; i++) {
      if (counters[i].el === el || el.contains(counters[i].el)) { return counters[i]; }
    }
    return null;
  }

  /* ===== Apparitions au chargement (héros) et au défilement ===== */
  var SCROLL_SEL = [
    '.p2-intro-photo', '.p2-feat', '.p2-step', '.p2-dcell', '.p2-ecard',
    '.p2-sec-head', '.p2-ftable tbody tr', '.p2-etab h2', '.p2-etab .p2-lead',
    '.p2-etab ul li', '.p2-cta h2', '.p2-cta .p2-btn',
    '.clarte-fcard', '.clarte-ec-card', '.clarte-blog-item', '.clarte-case',
    '.p2-infobar', '.clarte-ff-head', '.clarte-ct-q', '.clarte-sugg-item'
  ].join(',');

  function reveal(el) {
    el.classList.add('is-in');
    var c = counterFor(el);
    if (c) { countUp(c.el, c.to, c.fmt); }
  }

  function init() {
    applyStats();
    markLoaded();

    if (!MOTION) { return; }

    /* Héros : entrée séquencée dès le chargement. */
    var heroKids = document.querySelectorAll('.p2-hero > *');
    heroKids.forEach(function (el, i) {
      el.classList.add('p2-anim');
      el.style.transitionDelay = (i * 90) + 'ms';
    });
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        heroKids.forEach(function (el) {
          reveal(el);
          /* Le délai ne doit pas s'appliquer aux interactions suivantes. */
          el.addEventListener('transitionend', function te() {
            el.style.transitionDelay = '';
            el.removeEventListener('transitionend', te);
          });
        });
      });
    });

    /* Sections : apparition au défilement — PAGE D'ACCUEIL UNIQUEMENT. */
    if (!document.querySelector('main.p2-home')) { return; }
    var els = [];
    var perParent = [];
    document.querySelectorAll(SCROLL_SEL).forEach(function (el) {
      if (el.closest('form') || el.closest('.p2-hero')) { return; }
      el.classList.add('p2-anim');
      var p = el.parentElement, entry = null;
      for (var i = 0; i < perParent.length; i++) {
        if (perParent[i].p === p) { entry = perParent[i]; break; }
      }
      if (!entry) { entry = { p: p, n: 0 }; perParent.push(entry); }
      el.style.transitionDelay = (Math.min(entry.n, 7) * 70) + 'ms';
      entry.n++;
      els.push(el);
    });

    if (!('IntersectionObserver' in window)) {
      els.forEach(reveal);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          reveal(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.addEventListener('load', markLoaded);
})();
