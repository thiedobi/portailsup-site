/**
 * PortailSup — bouton flottant « Retour en haut de page ».
 * Ajouté le 17/09/2026. Pour annuler : retirer la ligne « inc/retour-haut.php » dans functions.php.
 */
(function () {
	"use strict";
	var THRESHOLD = 400;

	document.addEventListener("DOMContentLoaded", function () {
		var btn = document.createElement("button");
		btn.className = "p2-rh-btn";
		btn.type = "button";
		btn.setAttribute("aria-label", "Retour en haut de page");
		btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
		document.body.appendChild(btn);

		var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		function toggle() {
			if (window.scrollY > THRESHOLD) {
				btn.classList.add("is-visible");
			} else {
				btn.classList.remove("is-visible");
			}
		}

		btn.addEventListener("click", function () {
			window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
		});

		window.addEventListener("scroll", toggle, { passive: true });
		toggle();
	});
})();
