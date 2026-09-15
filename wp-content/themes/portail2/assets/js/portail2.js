/* Portail2 — interactions de l'en-tête (le reste est géré par clarte.js). */
(function () {
  /* Menu mobile */
  var burger = document.getElementById('p2Burger');
  var links = document.getElementById('p2Links');
  if (burger && links) {
    burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); }
    });
  }

  /* Lien actif dans la navigation — reflète la page OU la section courante,
     y compris les pages de détail (fiche formation → Formations, fiche école → Écoles,
     article → Blog), grâce aux classes de body posées par WordPress. */
  if (links) {
    var path = window.location.pathname.replace(/\/+$/, '') || '/';
    var bc = ' ' + document.body.className + ' ';
    var section = null;
    if (path !== '/') {
      if (/ (single-formation|post-type-archive-formation) /.test(bc)) { section = '/formations'; }
      else if (/ (single-ecole|post-type-archive-ecole) /.test(bc)) { section = '/ecoles'; }
      else if (/ (single-post|blog|category|tag|date|author) /.test(bc)) { section = '/blog'; }
    }
    var normHref = function (a) {
      return (a.getAttribute('href') || '')
        .replace(/^https?:\/\/[^/]+/, '')
        .replace(/[#?].*$/, '')
        .replace(/\/+$/, '') || '/';
    };
    var anyActive = false;
    links.querySelectorAll('a').forEach(function (a) { a.classList.remove('active'); });
    links.querySelectorAll('a').forEach(function (a) {
      var href = normHref(a);
      var on = false;
      if (section) { on = (href === section); }
      else if (href === '/') { on = (path === '/'); }
      else { on = (href === path || path.indexOf(href + '/') === 0); }
      if (on) { a.classList.add('active'); anyActive = true; }
    });
    if (!anyActive && path === '/') {
      links.querySelectorAll('a').forEach(function (a) { if (normHref(a) === '/') { a.classList.add('active'); } });
    }
  }
})();

/* Filtres Formations : accordéon exclusif — ouvrir un groupe replie les autres. */
document.addEventListener('click', function (e) {
  var head = e.target.closest('.clarte-acc__head');
  if (!head) { return; }
  var current = head.parentElement;
  var panel = current.closest('.clarte-filters');
  if (!panel) { return; }
  panel.querySelectorAll('.clarte-acc.is-open').forEach(function (acc) {
    if (acc !== current) { acc.classList.remove('is-open'); }
  });
});

/* Sélection du mois : toute la ligne du tableau est cliquable. */
document.addEventListener('click', function (e) {
  var tr = e.target.closest('tr.p2-rowlink');
  if (!tr || e.target.closest('a')) { return; }
  var href = tr.getAttribute('data-href');
  if (href) { window.location.href = href; }
});

/* Indicatif téléphonique automatique selon le pays choisi (formulaires de fiche). */
document.addEventListener('change', function (e) {
  var sel = e.target;
  if (!sel || sel.name !== 'pays') { return; }
  var form = sel.closest('form');
  if (!form) { return; }
  var tel = form.querySelector('input[name="tel"]');
  if (!tel) { return; }
  var optn = sel.selectedOptions && sel.selectedOptions[0];
  var code = optn ? (optn.getAttribute('data-code') || '') : '';
  var current = tel.value.trim();
  var isOnlyCode = /^\+\d{1,4}\s?$/.test(current);
  if (code) {
    if (current === '' || isOnlyCode) { tel.value = code + ' '; }
    tel.placeholder = code + ' 77 000 00 00';
  }
});

/* Formulaire de fiche : suit le défilement (implémentation JS, fiable sur Safari). */
(function () {
  function init() {
    var form = document.querySelector('.p2-ffside .clarte-ff-form');
    if (!form) { return; }
    var side = form.closest('.p2-ffside');
    var grid = form.closest('.clarte-ff') || form.closest('.p2-ffgrid');
    if (!side || !grid) { return; }
    var raf = false;
    function offsetTop() {
      return document.body.classList.contains('admin-bar') ? 132 : 100;
    }
    function reset() {
      form.style.position = ''; form.style.top = ''; form.style.left = '';
      form.style.width = ''; form.style.bottom = '';
    }
    function update() {
      raf = false;
      if (window.innerWidth <= 1000) { reset(); return; }
      var top = offsetTop();
      var sideRect = side.getBoundingClientRect();
      var gridRect = grid.getBoundingClientRect();
      var formH = form.offsetHeight;
      if (sideRect.top >= top) { reset(); return; }
      if (gridRect.bottom - formH <= top) {
        form.style.position = 'absolute';
        form.style.top = Math.round(gridRect.bottom - sideRect.top - formH) + 'px';
        form.style.bottom = 'auto';
        form.style.left = '0';
        form.style.width = sideRect.width + 'px';
      } else {
        form.style.position = 'fixed';
        form.style.top = top + 'px';
        form.style.bottom = 'auto';
        form.style.left = sideRect.left + 'px';
        form.style.width = sideRect.width + 'px';
      }
    }
    function onScroll() {
      if (!raf) { raf = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();

/* Recherche dans l'en-tête : loupe qui déplie un champ, disponible sur toutes les pages. */
(function () {
  function init() {
    var btn = document.querySelector('.p2-hsearch-btn');
    var form = document.querySelector('.p2-hsearch');
    if (!btn || !form) { return; }
    var input = form.querySelector('input[type="search"]');
    function close() {
      form.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', function () {
      var open = form.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && input) { input.focus(); }
    });
    form.addEventListener('submit', function (e) {
      if (input && !input.value.trim()) { e.preventDefault(); close(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); }
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.p2-hsearch') && !e.target.closest('.p2-hsearch-btn')) { close(); }
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* Test d'orientation (page /orientation/) — adapté aux parcours ouest-africains :
   séries du Bac (S, L, G, technique), concours de la fonction publique, secteurs
   qui recrutent dans la sous-région (numérique/mobile money, agrobusiness, banque…). */
(function () {
  var QD = [
    { q: 'Quelle série de Bac as-tu (ou vises-tu) ?', a: [
      ['Bac S — sciences', { sante: 2, ingenierie: 2, informatique: 1, agro: 1 }],
      ['Bac L — lettres et langues', { droit: 2, marketing: 2 }],
      ['Bac G / STEG — gestion et économie', { gestion: 2, finance: 2 }],
      ['Bac technique ou professionnel', { ingenierie: 2, informatique: 2 }]
    ] },
    { q: 'Qu’est-ce qui te parle le plus ?', a: [
      ['Coder, gérer des réseaux, créer des applis', { informatique: 2 }],
      ['Soigner et accompagner les malades', { sante: 2 }],
      ['Défendre, conseiller, administrer', { droit: 2, gestion: 1 }],
      ['Produire, transformer, protéger la terre', { agro: 2, ingenierie: 1 }]
    ] },
    { q: 'Ton projet après le diplôme :', a: [
      ['Intégrer une banque ou une grande entreprise', { finance: 2, gestion: 1 }],
      ['Réussir un concours de la fonction publique', { droit: 2, gestion: 1 }],
      ['Monter ma propre affaire', { gestion: 2, marketing: 1, agro: 1 }],
      ['Devenir un expert technique recherché', { ingenierie: 2, informatique: 1 }]
    ] },
    { q: 'Tu préfères travailler…', a: [
      ['Avec les chiffres et les dossiers', { finance: 2, gestion: 1 }],
      ['Sur le terrain, au contact du réel', { agro: 2, ingenierie: 1 }],
      ['Avec les gens, au service des autres', { sante: 2, marketing: 1 }],
      ['Devant un écran, à créer et résoudre', { informatique: 2, marketing: 1 }]
    ] },
    { q: 'Un secteur qui recrute en Afrique de l’Ouest et qui t’attire :', a: [
      ['Le numérique, les télécoms, le mobile money', { informatique: 2, finance: 1 }],
      ['La santé', { sante: 2 }],
      ['L’agrobusiness, l’énergie, l’environnement', { agro: 2, ingenierie: 1 }],
      ['La banque, l’assurance, la microfinance', { finance: 2 }],
      ['La communication et le marketing digital', { marketing: 2 }]
    ] }
  ];
  var QLBL = {
    informatique: { n: 'Informatique, Numérique & Télécoms', q: 'informatique' },
    ingenierie:   { n: 'Ingénierie & Génie', q: 'ingénieur' },
    gestion:      { n: 'Gestion & Management', q: 'gestion' },
    finance:      { n: 'Banque, Finance & Comptabilité', q: 'finance' },
    droit:        { n: 'Droit & Administration', q: 'droit' },
    sante:        { n: 'Santé & Médecine', q: 'médecine' },
    marketing:    { n: 'Marketing & Communication', q: 'marketing' },
    agro:         { n: 'Agronomie, Agroalimentaire & Environnement', q: 'agronomie' }
  };
  var ARROW = '<svg class="p2-ne" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

  function init() {
    var box = document.getElementById('p2Quiz');
    if (!box) { return; }
    var step = 0;
    var picks = [];

    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function swap(html) {
      box.innerHTML = '<div class="p2-qz">' + html + '</div>';
      var el = box.querySelector('.p2-qz');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { el.classList.add('is-in'); });
      });
    }
    function question() {
      var d = QD[step];
      var html = '<div class="p2-qz-top"><span class="p2-qz-count">Question ' + (step + 1) + ' / ' + QD.length + '</span><span class="p2-qz-line"><i style="width:' + Math.round((step / QD.length) * 100) + '%"></i></span></div>';
      html += '<h2 class="p2-qz-q">' + esc(d.q) + '</h2><div class="p2-qz-list">';
      d.a.forEach(function (ans, i) {
        html += '<button type="button" class="p2-qz-a" data-quiz-answer="' + i + '"><span class="k">' + String.fromCharCode(65 + i) + '</span><span class="t">' + esc(ans[0]) + '</span>' + ARROW + '</button>';
      });
      html += '</div>';
      if (step > 0) { html += '<button type="button" class="p2-qz-back" data-quiz-back>← Question précédente</button>'; }
      swap(html);
    }
    function result() {
      var scores = {};
      picks.forEach(function (pi, qi) {
        var w = QD[qi].a[pi][1];
        Object.keys(w).forEach(function (k) { scores[k] = (scores[k] || 0) + w[k]; });
      });
      var keys = Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; });
      var top = keys.slice(0, 3).filter(function (k) { return scores[k] > 0 && QLBL[k]; });
      var html = '<p class="p2-eyebrow">Ton profil</p><h2 class="p2-qz-q">Les domaines qui te ressemblent</h2><div class="p2-qz-doms">';
      top.forEach(function (k, i) {
        var d = QLBL[k];
        html += '<a class="p2-qz-dom" href="/formations/?q=' + encodeURIComponent(d.q) + '"><span class="idx">0' + (i + 1) + '</span><b>' + esc(d.n) + '</b><span class="go">Voir les formations ' + ARROW + '</span></a>';
      });
      html += '</div><button type="button" class="p2-qz-back" data-quiz-restart>↻ Refaire le test</button>';
      swap(html);
    }

    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-quiz-restart]')) { step = 0; picks = []; question(); return; }
      if (e.target.closest('[data-quiz-back]')) { if (step > 0) { step--; question(); } return; }
      var a = e.target.closest('[data-quiz-answer]');
      if (!a) { return; }
      picks[step] = parseInt(a.getAttribute('data-quiz-answer'), 10);
      step++;
      if (step < QD.length) { question(); } else { result(); }
    });

    question();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* Page Formations : comparateur (sélection + barre verte flottante + tableau côte à côte). */
(function () {
  var MAX = 3;
  function init() {
    var grid = document.querySelector('.clarte-results__grid');
    if (!grid) { return; }

    var picks = [];
    var bar = null;

    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function cardData(card) {
      var t = card.querySelector('.p2-rc-title');
      return {
        fid: card.getAttribute('data-fid') || '',
        title: t ? t.textContent.trim() : (card.getAttribute('aria-label') || 'Formation'),
        ecole: card.getAttribute('data-ecole') || '',
        ville: card.getAttribute('data-ville') || '',
        niveau: card.getAttribute('data-niveau') || '',
        duree: card.getAttribute('data-duree') || '',
        langue: card.getAttribute('data-langue') || '',
        modalite: card.getAttribute('data-modalite') || '',
        rythme: card.getAttribute('data-rythme') || '',
        accred: (card.getAttribute('data-accred') || '').split('|').filter(Boolean).join(', '),
        cout: parseInt(card.getAttribute('data-cout'), 10) || 0,
        clabel: card.getAttribute('data-clabel') || '—',
        href: card.getAttribute('href') || '#'
      };
    }
    function cardByFid(fid) {
      return grid.querySelector('.p2-rescard[data-fid="' + fid + '"]');
    }
    function syncButtons() {
      grid.querySelectorAll('.p2-rescard').forEach(function (card) {
        var on = picks.indexOf(card.getAttribute('data-fid')) !== -1;
        card.classList.toggle('is-cmp', on);
        var btn = card.querySelector('[data-cmp]');
        if (btn) {
          btn.classList.toggle('is-on', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
          btn.setAttribute('aria-label', on ? 'Retirer de la comparaison' : 'Sélectionner pour comparer');
          btn.setAttribute('title', on ? 'Retirer de la comparaison' : 'Comparer cette formation');
        }
      });
    }
    /* Barre verte flottante en bas de l'écran (apparaît dès la 1re formation cochée). */
    function renderBar() {
      if (!picks.length) {
        if (bar) { bar.remove(); bar = null; }
        return;
      }
      var fresh = false;
      if (!bar) {
        bar = document.createElement('div');
        bar.className = 'p2-cmpbar';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', 'Comparateur de formations');
        document.body.appendChild(bar);
        fresh = true;
      }
      var html = '<span class="p2-cmpbar-t">' + picks.length + ' formation' + (picks.length > 1 ? 's' : '') + '</span>';
      html += '<div class="p2-cmpbar-chips">';
      picks.forEach(function (fid) {
        var card = cardByFid(fid);
        if (!card) { return; }
        var d = cardData(card);
        html += '<span class="p2-cmpbar-chip"><span>' + esc(d.title) + '</span><button type="button" class="p2-cmpbar-x" data-x="' + esc(fid) + '" aria-label="Retirer ' + esc(d.title) + '">&times;</button></span>';
      });
      html += '</div>';
      html += '<button type="button" class="p2-cmp-clear">Tout retirer</button>';
      if (picks.length >= 2) {
        html += '<button type="button" class="p2-cmp-open">Comparer &rarr;</button>';
      } else {
        html += '<button type="button" class="p2-cmp-open" disabled>Ajoute une 2e formation</button>';
      }
      bar.classList.toggle('is-full', picks.length >= MAX);
      bar.innerHTML = html;
    }
    function toggle(fid) {
      var i = picks.indexOf(fid);
      if (i !== -1) { picks.splice(i, 1); }
      else {
        if (picks.length >= MAX) { flashFull(); return; }
        picks.push(fid);
      }
      syncButtons();
      renderBar();
    }
    function flashFull() {
      if (bar && bar.animate) {
        bar.animate([{ transform: 'translateX(-50%) translateY(0)' }, { transform: 'translateX(-50%) translateY(-5px)' }, { transform: 'translateX(-50%) translateY(0)' }], { duration: 240 });
      }
    }

    /* Nom de l'école ou logo : renvoie vers la fiche de l'école (dans le lien de la carte). */
    grid.addEventListener('click', function (e) {
      var sch = e.target.closest('.p2-rc-school, .p2-rc-logo');
      if (sch) {
        var card0 = sch.closest('.p2-rescard');
        var url = card0 ? card0.getAttribute('data-ecole-url') : '';
        if (url) { e.preventDefault(); e.stopPropagation(); window.location.href = url; return; }
      }
    });

    /* Clic sur un bouton « Comparer » d'une carte (le bouton est dans le lien : on bloque la nav). */
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cmp]');
      if (!btn) { return; }
      e.preventDefault();
      e.stopPropagation();
      var card = btn.closest('.p2-rescard');
      if (card) { toggle(card.getAttribute('data-fid')); }
    });

    /* Actions dans la barre : retirer une formation, tout vider, ouvrir la comparaison. */
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.p2-cmpbar')) { return; }
      var x = e.target.closest('.p2-cmpbar-x');
      if (x) { toggle(x.getAttribute('data-x')); return; }
      if (e.target.closest('.p2-cmp-clear')) { picks = []; syncButtons(); renderBar(); return; }
      if (e.target.closest('.p2-cmp-open')) { openModal(); return; }
    });

    /* ---- Modale de comparaison ---- */
    function rowsFor(list) {
      var minCout = Math.min.apply(null, list.map(function (d) { return d.cout > 0 ? d.cout : Infinity; }));
      return [
        { label: 'École', key: 'ecole' },
        { label: 'Ville', key: 'ville' },
        { label: 'Coût / an', key: 'clabel', best: function (d) { return d.cout > 0 && d.cout === minCout; } },
        { label: 'Niveau', key: 'niveau' },
        { label: 'Durée', key: 'duree' },
        { label: 'Langue', key: 'langue' },
        { label: 'Modalité', key: 'modalite' },
        { label: 'Rythme', key: 'rythme' },
        { label: 'Accréditations', key: 'accred' }
      ];
    }
    function openModal() {
      var list = picks.map(function (fid) { return cardData(cardByFid(fid)); }).filter(function (d) { return d && d.fid; });
      if (list.length < 2) { return; }
      var rows = rowsFor(list);
      var waText = 'Je compare ces formations sur PortailSup :\n' + list.map(function (d) { return '• ' + d.title + ' (' + d.ecole + ')'; }).join('\n') + '\n' + window.location.href;
      var wa = 'https://wa.me/?text=' + encodeURIComponent(waText);

      var h = '<div class="p2-modal" role="dialog" aria-modal="true" aria-label="Comparaison des formations">';
      h += '<div class="p2-modal-card"><button type="button" class="p2-modal-x" aria-label="Fermer">&times;</button>';
      h += '<div class="p2-modal-head"><h2>Comparer</h2><a class="p2-cmp-share" href="' + esc(wa) + '" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.7.8-2.8-.2-.3A8 8 0 1 1 12 20Zm4.5-6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.2.2-.6.8-.7.9-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.4.2-.4c.1-.2 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.2 1.6 2.4 3.8 3.4 1.4.6 2 .6 2.7.5.4 0 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.4-.4Z"/></svg>Partager</a></div>';
      h += '<div class="p2-modal-scroll"><table><thead><tr><th></th>';
      list.forEach(function (d) { h += '<th>' + esc(d.title) + '<div style="font-weight:400;font-size:12.5px;color:var(--p2-gray)">' + esc(d.ecole) + '</div></th>'; });
      h += '</tr></thead><tbody>';
      rows.forEach(function (r) {
        var vals = list.map(function (d) { return (d[r.key] || '—'); });
        var same = vals.every(function (v) { return v === vals[0]; }) && vals[0] !== '—';
        h += '<tr' + (same ? ' class="p2-same"' : '') + '><th>' + esc(r.label) + '</th>';
        list.forEach(function (d) {
          var v = d[r.key] || '—';
          var cell = (r.best && r.best(d)) ? '<span class="p2-best">' + esc(v) + '</span>' : esc(v);
          h += '<td>' + cell + '</td>';
        });
        h += '</tr>';
      });
      h += '<tr><th></th>';
      list.forEach(function (d) { h += '<td><a class="p2-modal-go" href="' + esc(d.href) + '">Voir la fiche &rsaquo;</a></td>'; });
      h += '</tr></tbody></table></div></div></div>';

      var wrap = document.createElement('div');
      wrap.innerHTML = h;
      var modal = wrap.firstChild;
      document.body.appendChild(modal);
      document.body.classList.add('p2-noscroll');

      function close() {
        modal.remove();
        document.body.classList.remove('p2-noscroll');
        document.removeEventListener('keydown', onKey);
      }
      function onKey(e) { if (e.key === 'Escape') { close(); } }
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.closest('.p2-modal-x')) { close(); }
      });
      document.addEventListener('keydown', onKey);
    }
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* Page Formations : bascule cartes / liste (choix mémorisé). */
(function () {
  function init() {
    var grid = document.querySelector('.clarte-results__grid');
    var btns = document.querySelectorAll('.p2-vt');
    if (!grid || !btns.length) { return; }
    function setView(v) {
      grid.classList.toggle('is-list', v === 'list');
      btns.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-view') === v); });
      try { localStorage.setItem('p2_view', v); } catch (e) {}
    }
    var saved = null;
    try { saved = localStorage.getItem('p2_view'); } catch (e) {}
    if (saved === 'list') { setView('list'); }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { setView(b.getAttribute('data-view')); });
    });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* Galerie école : lightbox plein écran avec navigation entre les images. */
(function () {
  function init() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.p2-gal-item'));
    if (!items.length) { return; }
    var urls = items.map(function (b) { return b.getAttribute('data-full'); });
    var cur = 0, ov = null;
    function render() {
      var img = ov.querySelector('.p2-lb-img');
      img.src = urls[cur];
      ov.querySelector('.p2-lb-count').textContent = (cur + 1) + ' / ' + urls.length;
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); }
      else if (e.key === 'ArrowRight') { cur = (cur + 1) % urls.length; render(); }
      else if (e.key === 'ArrowLeft') { cur = (cur - 1 + urls.length) % urls.length; render(); }
    }
    function close() {
      if (!ov) { return; }
      ov.remove(); ov = null;
      document.body.classList.remove('p2-noscroll');
      document.removeEventListener('keydown', onKey);
    }
    function open(i) {
      cur = i;
      ov = document.createElement('div');
      ov.className = 'p2-lb';
      ov.innerHTML = '<button type="button" class="p2-lb-x" aria-label="Fermer">&times;</button>'
        + '<button type="button" class="p2-lb-nav p2-lb-prev" aria-label="Image précédente">&#8249;</button>'
        + '<img class="p2-lb-img" src="" alt="">'
        + '<button type="button" class="p2-lb-nav p2-lb-next" aria-label="Image suivante">&#8250;</button>'
        + '<div class="p2-lb-count"></div>';
      document.body.appendChild(ov);
      document.body.classList.add('p2-noscroll');
      render();
      ov.addEventListener('click', function (e) {
        if (e.target === ov || e.target.closest('.p2-lb-x')) { close(); return; }
        if (e.target.closest('.p2-lb-next')) { cur = (cur + 1) % urls.length; render(); return; }
        if (e.target.closest('.p2-lb-prev')) { cur = (cur - 1 + urls.length) % urls.length; render(); return; }
      });
      document.addEventListener('keydown', onKey);
    }
    items.forEach(function (b, i) { b.addEventListener('click', function () { open(i); }); });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();

/* Onglet Avis : bouton « Donner son avis » qui révèle le formulaire. */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.p2-avis-open');
    if (!btn) { return; }
    var wrap = btn.nextElementSibling;
    if (!wrap || !wrap.classList.contains('p2-avisform-wrap')) {
      wrap = document.querySelector('.p2-avisform-wrap');
    }
    if (!wrap) { return; }
    if (wrap.hasAttribute('hidden')) {
      wrap.removeAttribute('hidden');
      btn.setAttribute('aria-expanded', 'true');
      var f = wrap.querySelector('input[name="auteur"]');
      if (f) { f.focus(); }
      wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      wrap.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();
