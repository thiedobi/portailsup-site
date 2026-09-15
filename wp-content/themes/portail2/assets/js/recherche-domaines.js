/* PortailSup — suggestions de domaines dans la barre de recherche de l'accueil (11/09/2026).
   Dès 2 lettres tapées, une liste de domaines apparaît sous la barre (ex. « inf » → Informatique).
   Un clic (ou Entrée) ouvre la page Formations filtrée sur ce domaine. */
(function () {
	/* Mots proches pour chaque domaine (sans accents, en minuscules) */
	var SYNONYMES = {
		'informatique': ['info', 'numerique', 'digital', 'developpement', 'developpeur', 'code', 'programmation', 'data', 'donnees', 'cyber', 'logiciel', 'web', 'ia', 'intelligence artificielle', 'reseau'],
		'telecoms': ['telecom', 'telecommunication', 'reseau', 'reseaux', 'fibre', 'mobile'],
		'gestion': ['management', 'rh', 'ressources humaines', 'administration des entreprises', 'comptabilite', 'compta', 'audit', 'logistique', 'mba'],
		'commerce': ['vente', 'business', 'commercial', 'import', 'export', 'negoce', 'international'],
		'marketing': ['digital', 'publicite', 'marque', 'community', 'reseaux sociaux'],
		'communication': ['com', 'journalisme', 'journaliste', 'medias', 'relations publiques', 'audiovisuel'],
		'finance': ['banque', 'bancaire', 'assurance', 'comptabilite', 'compta', 'bourse', 'fiscalite', 'microfinance'],
		'economie': ['eco', 'economiste', 'statistique', 'developpement'],
		'droit': ['juridique', 'juriste', 'avocat', 'notaire', 'magistrat', 'justice', 'sciences politiques'],
		'administration': ['admin', 'fonction publique', 'etat', 'concours', 'ena', 'collectivites'],
		'sante': ['medecine', 'medecin', 'infirmier', 'infirmiere', 'sage-femme', 'pharmacie', 'pharmacien', 'soins', 'paramedical', 'dentaire'],
		'ingenierie': ['ingenieur', 'genie', 'genie civil', 'btp', 'electrique', 'mecanique', 'electromecanique', 'industriel', 'polytechnique'],
		'agronomie': ['agriculture', 'agricole', 'agro', 'elevage', 'agronome', 'rural'],
		'agroalimentaire': ['agro', 'alimentaire', 'nutrition', 'qualite', 'transformation'],
		'environnement': ['ecologie', 'climat', 'energie', 'developpement durable', 'eau', 'forets'],
		'lettres': ['langues', 'anglais', 'litterature', 'philosophie', 'histoire', 'sciences humaines', 'enseignement']
	};

	function fold(s) {
		return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
	}
	function esc(s) {
		return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
	}
	/* Met en gras la partie tapée dans le nom du domaine */
	function surligner(nom, q) {
		var f = fold(nom), i = f.indexOf(q);
		if (i < 0 || !q) { return esc(nom); }
		return esc(nom.slice(0, i)) + '<mark>' + esc(nom.slice(i, i + q.length)) + '</mark>' + esc(nom.slice(i + q.length));
	}

	/* Tolerance aux fautes de frappe */
	function lev(a, b, max) {
		var m = a.length, n = b.length, i, j;
		if (Math.abs(m - n) > max) { return max + 1; }
		var prev2 = [], prev = [], cur = [];
		for (j = 0; j <= n; j++) { prev[j] = j; }
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
				if (v < best) { best = v; }
			}
			if (best > max) { return max + 1; }
			for (j = 0; j <= n; j++) { prev2[j] = prev[j]; prev[j] = cur[j]; }
		}
		return prev[n];
	}
	function proche(q, mot) {
		var t = q.length >= 8 ? 2 : (q.length >= 4 ? 1 : 0);
		if (!t || mot.length < 3) { return false; }
		if (Math.abs(mot.length - q.length) <= t && lev(q, mot, t) <= t) { return true; }
		if (mot.length > q.length && q.length >= 5 && lev(q, mot.slice(0, q.length), t) <= t) { return true; }
		return false;
	}

	function init() {
		var data = window.p2Domaines;
		var form = document.querySelector('.p2-hero .p2-searchbar');
		if (!form || !data || !data.length) { return; }
		var input = form.querySelector('input[type="search"], input[name="q"]');
		if (!input) { return; }

		var domaines = data.map(function (d) {
			var cle = fold(d.nom);
			return { nom: d.nom, n: d.n, url: d.url, cle: cle, syn: SYNONYMES[cle] || [] };
		});

		var box = document.createElement('div');
		box.className = 'p2-acbox p2-domsugg';
		box.id = 'p2DomSugg';
		box.setAttribute('role', 'listbox');
		box.setAttribute('aria-label', 'Domaines suggérés');
		box.hidden = true;
		form.appendChild(box);
		input.setAttribute('role', 'combobox');
		input.setAttribute('aria-autocomplete', 'list');
		input.setAttribute('aria-controls', 'p2DomSugg');
		input.setAttribute('aria-expanded', 'false');
		input.setAttribute('autocomplete', 'off');

		var actifs = [], index = -1;

		function chercher(q) {
			var res = [];
			domaines.forEach(function (d) {
				var score = 0;
				if (d.cle.indexOf(q) === 0) { score = 3; }
				else if (q.length >= 3 && d.cle.indexOf(q) > 0) { score = 2; }
				else if (d.syn.some(function (s) { return s.indexOf(q) === 0 || (q.length >= 3 && s.indexOf(q) > -1); })) { score = 1; }
				else if (proche(q, d.cle)) { score = 1.5; }
				else if (d.syn.some(function (s) { return proche(q, s); })) { score = 0.5; }
				if (score) { res.push({ d: d, score: score }); }
			});
			res.sort(function (a, b) { return b.score - a.score || b.d.n - a.d.n; });
			return res.slice(0, 5).map(function (r) { return r.d; });
		}

		function fermer() {
			box.hidden = true; box.innerHTML = ''; actifs = []; index = -1;
			input.setAttribute('aria-expanded', 'false');
			input.removeAttribute('aria-activedescendant');
		}

		function afficher() {
			var brut = input.value.trim();
			var q = fold(brut);
			if (q.length < 2) { fermer(); return; }
			actifs = chercher(q);
			index = -1;
			/* Aucun domaine trouvé : pas de liste */
			if (!actifs.length) { fermer(); return; }
			var html = '';
			{
				html += '<p class="p2-domsugg-t">Domaines</p>';
				actifs.forEach(function (d, i) {
					html += '<a class="p2-acitem p2-domsugg-it" id="p2Dom' + i + '" role="option" aria-selected="false" href="' + esc(d.url) + '">'
						+ '<span class="p2-acitem-t">' + surligner(d.nom, q) + '</span>'
						+ '<span class="p2-acitem-s">' + d.n + ' formation' + (d.n > 1 ? 's' : '') + '</span></a>';
				});
			}
			html += '<button type="submit" class="p2-domsugg-all">Rechercher « ' + esc(brut) + ' » dans toutes les formations</button>';
			box.innerHTML = html;
			box.hidden = false;
			input.setAttribute('aria-expanded', 'true');
		}

		function surbrillance(i) {
			var items = box.querySelectorAll('.p2-domsugg-it');
			items.forEach(function (el, k) {
				var on = k === i;
				el.classList.toggle('is-on', on);
				el.setAttribute('aria-selected', on ? 'true' : 'false');
			});
			if (i >= 0 && items[i]) { input.setAttribute('aria-activedescendant', items[i].id); }
			else { input.removeAttribute('aria-activedescendant'); }
		}

		input.addEventListener('input', afficher);
		input.addEventListener('focus', function () { if (input.value.trim().length >= 2) { afficher(); } });
		input.addEventListener('keydown', function (e) {
			if (box.hidden) { return; }
			if (e.key === 'ArrowDown' && actifs.length) { e.preventDefault(); index = (index + 1) % actifs.length; surbrillance(index); }
			else if (e.key === 'ArrowUp' && actifs.length) { e.preventDefault(); index = (index - 1 + actifs.length) % actifs.length; surbrillance(index); }
			else if (e.key === 'Enter' && index >= 0 && actifs[index]) { e.preventDefault(); window.location.href = actifs[index].url; }
			else if (e.key === 'Escape') { fermer(); }
		});
		document.addEventListener('click', function (e) { if (!form.contains(e.target)) { fermer(); } });
	}

	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
	else { init(); }
})();
