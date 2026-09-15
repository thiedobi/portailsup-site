/* PortailSup — menu mobile : panneau de droite, page en cours, fermeture. */
(function () {
	function init() {
		var burger = document.getElementById('p2Burger');
		var drawer = document.getElementById('p2Drawer');
		var overlay = document.querySelector('.p2-drawer-overlay');
		var header = document.querySelector('.p2-header');
		if (!burger || !drawer || !overlay) { return; }
		var html = document.documentElement;
		var mq = window.matchMedia('(max-width: 719px)');
		burger.setAttribute('aria-controls', 'p2Drawer');

		/* Page en cours */
		var path = window.location.pathname.replace(/\/+$/, '') || '/';
		var bc = ' ' + document.body.className + ' ';
		var key = '';
		if (path === '/') { key = 'accueil'; }
		else if (/ (single-formation|post-type-archive-formation) /.test(bc) || /^\/formations?(\/|$)/.test(path)) { key = 'formations'; }
		else if (/ (single-ecole|post-type-archive-ecole) /.test(bc) || /^\/ecoles?(\/|$)/.test(path)) { key = 'ecoles'; }
		else if (/^\/orientation(\/|$)/.test(path)) { key = 'orientation'; }
		else if (/ (single-post|blog|category|tag|date|author) /.test(bc) || /^\/blog(\/|$)/.test(path)) { key = 'blog'; }
		else if (/^\/a-propos(\/|$)/.test(path)) { key = 'a-propos'; }
		else if (/^\/contact(\/|$)/.test(path)) { key = 'contact'; }
		drawer.querySelectorAll('[data-dnav="' + key + '"]').forEach(function (a) {
			a.classList.add('is-on'); a.setAttribute('aria-current', 'page');
		});

		function isOpen() { return drawer.classList.contains('is-on'); }
		function placeUnderHeader() {
			var h = header ? Math.max(0, header.getBoundingClientRect().bottom) : 64;
			html.style.setProperty('--p2-drawer-top', h + 'px');
		}
		var closeTimer = null;
		function open() {
			clearTimeout(closeTimer);
			placeUnderHeader();
			overlay.hidden = false; drawer.hidden = false;
			html.classList.add('p2-drawer-lock');
			burger.setAttribute('aria-expanded', 'true');
			burger.setAttribute('aria-label', 'Fermer le menu');
			drawer.getBoundingClientRect(); /* force le départ de l'animation */
			overlay.classList.add('is-on'); drawer.classList.add('is-on');
			var first = drawer.querySelector('a');
			if (first) { setTimeout(function () { first.focus({ preventScroll: true }); }, 350); }
		}
		function close(returnFocus) {
			overlay.classList.remove('is-on'); drawer.classList.remove('is-on');
			html.classList.remove('p2-drawer-lock');
			burger.setAttribute('aria-expanded', 'false');
			burger.setAttribute('aria-label', 'Ouvrir le menu');
			closeTimer = setTimeout(function () { overlay.hidden = true; drawer.hidden = true; }, 340);
			if (returnFocus) { burger.focus({ preventScroll: true }); }
		}

		/* Le bouton ☰ pilote ce panneau sur mobile (l'ancien menu déroulant reste pour les écrans plus larges) */
		window.addEventListener('click', function (e) {
			if (!mq.matches) { return; }
			if (e.target.closest('#p2Burger')) {
				e.stopImmediatePropagation(); e.preventDefault();
				if (isOpen()) { close(true); } else { open(); }
			}
		}, true);

		overlay.addEventListener('click', function () { close(false); });
		drawer.addEventListener('click', function (e) { if (e.target.closest('a')) { close(false); } });
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && isOpen()) { close(true); }
			if (e.key === 'Tab' && isOpen()) {
				var items = [burger].concat([].slice.call(drawer.querySelectorAll('a')));
				var i = items.indexOf(document.activeElement);
				if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
				else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
			}
		});
		/* La loupe ferme le menu avant d'ouvrir la recherche */
		var sbtn = document.querySelector('.p2-hsearch-btn');
		if (sbtn) { sbtn.addEventListener('click', function () { if (isOpen()) { close(false); } }, true); }
		/* Glisser vers la droite pour fermer */
		var x0 = null;
		drawer.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
		drawer.addEventListener('touchend', function (e) {
			if (x0 !== null && e.changedTouches[0].clientX - x0 > 70) { close(false); }
			x0 = null;
		}, { passive: true });
		/* Passage en écran large : on referme */
		var onChange = function () { if (!mq.matches && isOpen()) { close(false); } };
		if (mq.addEventListener) { mq.addEventListener('change', onChange); } else if (mq.addListener) { mq.addListener(onChange); }
	}
	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
	else { init(); }
})();
