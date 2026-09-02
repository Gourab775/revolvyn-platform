import { warmGPU, initRenderer, bootScene, lerpCam, updateCamera, updateScene, cameraPath, renderer, startQualityMeasurement, updateQuality } from './three-scene.js';
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

// --- Start FPS Measurement ---
startQualityMeasurement();

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

function animate() {
	const dt = Math.min(clock.getDelta(), 0.05);

	const currentScrollT = updateScroll(dt);
	const cam = lerpCam(currentScrollT);
	updateCamera(cam, dt);
	updateProgressbar();
	updateScrollHint();
	updateFooterVisibility(renderer.domElement);
	updateScene(dt);
	updateQuality(performance.now());
}

renderer.setAnimationLoop(animate);
