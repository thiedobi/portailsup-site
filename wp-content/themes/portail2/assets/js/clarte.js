/* PortailSup — interactions Clarté (filtres accordéon) */
(function () {
  /* Repli des images (remplace les onerror inline, compatibles CSP) :
     data-fallback = adresse de secours ; data-fallback-remove = retirer l'image. */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG') return;
    var fb = img.getAttribute('data-fallback');
    if (fb) { img.removeAttribute('data-fallback'); img.src = fb; return; }
    if (img.hasAttribute('data-fallback-remove')) { img.remove(); }
  }, true);

  function updateCounts(root) {
    if (!root) return;
    var total = 0;
    root.querySelectorAll('.clarte-acc').forEach(function (acc) {
      var n = acc.querySelectorAll('input[type="checkbox"]:checked').length;
      total += n;
      var badge = acc.querySelector('.clarte-acc__badge');
      if (badge) {
        if (n > 0) { badge.textContent = n; badge.hidden = false; }
        else { badge.hidden = true; }
      }
    });
    var clear = root.querySelector('.clarte-clear');
    if (clear) {
      clear.textContent = total > 0 ? ('Tout effacer (' + total + ')') : 'Tout effacer';
      clear.classList.toggle('is-active', total > 0);
    }
  }

  /* Filtrage des formations en temps réel (sans rechargement) */
  function psCoutState(root) {
    var s = root.querySelector('#ps-cout');
    if (!s) return { active: false, max: Infinity };
    var v = parseInt(s.value, 10), mx = parseInt(s.max, 10);
    var lbl = root.querySelector('#ps-cout-val');
    if (lbl) lbl.textContent = v.toLocaleString('fr-FR') + ' FCFA';
    var acc = s.closest('.clarte-acc');
    if (acc) {
      var b = acc.querySelector('.clarte-acc__badge');
      if (b) { if (v < mx) { b.textContent = '1'; b.hidden = false; } else { b.hidden = true; } }
    }
    return { active: v < mx, max: v };
  }
  function psFoldJs(s) {
    return (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  var PS_SYN = {
    info: ['informatique', 'numerique'], informatique: ['numerique', 'info'], numerique: ['informatique'],
    fac: ['universite'], universite: ['fac'],
    compta: ['comptabilite', 'finance'], comptabilite: ['compta', 'finance'],
    gestion: ['management', 'commerce'], management: ['gestion'], commerce: ['gestion', 'vente', 'marketing'],
    banque: ['finance'], finance: ['banque', 'comptabilite'],
    medecine: ['sante', 'medical'], sante: ['medecine', 'medical'], medical: ['medecine', 'sante'],
    droit: ['juridique', 'justice'], juridique: ['droit'],
    ingenieur: ['ingenierie', 'genie'], ingenierie: ['ingenieur', 'genie'], genie: ['ingenierie', 'ingenieur'],
    marketing: ['communication', 'commerce'], communication: ['marketing'],
    bts: ['dut'], dut: ['bts'], bachelor: ['licence'], licence: ['bachelor']
  };
  function psEsc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* Tolerance aux fautes de frappe : nombre de corrections (lettre en trop,
     lettre oubliee, lettre fausse, deux lettres inversees) pour passer d'un mot a l'autre. */
  function psLev(a, b, max) {
    var m = a.length, n = b.length, i, j;
    if (Math.abs(m - n) > max) return max + 1;
    var prev2 = [], prev = [], cur = [];
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      var best = i;
      for (j = 1; j <= n; j++) {
        var c = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        var v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + c);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) {
          v = Math.min(v, prev2[j - 2] + 1);
        }
        cur[j] = v;
        if (v < best) best = v;
      }
      if (best > max) return max + 1;
      for (j = 0; j <= n; j++) { prev2[j] = prev[j]; prev[j] = cur[j]; }
    }
    return prev[n];
  }
  /* Fautes acceptees selon la longueur du mot tape */
  function psTol(len) { return len >= 8 ? 2 : (len >= 4 ? 1 : 0); }
  function psWordMatch(w, hay, toks) {
    if (hay.indexOf(w) > -1) return true;
    var syn = PS_SYN[w], k;
    if (syn) { for (k = 0; k < syn.length; k++) { if (hay.indexOf(syn[k]) > -1) return true; } }
    var tol = psTol(w.length);
    if (!tol) return false;
    for (k = 0; k < toks.length; k++) {
      var t = toks[k];
      if (t.length < 3) continue;
      /* mot entier mal orthographie (ex. « informtique », « infromatique ») */
      if (Math.abs(t.length - w.length) <= tol && psLev(w, t, tol) <= tol) return true;
      /* mot tape en partie et mal orthographie (ex. « informtiq ») */
      if (t.length > w.length && w.length >= 5 && psLev(w, t.slice(0, w.length), tol) <= tol) return true;
    }
    return false;
  }
  function psMatch(words, hay) {
    if (!words.length) return true;
    var toks = hay.split(' ');
    return words.every(function (w) { return psWordMatch(w, hay, toks); });
  }
  function psRenderChips(root, checked, cout, qEl) {
    var box = root.querySelector('.p2-chips');
    var html = '', total = 0;
    var q = qEl ? qEl.value.trim() : '';
    if (q) { html += '<button type="button" class="p2-chip" data-chip="search">« ' + psEsc(q) + ' »<span class="p2-chip-x" aria-hidden="true">×</span></button>'; }
    Object.keys(checked).forEach(function (g) {
      checked[g].forEach(function (v) {
        total++;
        html += '<button type="button" class="p2-chip" data-chip="cb" data-group="' + psEsc(g) + '" data-value="' + psEsc(v) + '">' + psEsc(v) + '<span class="p2-chip-x" aria-hidden="true">×</span></button>';
      });
    });
    if (cout.active) { html += '<button type="button" class="p2-chip" data-chip="cout">≤ ' + cout.max.toLocaleString('fr-FR') + ' FCFA<span class="p2-chip-x" aria-hidden="true">×</span></button>'; }
    var fcount = total + (cout.active ? 1 : 0) + (q ? 1 : 0);
    if (html) { html += '<button type="button" class="p2-chip p2-chip-clear" data-chip="clear">Tout effacer</button>'; }
    if (box) { box.innerHTML = html; box.hidden = !html; }
    var badge = root.querySelector('.p2-filterbtn-badge');
    if (badge) { if (fcount > 0) { badge.textContent = fcount; badge.hidden = false; } else { badge.hidden = true; } }
    return fcount;
  }
  var PS_AC = { built: false, items: [], box: null, input: null };
  function psAcBuild() {
    if (PS_AC.built) return;
    var input = document.querySelector('.clarte-frm-hero input[type="search"]');
    if (!input) return;
    PS_AC.input = input;
    var grid = document.querySelector('.clarte-results__grid');
    if (grid) {
      grid.querySelectorAll('.clarte-fcard').forEach(function (c) {
        var t = c.querySelector('.p2-rc-title'), s = c.querySelector('.p2-rc-school');
        PS_AC.items.push({
          title: t ? t.textContent.trim() : '',
          school: s ? s.textContent.trim() : '',
          href: c.getAttribute('href') || '#',
          hay: c.getAttribute('data-search') || ''
        });
      });
    }
    var box = document.createElement('div');
    box.className = 'p2-acbox';
    box.hidden = true;
    var form = input.closest('form') || input.parentElement;
    if (form) { form.appendChild(box); }
    PS_AC.box = box;
    PS_AC.built = true;
  }
  function psAcHide() { if (PS_AC.box) { PS_AC.box.hidden = true; PS_AC.box.innerHTML = ''; } }
  function psAutoUpdate() {
    if (!PS_AC.built) psAcBuild();
    if (!PS_AC.box || !PS_AC.input) return;
    var q = psFoldJs(PS_AC.input.value.trim());
    var words = q.split(/\s+/).filter(Boolean);
    if (q.length < 2 || !words.length) { psAcHide(); return; }
    var res = [], i;
    for (i = 0; i < PS_AC.items.length && res.length < 6; i++) {
      if (psMatch(words, PS_AC.items[i].hay)) res.push(PS_AC.items[i]);
    }
    if (!res.length) { psAcHide(); return; }
    var html = '';
    res.forEach(function (r) {
      html += '<a class="p2-acitem" href="' + psEsc(r.href) + '"><span class="p2-acitem-t">' + psEsc(r.title) + '</span><span class="p2-acitem-s">' + psEsc(r.school) + '</span></a>';
    });
    PS_AC.box.innerHTML = html;
    PS_AC.box.hidden = false;
  }
  /* ===== Favoris (mémorisés dans le navigateur), comparateur, pagination progressive, filtres dans l'URL ===== */
  var psState = { limit: 12, sig: '', favOnly: false };
  var PS_FAVS = (function () { try { return JSON.parse(localStorage.getItem('p2_favs') || '[]'); } catch (e) { return []; } })();
  function psSaveFavs() { try { localStorage.setItem('p2_favs', JSON.stringify(PS_FAVS)); } catch (e) {} }
  /* Comparateur : sélection mémorisée dans le navigateur (comme les favoris). */
  var PS_CMP = (function () { try { return JSON.parse(localStorage.getItem('p2_cmp') || '[]'); } catch (e) { return []; } })();
  function psSaveCmp() { try { localStorage.setItem('p2_cmp', JSON.stringify(PS_CMP)); } catch (e) {} }
  var PS_HEART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5S4 15 4 9.6A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6c0 5.4-8 10.9-8 10.9Z"/></svg>';
  var PS_SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3l4 4-4 4M20 7H7M8 21l-4-4 4-4M4 17h13"/></svg>';
  var PS_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

  function psUpdateFavToggle() {
    var b = document.querySelector('.p2-favtoggle');
    if (!b) return;
    var n = b.querySelector('b');
    if (n) n.textContent = PS_FAVS.length;
    b.classList.toggle('is-on', psState.favOnly);
    b.setAttribute('aria-pressed', psState.favOnly ? 'true' : 'false');
  }
  function psLoadMore(root, total) {
    var grid = root.querySelector('.clarte-results__grid');
    if (!grid) return;
    var btn = root.querySelector('.p2-loadmore');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'p2-loadmore';
      grid.insertAdjacentElement('afterend', btn);
    }
    var rest = total - psState.limit;
    if (rest > 0) {
      btn.hidden = false;
      btn.textContent = 'Voir toutes les formations (' + rest + ' restante' + (rest > 1 ? 's' : '') + ')';
    } else {
      btn.hidden = true;
    }
  }
  function psSyncUrl(checked, cout, qEl) {
    if (!window.history || !history.replaceState || !window.URLSearchParams) return;
    var p = new URLSearchParams();
    var q = qEl ? qEl.value.trim() : '';
    if (q) p.set('q', q);
    Object.keys(checked).forEach(function (g) { p.set(g, checked[g].join('|')); });
    if (cout.active) p.set('cout', cout.max);
    var qs = p.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) {}
  }
  function psDecorate() {
    var root = document.querySelector('.clarte-frm-layout');
    if (!root) return;
    root.querySelectorAll('.clarte-fcard[data-fid]').forEach(function (card) {
      if (card.querySelector('.p2-fav')) return;
      var box = card.querySelector('.p2-rc-img');
      if (!box) return;
      var fid = card.getAttribute('data-fid');
      var on = PS_FAVS.indexOf(fid) > -1;
      var fav = document.createElement('button');
      fav.type = 'button';
      fav.className = 'p2-fav' + (on ? ' is-on' : '');
      fav.setAttribute('aria-label', 'Ajouter aux favoris');
      fav.setAttribute('aria-pressed', on ? 'true' : 'false');
      fav.innerHTML = '<span class="p2-fav-txt">Favoris</span><span class="p2-fav-ico">' + PS_HEART + '</span>';
      card.appendChild(fav);
      /* Comparateur : géré par portail2.js (case à cocher + barre verte). Rien à injecter ici. */
    });
    var tools = root.querySelector('.p2-headtools');
    if (tools && !root.querySelector('.p2-favtoggle')) {
      var ft = document.createElement('button');
      ft.type = 'button';
      ft.className = 'p2-favtoggle';
      ft.setAttribute('aria-pressed', 'false');
      ft.innerHTML = PS_HEART + 'Favoris <b>' + PS_FAVS.length + '</b>';
      tools.insertBefore(ft, tools.firstChild);
    }
    /* Barre du comparateur : gérée par portail2.js. */
  }
  /* Panneau « Comparateur » (bas droite) : formations choisies + retrait à l'unité. */
  function psCmpBar() {
    var bar = document.querySelector('.p2-cmpbar');
    if (!bar) return;
    if (!PS_CMP.length) {
      /* Sélection vide : on garde le titre et une consigne courte. */
      bar.innerHTML = '<div class="p2-cmpbar-h"><b>Comparateur</b></div>'
        + '<p class="p2-cmpbar-empty">Ajouter (+) jusqu\'à 3 formations pour les comparer.</p>';
      bar.hidden = false;
      return;
    }
    var items = '';
    PS_CMP.forEach(function (fid) {
      var c = document.querySelector('.clarte-fcard[data-fid="' + fid + '"]');
      var tEl = c ? c.querySelector('.p2-rc-title') : null;
      items += '<div class="p2-cmpbar-it"><span>' + psEsc(tEl ? tEl.textContent.trim() : 'Formation') + '</span><button type="button" class="p2-cmpbar-x" data-fid="' + psEsc(fid) + '" aria-label="Retirer de la comparaison">×</button></div>';
    });
    bar.innerHTML = '<div class="p2-cmpbar-h"><b>Comparateur</b><button type="button" class="p2-cmp-clear">Vider</button></div>'
      + items
      + '<div class="p2-cmpbar-note">Maximum 3 formations</div>'
      + '<button type="button" class="p2-cmp-open"' + (PS_CMP.length < 2 ? ' disabled' : '') + '>'
      + (PS_CMP.length < 2 ? 'Choisis-en une 2e pour comparer' : 'Comparer (' + PS_CMP.length + ')')
      + '</button>';
    bar.hidden = false;
  }
  function psCmpSyncCard(fid) {
    var c = document.querySelector('.clarte-fcard[data-fid="' + fid + '"]');
    var b = c ? c.querySelector('.p2-cmp') : null;
    if (!b) return;
    var on = PS_CMP.indexOf(fid) > -1;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    var lb = b.querySelector('span');
    if (lb) lb.textContent = on ? 'Ajouté ✓' : 'Comparer';
  }
  function psCmpClose() {
    var m = document.querySelector('.p2-modal');
    if (m) { m.remove(); document.body.classList.remove('p2-noscroll'); }
  }
  function psCmpModal() {
    psCmpClose();
    var cards = PS_CMP.map(function (fid) {
      return document.querySelector('.clarte-fcard[data-fid="' + fid + '"]');
    }).filter(Boolean);
    if (cards.length < 2) return;
    var rows = [
      ['École', 'ecole'], ['Ville', 'ville'], ['Niveau', 'niveau'], ['Durée', 'duree'],
      ['Rythme', 'rythme'], ['Modalité', 'modalite'], ['Langue', 'langue'],
      ['Coût annuel', 'clabel'], ['Accréditations', 'accred']
    ];
    /* Texte de partage WhatsApp : une ligne par formation, avec le lien de la fiche. */
    var waTxt = 'Comparaison de formations — PortailSup :';
    cards.forEach(function (c) {
      var t = c.querySelector('.p2-rc-title');
      waTxt += '\n• ' + (t ? t.textContent.trim() : 'Formation') + ' (' + (c.getAttribute('data-ecole') || '') + ') — ' + (c.getAttribute('data-clabel') || 'coût n.c.') + '\n' + (c.getAttribute('href') || '');
    });
    var waIco = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.5 14.1c-.2.6-1.2 1.1-1.7 1.2-.4.1-.9.1-1.5-.1-.4-.1-.8-.2-1.4-.5a11 11 0 0 1-4.2-3.7c-.2-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4-.1.6.4.2.5.8 1.8.8 1.9v.5c-.1.2-.2.3-.3.5l-.4.5c-.1.2-.4.4-.1.8a6.7 6.7 0 0 0 3.3 2.9c.2.1.4.1.5-.1.2-.2.6-.8.8-1 .2-.2.4-.2.6-.1.2.1 1.5.7 1.7.8l.4.2c.1.1.1.6-.1 1.2Z"/></svg>';
    var html = '<div class="p2-modal-card" role="dialog" aria-modal="true" aria-label="Comparaison de formations"><button type="button" class="p2-modal-x" aria-label="Fermer">×</button><div class="p2-modal-head"><h2>Comparer les formations</h2><a class="p2-cmp-share" href="https://wa.me/?text=' + encodeURIComponent(waTxt) + '" target="_blank" rel="noopener">' + waIco + 'Partager</a></div><div class="p2-modal-scroll"><table><thead><tr><th></th>';
    cards.forEach(function (c) {
      var t = c.querySelector('.p2-rc-title');
      html += '<th>' + psEsc(t ? t.textContent.trim() : '') + '</th>';
    });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      var vals = cards.map(function (c) {
        var v = c.getAttribute('data-' + r[1]) || '';
        if (r[1] === 'accred' && v) { v = v.split('|').join(', '); }
        return v;
      });
      /* Ligne identique partout : grisée, pour que l'œil ne lise que les différences. */
      var same = vals.length > 1 && vals.every(function (v) { return v !== '' && v === vals[0]; });
      /* Coût annuel : le moins cher est surligné en vert. */
      var best = -1;
      if (r[1] === 'clabel' && !same) {
        var min = Infinity;
        cards.forEach(function (c, i) {
          var n = parseInt(c.getAttribute('data-cout') || '0', 10);
          if (n > 0 && n < min) { min = n; best = i; }
        });
      }
      html += '<tr' + (same ? ' class="p2-same"' : '') + '><th>' + r[0] + '</th>';
      vals.forEach(function (v, i) {
        html += '<td>' + (i === best && v ? '<span class="p2-best">' + psEsc(v) + '</span>' : (v ? psEsc(v) : '—')) + '</td>';
      });
      html += '</tr>';
    });
    html += '<tr><th></th>';
    cards.forEach(function (c) {
      html += '<td><a class="p2-modal-go" href="' + psEsc(c.getAttribute('href') || '#') + '">Voir la fiche →</a></td>';
    });
    html += '</tr></tbody></table></div></div>';
    var wrap = document.createElement('div');
    wrap.className = 'p2-modal';
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
    document.body.classList.add('p2-noscroll');
    var x = wrap.querySelector('.p2-modal-x');
    if (x) x.focus();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { psCmpClose(); }
  });

  document.addEventListener('click', function (e) {
    var favb = e.target.closest('.p2-fav');
    if (favb) {
      e.preventDefault();
      var card = favb.closest('.clarte-fcard');
      var fid = card ? card.getAttribute('data-fid') : '';
      if (!fid) return;
      var i = PS_FAVS.indexOf(fid);
      if (i > -1) { PS_FAVS.splice(i, 1); } else { PS_FAVS.push(fid); }
      psSaveFavs();
      var on = PS_FAVS.indexOf(fid) > -1;
      favb.classList.toggle('is-on', on);
      favb.setAttribute('aria-pressed', on ? 'true' : 'false');
      psUpdateFavToggle();
      if (psState.favOnly) psFilter();
      return;
    }
    if (e.target.closest('.p2-favtoggle')) {
      psState.favOnly = !psState.favOnly;
      psUpdateFavToggle();
      psFilter();
      return;
    }
    if (e.target.closest('.p2-loadmore')) {
      psState.limit = 999999;
      psFilter();
      return;
    }
    /* Copier le lien (encart de partage des fiches). */
    var cpy = e.target.closest('.p2-share-copy');
    if (cpy) {
      var url = cpy.getAttribute('data-url') || location.href;
      function copied() {
        var ok = cpy.parentElement.querySelector('.p2-share-ok');
        if (ok) { ok.hidden = false; setTimeout(function () { ok.hidden = true; }, 1800); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(copied).catch(function () {});
      } else {
        var tmp = document.createElement('input');
        tmp.value = url;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); copied(); } catch (err) {}
        tmp.remove();
      }
    }
  });

  function psFilter() {
    var root = document.querySelector('.clarte-frm-layout');
    if (!root) return;
    var checked = {};
    root.querySelectorAll('.clarte-filters input[type="checkbox"]:checked').forEach(function (c) {
      var g = c.getAttribute('data-group');
      if (!g) return;
      (checked[g] = checked[g] || []).push(c.value);
    });
    var cout = psCoutState(root);
    var groups = Object.keys(checked);
    var qEl = document.querySelector('.clarte-frm-hero input[type="search"]');
    var words = qEl ? psFoldJs(qEl.value).split(/\s+/).filter(Boolean) : [];
    var sig = JSON.stringify([checked, cout.active ? cout.max : 0, words, psState.favOnly]);
    if (sig !== psState.sig) { psState.sig = sig; psState.limit = 12; }
    var matched = [];
    root.querySelectorAll('.clarte-fcard').forEach(function (card) {
      var ok = true;
      for (var i = 0; i < groups.length && ok; i++) {
        var g = groups[i], vals = checked[g];
        if (g === 'accred' || g === 'domaine') {
          var list = (card.getAttribute('data-' + g) || '').split('|');
          ok = vals.some(function (v) { return list.indexOf(v) > -1; });
        } else {
          ok = vals.indexOf(card.getAttribute('data-' + g)) > -1;
        }
      }
      if (ok && cout.active) {
        ok = parseInt(card.getAttribute('data-cout') || '0', 10) <= cout.max;
      }
      if (ok && words.length) {
        ok = psMatch(words, card.getAttribute('data-search') || '');
      }
      if (ok && psState.favOnly) {
        ok = PS_FAVS.indexOf(card.getAttribute('data-fid')) > -1;
      }
      if (ok) { matched.push(card); } else { card.style.display = 'none'; }
    });
    var shown = matched.length;
    matched.forEach(function (card, i) { card.style.display = (i < psState.limit) ? '' : 'none'; });
    psLoadMore(root, shown);
    var cnt = root.querySelector('.clarte-results__head .count b');
    if (cnt) cnt.textContent = shown;
    var clbl = root.querySelector('.ps-count-label');
    if (clbl) clbl.textContent = (shown <= 1 ? 'formation trouvée' : 'formations trouvées');
    var none = root.querySelector('.clarte-noresult');
    if (none) none.hidden = (shown > 0);
    var active = (groups.length > 0) || cout.active || (words.length > 0);
    var countBox = root.querySelector('.clarte-results__head .count');
    if (countBox) countBox.classList.toggle('is-on', active);
    psRenderChips(root, checked, cout, qEl);
    var apply = root.querySelector('.p2-filters-apply');
    if (apply) apply.textContent = active ? ('Voir les ' + shown + ' résultats') : 'Voir les résultats';
    psSyncUrl(checked, cout, qEl);
  }
  function psEcoleFilter() {
    var wrap = document.querySelector('.clarte-ec-wrap');
    if (!wrap) return;
    var filters = {};
    wrap.querySelectorAll('select[data-ecfilter]').forEach(function (s) {
      var k = s.getAttribute('data-ecfilter');
      if (s.value) filters[k] = s.value;
    });
    var qEl = wrap.querySelector('#ps-ec-search');
    var words = qEl ? psFoldJs(qEl.value).split(/\s+/).filter(Boolean) : [];
    var shown = 0;
    wrap.querySelectorAll('.clarte-ec-card').forEach(function (card) {
      var ok = true;
      Object.keys(filters).forEach(function (k) {
        if (ok && card.getAttribute('data-' + k) !== filters[k]) ok = false;
      });
      if (ok && words.length) {
        var hay = card.getAttribute('data-search') || '';
        ok = psMatch(words, hay);
      }
      card.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    var cnt = wrap.querySelector('.clarte-ec-count b');
    if (cnt) cnt.textContent = shown;
    var elbl = wrap.querySelector('.ps-eccount-label');
    if (elbl) elbl.textContent = (shown <= 1 ? 'établissement' : 'établissements');
    var none = wrap.querySelector('.clarte-ec-noresult');
    if (none) none.hidden = (shown > 0);
  }
  function psSort() {
    var grid = document.querySelector('.clarte-results__grid');
    var sel = document.querySelector('#ps-sort');
    if (!grid || !sel) return;
    var v = sel.value;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.clarte-fcard'));
    cards.sort(function (a, b) {
      var ca = parseInt(a.getAttribute('data-cout') || '0', 10);
      var cb = parseInt(b.getAttribute('data-cout') || '0', 10);
      if (v === 'asc') return ca - cb;
      if (v === 'desc') return cb - ca;
      return (parseInt(a.getAttribute('data-ord') || '0', 10)) - (parseInt(b.getAttribute('data-ord') || '0', 10));
    });
    cards.forEach(function (c) { grid.appendChild(c); });
    var nr = grid.querySelector('.clarte-noresult');
    if (nr) grid.appendChild(nr);
    psFilter();
  }

  document.addEventListener('click', function (e) {
    if (PS_AC.box && !PS_AC.box.hidden && !e.target.closest('.clarte-frm-hero')) { psAcHide(); }
    var frmRoot = document.querySelector('.clarte-frm-layout');
    var chip = e.target.closest('.p2-chip');
    if (chip && frmRoot) {
      var ct = chip.getAttribute('data-chip'), fil = frmRoot.querySelector('.clarte-filters');
      if (ct === 'cb') {
        var g = chip.getAttribute('data-group'), v = chip.getAttribute('data-value');
        frmRoot.querySelectorAll('.clarte-filters input[type="checkbox"][data-group="' + g + '"]').forEach(function (cb) { if (cb.value === v) cb.checked = false; });
        updateCounts(fil);
      } else if (ct === 'cout') {
        var sc = frmRoot.querySelector('#ps-cout'); if (sc) sc.value = sc.max;
        updateCounts(fil);
      } else if (ct === 'search') {
        var hs = document.querySelector('.clarte-frm-hero input[type="search"]'); if (hs) hs.value = '';
        psAcHide();
      } else if (ct === 'clear') {
        frmRoot.querySelectorAll('.clarte-filters input[type="checkbox"]').forEach(function (c) { c.checked = false; });
        var sc2 = frmRoot.querySelector('#ps-cout'); if (sc2) sc2.value = sc2.max;
        var hs2 = document.querySelector('.clarte-frm-hero input[type="search"]'); if (hs2) hs2.value = '';
        updateCounts(fil); psAcHide();
      }
      psFilter();
      return;
    }
    if (e.target.closest('.p2-filterbtn')) { document.body.classList.add('p2-filters-open'); return; }
    if (e.target.closest('.p2-filters-close') || e.target.closest('.p2-filters-overlay') || e.target.closest('.p2-filters-apply')) { document.body.classList.remove('p2-filters-open'); return; }
    var head = e.target.closest('.clarte-acc__head');
    if (head) {
      head.parentElement.classList.toggle('is-open');
      return;
    }
    var clear = e.target.closest('.clarte-clear');
    if (clear) {
      var root = clear.closest('.clarte-filters');
      if (root) {
        root.querySelectorAll('input[type="checkbox"]').forEach(function (c) { c.checked = false; });
        var s = root.querySelector('#ps-cout');
        if (s) { s.value = s.max; }
        updateCounts(root);
        psFilter();
      }
      return;
    }
    var tag = e.target.closest('.clarte-tags a');
    if (tag) {
      e.preventDefault();
      var qy = tag.textContent.trim();
      if (document.querySelector('.clarte-frm-layout')) {
        var hero = document.querySelector('.clarte-frm-hero input[type="search"]');
        if (hero) { hero.value = qy; }
        psFilter();
        var top = document.querySelector('.clarte-frm-layout');
        if (top) { top.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      } else {
        location.href = '/formations/?q=' + encodeURIComponent(qy);
      }
    }
  });

  document.addEventListener('change', function (e) {
    if (e.target.matches && e.target.matches('.clarte-filters input[type="checkbox"]')) {
      updateCounts(e.target.closest('.clarte-filters'));
      psFilter();
    } else if (e.target.matches && e.target.matches('select[data-ecfilter]')) {
      psEcoleFilter();
    } else if (e.target.id === 'ps-sort') {
      psSort();
    } else if (e.target.matches && e.target.matches('select.clarte-haother')) {
      var sel = e.target;
      var form = sel.closest('form') || document;
      var other = form.querySelector('.clarte-other[data-for="' + sel.name + '"]');
      if (other) {
        var show = (sel.value === 'Autre');
        other.hidden = !show;
        var inp = other.querySelector('input, textarea');
        if (inp) { if (show) { inp.setAttribute('required', 'required'); } else { inp.removeAttribute('required'); inp.value = ''; } }
      }
    }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'ps-cout') { psFilter(); }
    else if (t.id === 'ps-ec-search') { psEcoleFilter(); }
    else if (t.type === 'search' && t.closest && t.closest('.clarte-frm-hero')) { psFilter(); psAutoUpdate(); }
  });

  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.type === 'search' && e.target.closest && e.target.closest('.clarte-frm-hero')) { psAutoUpdate(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) { psAcHide(); psCmpClose(); }
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form && form.closest && form.closest('.clarte-frm-hero') && document.querySelector('.clarte-frm-layout')) {
      e.preventDefault();
      psFilter();
      psAcHide();
    }
  });

  /* Mobile : libelle de tri raccourci pour tenir sur une seule ligne */
  function psSortLabel() {
    var s = document.getElementById('ps-sort');
    if (!s || !s.options.length) return;
    s.options[0].text = window.matchMedia('(max-width: 719px)').matches ? 'Pertinence' : 'Trier : Pertinence';
  }
  window.addEventListener('resize', psSortLabel);

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.clarte-filters').forEach(updateCounts);
    var gi = 0;
    document.querySelectorAll('.clarte-results__grid .clarte-fcard').forEach(function (c) { c.setAttribute('data-ord', gi++); });
    var params = new URLSearchParams(location.search);
    var q = params.get('q');
    if (q) {
      var hero = document.querySelector('.clarte-frm-hero input[type="search"]');
      if (hero) { hero.value = q; }
    }
    /* Filtres mémorisés dans l'adresse : restauration au chargement (lien partagé, bouton retour). */
    ['domaine', 'region', 'niveau', 'type', 'accred', 'langue'].forEach(function (g) {
      var v = params.get(g);
      if (!v) return;
      var vals = v.split('|');
      document.querySelectorAll('.clarte-filters input[type="checkbox"][data-group="' + g + '"]').forEach(function (cb) {
        if (vals.indexOf(cb.value) > -1) { cb.checked = true; }
      });
    });
    var cv = parseInt(params.get('cout') || '', 10);
    var slider = document.querySelector('#ps-cout');
    if (slider && !isNaN(cv)) {
      slider.value = Math.max(parseInt(slider.min, 10) || 0, Math.min(parseInt(slider.max, 10), cv));
    }
    document.querySelectorAll('.clarte-filters').forEach(updateCounts);
    psSortLabel();
    psDecorate();
    psUpdateFavToggle();
    psAcBuild();
    psFilter();
    psEcoleFilter();
    var path = location.pathname.replace(/\/+$/, '') || '/';
    document.querySelectorAll('.wp-block-navigation a').forEach(function (a) {
      try {
        var ap = new URL(a.href, location.origin).pathname.replace(/\/+$/, '') || '/';
        if (ap === path) { a.classList.add('ps-nav-current'); }
      } catch (err) {}
    });
  });

  /* Onglets de la page Contact */
  function ctActivate(idx) {
    document.querySelectorAll('.clarte-ct-tab').forEach(function (t) {
      t.classList.toggle('on', t.getAttribute('data-tab') === idx);
    });
    document.querySelectorAll('.clarte-ct-panel').forEach(function (p) {
      p.classList.toggle('on', p.getAttribute('data-tab') === idx);
    });
  }
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.clarte-ct-tab');
    if (tab) { ctActivate(tab.getAttribute('data-tab')); }
  });
  function ctHash() {
    if (location.hash === '#referencement' && document.querySelector('.clarte-ct-tab')) {
      ctActivate('2');
      var el = document.querySelector('.clarte-ct-tabs');
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
  }
  document.addEventListener('DOMContentLoaded', ctHash);
  window.addEventListener('hashchange', ctHash);

  /* Onglets horizontaux des fiches (formation / école) */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.clarte-ff-tab');
    if (!t) return;
    var main = t.closest('.clarte-ff-main');
    if (!main) return;
    var idx = t.getAttribute('data-tab');
    main.querySelectorAll('.clarte-ff-tab').forEach(function (x) { x.classList.toggle('on', x === t); });
    main.querySelectorAll('.clarte-ff-panel').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-tab') === idx); });
  });

  /* Plaquette PDF : le clic ouvre un pop-up contenant le formulaire à remplir.
     Envoi réussi -> téléchargement automatique du PDF puis fermeture du pop-up. */
  function ps_triggerDownload(url) {
    var a = document.createElement('a');
    a.href = url;
    a.download = '';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function ps_resetPlaquetteModal(modal) {
    if (!modal) return;
    var head = modal.querySelector('[data-plaq-head]');
    var body = modal.querySelector('[data-plaq-body]');
    var success = modal.querySelector('[data-plaq-success]');
    if (head) { head.hidden = false; }
    if (body) { body.hidden = false; }
    if (success) { success.hidden = true; }
  }
  function ps_openModal(modal) {
    if (!modal) return;
    ps_resetPlaquetteModal(modal);
    modal.hidden = false;
    document.body.classList.add('p2-plaq-lock');
    var firstField = modal.querySelector('select, input');
    if (firstField) { window.setTimeout(function () { firstField.focus(); }, 60); }
  }
  function ps_closeModal(modal) {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('p2-plaq-lock');
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-plaquette-trigger]');
    if (trigger) {
      var modal = document.getElementById(trigger.getAttribute('data-modal-target'));
      ps_openModal(modal);
      return;
    }
    var closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn) {
      ps_closeModal(closeBtn.closest('[data-plaquette-modal]'));
      return;
    }
    if (e.target.hasAttribute && e.target.hasAttribute('data-plaquette-modal')) {
      ps_closeModal(e.target);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('[data-plaquette-modal]:not([hidden])');
    if (open) { ps_closeModal(open); }
  });

  /* Menu en cascade « Programme d'intérêt -> Formation visée » du pop-up plaquette (fiches école).
     Le menu « Formation visée » est reconstruit (et non simplement masqué) pour n'afficher que
     les formations réellement disponibles au niveau choisi, dans tous les navigateurs. */
  document.addEventListener('change', function (e) {
    var niveauSelect = e.target.closest('[data-niveau-select]');
    if (niveauSelect) {
      var form = niveauSelect.closest('form');
      var formationSelect = form ? form.querySelector('[data-formation-select]') : null;
      var formationId = form ? form.querySelector('[data-formation-id]') : null;
      if (!formationSelect) return;
      if (!formationSelect._psAllOptions) {
        formationSelect._psPlaceholder = formationSelect.querySelector('option[value=""]');
        formationSelect._psAllOptions = Array.prototype.slice.call(formationSelect.querySelectorAll('option[data-niveau]'));
      }
      var niveau = niveauSelect.value;
      formationSelect.innerHTML = '';
      if (formationSelect._psPlaceholder) { formationSelect.appendChild(formationSelect._psPlaceholder.cloneNode(true)); }
      formationSelect._psAllOptions.forEach(function (opt) {
        if (opt.getAttribute('data-niveau') === niveau) { formationSelect.appendChild(opt.cloneNode(true)); }
      });
      formationSelect.disabled = !niveau;
      if (formationId) { formationId.value = ''; }
    }
    var formationSelect2 = e.target.closest('[data-formation-select]');
    if (formationSelect2) {
      var form2 = formationSelect2.closest('form');
      var formationId2 = form2 ? form2.querySelector('[data-formation-id]') : null;
      var opt2 = formationSelect2.selectedOptions[0];
      if (formationId2) { formationId2.value = opt2 ? (opt2.getAttribute('data-id') || '') : ''; }
    }
  });

  /* Indicatif téléphonique + longueur + format d'exemple, selon le pays choisi.
     data-len / data-ph (posés sur les options des pays d'Afrique de l'Ouest) donnent le
     nombre de chiffres et un exemple de découpage local ; à défaut, fourchette générique. */
  document.addEventListener('change', function (e) {
    var paysSelect = e.target.closest('[data-pays-select]');
    if (!paysSelect) return;
    var wrap = paysSelect.closest('form') || paysSelect.parentElement;
    var prefixEl = wrap ? wrap.querySelector('[data-tel-prefix]') : null;
    var telInput = wrap ? wrap.querySelector('[data-tel-input]') : null;
    var opt = paysSelect.selectedOptions[0];
    var code = opt ? opt.getAttribute('data-code') : '';
    var len = opt ? opt.getAttribute('data-len') : '';
    var ph = opt ? opt.getAttribute('data-ph') : '';
    if (prefixEl && code) { prefixEl.textContent = code; }
    if (telInput) {
      if (len) {
        telInput.setAttribute('maxlength', len);
        telInput.setAttribute('pattern', '[0-9]{' + len + '}');
        telInput.setAttribute('title', 'Numéro à ' + len + ' chiffres pour cet indicatif');
        telInput.setAttribute('placeholder', ph || 'Numéro à ' + len + ' chiffres');
      } else {
        telInput.setAttribute('maxlength', '12');
        telInput.setAttribute('pattern', '[0-9]{6,12}');
        telInput.setAttribute('title', 'Numéro de 6 à 12 chiffres');
        telInput.setAttribute('placeholder', 'Numéro local (6 à 12 chiffres)');
      }
      if (telInput.value.length > parseInt(telInput.getAttribute('maxlength'), 10)) {
        telInput.value = telInput.value.slice(0, parseInt(telInput.getAttribute('maxlength'), 10));
      }
    }
  });

  /* Contraintes de saisie en direct, sur tous les formulaires du site :
     - téléphone : chiffres uniquement (l'indicatif est déjà affiché à part, on ne le
       laisse jamais réapparaître dans ce champ, y compris via l'auto-remplissage du navigateur)
     - nom / prénom : lettres, espaces, apostrophes et tirets uniquement */
  function ps_sanitizeTelField(t) {
    var digits = t.value.replace(/[^0-9]/g, '');
    var max = t.getAttribute('maxlength');
    if (max) { digits = digits.slice(0, parseInt(max, 10)); }
    if (digits !== t.value) { t.value = digits; }
  }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-tel-input]')) { ps_sanitizeTelField(t); }
    if (t.matches && (t.matches('[data-letters-only]') || t.name === 'nom' || t.name === 'prenom')) {
      var letters = t.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '');
      if (letters !== t.value) { t.value = letters; }
    }
  });
  /* Filet de sécurité : certains navigateurs déclenchent seulement "change" (pas "input")
     lors du remplissage automatique du numéro de téléphone. */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches && t.matches('[data-tel-input]')) { ps_sanitizeTelField(t); }
  });

  /* Envoi des formulaires (contact + fiches) sans rechargement */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.classList || !form.classList.contains('clarte-jsform')) { return; }
    e.preventDefault();
    var msg = form.querySelector('.clarte-form-msg');
    var btn = form.querySelector('button[type="submit"]');
    if (!window.psAjax) {
      if (msg) { msg.hidden = false; msg.className = 'clarte-form-msg err'; msg.textContent = 'Configuration manquante, recharge la page.'; }
      return;
    }
    var data = new FormData(form);
    data.append('action', form.getAttribute('data-action') || 'ps_submit_form');
    data.append('nonce', psAjax.nonce);
    data.append('formtype', form.getAttribute('data-formtype') || 'contact');
    data.append('context', form.getAttribute('data-context') || '');
    if (form.dataset.plaquetteUrl) { data.append('plaquette_url', form.dataset.plaquetteUrl); }
    var telPrefix = form.querySelector('[data-tel-prefix]');
    var telInput = form.querySelector('[data-tel-input]');
    if (telPrefix && telInput && telInput.value && telInput.value.indexOf('+') !== 0) {
      data.set('tel', telPrefix.textContent + ' ' + telInput.value);
    }
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); btn.textContent = 'Envoi…'; }
    fetch(psAjax.url, { method: 'POST', body: data, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        var ok = res && res.success;
        var isPlaquette = !!form.dataset.plaquetteUrl;
        /* Pour le pop-up plaquette, la confirmation se fait uniquement via l'icône de succès
           dédiée (pas de double message) — elle n'apparaît qu'une fois l'envoi terminé. */
        if (msg && !(ok && isPlaquette)) {
          msg.hidden = false;
          msg.className = 'clarte-form-msg ' + (ok ? 'ok' : 'err');
          msg.textContent = (res && res.data && res.data.message) ? res.data.message : (ok ? 'Envoyé.' : 'Une erreur est survenue.');
        }
        if (ok) {
          form.querySelectorAll('input, textarea, select').forEach(function (el) {
            if (el.type !== 'submit' && el.type !== 'button' && el.type !== 'hidden') { el.value = ''; }
          });
          form.querySelectorAll('.clarte-other').forEach(function (o) { o.hidden = true; });
          if (isPlaquette) {
            ps_triggerDownload(form.dataset.plaquetteUrl);
            var modal = form.closest('[data-plaquette-modal]');
            if (modal) {
              var head = modal.querySelector('[data-plaq-head]');
              var body = modal.querySelector('[data-plaq-body]');
              var success = modal.querySelector('[data-plaq-success]');
              if (head) { head.hidden = true; }
              if (body) { body.hidden = true; }
              if (success) { success.hidden = false; }
            }
          }
        }
        if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); btn.textContent = label; }
      })
      .catch(function () {
        if (msg) { msg.hidden = false; msg.className = 'clarte-form-msg err'; msg.textContent = 'Une erreur est survenue. Réessaie.'; }
        if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); btn.textContent = label; }
      });
  });

  /* ===== Accessibilité : rôles ARIA des onglets et accordéons, cible du lien d'évitement ===== */
  function a11yInit() {
    var main = document.querySelector('main');
    if (main && !main.id) { main.id = 'main'; }

    document.querySelectorAll('.clarte-ff-tabs, .clarte-ct-tabs').forEach(function (bar, bi) {
      bar.setAttribute('role', 'tablist');
      var isFF = bar.classList.contains('clarte-ff-tabs');
      var scope = isFF ? (bar.closest('.clarte-ff-main') || document) : document;
      var panelSel = isFF ? '.clarte-ff-panel' : '.clarte-ct-panel';
      bar.querySelectorAll('.clarte-ff-tab, .clarte-ct-tab').forEach(function (t) {
        var idx = t.getAttribute('data-tab');
        var tid = 'p2tab-' + bi + '-' + idx;
        t.id = tid;
        t.setAttribute('role', 'tab');
        t.setAttribute('aria-selected', t.classList.contains('on') ? 'true' : 'false');
        t.setAttribute('tabindex', t.classList.contains('on') ? '0' : '-1');
        var p = scope.querySelector(panelSel + '[data-tab="' + idx + '"]');
        if (p) { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', tid); }
      });
      bar.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') { return; }
        var list = Array.prototype.slice.call(bar.querySelectorAll('[role="tab"]'));
        var cur = list.indexOf(document.activeElement);
        if (cur < 0) { return; }
        e.preventDefault();
        var nx = e.key === 'ArrowRight' ? (cur + 1) % list.length : (cur - 1 + list.length) % list.length;
        list[nx].focus();
        list[nx].click();
      });
    });

    document.querySelectorAll('.clarte-acc__head').forEach(function (h) {
      h.setAttribute('aria-expanded', h.parentElement.classList.contains('is-open') ? 'true' : 'false');
    });
  }
  document.addEventListener('DOMContentLoaded', a11yInit);

  /* Synchronisation des états ARIA après chaque interaction (lue après tous les gestionnaires). */
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('.clarte-ff-tab, .clarte-ct-tab');
    var head = e.target.closest('.clarte-acc__head');
    if (!tab && !head) { return; }
    window.requestAnimationFrame(function () {
      if (tab) {
        var bar = tab.closest('.clarte-ff-tabs, .clarte-ct-tabs');
        if (bar) {
          bar.querySelectorAll('.clarte-ff-tab, .clarte-ct-tab').forEach(function (x) {
            var on = x.classList.contains('on');
            x.setAttribute('aria-selected', on ? 'true' : 'false');
            x.setAttribute('tabindex', on ? '0' : '-1');
          });
        }
      }
      if (head) {
        var fil = head.closest('.clarte-filters') || document;
        fil.querySelectorAll('.clarte-acc__head').forEach(function (h) {
          h.setAttribute('aria-expanded', h.parentElement.classList.contains('is-open') ? 'true' : 'false');
        });
      }
    });
  });

  /* Filtre par catégorie du blog */
  document.addEventListener('click', function (e) {
    var chip = e.target.closest('.clarte-bfilter button');
    if (!chip) return;
    var wrap = chip.closest('.clarte-blog-wrap');
    if (!wrap) return;
    var cat = chip.getAttribute('data-cat') || '';
    wrap.querySelectorAll('.clarte-bfilter button').forEach(function (b) { b.classList.toggle('on', b === chip); });
    var shown = 0;
    wrap.querySelectorAll('.clarte-blog-item').forEach(function (it) {
      var ok = (cat === '' || it.getAttribute('data-cat') === cat);
      it.style.display = ok ? '' : 'none';
      if (ok) shown++;
    });
    var none = wrap.querySelector('.clarte-bnoresult');
    if (none) none.hidden = (shown > 0);
  });
})();
