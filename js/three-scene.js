import * as THREE from 'three/webgpu';
import {
	Fn, uniform, float, vec3, instancedArray, instanceIndex, uv,
	positionGeometry, positionWorld, sin, cos, pow, smoothstep, mix,
	sqrt, select, hash, time, deltaTime, PI, mx_noise_float,
	pass, mrt, output, transformedNormalView,
} from 'three/tsl';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';

// --- Device Detection ---
export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || innerWidth < 768;
export const isLowEnd = isMobile || (navigator.deviceMemory && navigator.deviceMemory < 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4);
const powerPref = isLowEnd ? 'low-power' : 'high-performance';

// --- GPU Warmup ---
export function warmGPU() {
	try {
		const c = document.createElement('canvas');
		const gl = c.getContext('webgl2', { powerPreference: 'high-performance', desynchronized: true })
			|| c.getContext('webgl', { powerPreference: 'high-performance' });
		if (gl) {
			const ext = gl.getExtension('WEBGL_debug_renderer_info');
			if (ext) console.log('GPU:', gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		}
	} catch (e) {}
}

// --- Constants ---
const BLADE_COUNT = 120000;
const FIELD_SIZE = 30;
const BACKGROUND_HEX = '#000000';
const GROUND_HEX = '#000000';
const BLADE_BASE_HEX = '#0e1e04';
const BLADE_TIP_HEX = '#c8b840';

// --- Sky Gradient ---
const skyColors = {
	top:     new THREE.Color('#000000'),
	midHigh: new THREE.Color('#000000'),
	midLow:  new THREE.Color('#000000'),
	horizon: new THREE.Color('#000000'),
};

function buildSkyTexture() {
	const w = 2, h = 512;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	const grad = ctx.createLinearGradient(0, 0, 0, h);
	grad.addColorStop(0.0,  '#' + skyColors.top.getHexString());
	grad.addColorStop(0.35, '#' + skyColors.midHigh.getHexString());
	grad.addColorStop(0.65, '#' + skyColors.midLow.getHexString());
	grad.addColorStop(1.0,  '#' + skyColors.horizon.getHexString());
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, w, h);
	const tex = new THREE.CanvasTexture(canvas);
	tex.mapping = THREE.EquirectangularReflectionMapping;
	tex.colorSpace = THREE.SRGBColorSpace;
	tex.needsUpdate = true;
	return tex;
}

// --- Scene ---
export const scene = new THREE.Scene();
scene.background = buildSkyTexture();
scene.fog = new THREE.FogExp2('#000000', 0.035);

// --- Camera ---
const aspectRatio = innerWidth / innerHeight;
export const camera = new THREE.PerspectiveCamera(38, aspectRatio, 0.1, 100);
camera.position.set(0, 8, 18);
camera.lookAt(0, 0, 0);

// --- Renderer ---
export const renderer = new THREE.WebGPURenderer({ antialias: !isLowEnd, powerPreference: powerPref });
const maxDPR = window.innerWidth < 1200 ? 1.5 : Math.min(devicePixelRatio, 2);
renderer.setPixelRatio(maxDPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.sortObjects = false;
document.body.appendChild(renderer.domElement);

// --- GPU Buffers ---
const bladeData = instancedArray(BLADE_COUNT, 'vec4');
const bendState = instancedArray(BLADE_COUNT, 'vec4');
const bladeBound = instancedArray(BLADE_COUNT, 'float');

// --- Uniforms ---
export const mouseWorld = uniform(new THREE.Vector3(99999, 0, 99999));
const mouseRadius = uniform(6.1);
const mouseStrength = uniform(4.0);
const outerRadius = uniform(9.4);
const outerStrength = uniform(1.45);
export const camSphereWorld = uniform(new THREE.Vector3(99999, 0, 99999));
const camSphereRadius = uniform(15.0);
const camSphereStrength = uniform(5.9);

const grassDensity = uniform(1.0);
const windSpeed = uniform(1.3);
const windAmplitude = uniform(0.21);
const bladeWidth = uniform(4.0);
const bladeTipWidth = uniform(0.19);
const bladeHeight = uniform(1.6);
const bladeHeightVariation = uniform(0.5);
const bladeLean = uniform(1.1);
const noiseAmplitude = uniform(1.85);
const noiseFrequency = uniform(0.3);
const noise2Amplitude = uniform(0.2);
const noise2Frequency = uniform(15);
const bladeColorVariation = uniform(0.93);
const groundRadius = uniform(13.8);
const groundFalloff = uniform(2.4);
const bladeBaseColor = uniform(new THREE.Color(BLADE_BASE_HEX));
const bladeTipColor = uniform(new THREE.Color(BLADE_TIP_HEX));
const backgroundColor = uniform(new THREE.Color(BACKGROUND_HEX));
const groundColor = uniform(new THREE.Color(GROUND_HEX));
const fogStart = uniform(6.5);
const fogEnd = uniform(12.0);
const fogIntensity = uniform(1.0);
const fogColor = uniform(new THREE.Color('#000000'));
let fogEnabled = true;
const goldenTipColor = uniform(new THREE.Color('#d4b838'));
const greenTipColor = uniform(new THREE.Color('#4a7a14'));
const midColor = uniform(new THREE.Color('#2d4e0e'));

// --- DoF Uniforms ---
const focusDistanceU = uniform(31.83);
const focalLengthU = uniform(10.0);
const bokehScaleU = uniform(12.5);
let dofEnabled = true;

// Mouse-world distance for auto-focus
let mouseFocusDist = 10.0;
let autoFocusSmoothed = 10.0;

const noise2D = Fn(([x, z]) => mx_noise_float(vec3(x, float(0), z)).mul(0.5).add(0.5));

// --- Compute Init ---
export const computeInit = Fn(() => {
	const blade = bladeData.element(instanceIndex);
	const col = instanceIndex.mod(283);
	const row = instanceIndex.div(283);
	const jx = hash(instanceIndex).sub(0.5);
	const jz = hash(instanceIndex.add(7919)).sub(0.5);
	const wx = col.toFloat().add(jx).div(float(283)).sub(0.5).mul(FIELD_SIZE);
	const wz = row.toFloat().add(jz).div(float(283)).sub(0.5).mul(FIELD_SIZE);
	blade.x.assign(wx);
	blade.y.assign(wz);
	blade.z.assign(hash(instanceIndex.add(1337)).mul(PI.mul(2)));
	const n1 = noise2D(wx.mul(noiseFrequency), wz.mul(noiseFrequency));
	const n2 = noise2D(wx.mul(noiseFrequency.mul(noise2Frequency)).add(50), wz.mul(noiseFrequency.mul(noise2Frequency)).add(50));
	const clump = n1.mul(noiseAmplitude).sub(noise2Amplitude).add(n2.mul(noise2Amplitude).mul(2)).max(0);
	blade.w.assign(clump);
	const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
	const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
	const maxR = float(12.0).add(edgeNoise.sub(0.5).mul(6.0));
	const boundary = float(1).sub(smoothstep(maxR.sub(1.5), maxR, dist));
	bladeBound.element(instanceIndex).assign(select(boundary.lessThan(0.05), float(0), boundary));
})().compute(BLADE_COUNT);

// --- Compute Update ---
export const computeUpdate = Fn(() => {
	const blade = bladeData.element(instanceIndex);
	const bend = bendState.element(instanceIndex);
	const bx = blade.x;
	const bz = blade.y;

	const w1 = sin(bx.mul(0.35).add(bz.mul(0.12)).add(time.mul(windSpeed)));
	const w2 = sin(bx.mul(0.18).add(bz.mul(0.28)).add(time.mul(windSpeed.mul(0.67))).add(1.7));
	const windX = w1.add(w2).mul(windAmplitude);
	const windZ = w1.sub(w2).mul(windAmplitude.mul(0.55));

	const lw = deltaTime.mul(4.0).saturate();
	bend.x.assign(mix(bend.x, windX, lw));
	bend.y.assign(mix(bend.y, windZ, lw));

	// Mouse push
	const dx = bx.sub(mouseWorld.x);
	const dz = bz.sub(mouseWorld.z);
	const dist = sqrt(dx.mul(dx).add(dz.mul(dz))).add(0.0001);
	const falloff = float(1).sub(dist.div(mouseRadius).saturate());
	const influence = falloff.mul(falloff).mul(mouseStrength);
	const pushX = dx.div(dist).mul(influence);
	const pushZ = dz.div(dist).mul(influence);

	// Outer mouse sphere
	const odx = bx.sub(mouseWorld.x);
	const odz = bz.sub(mouseWorld.z);
	const odist = sqrt(odx.mul(odx).add(odz.mul(odz))).add(0.0001);
	const ofalloff = float(1).sub(odist.div(outerRadius).saturate());
	const oinfluence = ofalloff.mul(ofalloff).mul(outerStrength);
	const opushX = odx.div(odist).mul(oinfluence);
	const opushZ = odz.div(odist).mul(oinfluence);

	// Camera sphere push
	const cdx = bx.sub(camSphereWorld.x);
	const cdz = bz.sub(camSphereWorld.z);
	const cdist = sqrt(cdx.mul(cdx).add(cdz.mul(cdz))).add(0.0001);
	const cfalloff = float(1).sub(cdist.div(camSphereRadius).saturate());
	const cinfluence = cfalloff.mul(cfalloff).mul(camSphereStrength);
	const cpushX = cdx.div(cdist).mul(cinfluence);
	const cpushZ = cdz.div(cdist).mul(cinfluence);

	const totalPushX = pushX.add(opushX).add(cpushX);
	const totalPushZ = pushZ.add(opushZ).add(cpushZ);

	const targetMag = sqrt(totalPushX.mul(totalPushX).add(totalPushZ.mul(totalPushZ)));
	const currentMag = sqrt(bend.z.mul(bend.z).add(bend.w.mul(bend.w)));
	const lm = select(targetMag.greaterThan(currentMag), deltaTime.mul(12.0), deltaTime.mul(1)).saturate();
	bend.z.assign(mix(bend.z, totalPushX, lm));
	bend.w.assign(mix(bend.w, totalPushZ, lm));
})().compute(BLADE_COUNT);

// --- Blade Geometry ---
function createBladeGeometry() {
	const segs = 5, W = 0.055, H = 1.0;
	const verts = [], norms = [], uvArr = [], idx = [];
	for (let i = 0; i <= segs; i++) {
		const t = i / segs, y = t * H, hw = W * 0.5 * (1.0 - t * 0.82);
		verts.push(-hw, y, 0, hw, y, 0);
		norms.push(0, 0, 1, 0, 0, 1);
		uvArr.push(0, t, 1, t);
	}
	for (let i = 0; i < segs; i++) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
	geo.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
	geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
	geo.setIndex(idx);
	return geo;
}

// --- Grass Material ---
const grassMat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: true });

grassMat.positionNode = Fn(() => {
	const blade = bladeData.element(instanceIndex);
	const bend = bendState.element(instanceIndex);
	const worldX = blade.x, worldZ = blade.y, rotY = blade.z;
	const boundary = bladeBound.element(instanceIndex);
	const visible = select(hash(instanceIndex.add(9999)).lessThan(grassDensity.mul(0.5)), float(1), float(0));
	const hVar = hash(instanceIndex.add(5555)).mul(bladeHeightVariation);
	const heightScale = float(0.35).add(blade.w).add(hVar).mul(boundary).mul(visible);
	const taper = float(1).sub(uv().y.mul(float(1).sub(bladeTipWidth)));
	const lx = positionGeometry.x.mul(bladeWidth).mul(taper).mul(heightScale.sign());
	const ly = positionGeometry.y.mul(heightScale).mul(bladeHeight);
	const cY = cos(rotY), sY = sin(rotY);
	const rx = lx.mul(cY), rz = lx.mul(sY);
	const t = uv().y;
	const bendFactor = pow(t, 1.8);
	const staticBendX = hash(instanceIndex.add(7777)).sub(0.5).mul(bladeLean);
	const staticBendZ = hash(instanceIndex.add(8888)).sub(0.5).mul(bladeLean);
	const bendX = staticBendX.add(bend.x).add(bend.z);
	const bendZ = staticBendZ.add(bend.y).add(bend.w);
	const relX = rx.add(bendX.mul(bendFactor).mul(bladeHeight));
	const relY = ly;
	const relZ = rz.add(bendZ.mul(bendFactor).mul(bladeHeight));
	const origLen = sqrt(rx.mul(rx).add(ly.mul(ly)).add(rz.mul(rz)));
	const newLen = sqrt(relX.mul(relX).add(relY.mul(relY)).add(relZ.mul(relZ)));
	const scale = origLen.div(newLen.max(0.0001));
	return vec3(worldX.add(relX.mul(scale)), relY.mul(scale), worldZ.add(relZ.mul(scale)));
})();

grassMat.colorNode = Fn(() => {
	const t = uv().y;
	const clump = bladeData.element(instanceIndex).w.saturate();
	const bladeHash = hash(instanceIndex.add(4242));
	const isGolden = bladeHash.lessThan(0.4);
	const lowerGrad = smoothstep(float(0.0), float(0.45), t);
	const upperGrad = smoothstep(float(0.4), float(0.85), t);
	const tipMix = float(1).sub(bladeColorVariation).add(clump.mul(bladeColorVariation));
	const greenTip = mix(greenTipColor, bladeTipColor, tipMix);
	const warmTip = mix(greenTipColor, goldenTipColor, tipMix);
	const tipFinal = mix(greenTip, warmTip, select(isGolden, float(1), float(0)));
	const lowerColor = mix(bladeBaseColor, midColor, lowerGrad);
	const grassColor = mix(lowerColor, tipFinal, upperGrad);
	const blade = bladeData.element(instanceIndex);
	const dist = sqrt(blade.x.mul(blade.x).add(blade.y.mul(blade.y)));
	const fogFactor = smoothstep(fogStart, fogEnd, dist).mul(fogIntensity);
	return mix(grassColor, fogColor, fogFactor);
})();

grassMat.opacityNode = Fn(() => {
	const blade = bladeData.element(instanceIndex);
	const dist = sqrt(blade.x.mul(blade.x).add(blade.y.mul(blade.y)));
	const fadeEnd = select(fogIntensity.greaterThan(0.01), fogEnd.add(2.0), float(15.0));
	const fadeFactor = float(1).sub(smoothstep(fadeEnd.sub(5.0), fadeEnd, dist));
	return smoothstep(float(0.0), float(0.1), uv().y).mul(fadeFactor);
})();
grassMat.transparent = true;

// --- Instances ---
const bladeGeo = createBladeGeometry();
const grass = new THREE.InstancedMesh(bladeGeo, grassMat, BLADE_COUNT);
grass.frustumCulled = false;
scene.add(grass);
const dummy = new THREE.Object3D();
for (let i = 0; i < BLADE_COUNT; i++) grass.setMatrixAt(i, dummy.matrix);
grass.instanceMatrix.needsUpdate = true;

// --- Ground ---
const groundMat = new THREE.MeshBasicNodeMaterial();
groundMat.colorNode = Fn(() => {
	const wx = positionWorld.x, wz = positionWorld.z;
	const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
	const edgeNoise = noise2D(wx.mul(0.25).add(100), wz.mul(0.25).add(100));
	const maxR = groundRadius.add(edgeNoise.sub(0.5).mul(4.0));
	const t = smoothstep(maxR.sub(groundFalloff), maxR, dist);
	return mix(groundColor, backgroundColor, t);
})();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(FIELD_SIZE * 5, FIELD_SIZE * 5), groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// --- Lighting ---
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// --- Post Processing (DoF) ---
const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({
	output: output,
	normal: transformedNormalView,
}));
const sceneColor = scenePass.getTextureNode('output');
const sceneViewZ = scenePass.getViewZNode();
const dofOutput = dof(sceneColor, sceneViewZ, focusDistanceU, focalLengthU, bokehScaleU);

// Disable DoF on mobile devices
const globalDofEnabledInit = !isMobile;
postProcessing.outputNode = globalDofEnabledInit ? dofOutput : sceneColor;
if (!globalDofEnabledInit) dofEnabled = false;
postProcessing.needsUpdate = true;

function rebuildPipeline() {
	if (dofEnabled) {
		postProcessing.outputNode = dofOutput;
	} else {
		postProcessing.outputNode = sceneColor;
	}
	postProcessing.needsUpdate = true;
}

// --- Mouse ---
const raycaster = new THREE.Raycaster();
const mouseNDC = new THREE.Vector2();
const grassPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
let _mouseRaf = null;

window.addEventListener('mousemove', (e) => {
	if (_mouseRaf) return;
	_mouseRaf = requestAnimationFrame(() => {
		_mouseRaf = null;
		mouseNDC.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
		raycaster.setFromCamera(mouseNDC, camera);
		if (raycaster.ray.intersectPlane(grassPlane, hitPoint)) {
			mouseWorld.value.copy(hitPoint);
			mouseFocusDist = camera.position.distanceTo(hitPoint);
		}
	});
});
window.addEventListener('mouseleave', () => mouseWorld.value.set(99999, 0, 99999));

// --- Resize ---
let resizeTimeout;
window.addEventListener('resize', () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(() => {
		camera.aspect = innerWidth / innerHeight;
		camera.updateProjectionMatrix();
		const dpr = Math.min(devicePixelRatio, 2);
		renderer.setPixelRatio(dpr);
		renderer.setSize(innerWidth, innerHeight);
	}, 200);
});

// --- Wind Burst ---
export let windBurst = 0;
let _baseWindSpeed = 1.3;
let _baseWindAmp = 0.21;
let globalDofEnabled = !isMobile;

// --- Camera Path ---
// [scroll, posX, posY, posZ, lookX, lookY, lookZ, focusDist, autoFocus, dofOn, focalLen, bokehScale, afSpeed, afMin, afMax]
export const cameraPath = [
	[0.00, -2.8,  7.2, 19.6,  0.5, 1.5,  0.4, 22.0, 1, 1, 10.0, 12.5, 5.0, 1.0, 40.0],
	[0.14,  0,    2.2, 14.0,  0,  -2.0,   0,   15.0, 1, 1,  8.0, 10.0, 5.0, 1.0, 30.0],
	[0.28,  7.5, 10.9, 15.8,  0,   0.0,   0.7, 10.0, 1, 1,  6.0,  8.0, 5.0, 0.5, 20.0],
	[0.43, -8.0,  6.8, 21.6,  0,   0.2,   0,    7.0, 1, 1,  5.0, 10.0, 5.0, 0.5, 15.0],
	[0.57, -1.0,  5.3, 25.0, -1.2, 3.0,   0,    5.0, 1, 1,  4.0, 14.0, 6.0, 1.1, 21.5],
	[0.78, -1.6,  2.4,  0.0, -1.2, -2.0,   0.0, 16.4, 1, 0, 20.0, 18.0, 19.0, 2.8, 12.5],
	[1.00,  0,   15.0,  0.0, -5,   3.0,  -5,    9.8, 1, 1, 13.8,  0.0, 17.5, 1.2,  9.0],
];

// --- Stage Params ---
export const stageParamDefs = {
	fogStart:    { u: fogStart,    def: 6.5,  min: 0,   max: 20, step: 0.5, label: 'Fog Start',     group: 'Fog' },
	fogEnd:      { u: fogEnd,      def: 12.0, min: 1,   max: 30, step: 0.5, label: 'Fog End',       group: 'Fog' },
	fogIntensity:{ u: fogIntensity, def: 1.0, min: 0,   max: 1,  step: 0.01, label: 'Fog Intensity', group: 'Fog' },
	fogR:        { def: 0, min: 0, max: 1, step: 0.01, label: 'Fog Red',   group: 'Fog', isColor: 'fogColor', ch: 'r' },
	fogG:        { def: 0, min: 0, max: 1, step: 0.01, label: 'Fog Green', group: 'Fog', isColor: 'fogColor', ch: 'g' },
	fogB:        { def: 0, min: 0, max: 1, step: 0.01, label: 'Fog Blue',  group: 'Fog', isColor: 'fogColor', ch: 'b' },
	grassDensity:      { u: grassDensity,        def: 1.0,  min: 0,   max: 1,  step: 0.01, label: 'Density',        group: 'Grass' },
	bladeWidth:        { u: bladeWidth,           def: 4.0,  min: 0.2, max: 4,  step: 0.05, label: 'Blade Width',    group: 'Grass' },
	bladeTipWidth:     { u: bladeTipWidth,        def: 0.19, min: 0,   max: 1,  step: 0.01, label: 'Tip Width',      group: 'Grass' },
	bladeHeight:       { u: bladeHeight,          def: 1.6,  min: 0.1, max: 2,  step: 0.05, label: 'Blade Height',   group: 'Grass' },
	bladeHeightVar:    { u: bladeHeightVariation, def: 0.5,  min: 0,   max: 1,  step: 0.01, label: 'Height Var',     group: 'Grass' },
	bladeLean:         { u: bladeLean,            def: 1.1,  min: 0,   max: 3,  step: 0.05, label: 'Lean',           group: 'Grass' },
	windSpeed:    { u: windSpeed,     def: 1.3,  min: 0, max: 5, step: 0.1,  label: 'Wind Speed',  group: 'Wind' },
	windAmplitude:{ u: windAmplitude,  def: 0.21, min: 0, max: 1, step: 0.01, label: 'Wind Amp',    group: 'Wind' },
	noiseAmp:     { u: noiseAmplitude,  def: 1.85, min: 0,    max: 4,  step: 0.05, label: 'Noise Amp',    group: 'Noise' },
	noiseFreq:    { u: noiseFrequency,  def: 0.3,  min: 0.01, max: 1,  step: 0.01, label: 'Noise Freq',   group: 'Noise' },
	noise2Amp:    { u: noise2Amplitude, def: 0.2,  min: 0,    max: 1,  step: 0.01, label: 'Detail Amp',   group: 'Noise' },
	noise2Freq:   { u: noise2Frequency, def: 15,   min: 1,    max: 30, step: 0.5,  label: 'Detail Freq',  group: 'Noise' },
	mouseRadius:   { u: mouseRadius,   def: 6.1,  min: 0.5, max: 8,  step: 0.1,  label: 'Mouse Radius',   group: 'Mouse Sphere' },
	mouseStrength: { u: mouseStrength,  def: 4.0,  min: 0,   max: 5,  step: 0.1,  label: 'Mouse Strength', group: 'Mouse Sphere' },
	outerRadius:   { u: outerRadius,    def: 9.4,  min: 1,   max: 12, step: 0.1,  label: 'Outer Radius',   group: 'Mouse Sphere' },
	outerStrength: { u: outerStrength,   def: 1.45, min: 0,   max: 3,  step: 0.05, label: 'Outer Strength', group: 'Mouse Sphere' },
	camSphereRadius:   { def: 15.0, min: 1,  max: 15, step: 0.1, label: 'Cam Radius',   group: 'Camera Sphere', noDirect: true },
	camSphereStrength: { def: 5.9,  min: 0,  max: 6,  step: 0.1, label: 'Cam Strength',  group: 'Camera Sphere', noDirect: true },
	bladeBaseR: { def: 0.055, min: 0, max: 1, step: 0.01, label: 'Base Red',     group: 'Scene Colors', isColor: 'bladeBaseColor', ch: 'r' },
	bladeBaseG: { def: 0.118, min: 0, max: 1, step: 0.01, label: 'Base Green',   group: 'Scene Colors', isColor: 'bladeBaseColor', ch: 'g' },
	bladeBaseB: { def: 0.016, min: 0, max: 1, step: 0.01, label: 'Base Blue',    group: 'Scene Colors', isColor: 'bladeBaseColor', ch: 'b' },
	bladeTipR:  { def: 0.784, min: 0, max: 1, step: 0.01, label: 'Tip Red',      group: 'Scene Colors', isColor: 'bladeTipColor', ch: 'r' },
	bladeTipG:  { def: 0.722, min: 0, max: 1, step: 0.01, label: 'Tip Green',    group: 'Scene Colors', isColor: 'bladeTipColor', ch: 'g' },
	bladeTipB:  { def: 0.251, min: 0, max: 1, step: 0.01, label: 'Tip Blue',     group: 'Scene Colors', isColor: 'bladeTipColor', ch: 'b' },
	goldenTipR: { def: 0.831, min: 0, max: 1, step: 0.01, label: 'Gold Tip R',   group: 'Scene Colors', isColor: 'goldenTipColor', ch: 'r' },
	goldenTipG: { def: 0.722, min: 0, max: 1, step: 0.01, label: 'Gold Tip G',   group: 'Scene Colors', isColor: 'goldenTipColor', ch: 'g' },
	goldenTipB: { def: 0.220, min: 0, max: 1, step: 0.01, label: 'Gold Tip B',   group: 'Scene Colors', isColor: 'goldenTipColor', ch: 'b' },
	greenTipR:  { def: 0.290, min: 0, max: 1, step: 0.01, label: 'Green Tip R',  group: 'Scene Colors', isColor: 'greenTipColor', ch: 'r' },
	greenTipG:  { def: 0.478, min: 0, max: 1, step: 0.01, label: 'Green Tip G',  group: 'Scene Colors', isColor: 'greenTipColor', ch: 'g' },
	greenTipB:  { def: 0.078, min: 0, max: 1, step: 0.01, label: 'Green Tip B',  group: 'Scene Colors', isColor: 'greenTipColor', ch: 'b' },
	midR:       { def: 0.176, min: 0, max: 1, step: 0.01, label: 'Mid Tone R',   group: 'Scene Colors', isColor: 'midColor', ch: 'r' },
	midG:       { def: 0.306, min: 0, max: 1, step: 0.01, label: 'Mid Tone G',   group: 'Scene Colors', isColor: 'midColor', ch: 'g' },
	midB:       { def: 0.055, min: 0, max: 1, step: 0.01, label: 'Mid Tone B',   group: 'Scene Colors', isColor: 'midColor', ch: 'b' },
	colorVar:   { u: bladeColorVariation, def: 0.93, min: 0, max: 1, step: 0.01, label: 'Color Var', group: 'Scene Colors' },
};

export const stageParamKeys = Object.keys(stageParamDefs);

const colorUniformMap = {
	fogColor: fogColor,
	bladeBaseColor: bladeBaseColor,
	bladeTipColor: bladeTipColor,
	goldenTipColor: goldenTipColor,
	greenTipColor: greenTipColor,
	midColor: midColor,
};

function getDefaultParams() {
	const p = {};
	stageParamKeys.forEach(k => {
		const d = stageParamDefs[k];
		if (d.isColor && d.ch) {
			const cu = colorUniformMap[d.isColor];
			if (cu) {
				p[k] = cu.value[d.ch];
			} else {
				p[k] = d.def;
			}
		} else {
			p[k] = d.def;
		}
	});
	return p;
}

// Per-stage params (each stage gets its own copy, starts as defaults)
export const stageParams = cameraPath.map(() => getDefaultParams());

// Apply exported per-stage overrides
(function applyExportedParams() {
	const exported = [
		{ bladeBaseR:0, bladeBaseG:0, bladeBaseB:0, bladeTipR:0.058823529411764705, bladeTipG:0.2196078431372549, bladeTipB:0, goldenTipR:0.30980392156862746, goldenTipG:0.44313725490196076, goldenTipB:0.01568627450980392, greenTipR:0, greenTipG:0, greenTipB:0, midR:0.026241221889696346, midG:0.07618538147321911, midB:0.004391442035325718 },
		{ bladeBaseR:0.004391442035325718, bladeBaseG:0.012983032338510335, bladeBaseB:0.001214107934117647, bladeTipR:0.058823529411764705, bladeTipG:0.2196078431372549, bladeTipB:0, goldenTipR:0.30980392156862746, goldenTipG:0.44313725490196076, goldenTipB:0.01568627450980392, greenTipR:0, greenTipG:0, greenTipB:0, midR:0.026241221889696346, midG:0.07618538147321911, midB:0.004391442035325718 },
		{ bladeBaseR:0, bladeBaseG:0.012983032338510335, bladeBaseB:0.001214107934117647, bladeTipR:0.5529411764705883, bladeTipG:0.3803921568627451, bladeTipB:0.00784313725490196, goldenTipR:0.6627450980392157, goldenTipG:0.28627450980392155, goldenTipB:0.0392156862745098, greenTipR:0, greenTipG:0, greenTipB:0, midR:0.07450980392156863, midG:0.00784313725490196, midB:0.00392156862745098, colorVar:1 },
		{ fogStart:0, fogEnd:12.5, bladeHeight:2, bladeHeightVar:1, bladeLean:0, windSpeed:1.3, windAmplitude:0.21, bladeBaseR:0.004391442035325718, bladeBaseG:0.012983032338510335, bladeBaseB:0.001214107934117647, bladeTipR:0.5775804404214573, bladeTipG:0.4793201830913402, bladeTipB:0.05126945836711539, goldenTipR:0.6583748172725346, goldenTipG:0.4793201830913402, goldenTipB:0.03954623527052923, greenTipR:0.06847816983662762, greenTipG:0.19461783043107173, greenTipB:0.0069954101845983935, midR:0.026241221889696346, midG:0.07618538147321911, midB:0.004391442035325718 },
		{ bladeBaseR:0.004391442035325718, bladeBaseG:0.012983032338510335, bladeBaseB:0.001214107934117647, bladeTipR:0.5775804404214573, bladeTipG:0.4793201830913402, bladeTipB:0.05126945836711539, goldenTipR:0.6583748172725346, goldenTipG:0.4793201830913402, goldenTipB:0.03954623527052923, greenTipR:0.06847816983662762, greenTipG:0.19461783043107173, greenTipB:0.0069954101845983935, midR:0.026241221889696346, midG:0.07618538147321911, midB:0.004391442035325718 },
		{ fogStart:7, bladeTipWidth:0.27, bladeHeight:0.9, bladeHeightVar:0, bladeLean:0, bladeBaseR:0.004391442035325718, bladeBaseG:0.012983032338510335, bladeBaseB:0.001214107934117647, bladeTipR:0.058823529411764705, bladeTipG:0.2196078431372549, bladeTipB:0, goldenTipR:0.30980392156862746, goldenTipG:0.44313725490196076, goldenTipB:0.01568627450980392, greenTipR:0, greenTipG:0, greenTipB:0, midR:0.026241221889696346, midG:0.07618538147321911, midB:0.004391442035325718 },
		{ fogStart:2, fogEnd:10, bladeHeight:2, bladeHeightVar:0, bladeLean:0, windSpeed:1.3, windAmplitude:0.21, bladeBaseR:0, bladeBaseG:0.012983032338510335, bladeBaseB:0.001214107934117647, bladeTipR:0.058823529411764705, bladeTipG:0.2196078431372549, bladeTipB:0, goldenTipR:0.30980392156862746, goldenTipG:0.44313725490196076, goldenTipB:0.01568627450980392, greenTipR:0, greenTipG:0, greenTipB:0, midR:0, midG:0, midB:0 },
	];
	exported.forEach((overrides, i) => {
		Object.keys(overrides).forEach(k => {
			if (k in stageParams[i]) stageParams[i][k] = overrides[k];
		});
	});
})();

// --- Lerp Camera ---
export function lerpCam(scrollT) {
	const snapThreshold = 0.005;
	for (let j = 0; j < cameraPath.length; j++) {
		if (Math.abs(cameraPath[j][0] - scrollT) < snapThreshold) {
			const kf = cameraPath[j];
			return {
				px: kf[1], py: kf[2], pz: kf[3],
				lx: kf[4], ly: kf[5], lz: kf[6],
				fd: kf[7], af: kf[8], dofOn: kf[9],
				fl: kf[10], bk: kf[11],
				afSpd: kf[12], afMin: kf[13], afMax: kf[14],
				params: { ...stageParams[j] },
			};
		}
	}

	let i = 0;
	for (let j = 1; j < cameraPath.length; j++) {
		if (cameraPath[j][0] >= scrollT) { i = j - 1; break; }
		if (j === cameraPath.length - 1) i = j - 1;
	}
	const a = cameraPath[i], b = cameraPath[Math.min(i + 1, cameraPath.length - 1)];
	const range = b[0] - a[0];
	const t = range > 0 ? Math.max(0, Math.min(1, (scrollT - a[0]) / range)) : 0;
	const ease = t * t * (3 - 2 * t);

	const iB = Math.min(i + 1, cameraPath.length - 1);
	const pA = stageParams[i], pB = stageParams[iB];
	const lerpedParams = {};
	stageParamKeys.forEach(k => {
		lerpedParams[k] = pA[k] + (pB[k] - pA[k]) * ease;
	});

	return {
		px: a[1] + (b[1] - a[1]) * ease,
		py: a[2] + (b[2] - a[2]) * ease,
		pz: a[3] + (b[3] - a[3]) * ease,
		lx: a[4] + (b[4] - a[4]) * ease,
		ly: a[5] + (b[5] - a[5]) * ease,
		lz: a[6] + (b[6] - a[6]) * ease,
		fd: a[7] + (b[7] - a[7]) * ease,
		af: a[8] + (b[8] - a[8]) * ease,
		dofOn: a[9] + (b[9] - a[9]) * ease,
		fl: a[10] + (b[10] - a[10]) * ease,
		bk: a[11] + (b[11] - a[11]) * ease,
		afSpd: a[12] + (b[12] - a[12]) * ease,
		afMin: a[13] + (b[13] - a[13]) * ease,
		afMax: a[14] + (b[14] - a[14]) * ease,
		params: lerpedParams,
	};
}

// --- Update Camera ---
const lookTarget = new THREE.Vector3();

export function updateCamera(cam, dt) {
	camera.position.set(cam.px, cam.py, cam.pz);
	lookTarget.set(cam.lx, cam.ly, cam.lz);
	camera.lookAt(lookTarget);

	// Camera sphere
	camSphereWorld.value.set(camera.position.x, 0, camera.position.z);

	// Apply interpolated per-stage params to uniforms
	if (cam.params) {
		const p = cam.params;
		fogStart.value = p.fogStart;
		fogEnd.value = p.fogEnd;
		fogIntensity.value = p.fogIntensity;
		fogColor.value.setRGB(p.fogR, p.fogG, p.fogB);
		if (scene.fog) scene.fog.color.setRGB(p.fogR, p.fogG, p.fogB);
		grassDensity.value = p.grassDensity;
		bladeWidth.value = p.bladeWidth;
		bladeTipWidth.value = p.bladeTipWidth;
		bladeHeight.value = p.bladeHeight;
		bladeHeightVariation.value = p.bladeHeightVar;
		bladeLean.value = p.bladeLean;
		_baseWindSpeed = p.windSpeed;
		_baseWindAmp = p.windAmplitude;
		noiseAmplitude.value = p.noiseAmp;
		noiseFrequency.value = p.noiseFreq;
		noise2Amplitude.value = p.noise2Amp;
		noise2Frequency.value = p.noise2Freq;
		mouseRadius.value = p.mouseRadius;
		mouseStrength.value = p.mouseStrength;
		outerRadius.value = p.outerRadius;
		outerStrength.value = p.outerStrength;
		bladeBaseColor.value.setRGB(p.bladeBaseR, p.bladeBaseG, p.bladeBaseB);
		bladeTipColor.value.setRGB(p.bladeTipR, p.bladeTipG, p.bladeTipB);
		goldenTipColor.value.setRGB(p.goldenTipR, p.goldenTipG, p.goldenTipB);
		greenTipColor.value.setRGB(p.greenTipR, p.greenTipG, p.greenTipB);
		midColor.value.setRGB(p.midR, p.midG, p.midB);
		bladeColorVariation.value = p.colorVar;
		const baseCamR = p.camSphereRadius;
		const baseCamS = p.camSphereStrength;
		camSphereRadius.value = baseCamR;
		camSphereStrength.value = baseCamS;
	}

	// Scale camera sphere influence based on proximity to grass
	const camHeight = camera.position.y;
	const proximityT = Math.max(0, 1 - camHeight / 10);
	const proxCurve = proximityT * proximityT;
	camSphereRadius.value = Math.min(15, camSphereRadius.value * (0.3 + proxCurve * 0.7));
	camSphereStrength.value = camSphereStrength.value * (0.1 + proxCurve * 0.9);

	// Base wind from per-stage params
	windSpeed.value = _baseWindSpeed;
	windAmplitude.value = _baseWindAmp;

	// Wind burst
	if (windBurst > 0) {
		windBurst -= dt * 0.6;
		const burstT = Math.max(0, windBurst / 4.0);
		const eased = burstT * burstT * (3 - 2 * burstT);
		windSpeed.value += eased * 4.5;
		windAmplitude.value += eased * 0.45;
	}

	// Per-stage DoF
	if (globalDofEnabled) {
		const dofWeight = typeof cam.dofOn === 'number' ? cam.dofOn : 1;
		const shouldDof = dofWeight > 0.5;

		if (shouldDof !== dofEnabled) {
			dofEnabled = shouldDof;
			rebuildPipeline();
		}

		if (dofEnabled) {
			const autoWeight = typeof cam.af === 'number' ? Math.max(0, Math.min(1, cam.af)) : 0;
			const mouseOnField = mouseWorld.value.x < 9000;
			const afSpeed = cam.afSpd || 5.0;
			const afMin = cam.afMin || 0.5;
			const afMax = cam.afMax || 40.0;

			let rawAutoFocus;
			if (mouseOnField) {
				rawAutoFocus = mouseFocusDist;
			} else {
				rawAutoFocus = Math.max(0.5, Math.sqrt(cam.py * cam.py + cam.pz * cam.pz) * 0.9);
			}

			rawAutoFocus = Math.max(afMin, Math.min(afMax, rawAutoFocus));
			autoFocusSmoothed += (rawAutoFocus - autoFocusSmoothed) * Math.min(1, dt * afSpeed);
			const targetFocus = cam.fd * (1 - autoWeight) + autoFocusSmoothed * autoWeight;

			focusDistanceU.value += (targetFocus - focusDistanceU.value) * Math.min(1, dt * 8);
			focalLengthU.value += (cam.fl - focalLengthU.value) * Math.min(1, dt * 6);
			bokehScaleU.value += (cam.bk - bokehScaleU.value) * Math.min(1, dt * 6);
		}
	}
}

// --- Update Scene (compute + render) ---
export function updateScene(dt) {
	renderer.compute(computeUpdate);
	postProcessing.render();
}

// --- Init ---
export async function initRenderer() {
	await renderer.init();
}

export async function bootScene() {
	await renderer.computeAsync(computeInit);

	renderer.domElement.style.opacity = '0';
	renderer.domElement.style.transition = 'opacity 0.4s ease';
	for (let i = 0; i < 3; i++) {
		renderer.compute(computeUpdate);
		postProcessing.render();
		await new Promise(r => requestAnimationFrame(r));
	}
	renderer.domElement.style.opacity = '1';
}
