/* PortailSup — bouton flottant « Contacter » (fiches formation et école, écrans ≤ 1000 px). */
(function () {
	function init() {
		var form = document.querySelector('.p2-ffside > .clarte-ff-form');
		if (!form) { return; }
		var side = form.parentNode;
		var html = document.documentElement;
		var mq = window.matchMedia('(max-width: 1000px)');
		var titleEl = form.querySelector('h3');
		var label = titleEl ? titleEl.textContent.trim() : 'Contacter l’établissement';
		if (titleEl && !titleEl.id) { titleEl.id = 'p2CfTitle'; }

		/* Repère pour remettre le formulaire à sa place sur grand écran */
		var marker = document.createComment('p2-contact-form');
		side.insertBefore(marker, form);

		/* Bouton flottant */
		var fab = document.createElement('button');
		fab.type = 'button';
		fab.className = 'p2-cf-fab';
		fab.setAttribute('aria-haspopup', 'dialog');
		fab.setAttribute('aria-expanded', 'false');
		fab.setAttribute('aria-controls', 'p2CfSheet');
		fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.6c0 4.3-3.8 7.7-8.5 7.7-1.2 0-2.3-.2-3.3-.6L3.5 20l1.4-3.9c-.9-1.3-1.4-2.8-1.4-4.5C3.5 7.3 7.3 4 12 4s8.5 3.3 8.5 7.6Z"/><path d="M8.5 11.8h.01M12 11.8h.01M15.5 11.8h.01"/></svg><span></span>';
		fab.querySelector('span').textContent = label;

		/* Voile + panneau */
		var overlay = document.createElement('div');
		overlay.className = 'p2-cf-overlay';
		overlay.hidden = true;
		var sheet = document.createElement('div');
		sheet.className = 'p2-cf-sheet';
		sheet.id = 'p2CfSheet';
		sheet.setAttribute('role', 'dialog');
		sheet.setAttribute('aria-modal', 'true');
		if (titleEl) { sheet.setAttribute('aria-labelledby', titleEl.id); } else { sheet.setAttribute('aria-label', label); }
		sheet.hidden = true;
		sheet.innerHTML = '<div class="p2-cf-top"><span class="p2-cf-handle" aria-hidden="true"></span>'
			+ '<button type="button" class="p2-cf-close" aria-label="Fermer le formulaire"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
		document.body.appendChild(overlay);
		document.body.appendChild(sheet);
		document.body.appendChild(fab);
		var closeBtn = sheet.querySelector('.p2-cf-close');

		/* Le formulaire va dans le panneau (petits écrans) ou reste à droite (grands écrans) */
		function place() {
			if (mq.matches) {
				if (form.parentNode !== sheet) { sheet.appendChild(form); }
				side.classList.add('p2-cf-moved');
				document.body.classList.add('p2-cf-on');
			} else {
				if (isOpen()) { close(false); }
				if (form.parentNode !== side) { side.insertBefore(form, marker.nextSibling); }
				side.classList.remove('p2-cf-moved');
				document.body.classList.remove('p2-cf-on');
			}
		}
		function isOpen() { return sheet.classList.contains('is-on'); }
		var timer = null;
		function open() {
			clearTimeout(timer);
			overlay.hidden = false; sheet.hidden = false;
			html.classList.add('p2-cf-lock');
			fab.setAttribute('aria-expanded', 'true');
			sheet.getBoundingClientRect();
			overlay.classList.add('is-on'); sheet.classList.add('is-on');
			sheet.scrollTop = 0;
			setTimeout(function () { closeBtn.focus({ preventScroll: true }); }, 380);
		}
		function close(returnFocus) {
			overlay.classList.remove('is-on'); sheet.classList.remove('is-on');
			html.classList.remove('p2-cf-lock');
			fab.setAttribute('aria-expanded', 'false');
			timer = setTimeout(function () { overlay.hidden = true; sheet.hidden = true; }, 380);
			if (returnFocus) { fab.focus({ preventScroll: true }); }
		}

		fab.addEventListener('click', open);
		closeBtn.addEventListener('click', function () { close(true); });
		overlay.addEventListener('click', function () { close(true); });
		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && isOpen()) { close(true); }
		});
		/* Glisser la poignée vers le bas pour fermer */
		var y0 = null;
		sheet.addEventListener('touchstart', function (e) {
			y0 = (sheet.scrollTop <= 0 && e.target.closest('.p2-cf-top')) ? e.touches[0].clientY : null;
		}, { passive: true });
		sheet.addEventListener('touchend', function (e) {
			if (y0 !== null && e.changedTouches[0].clientY - y0 > 70) { close(true); }
			y0 = null;
		}, { passive: true });

		/* Saisie ailleurs dans la page (avis, recherche) : le bouton se retire */
		document.addEventListener('focusin', function (e) {
			if (e.target.matches('input, textarea, select') && !sheet.contains(e.target)) { html.classList.add('p2-cf-typing'); }
		});
		document.addEventListener('focusout', function () {
			setTimeout(function () {
				var a = document.activeElement;
				if (!a || !a.matches('input, textarea, select') || sheet.contains(a)) { html.classList.remove('p2-cf-typing'); }
			}, 120);
		});

		place();
		if (mq.addEventListener) { mq.addEventListener('change', place); } else if (mq.addListener) { mq.addListener(place); }
		setTimeout(function () { fab.classList.add('is-ready'); }, 400);
	}
	if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
	else { init(); }
})();
