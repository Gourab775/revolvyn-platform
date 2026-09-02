export function initNavigation() {
	const navLogo = document.querySelector('.nav-logo');
	if (navLogo) {
		navLogo.addEventListener('click', (e) => {
			e.preventDefault();
			const hero = document.querySelector('.section[data-stage="0"]');
			if (hero) {
				hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	}

	document.querySelectorAll('[data-nav]').forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const stageIdx = parseInt(link.dataset.nav);
			const section = document.querySelector(`.section[data-stage="${stageIdx}"]`);
			if (section) {
				section.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		});
	});

	const navHamburger = document.getElementById('navHamburger');
	const navMobileOverlay = document.getElementById('navMobileOverlay');

	if (navHamburger && navMobileOverlay) {
		navHamburger.addEventListener('click', () => {
			navHamburger.classList.toggle('open');
			navMobileOverlay.classList.toggle('open');
		});

		document.querySelectorAll('[data-nav-mobile]').forEach(link => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
				const stageIdx = parseInt(link.dataset.navMobile);
				const section = document.querySelector(`.section[data-stage="${stageIdx}"]`);
				navHamburger.classList.remove('open');
				navMobileOverlay.classList.remove('open');
				if (section) {
					section.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			});
		});
	}
}
