let currentScrollT = 0;
let targetScrollT = 0;
let _scrollDirty = false;

const progressBar = document.getElementById('progressBar');
const navFloat = document.getElementById('navFloat');
const _scrollHint = document.querySelector('.scroll-hint');
const _siteFooter = document.querySelector('.site-footer');

// Reveal on Scroll
const revealObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			const el = entry.target;
			const delay = el.dataset.delay || '0';
			el.classList.add('revealed', `delay-${delay}`);
			revealObserver.unobserve(el);
		}
	});
}, { threshold: 0.1, rootMargin: '0px 0px -18% 0px' });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// Force reveal the scroll hint after a brief delay
setTimeout(() => {
	const hint = document.querySelector('.scroll-hint');
	if (hint && !hint.classList.contains('revealed')) {
		hint.classList.add('revealed', 'delay-4');
	}
}, 800);

// Scroll event listeners
window.addEventListener('scroll', () => { _scrollDirty = true; }, { passive: true });
window.addEventListener('touchmove', () => { _scrollDirty = true; }, { passive: true });

export function getScrollProgress() {
	const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
	const docHeight = document.documentElement.scrollHeight;
	const winHeight = window.innerHeight;
	const scrollable = docHeight - winHeight;
	return scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
}

export function syncCameraPathToDOM(cameraPath) {
	const docHeight = document.documentElement.scrollHeight;
	const winHeight = window.innerHeight;
	const scrollable = docHeight - winHeight;
	if (scrollable <= 0) return;
	cameraPath.forEach((kf, i) => {
		const section = document.querySelector(`.section[data-stage="${i}"]`);
		if (section) {
			const sectionTop = section.offsetTop;
			kf[0] = Math.min(1, Math.max(0, sectionTop / scrollable));
		}
	});
	cameraPath[cameraPath.length - 1][0] = 1.0;
}

export function initScrollSync(cameraPath) {
	syncCameraPathToDOM(cameraPath);
	window.addEventListener('resize', () => {
		setTimeout(() => syncCameraPathToDOM(cameraPath), 100);
	});
	window.addEventListener('load', () => {
		setTimeout(() => syncCameraPathToDOM(cameraPath), 200);
		setTimeout(() => syncCameraPathToDOM(cameraPath), 1000);
	});
}

export function updateScroll(dt) {
	if (_scrollDirty) {
		targetScrollT = getScrollProgress();
		_scrollDirty = false;
	}
	currentScrollT += (targetScrollT - currentScrollT) * Math.min(1, dt * 6);
	return currentScrollT;
}

export function getCurrentScrollT() {
	return currentScrollT;
}

export function updateProgressbar() {
	if (progressBar) {
		progressBar.style.transform = `scaleX(${currentScrollT})`;
	}
}

export function updateScrollHint() {
	if (_scrollHint) {
		_scrollHint.style.opacity = Math.max(0, 1 - currentScrollT * 15);
	}
}

export function updateFooterVisibility(rendererDomElement) {
	if (_siteFooter) {
		const footerTop = _siteFooter.getBoundingClientRect().top;
		if (footerTop < window.innerHeight) {
			const ty = -(window.innerHeight - footerTop);
			if (rendererDomElement._lastTy !== ty) {
				rendererDomElement.style.transform = `translateY(${ty}px)`;
				rendererDomElement._lastTy = ty;
			}
		} else if (rendererDomElement._lastTy !== 0) {
			rendererDomElement.style.transform = '';
			rendererDomElement._lastTy = 0;
		}
	}
}
