import { warmGPU, initRenderer, bootScene, lerpCam, updateCamera, updateScene, cameraPath, renderer, qualityTier } from './three-scene.js';
import { initScrollSync, updateScroll, updateProgressbar, updateScrollHint, updateFooterVisibility } from './scroll.js';
import { initNavigation } from './navigation.js';
import { initVideos } from './videos.js';

// --- GPU Warmup ---
warmGPU();

// --- Initialize Renderer ---
await initRenderer();

// --- Initialize Navigation ---
initNavigation();

// --- Initialize Videos ---
initVideos();

// --- Initialize Scroll Sync ---
initScrollSync(cameraPath);

// --- Boot Scene (compute init + warmup renders) ---
await bootScene();

// --- Hide Loading Screen ---
const loadingScreen = document.getElementById('loadingScreen');
if (loadingScreen) {
	loadingScreen.style.opacity = '0';
	loadingScreen.style.visibility = 'hidden';
	setTimeout(() => loadingScreen.remove(), 600);
}

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
let _visible = !document.hidden;
let _rafId = null;

// Pause when tab hidden, resume when visible
document.addEventListener('visibilitychange', () => {
	_visible = !document.hidden;
	if (_visible) {
		clock.getDelta(); // Reset delta to avoid jump
	}
});

function animate() {
	const dt = Math.min(clock.getDelta(), 0.05);

	// Skip all updates when tab is hidden
	if (!_visible) return;

	const currentScrollT = updateScroll(dt);
	const cam = lerpCam(currentScrollT);
	updateCamera(cam, dt);
	updateProgressbar();
	updateScrollHint();
	updateFooterVisibility(renderer.domElement);
	updateScene(dt);
}

renderer.setAnimationLoop(animate);
