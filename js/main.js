import { warmGPU, initRenderer, bootScene, lerpCam, updateCamera, updateScene, cameraPath, renderer, startQualityMeasurement, updateQuality, applyPendingResize, updateTierTransition } from './three-scene.js';
import { initScrollSync, updateScroll, updateProgressbar, updateScrollHint, updateFooterVisibility } from './scroll.js';
import { initNavigation } from './navigation.js';
import { initVideos } from './videos.js';

// --- Loader integration: let percentage counter reach 100% once home page loads ---
let loaderHidden = false;
function hideLoader() {
	if (loaderHidden) return;
	loaderHidden = true;
	if (window.__rvLoader && typeof window.__rvLoader.done === 'function') {
		window.__rvLoader.done();
		return;
	}
	const loadingScreen = document.getElementById('loadingScreen');
	if (loadingScreen) {
		loadingScreen.classList.add('is-sliding');
		setTimeout(() => loadingScreen.remove(), 950);
	}
}
if (window.__rvLoader && typeof window.__rvLoader.setTarget === 'function') {
	window.__rvLoader.setTarget(68);
}
const LOADER_TIMEOUT_MS = 6500;
setTimeout(hideLoader, LOADER_TIMEOUT_MS);

// --- Independent UI (works with or without 3D) ---
initNavigation();

// --- Initialize Videos ---
initVideos();

// --- Initialize Scroll Sync ---
initScrollSync(cameraPath);

// --- 3D boot (failure must never break the page) ---
let sceneReady = false;
try {
	// --- GPU Warmup ---
	warmGPU();

	// --- Initialize Renderer ---
	await initRenderer();

	// --- Boot Scene (compute init + warmup renders) ---
	await bootScene();

	// --- Start FPS Measurement ---
	startQualityMeasurement();

	sceneReady = true;
} catch (err) {
	console.warn('3D scene disabled, content remains usable:', err);
}

// --- Hide Loading Screen ---
hideLoader();

// --- Hash Navigation ---
if (window.location.hash === '#about') {
	const aboutEl = document.getElementById('about');
	if (aboutEl) setTimeout(() => aboutEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

window.addEventListener('hashchange', () => {
	if (window.location.hash === '#about') {
		const aboutEl = document.getElementById('about');
		if (aboutEl) aboutEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
});

// --- Animation Loop ---
import * as THREE from 'three/webgpu';

const clock = new THREE.Clock();

function animate() {
	const dt = Math.min(clock.getDelta(), 0.05);

	applyPendingResize();
	updateTierTransition(dt);

	const currentScrollT = updateScroll(dt);
	const cam = lerpCam(currentScrollT);
	updateCamera(cam, dt);
	updateProgressbar();
	updateScrollHint();
	updateFooterVisibility(renderer.domElement);
	updateScene(dt);
	updateQuality(performance.now());
}

if (sceneReady) renderer.setAnimationLoop(animate);
