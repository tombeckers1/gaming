// Versandecke – Referenzszene "so gut kann Echtzeit-WebGL aussehen".
// Layout wird aus Pixelkoordinaten des Zielbilds (1312x1200) per Kamerastrahl abgeleitet.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as T from './tex.js';

const Q = new URLSearchParams(location.search);
const SS = parseFloat(Q.get('ss') || '1');
const HEADLESS = Q.has('headless');
const W = 1312, H = 1200, DEG = Math.PI / 180;

async function main() {
	await document.fonts.load('600 64px Inter'); await document.fonts.load('700 64px Inter');

	const renderer = new THREE.WebGLRenderer({ antialias: !HEADLESS, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
	renderer.setPixelRatio(SS * (HEADLESS ? 1 : Math.min(window.devicePixelRatio, 1.5)));
	renderer.setSize(W, H);
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.0;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = { pcf: THREE.PCFShadowMap, vsm: THREE.VSMShadowMap, basic: THREE.BasicShadowMap }[Q.get('sm') || 'pcf'];
	document.body.appendChild(renderer.domElement);
	RectAreaLightUniformsLib.init();

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x30343a);
	const pmrem = new THREE.PMREMGenerator(renderer);
	scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
	scene.environmentIntensity = 0.22;

	const cam = new THREE.PerspectiveCamera(55, W / H, 0.1, 80);
	cam.position.set(0, 2.45, 0);
	// Architektur-Perspektive wie im Zielbild: Kamera waagerecht, Bild nach unten verschoben (Shift-Objektiv) -> Senkrechte bleiben senkrecht
	cam.setViewOffset(W, H, 6, 352, W, H);
	cam.updateMatrixWorld(); cam.updateProjectionMatrix();

	// ---- Pixel -> Welt ----
	const rc = new THREE.Raycaster();
	const ray = (px, py) => { rc.setFromCamera(new THREE.Vector2(px / W * 2 - 1, 1 - py / H * 2), cam); return rc.ray; };
	const hit = (r, t) => r.origin.clone().addScaledVector(r.direction, t);
	const onZ = (px, py, z) => { const r = ray(px, py); return hit(r, (z - r.origin.z) / r.direction.z); };
	const onY = (px, py, y = 0) => { const r = ray(px, py); return hit(r, (y - r.origin.y) / r.direction.y); };
	const onX = (px, py, x) => { const r = ray(px, py); return hit(r, (x - r.origin.x) / r.direction.x); };

	// ---- Materialien ----
	const M = {};
	const std = (o) => new THREE.MeshStandardMaterial(o);
	const phys = (o) => new THREE.MeshPhysicalMaterial(o);
	M.yellow = phys({ color: 0xf2bd00, roughness: 0.38, metalness: 0.05, clearcoat: 0.6, clearcoatRoughness: 0.25 });
	M.black = std({ color: 0x18191b, roughness: 0.55, metalness: 0.2 });
	M.darkSteel = std({ color: 0x2a2d32, roughness: 0.45, metalness: 0.6 });
	M.frame = std({ color: 0x2c2f34, roughness: 0.5, metalness: 0.5 });
	M.navy = phys({ color: 0x1e3156, roughness: 0.35, metalness: 0.2, clearcoat: 0.5 });
	M.blueSteel = std({ color: 0x223d72, roughness: 0.45, metalness: 0.3 });
	M.rackBlue = std({ color: 0x47566b, roughness: 0.45, metalness: 0.55 });
	M.rackGrey = std({ color: 0x8c939b, roughness: 0.4, metalness: 0.6 });
	M.lightGrey = std({ color: 0x9da2a9, roughness: 0.4, metalness: 0.35 });
	M.concrete = std({ color: 0x8c8f94, roughness: 0.9 });
	M.white = std({ color: 0xf2f2f2, roughness: 0.3 });
	M.rubber = std({ color: 0x111214, roughness: 0.8 });
	const br = T.brushed(178), br2 = T.brushed(120, 33);
	M.steel = std({ color: 0xffffff, map: br.map, roughnessMap: br.rough, roughness: 1, metalness: 0.85 });
	M.steelDark = std({ color: 0xffffff, map: br2.map, roughnessMap: br2.rough, roughness: 1, metalness: 0.75 });

	const wall = T.wallTex();
	const slat = T.slatTex(40, [70, 73, 80], 0);
	const slatL = T.slatTex(30, [100, 105, 113], 0);
	const cbT = [0, 1, 2, 3, 4].map(v => T.cardboard(v));
	const cbSide = T.flatStackSide();
	const matT = T.matTex();
	const woodT = T.woodTex();

	const shadow = (m, c = true, r = true) => { m.castShadow = c; m.receiveShadow = r; return m; };
	const add = (geo, mat, x, y, z, parent = scene) => { const m = shadow(new THREE.Mesh(geo, mat)); m.position.set(x, y, z); parent.add(m); return m; };
	// Quader aus Grenzen
	const boxB = (x0, x1, y0, y1, z0, z1, mat, round = 0, parent = scene) => {
		const w = Math.abs(x1 - x0), h = Math.abs(y1 - y0), d = Math.abs(z1 - z0);
		const g = round ? new RoundedBoxGeometry(w, h, d, 3, Math.min(round, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
		return add(g, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent);
	};
	const rod = (a, b, r, mat, seg = 16, parent = scene) => {
		const len = a.distanceTo(b);
		const m = add(new THREE.CylinderGeometry(r, r, len, seg), mat, 0, 0, 0, parent);
		m.position.copy(a).add(b).multiplyScalar(0.5);
		m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
		return m;
	};
	const plane = (w, h, mat, x, y, z, ry = 0, parent = scene) => { const m = add(new THREE.PlaneGeometry(w, h), mat, x, y, z, parent); m.rotation.y = ry; m.castShadow = false; return m; };

	// ================= Raum =================
	const WZ = onY(530, 490).z;           // Rückwand
	const GZ = onY(530, 503).z;           // Absperrgitter
	console.log('Rueckwand z=', WZ.toFixed(2), 'Gitter z=', GZ.toFixed(2));

	// Rückwand
	wall.map.repeat.set(18 / 2.4, 7 / 2.4); wall.bump.repeat.copy(wall.map.repeat);
	const wallMat = std({ map: wall.map, bumpMap: wall.bump, bumpScale: 0.8, roughness: 0.9, color: 0xb4b5b8 });
	const wallMesh = add(new THREE.PlaneGeometry(18, 7), wallMat, -1, 3.5, WZ); wallMesh.castShadow = false;
	// Seitenwände/Decke (für Reflexion, Licht)
	const sideMat = std({ color: 0x7d8189, roughness: 0.9 });
	plane(16, 7, sideMat, -10, 3.5, WZ + 8, Math.PI / 2);
	plane(16, 7, sideMat, 8, 3.5, WZ + 8, -Math.PI / 2);
	const ceil = add(new THREE.PlaneGeometry(18, 16), std({ color: 0x3a3e45, roughness: 0.9 }), -1, 6.8, WZ + 8); ceil.rotation.x = Math.PI / 2; ceil.castShadow = false;
	// Wand hinter Kamera
	plane(18, 7, sideMat, -1, 3.5, 3.5, Math.PI);

	// blauer Stahlträger oben
	const topY = onZ(700, 4, WZ).y;
	boxB(-10, 8, topY - 0.05, topY + 0.35, WZ, WZ + 0.3, M.blueSteel);

	// ================= Haupttor (Sektionaltor) =================
	const zt = WZ + 0.02;
	const fL = onZ(290, 420, zt).x, fR = onZ(772, 420, zt).x;
	const lL = onZ(312, 420, zt).x, lR = onZ(751, 420, zt).x;
	const hTop = onZ(530, 58, zt).y, hBot = onZ(530, 98, zt).y;
	const doorW = lR - lL, doorH = hBot;
	slat.map.repeat.set(1, 1);
	const doorMat = std({ map: slat.map, bumpMap: slat.bump, bumpScale: 1.2, color: 0xa4aab4, roughness: 0.45, metalness: 0.45 });
	plane(doorW, doorH, doorMat, (lL + lR) / 2, doorH / 2, zt + 0.02);
	// Zarge
	boxB(fL, lL, 0, hTop, zt, zt + 0.22, M.frame);
	boxB(lR, fR, 0, hTop, zt, zt + 0.22, M.frame);
	boxB(fL - 0.02, fR + 0.02, hBot, hTop, zt, zt + 0.42, M.frame, 0.02);
	// Leuchtschild über dem Tor
	{
		const x0 = onZ(476, 79, zt + 0.42).x, x1 = onZ(566, 79, zt + 0.42).x;
		const y0 = onZ(520, 89, zt + 0.42).y, y1 = onZ(520, 69, zt + 0.42).y;
		const m = boxB(x0, x1, y0, y1, zt + 0.42, zt + 0.46, std({ color: 0xffffff, emissive: 0xfff6e8, emissiveIntensity: 3 }));
		m.castShadow = false;
	}
	// Fenster
	const winMat = std({ map: T.windowTex(), emissive: 0xffffff, emissiveMap: null, color: 0x000000, roughness: 0.05 });
	winMat.emissiveMap = winMat.map; winMat.emissiveIntensity = 1.15;
	for (const [a, b] of [[370, 455], [492, 578], [615, 700]]) {
		const x0 = onZ(a, 272, zt).x, x1 = onZ(b, 272, zt).x, y0 = onZ(a, 292, zt).y, y1 = onZ(a, 252, zt).y;
		boxB(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, zt + 0.01, zt + 0.05, std({ color: 0x23252a, roughness: 0.4, metalness: 0.5 }), 0.015);
		boxB(x0 - 0.015, x1 + 0.015, y0 - 0.015, y1 + 0.015, zt + 0.05, zt + 0.06, M.lightGrey);
		const g = plane(x1 - x0, y1 - y0, winMat, (x0 + x1) / 2, (y0 + y1) / 2, zt + 0.065); g.castShadow = false;
	}
	// orange Reflektoren an der Zarge
	const orange = std({ color: 0xff7a10, emissive: 0xff5a00, emissiveIntensity: 0.6, roughness: 0.3 });
	for (const [px, py] of [[301, 232], [752, 225], [752, 440]]) {
		const p = onZ(px, py, zt + 0.22);
		boxB(p.x - 0.04, p.x + 0.04, p.y - 0.09, p.y + 0.09, zt + 0.22, zt + 0.235, orange);
	}
	// Steuerkasten rechts neben dem Tor
	{
		const x0 = onZ(780, 360, zt).x, x1 = onZ(826, 360, zt).x, y0 = onZ(800, 447, zt).y, y1 = onZ(800, 283, zt).y;
		boxB(x0, x1, y0, y1, zt, zt + 0.16, std({ color: 0xa3a7ad, roughness: 0.5, metalness: 0.2 }), 0.01);
		boxB(x0 + 0.06, x0 + 0.12, y1 - 0.25, y1 - 0.12, zt + 0.16, zt + 0.18, std({ color: 0xc81f1f, roughness: 0.4 }));
		rod(new THREE.Vector3((x0 + x1) / 2, y0, zt + 0.06), new THREE.Vector3((x0 + x1) / 2, 0.0, zt + 0.06), 0.012, M.black);
	}

	// ================= Linker Bereich =================
	// kleines Rolltor links
	{
		const z = WZ + 0.02;
		const x1 = onZ(52, 300, z).x, xf = onZ(76, 300, z).x;
		const hb = onZ(30, 145, z).y, ht = onZ(30, 95, z).y;
		const doorMatL = std({ map: slatL.map, bumpMap: slatL.bump, bumpScale: 2, color: 0xffffff, roughness: 0.45, metalness: 0.45 });
		slatL.map.repeat.set(1, 1);
		plane(3, hb, doorMatL, x1 - 1.5, hb / 2, z + 0.02);
		boxB(x1, xf, 0, ht, z, z + 0.2, M.frame);
		boxB(x1 - 3.2, xf + 0.02, hb, ht, z, z + 0.45, M.frame, 0.02);
		// kleine Statusleuchte links
		const p = onZ(4, 268, z + 0.1);
		boxB(p.x - 0.12, p.x + 0.06, p.y - 0.15, p.y + 0.15, z + 0.03, z + 0.08, std({ color: 0x000000, emissive: 0x3a7bff, emissiveIntensity: 1.4 }));
	}
	// blaue Stahlstütze + graue Betonstütze
	{
		const z = WZ + 0.3;
		const x0 = onZ(122, 300, z).x, x1 = onZ(150, 300, z).x;
		boxB(x0, x1, 0, 6.8, z - 0.25, z + 0.05, M.blueSteel);
		const z2 = WZ + 0.25;
		const c0 = onZ(184, 300, z2).x, c1 = onZ(214, 300, z2).x;
		boxB(c0, c1, 0, 6.8, WZ, z2, M.concrete);
	}
	// Poller links
	{
		const z = WZ + 0.35;
		const p0 = onZ(38, 480, z).x, p1 = onZ(58, 480, z).x, ht = onZ(48, 340, z).y;
		bollard((p0 + p1) / 2, z, Math.abs(p1 - p0) / 2, ht);
	}
	function bollard(x, z, r, h) {
		add(new THREE.CylinderGeometry(r, r, h, 24), M.yellow, x, h / 2, z);
		add(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.06, 24), M.black, x, h - 0.03, z);
		add(new THREE.CylinderGeometry(r * 1.6, r * 1.6, 0.012, 24), M.darkSteel, x, 0.006, z);
	}

	// ================= Absperrgitter vor dem Tor =================
	function meshPanel(a, b, y0, y1, cell = 0.095, wire = 0.007, frame = 0.034) {
		// a,b: Vector3 am Boden (gleiches z oder gleiches x)
		const geos = [];
		const dir = b.clone().sub(a); const L = dir.length(); dir.normalize();
		const ang = Math.atan2(-dir.z, dir.x);
		const mk = (w, h, d, x, y) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, 0); return g; };
		const n = Math.floor((L - 2 * frame) / cell), hh = y1 - y0;
		for (let i = 1; i < n; i++) geos.push(mk(wire, hh, wire, -L / 2 + frame + i * (L - 2 * frame) / n, (y0 + y1) / 2));
		const m = Math.floor(hh / cell);
		for (let j = 1; j < m; j++) geos.push(mk(L, wire, wire, 0, y0 + j * hh / m));
		const meshG = mergeGeometries(geos);
		const fr = mergeGeometries([mk(L, frame, frame, 0, y0), mk(L, frame, frame, 0, y1), mk(frame, hh, frame, -L / 2 + frame / 2, (y0 + y1) / 2), mk(frame, hh, frame, L / 2 - frame / 2, (y0 + y1) / 2)]);
		const g = new THREE.Group();
		g.add(shadow(new THREE.Mesh(meshG, M.yellow)), shadow(new THREE.Mesh(fr, M.yellow)));
		g.position.copy(a).add(b).multiplyScalar(0.5); g.position.y = 0;
		g.rotation.y = ang;
		scene.add(g);
		return g;
	}
	function post(x, z, h, s = 0.07) {
		boxB(x - s / 2, x + s / 2, 0, h, z - s / 2, z + s / 2, M.yellow, 0.008);
		boxB(x - s / 2 - 0.004, x + s / 2 + 0.004, h - 0.01, h + 0.012, z - s / 2 - 0.004, z + s / 2 + 0.004, M.black, 0.003);
		boxB(x - 0.08, x + 0.08, 0, 0.012, z - 0.08, z + 0.08, M.yellow);
	}
	{
		const gateH = onZ(530, 347, GZ).y;
		const px = [299, 446, 617, 764];
		const xs = px.map(p => onZ(p, 450, GZ).x);
		for (const x of xs) post(x, GZ, gateH + 0.04);
		for (let i = 0; i < 3; i++) meshPanel(new THREE.Vector3(xs[i] + 0.04, 0, GZ), new THREE.Vector3(xs[i + 1] - 0.04, 0, GZ), 0.12, gateH - 0.02);
		// hohe Anfahrschutz-Pfosten links/rechts
		const tall = onZ(290, 285, GZ).y;
		const lx = onZ(291, 450, GZ).x, rx = onZ(789, 450, GZ + 0.05).x;
		for (const x of [lx - 0.03, rx]) {
			boxB(x - 0.06, x + 0.06, 0, tall, GZ - 0.06, GZ + 0.06, M.yellow, 0.01);
			boxB(x - 0.062, x + 0.062, tall - 0.04, tall, GZ - 0.062, GZ + 0.062, M.black, 0.005);
			boxB(x - 0.11, x + 0.11, 0, 0.015, GZ - 0.11, GZ + 0.11, M.darkSteel);
		}
	}

	// ================= Automat "RAKETE" =================
	{
		const zf = onY(140, 586).z, zb = zf - 0.45;
		const x0 = onZ(82, 560, zf).x, x1 = onZ(205, 560, zf).x;
		const yAt = (py) => onZ(140, py, zf).y;
		const yPl = yAt(566), yCab = yAt(456), yDisp = yAt(322), ySign = yAt(243), yTop = yAt(220);
		const xm = (x0 + x1) / 2;
		boxB(x0 + 0.02, x1 - 0.02, 0, yPl, zb + 0.02, zf - 0.02, M.navy, 0.01);
		boxB(x0, x1, yPl, yCab, zb, zf, M.steel, 0.015);
		boxB(x0 + 0.12, x1 - 0.12, yAt(512), yAt(490), zf - 0.02, zf + 0.005, M.black, 0.01); // Ausgabeschacht
		boxB(x0 + 0.08, x1 - 0.08, yPl + 0.05, yAt(520), zf, zf + 0.004, std({ color: 0x223a66, roughness: 0.4 }));
		// Vitrine
		boxB(x0, x0 + 0.08, yCab, yDisp, zb, zf, M.steel, 0.01);
		boxB(x1 - 0.08, x1, yCab, yDisp, zb, zf, M.steel, 0.01);
		boxB(x0 + 0.08, x1 - 0.08, yCab, yDisp, zb, zb + 0.04, M.steelDark);
		boxB(x0 + 0.08, x1 - 0.08, yCab, yCab + 0.05, zb, zf, std({ color: 0x220000, emissive: 0xff1a10, emissiveIntensity: 1.1 }));
		const glass = phys({ color: 0xdfe8f5, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, envMapIntensity: 2.5, clearcoat: 1 });
		const gl = plane(x1 - x0 - 0.16, yDisp - yCab, glass, xm, (yCab + yDisp) / 2, zf - 0.03); gl.castShadow = false;
		const red = new THREE.PointLight(0xff2a1a, 0.35, 1.2, 2); red.position.set(xm, yCab + 0.15, zf - 0.3); scene.add(red);
		// Rakete
		const rz = zf - 0.36, ry0 = yCab + 0.18;
		const rw = std({ color: 0xf4f4f4, roughness: 0.3 });
		add(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 24), rw, xm, ry0 + 0.21, rz);
		add(new THREE.ConeGeometry(0.07, 0.2, 24), rw, xm, ry0 + 0.52, rz);
		for (let k = 0; k < 3; k++) {
			const f = add(new THREE.BoxGeometry(0.01, 0.12, 0.09), rw, xm + Math.sin(k * 2.09) * 0.09, ry0 + 0.05, rz + Math.cos(k * 2.09) * 0.09);
			f.rotation.y = k * 2.09;
		}
		add(new THREE.CylinderGeometry(0.02, 0.02, 0.012, 16), std({ color: 0x223a66 }), xm, ry0 + 0.32, rz + 0.07).rotation.x = Math.PI / 2;
		// Schildkasten oben
		boxB(x0, x1, yDisp, ySign, zb, zf, M.navy, 0.015);
		const sg = plane(x1 - x0 - 0.06, ySign - yDisp - 0.06, std({ map: T.signRakete(), roughness: 0.35, emissive: 0xffffff, emissiveIntensity: 0.25 }), xm, (yDisp + ySign) / 2, zf + 0.003);
		sg.material.emissiveMap = sg.material.map;
		boxB(x0 - 0.02, x1 + 0.02, ySign, yTop, zb - 0.02, zf + 0.04, M.steel, 0.02);
	}

	// ================= Self-Checkout =================
	{
		const zf = onY(250, 552).z, zb = zf - 0.45;
		const xAt = (px) => onZ(px + 12, 480, zf).x, yAt = (py) => onZ(240, py, zf).y;
		const x0 = xAt(196), x1 = xAt(268), xm = (x0 + x1) / 2;
		boxB(xm - 0.25, xm + 0.27, 0, 0.03, zb, zf, M.darkSteel);
		boxB(xm - 0.18, xm + 0.22, 0.03, yAt(428), zb + 0.05, zf - 0.08, M.lightGrey, 0.02);
		boxB(x0, x1, yAt(428), yAt(415), zb, zf + 0.05, M.lightGrey, 0.01);
		// Scanner
		const sy0 = yAt(420), sy1 = yAt(388);
		boxB(xAt(205), xAt(240), sy0, sy1, zb + 0.15, zb + 0.32, M.black, 0.015);
		boxB(xAt(210), xAt(236), sy0 + 0.04, sy1 - 0.03, zb + 0.32, zb + 0.325, std({ color: 0x300000, emissive: 0xff1010, emissiveIntensity: 2.5 }));
		// Säule + Bildschirm
		rod(new THREE.Vector3(xm + 0.05, yAt(415), zb + 0.12), new THREE.Vector3(xm + 0.05, yAt(300), zb + 0.12), 0.025, M.darkSteel);
		const scx0 = xAt(208), scx1 = xAt(275), scy0 = yAt(355), scy1 = yAt(286);
		const scr = boxB(scx0 - 0.02, scx1 + 0.02, scy0 - 0.02, scy1 + 0.02, zb + 0.14, zb + 0.18, M.lightGrey, 0.012);
		const sc = plane(scx1 - scx0, scy1 - scy0, std({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 1.3, roughness: 0.15 }), (scx0 + scx1) / 2, (scy0 + scy1) / 2, zb + 0.185);
		sc.material.emissiveMap = T.screenTex(); sc.castShadow = false;
	}

	// ================= Lampe + Schild =================
	{
		const z = WZ + 0.02;
		const sx0 = onZ(873, 140, z).x, sx1 = onZ(1100, 140, z).x, sy0 = onZ(980, 187, z).y, sy1 = onZ(980, 95, z).y;
		// hellerer Rahmen hinter dem Schild
		boxB(sx0 - 0.12, sx1 + 0.06, sy0 - 0.03, sy1 + 0.25, z, z + 0.012, std({ color: 0xaeb1b6, roughness: 0.7 }));
		boxB(sx0, sx1, sy0, sy1, z + 0.015, z + 0.045, M.navy);
		plane(sx1 - sx0 - 0.02, sy1 - sy0 - 0.02, std({ map: T.signDDL(), roughness: 0.4 }), (sx0 + sx1) / 2, (sy0 + sy1) / 2, z + 0.046);
		// Schwanenhalslampe
		const lp = onZ(826, 100, z + 0.45);
		const shade = new THREE.LatheGeometry([0, 0.1, 0.17, 0.22, 0.25, 0.255].map((r, i) => new THREE.Vector2(r + 0.001, 0.16 - Math.pow(i / 5, 1.6) * 0.16)), 40);
		const sm = add(shade, std({ color: 0x141517, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), lp.x, lp.y - 0.06, lp.z);
		add(new THREE.SphereGeometry(0.07, 20, 12), std({ color: 0xffffff, emissive: 0xfff3dc, emissiveIntensity: 9 }), lp.x, lp.y - 0.04, lp.z).castShadow = false;
		const arm = new THREE.CatmullRomCurve3([new THREE.Vector3(lp.x, lp.y + 0.1, lp.z), new THREE.Vector3(lp.x, lp.y + 0.3, lp.z - 0.15), new THREE.Vector3(lp.x, lp.y + 0.32, z + 0.12), new THREE.Vector3(lp.x, lp.y + 0.2, z + 0.02)]);
		add(new THREE.TubeGeometry(arm, 24, 0.017, 10), M.black, 0, 0, 0);
		boxB(lp.x - 0.06, lp.x + 0.06, lp.y + 0.12, lp.y + 0.28, z, z + 0.03, M.black, 0.01);
		const sp = new THREE.SpotLight(0xfff1dc, 16, 9, 58 * DEG, 0.9, 1.6);
		sp.position.set(lp.x, lp.y - 0.08, lp.z); sp.target.position.set(lp.x + 0.2, 0, z + 0.6);
		sp.castShadow = true; sp.shadow.mapSize.set(1024, 1024); sp.shadow.radius = 8; sp.shadow.blurSamples = 16; sp.shadow.bias = -0.0005;
		scene.add(sp, sp.target);
	}

	// ================= Regal =================
	const cardboardMats = cbT.map(t => std({ map: t, roughness: 0.82, color: 0xffffff }));
	function carton(x0, x1, y0, y1, z0, z1, v = 0, rot = 0) {
		const m = boxB(x0, x1, y0, y1, z0, z1, cardboardMats[v], 0.008);
		m.rotation.y = rot;
		return m;
	}
	const flatMats = [std({ map: cbSide, roughness: 0.85 }), std({ map: cbT[0], roughness: 0.85 })];
	function flatStack(x0, x1, y0, y1, z0, z1) {
		const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
		const m = add(g, [flatMats[0], flatMats[0], flatMats[1], flatMats[1], flatMats[0], flatMats[0]], (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
		return m;
	}
	{
		const zf = onY(840, 522).z, zb = Math.max(zf - 0.62, WZ + 0.04);
		const xAt = (px) => onZ(px, 400, zf).x;
		const yAt = (py) => onZ(900, py, zf).y;
		const ux = [xAt(838), xAt(1047), xAt(1077), xAt(1300)];
		const top = yAt(240);
		const levels = [0.12, yAt(432), yAt(360), yAt(290)];
		for (const x of ux) for (const z of [zf - 0.04, zb + 0.04]) boxB(x - 0.035, x + 0.035, 0, top, z - 0.035, z + 0.035, M.rackBlue);
		const bays = [[ux[0], ux[1]], [ux[2], ux[3]]];
		for (const [a, b] of bays) for (const y of levels) {
			boxB(a + 0.035, b - 0.035, y - 0.07, y, zf - 0.07, zf - 0.01, M.rackGrey);
			boxB(a + 0.035, b - 0.035, y - 0.07, y, zb + 0.01, zb + 0.07, M.rackGrey);
			boxB(a + 0.035, b - 0.035, y - 0.012, y, zb + 0.04, zf - 0.04, M.rackGrey);
		}
		// Diagonalstreben seitlich
		for (const x of ux) rod(new THREE.Vector3(x, 0.2, zf - 0.04), new THREE.Vector3(x, 1.2, zb + 0.04), 0.012, M.rackBlue);
		const zc0 = zb + 0.08, zc1 = zf - 0.08;
		const R = T.rng(7);
		// Ebene oben
		const L3 = levels[3];
		carton(xAt(858), xAt(922), L3, L3 + 0.42, zc0, zc1, 2);
		flatStack(xAt(926), xAt(976), L3, L3 + 0.40, zc0 + 0.05, zc1);
		flatStack(xAt(966), xAt(1018), L3, L3 + 0.44, zc0, zc1 - 0.06);
		carton(xAt(1082), xAt(1140), L3, L3 + 0.48, zc0, zc1, 4);
		carton(xAt(1150), xAt(1200), L3, L3 + 0.42, zc0, zc1, 1);
		// Ebene 1.45
		const L2 = levels[2];
		carton(xAt(866), xAt(918), L2, L2 + 0.3, zc0, zc1, 1);
		flatStack(xAt(906), xAt(968), L2, L2 + 0.46, zc0 + 0.04, zc1);
		flatStack(xAt(948), xAt(1000), L2, L2 + 0.38, zc0, zc1 - 0.05);
		{ // Folienrolle
			const r = 0.2, x = (xAt(1004) + xAt(1056)) / 2;
			const fm = phys({ color: 0xb9bdc2, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, transmission: 0, sheen: 0.4 });
			const c = add(new THREE.CylinderGeometry(r, r, 0.5, 40), fm, x, L2 + r, (zc0 + zc1) / 2); c.rotation.z = Math.PI / 2;
			const core = add(new THREE.CylinderGeometry(0.04, 0.04, 0.52, 16), cardboardMats[0], x, L2 + r, (zc0 + zc1) / 2); core.rotation.z = Math.PI / 2;
		}
		carton(xAt(1090), xAt(1150), L2, L2 + 0.32, zc0, zc1, 3);
		carton(xAt(1150), xAt(1210), L2, L2 + 0.3, zc0, zc1, 0);
		// Ebene 0.77
		const L1 = levels[1];
		carton(xAt(866), xAt(946), L1, L1 + 0.3, zc0, zc1, 3);
		carton(xAt(948), xAt(1004), L1, L1 + 0.26, zc0, zc1, 1);
		boxB(xAt(1008), xAt(1044), L1, L1 + 0.2, zc0 + 0.1, zc1 - 0.05, std({ color: 0x9aa1a8, roughness: 0.4, metalness: 0.4 }), 0.01);
		carton(xAt(1082), xAt(1160), L1, L1 + 0.34, zc0, zc1, 2);
		// unten
		const L0 = levels[0];
		carton(xAt(868), xAt(918), L0, L0 + 0.42, zc0, zc1, 0);
		carton(xAt(920), xAt(990), L0, L0 + 0.32, zc0, zc1, 1);
		carton(xAt(1082), xAt(1150), L0, L0 + 0.36, zc0, zc1, 3);
		carton(xAt(1150), xAt(1215), L0, L0 + 0.4, zc0, zc1, 0);
		carton(xAt(1160), xAt(1215), L1, L1 + 0.3, zc0, zc1, 4);
		carton(xAt(1022), xAt(1044), L3, L3 + 0.3, zc0 + 0.1, zc1, 0);
		flatStack(xAt(1000), xAt(1040), L1 + 0.2, L1 + 0.3, zc0, zc1);
		carton(xAt(1200), xAt(1260), L3, L3 + 0.36, zc0, zc1, 2);
		carton(xAt(1215), xAt(1270), L2, L2 + 0.28, zc0, zc1, 1);
	}

	// ================= Packtisch =================
	const TH = 0.92;
	const tblBack = onY(918, 432, TH), tblFront = onY(1192, 612, TH);
	const G = onY(1165, 398, TH + 0.42); // Greifer = Oberkante gegriffener Karton
	const tx0 = tblBack.x, tx1 = Math.max(tx0 + 1.3, G.x + 0.45), tz0 = tblBack.z, tz1 = tblFront.z;
	console.log('Tisch x', tx0.toFixed(2), tx1.toFixed(2), 'z', tz0.toFixed(2), tz1.toFixed(2), 'Greifer', G.x.toFixed(2), G.z.toFixed(2));
	const tFrame = std({ color: 0x2c3544, roughness: 0.45, metalness: 0.55 });
	{
		const woodMat = std({ map: woodT, roughness: 0.55, color: 0xb98656 });
		woodT.rotation = Math.PI / 2; woodT.center.set(0.5, 0.5);
		boxB(tx0 - 0.03, tx1, TH - 0.035, TH, tz0, tz1, woodMat, 0.006);
		const nLeg = Math.max(2, Math.round((tz1 - tz0) / 1.4) + 1);
		for (let i = 0; i < nLeg; i++) {
			const z = tz0 + 0.05 + i * (tz1 - tz0 - 0.1) / (nLeg - 1);
			for (const x of [tx0 + 0.04, tx1 - 0.05]) boxB(x - 0.03, x + 0.03, 0, TH - 0.035, z - 0.03, z + 0.03, tFrame);
			boxB(x0f(), tx1 - 0.05, 0.1, 0.14, z - 0.02, z + 0.02, tFrame);
		}
		function x0f() { return tx0 + 0.04; }
		boxB(tx0 + 0.01, tx0 + 0.07, TH - 0.13, TH - 0.035, tz0, tz1, tFrame); // Zarge vorn
		boxB(tx1 - 0.08, tx1 - 0.02, TH - 0.13, TH - 0.035, tz0, tz1, tFrame);
		// Unterschrank hinten
		const cab = std({ color: 0x59606b, roughness: 0.4, metalness: 0.5 });
		boxB(tx0 + 0.05, tx0 + 0.7, 0.12, TH - 0.13, tz0 + 0.1, tz0 + 1.0, cab, 0.01);
		boxB(tx0 + 0.035, tx0 + 0.05, 0.16, TH - 0.17, tz0 + 0.14, tz0 + 0.54, std({ color: 0x6b737e, roughness: 0.35, metalness: 0.5 }), 0.004);
		boxB(tx0 + 0.035, tx0 + 0.05, 0.16, TH - 0.17, tz0 + 0.56, tz0 + 0.96, std({ color: 0x6b737e, roughness: 0.35, metalness: 0.5 }), 0.004);
		for (const zz of [tz0 + 0.5, tz0 + 0.6]) boxB(tx0 + 0.02, tx0 + 0.035, TH - 0.4, TH - 0.28, zz - 0.01, zz + 0.01, M.steel);
		// Paletten + Kartons unter dem Tisch
		const R = T.rng(77);
		const palMat = std({ color: 0xb08a5c, roughness: 0.8 });
		let z = tz0 + 1.12;
		while (z < tz1 - 0.6) {
			const d = Math.min(1.0, tz1 - 0.1 - z);
			// Europalette (vereinfacht)
			for (const k of [0, 0.5, 1]) boxB(tx0 + 0.1, tx0 + 0.9, 0, 0.1, z + k * (d - 0.1), z + k * (d - 0.1) + 0.1, palMat);
			for (let k = 0; k < 5; k++) boxB(tx0 + 0.1 + k * 0.17, tx0 + 0.1 + k * 0.17 + 0.12, 0.1, 0.122, z, z + d, palMat);
			let zz = z + 0.02;
			while (zz < z + d - 0.3) {
				const dd = Math.min(0.32 + R() * 0.25, z + d - zz - 0.02), h = 0.3 + R() * 0.25, w = 0.5 + R() * 0.25;
				carton(tx0 + 0.12, tx0 + 0.12 + w, 0.122, 0.122 + h, zz, zz + dd, (R() * 5) | 0);
				if (R() < 0.7) carton(tx0 + 0.14, tx0 + 0.1 + w * 0.85, 0.122 + h, Math.min(TH - 0.16, 0.122 + h + 0.18 + R() * 0.15), zz + 0.02, zz + dd - 0.03, (R() * 5) | 0);
				zz += dd + 0.03;
			}
			z += d + 0.12;
		}
		// Abroller (Tischgerät) rot/schwarz mit Bandrolle
		const tp = onY(1090, 478, TH);
		boxB(tp.x - 0.13, tp.x + 0.13, TH, TH + 0.11, tp.z - 0.17, tp.z + 0.17, std({ color: 0x1b1c1f, roughness: 0.4 }), 0.025);
		boxB(tp.x - 0.131, tp.x + 0.131, TH + 0.04, TH + 0.08, tp.z - 0.12, tp.z + 0.171, phys({ color: 0xc0201e, roughness: 0.35, clearcoat: 0.5 }), 0.01);
		const roll = add(new THREE.TorusGeometry(0.095, 0.05, 20, 48), phys({ color: 0xf3ecdc, roughness: 0.35, clearcoat: 0.6 }), tp.x, TH + 0.25, tp.z - 0.02);
		roll.rotation.y = Math.PI / 2; roll.scale.z = 1.6;
		add(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 24), cardboardMats[0], tp.x, TH + 0.25, tp.z - 0.02).rotation.z = Math.PI / 2;
		const tp2 = onY(1052, 455, TH);
		boxB(tp2.x - 0.09, tp2.x + 0.09, TH, TH + 0.17, tp2.z - 0.13, tp2.z + 0.13, std({ color: 0x1b1c1f, roughness: 0.4 }), 0.025);
		boxB(tp2.x - 0.091, tp2.x + 0.091, TH + 0.07, TH + 0.11, tp2.z - 0.131, tp2.z + 0.131, phys({ color: 0xc0201e, roughness: 0.35 }), 0.01);
		// Etikettendrucker vorn
		const pp = onY(1180, 560, TH);
		boxB(pp.x - 0.2, pp.x + 0.18, TH, TH + 0.22, pp.z - 0.22, pp.z + 0.22, std({ color: 0x1c1d20, roughness: 0.35, metalness: 0.1 }), 0.03);
		boxB(pp.x - 0.201, pp.x + 0.181, TH + 0.12, TH + 0.14, pp.z - 0.221, pp.z + 0.221, std({ color: 0x08090a, roughness: 0.15 }));
		boxB(pp.x - 0.12, pp.x + 0.1, TH + 0.215, TH + 0.225, pp.z - 0.3, pp.z + 0.1, std({ color: 0xf5f5f5, roughness: 0.5 }));
	}

	// ================= Matte =================
	{
		const a = onY(871, 636), b = onY(956, 634), c = onY(1101, 795), d = onY(962, 797);
		const x0 = (a.x + d.x) / 2, x1 = (b.x + c.x) / 2, z0 = (a.z + b.z) / 2, z1 = (c.z + d.z) / 2;
		matT.map.repeat.set(3, 9); matT.bump.repeat.set(3, 9);
		const mm = std({ map: matT.map, bumpMap: matT.bump, bumpScale: 3, roughness: 0.78, color: 0xffffff });
		boxB(x0, x1, 0, 0.014, z0, z1, mm, 0.006).castShadow = false;
	}

	// ================= Roboterzelle, Zaun, Rollenbahn =================
	{
		const fp = onY(1201, 893); // naher Zaunpfosten
		const fx = fp.x;
		const fh = onZ(1201, 512, fp.z).y;
		const zs = [fp.z, fp.z + 2.2];
		for (const z of zs) post(fx, z, fh, 0.08);
		for (let i = 0; i < zs.length - 1; i++) meshPanel(new THREE.Vector3(fx, 0, zs[i] + 0.05), new THREE.Vector3(fx, 0, zs[i + 1] - 0.05), 0.15, fh - 0.02);
		// Rollenbahn
		const cx0 = fx + 0.15, cx1 = cx0 + 0.75, cy = 0.82;
		boxB(cx0, cx0 + 0.05, cy - 0.12, cy, tz1 + 0.1, 1.5, M.darkSteel);
		boxB(cx1 - 0.05, cx1, cy - 0.12, cy, tz1 + 0.1, 1.5, M.darkSteel);
		const rollers = [];
		for (let z = tz1 + 0.15; z < 1.5; z += 0.085) { const g = new THREE.CylinderGeometry(0.025, 0.025, cx1 - cx0 - 0.1, 14); g.rotateZ(Math.PI / 2); g.translate((cx0 + cx1) / 2, cy - 0.03, z); rollers.push(g); }
		add(mergeGeometries(rollers), M.steel, 0, 0, 0);
		for (let z = tz1 + 0.15; z < 1.5; z += 1.2) for (const x of [cx0 + 0.03, cx1 - 0.03]) boxB(x - 0.025, x + 0.025, 0, cy - 0.12, z, z + 0.05, M.darkSteel);
		carton(cx0 + 0.1, cx1 - 0.1, cy, cy + 0.36, fp.z + 0.3, fp.z + 0.9, 3);
		// Palette mit Kartons unter dem vorderen Tischende
		// Kartonaufrichter (Maschine) rechts

		// Zelle um Roboter (hinten)
		const cellH = 1.25;
		const p1 = new THREE.Vector3(tx1 + 0.12, 0, tz0 + 0.3), p2 = new THREE.Vector3(tx1 + 0.12, 0, tz1 - 0.8);
		post(p1.x, p1.z, cellH); post(p2.x, p2.z, cellH);
		meshPanel(p1.clone().setZ(p1.z + 0.05), p2.clone().setZ(p2.z - 0.05), 0.15, cellH - 0.02);

		// Roboter (Gelenkpunkte aus dem Zielbild)
		const rob = phys({ color: 0xf2b705, roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.2 });
		const robD = std({ color: 0x26282c, roughness: 0.45, metalness: 0.5 });
		const Wr = onZ(1172, 350, G.z);
		const E = onZ(1272, 290, G.z - 0.35);
		const S = onZ(1262, 445, G.z - 0.55);
		const base = new THREE.Vector3(S.x, 0, S.z);
		console.log('Roboter S', S.toArray().map(v => v.toFixed(2)), 'E', E.toArray().map(v => v.toFixed(2)));
		add(new THREE.CylinderGeometry(0.34, 0.4, 0.12, 40), robD, base.x, 0.06, base.z);
		add(new THREE.CylinderGeometry(0.3, 0.32, S.y - 0.35, 40), rob, base.x, 0.12 + (S.y - 0.35) / 2, base.z);
		add(new THREE.CylinderGeometry(0.24, 0.24, 0.5, 32), rob, S.x, S.y, S.z).rotation.x = Math.PI / 2;
		add(new THREE.CylinderGeometry(0.12, 0.12, 0.52, 24), robD, S.x, S.y, S.z).rotation.x = Math.PI / 2;
		const ua = rod(S, E, 0.14, rob, 32); ua.scale.set(1, 1, 0.8);
		add(new THREE.CylinderGeometry(0.19, 0.19, 0.42, 32), rob, E.x, E.y, E.z).rotation.x = Math.PI / 2;
		add(new THREE.CylinderGeometry(0.09, 0.09, 0.44, 20), robD, E.x, E.y, E.z).rotation.x = Math.PI / 2;
		const fa = rod(E.clone().add(new THREE.Vector3(0, 0, 0.12)), Wr, 0.1, rob, 28);
		add(new THREE.SphereGeometry(0.1, 24, 16), rob, Wr.x, Wr.y, Wr.z);
		const flange = new THREE.Vector3(G.x, G.y + 0.16, G.z);
		rod(Wr, flange, 0.06, robD, 20);
		// Sauggreifer-Rahmen
		boxB(G.x - 0.26, G.x + 0.26, G.y + 0.12, G.y + 0.16, G.z - 0.03, G.z + 0.03, M.steel, 0.01);
		boxB(G.x - 0.03, G.x + 0.03, G.y + 0.12, G.y + 0.16, G.z - 0.18, G.z + 0.18, M.steel, 0.01);
		for (const dx of [-0.22, 0.22]) for (const dz of [-0.14, 0.14]) {
			rod(new THREE.Vector3(G.x + dx, G.y + 0.14, G.z + dz * 0.2), new THREE.Vector3(G.x + dx, G.y + 0.03, G.z + dz), 0.012, M.steel, 10);
			add(new THREE.CylinderGeometry(0.03, 0.035, 0.03, 16), M.black, G.x + dx, G.y + 0.015, G.z + dz);
		}
		// Schriftzug DDL auf Unterarm
		const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), std({ map: T.labelTex('DDL', null, '#121212'), transparent: true, roughness: 0.4 }));
		const mid = E.clone().lerp(Wr, 0.38); lab.position.copy(mid).add(new THREE.Vector3(0, 0.0, 0.17));
		lab.rotation.z = Math.atan2(Wr.y - E.y, Wr.x - E.x) + Math.PI; scene.add(lab);
		// Kabel
		const cable = new THREE.CatmullRomCurve3([S.clone().add(new THREE.Vector3(0.15, -0.1, -0.2)), S.clone().lerp(E, 0.5).add(new THREE.Vector3(0.17, 0, -0.15)), E.clone().add(new THREE.Vector3(0.12, 0.15, -0.1)), E.clone().lerp(Wr, 0.5).add(new THREE.Vector3(0, 0.12, -0.05))]);
		add(new THREE.TubeGeometry(cable, 40, 0.02, 8), M.black, 0, 0, 0);
		// gegriffener Karton
		carton(G.x - 0.3, G.x + 0.3, TH, G.y, G.z - 0.22, G.z + 0.22, 1);
		// Maschinengehäuse rechts hinten
		boxB(base.x + 0.35, base.x + 2.6, 2.3, 3.6, WZ + 0.05, WZ + 1.6, std({ color: 0xc9cdd2, roughness: 0.5, metalness: 0.15 }), 0.02);
		boxB(base.x + 0.42, base.x + 2.6, 2.4, 3.4, WZ + 1.6, WZ + 1.68, M.yellow, 0.01);
		boxB(base.x + 0.52, base.x + 2.6, 2.5, 3.3, WZ + 1.68, WZ + 1.69, std({ color: 0x15161a, roughness: 0.08, metalness: 0.3 }));
		// Gelenk-Arbeitsleuchte über dem Tisch
		const lA = onZ(1275, 236, G.z - 0.5), lB = onZ(1125, 216, G.z + 0.1);
		rod(new THREE.Vector3(lA.x, lA.y - 0.9, lA.z), lA, 0.022, M.black);
		rod(lA, lB, 0.02, M.black);
		boxB(lB.x - 0.05, lB.x + 0.35, lB.y - 0.045, lB.y, lB.z - 0.05, lB.z + 0.05, M.black, 0.01);
		const lbar = boxB(lB.x - 0.04, lB.x + 0.34, lB.y - 0.05, lB.y - 0.044, lB.z - 0.035, lB.z + 0.035, std({ color: 0xffffff, emissive: 0xfff6ea, emissiveIntensity: 5 }));
		lbar.castShadow = false;
		const tl = new THREE.RectAreaLight(0xfff4e6, 1.5, 0.38, 0.07); tl.position.set(lB.x + 0.15, lB.y - 0.05, lB.z); tl.lookAt(lB.x + 0.15, 0, lB.z); scene.add(tl);
	}

	// ================= Boden =================
	const FX0 = -10, FX1 = 8, FZ0 = WZ - 0.5, FZ1 = FZ0 + 18;
	const FN = 4096;
	const [fc, fg] = T.floorBase(FN);
	const W2C = (x, z) => [(x - FX0) / (FX1 - FX0) * FN, (z - FZ0) / (FZ1 - FZ0) * FN];
	const pxm = FN / (FX1 - FX0);
	{
		// blaue Zone links
		const zf = onY(238, 611).z;
		const xr = (onY(300, 515).x + onY(238, 610).x) / 2;
		fg.save();
		fg.globalAlpha = 0.75; fg.fillStyle = '#4f6c9e';
		let [ax, az] = W2C(FX0, FZ0), [bx, bz] = W2C(xr, zf);
		fg.fillRect(ax, az, bx - ax, bz - az);
		fg.globalCompositeOperation = 'multiply'; fg.globalAlpha = 0.35; fg.drawImage(fc, 0, 0); // Fleckigkeit erhalten
		fg.restore();
		const yel = '#f3c21a';
		const line = (pts, w = 0.1, col = yel, dash = null) => {
			fg.save(); fg.strokeStyle = col; fg.lineWidth = w * pxm; fg.lineCap = 'butt';
			if (dash) fg.setLineDash(dash.map(v => v * pxm));
			fg.beginPath(); pts.forEach((p, i) => { const [x, y] = W2C(p.x, p.z); i ? fg.lineTo(x, y) : fg.moveTo(x, y); }); fg.stroke(); fg.restore();
		};
		const V = (x, z) => ({ x, z });
		line([V(FX0, zf), V(xr, zf), V(xr, WZ + 0.3)], 0.11);
		// diagonale Linie ganz links
		line([onY(0, 546), onY(66, 490)], 0.1);
		// rechte Linie
		const r0 = onY(836, 492), r1 = onY(1290, 1070);
		const k = (r1.x - r0.x) / (r1.z - r0.z);
		line([V(r0.x - 0.25, r0.z), V(r0.x, r0.z), V(r0.x + k * (2 - r0.z), 2)], 0.11);
		// gestrichelte weiße Linie vor dem Tor
		const dz = onY(530, 521).z;
		line([V(onY(306, 521).x, dz), V(onY(772, 521).x, dz)], 0.07, '#e9ecef', [0.42, 0.3]);
		// Abnutzung über Linien
		fg.save(); fg.globalCompositeOperation = 'multiply'; fg.globalAlpha = 0.25; fg.drawImage(fc, 0, 0); fg.restore();
		// Fugen
		fg.strokeStyle = 'rgba(40,45,52,0.35)'; fg.lineWidth = 2;
		for (let z = WZ + 6; z < FZ1; z += 6) { const [x0, y0] = W2C(FX0, z), [x1] = W2C(FX1, z); fg.beginPath(); fg.moveTo(x0, y0); fg.lineTo(x1, y0); fg.stroke(); }
	}
	const floorMap = T.tex(fc, { aniso: 16 });
	floorMap.wrapS = floorMap.wrapT = THREE.ClampToEdgeWrapping;
	const rough = T.floorRough(); rough.repeat.set(6, 6);
	const floorGeo = new THREE.PlaneGeometry(FX1 - FX0, FZ1 - FZ0);
	const floorMat = phys({ map: floorMap, roughnessMap: rough, roughness: 1.25, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.22, envMapIntensity: 0.3, color: 0xd2d4da });
	const floor = new THREE.Mesh(floorGeo, floorMat);
	floor.rotation.x = -Math.PI / 2; floor.position.set((FX0 + FX1) / 2, 0, (FZ0 + FZ1) / 2);
	floor.receiveShadow = true; scene.add(floor);
	// Roughness-Map nutzt UV mit Repeat – die Grundfarbe ohne: eigener UV-Kanal via Transform
	floorMap.repeat.set(1, 1);

	// ---- unscharfe Bodenspiegelung ----
	const RW = Math.round(W * SS / 2), RH = Math.round(H * SS / 2);
	const refl = new Reflector(floorGeo, { textureWidth: RW, textureHeight: RH, clipBias: 0.003 });
	refl.rotation.copy(floor.rotation); refl.position.copy(floor.position);
	refl.updateMatrixWorld();
	const blurRT = () => new THREE.WebGLRenderTarget(RW / 2, RH / 2, { type: THREE.HalfFloatType });
	const bA = blurRT(), bB = blurRT(), bSoft = blurRT();
	const gw = []; { let s = 0; for (let i = -12; i <= 12; i++) { const w = Math.exp(-i * i / (2 * 5.5 * 5.5)); gw.push(w); s += w; } for (let i = 0; i < gw.length; i++) gw[i] /= s; }
	const blurMat = new THREE.ShaderMaterial({
		uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2() }, w: { value: gw } },
		vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
		fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; uniform float w[25]; varying vec2 vUv;
			void main(){ vec4 c=vec4(0.); for(int i=0;i<25;i++){ c+=texture2D(tDiffuse, vUv+dir*float(i-12))*w[i]; } gl_FragColor=c; }`,
		depthTest: false, depthWrite: false
	});
	const fsq = new FullScreenQuad(blurMat);
	// sx/sy: Gauss-Sigma als Anteil der Bildbreite/-höhe
	function blurPass(src, dst, sx, sy) {
		blurMat.uniforms.tDiffuse.value = src.texture; blurMat.uniforms.dir.value.set(sx / 5.5, sy / 5.5);
		renderer.setRenderTarget(dst); fsq.render(renderer);
	}
	function updateReflection() {
		floor.visible = false;
		refl.onBeforeRender(renderer, scene, cam);
		floor.visible = true;
		const src = refl.getRenderTarget();
		blurPass(src, bA, 0.003, 0);          // leicht
		blurPass(bA, bSoft, 0, 0.012);
		blurPass(bSoft, bB, 0.01, 0);         // stark, vertikal gestreckt
		blurPass(bB, bA, 0, 0.03);
		blurPass(bA, bB, 0, 0.04);
		renderer.setRenderTarget(null);
	}
	const reflUniforms = {
		tReflSoft: { value: bSoft.texture }, tReflBlur: { value: bB.texture },
		reflMat: { value: refl.material.uniforms.textureMatrix.value }, reflStrength: { value: Q.has('rs') ? +Q.get('rs') : 3.2 }
	};
	floorMat.onBeforeCompile = (sh) => {
		Object.assign(sh.uniforms, reflUniforms);
		sh.vertexShader = 'uniform mat4 reflMat; varying vec4 vReflUv;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vReflUv = reflMat * vec4(transformed, 1.0);');
		sh.fragmentShader = 'uniform sampler2D tReflSoft; uniform sampler2D tReflBlur; uniform float reflStrength; varying vec4 vReflUv;\n' +
			sh.fragmentShader.replace('#include <opaque_fragment>', `
			{
				vec2 ruv = vReflUv.xy / vReflUv.w;
				float rgh = roughnessFactor;
				ruv += (vec2(rgh) - 0.28) * vec2(0.004, 0.012);
				vec3 rs = texture2D(tReflSoft, ruv).rgb, rb = texture2D(tReflBlur, ruv).rgb;
				vec3 rc = mix(rs, rb, smoothstep(0.18, 0.4, rgh) * 0.6 + 0.4);
				float nv = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
				float fr = 0.07 + 0.93 * pow(1.0 - nv, 4.0);
				float gloss = 1.0 - smoothstep(0.2, 0.42, rgh);
				outgoingLight += rc * fr * reflStrength * (0.3 + 0.7 * gloss);
			}
			#include <opaque_fragment>`);
	};

	// ================= Licht =================
	const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x50555c, 0.18); scene.add(hemi);
	const sun = new THREE.DirectionalLight(0xf0f4ff, 1.1);
	sun.position.set(-2.5, 16, -9); sun.target.position.set(-0.5, 0, -4);
	sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
	Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 30 });
	sun.shadow.radius = 6; sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
	scene.add(sun, sun.target);
	// Wandfluter (warm) – helle obere Wandzone, spiegelt sich als Lichtbahnen im Boden
	for (const x of [-6.5, -1.8, 3.2]) {
		const s = new THREE.SpotLight(0xffeedd, 45, 0, 50 * DEG, 1.0, 2);
		s.position.set(x, 6.4, WZ + 3.2); s.target.position.set(x, 3.2, WZ); scene.add(s, s.target);
	}
	// Hallenstrahler über/vor der Kamera: Boden vorn heller, Wand oben dunkler (wie im Zielbild)
	for (const [x, z, I] of [[-2.5, -3.5, 165], [2.5, -4.5, 120]]) {
		const h = new THREE.SpotLight(0xf4f6ff, I, 0, 52 * DEG, 1.0, 2);
		h.position.set(x, 8.5, z); h.target.position.set(x * 0.6, 0, z - 2);
		h.castShadow = true; h.shadow.mapSize.set(2048, 2048); h.shadow.radius = 5; h.shadow.bias = -0.0004; h.shadow.camera.near = 2;
		scene.add(h, h.target);
	}
	// Hallen-Lichtbänder an der Decke (RectArea -> weiche, gestreckte Glanzlichter)
	const stripMat = std({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 });
	for (const [x, z] of [[-4.5, -2], [-0.5, -2], [3.5, -2], [-4.5, -7], [-0.5, -7], [3.5, -7]]) {
		const L = new THREE.RectAreaLight(0xeef3ff, 0.4, 0.5, 3.2);
		L.position.set(x, 6.6, WZ + 11 + z); L.lookAt(x, 0, WZ + 11 + z); scene.add(L);
		const m = add(new THREE.BoxGeometry(0.5, 0.05, 3.2), stripMat, x, 6.72, WZ + 11 + z); m.castShadow = false;
	}
	// Wandleuchten oben (außerhalb des Bildes) – erzeugen Lichtstreifen im Boden
	for (const px of [380, 1010]) {
		const p = onZ(px, 0, WZ + 0.3);
		const s = new THREE.SpotLight(0xf6f8ff, 40, 14, 55 * DEG, 0.9, 1.5);
		s.position.set(p.x, 5.4, WZ + 0.6); s.target.position.set(p.x, 0, WZ + 5); scene.add(s, s.target);
		add(new THREE.BoxGeometry(0.6, 0.1, 0.3), std({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 12 }), p.x, 5.35, WZ + 0.5).castShadow = false;
	}

	if (Q.get('dbg') === 'ray') {
		const dir = sun.position.clone().sub(sun.target.position).normalize();
		for (const [px, py] of [[650, 600], [650, 650], [300, 600]]) {
			const p = onY(px, py, 0.001);
			const r = new THREE.Raycaster(p, dir); const hits = r.intersectObjects(scene.children, true).filter(h => h.object.castShadow);
			console.log('ray', px, py, hits.slice(0, 3).map(h => h.object.geometry.type + '@' + h.point.toArray().map(v => v.toFixed(2)).join(',')).join(' | '));
		}
	}
	if (Q.get('dbg') === 'sun') {
		scene.environmentIntensity = 0; hemi.intensity = 0;
		scene.traverse(o => { if (o.isLight && o !== sun) o.visible = false; });
	}
	// Aufhellung Roboterzelle
	{ const rl = new THREE.SpotLight(0xfff6ea, 30, 0, 45 * DEG, 0.9, 2); rl.position.set(2.5, 5.5, -6.5); rl.target.position.set(4.6, 1.2, -9); scene.add(rl, rl.target); }
	// ================= Post-Processing =================
	const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * renderer.getPixelRatio(), H * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: HEADLESS ? 0 : 4 }));
	composer.addPass(new RenderPass(scene, cam));
	const gtao = new GTAOPass(scene, cam, W, H);
	gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.5, thickness: 2, scale: 1.2, samples: 24, distanceFallOff: 1 });
	gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
	gtao.blendIntensity = 0.9;
	if (Q.get('gtao') !== '0') composer.addPass(gtao);
	const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.32, 0.55, 0.92);
	composer.addPass(bloom);
	composer.addPass(new OutputPass());
	// Farbkorrektur: leichte S-Kurve, kühle Schatten, Vignette
	const grade = new ShaderPass({
		uniforms: { tDiffuse: { value: null } },
		vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
		fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
			void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
				c = mix(c, c*c*(3.0-2.0*c), 0.22);
				float l = dot(c, vec3(0.299,0.587,0.114));
				c += vec3(-0.006, -0.002, 0.015) * (1.0 - l);
				vec2 d = vUv - 0.5; c *= 1.0 - 0.55 * dot(d, d) - 0.12 * smoothstep(0.1, 0.5, vUv.y - 0.5);
				gl_FragColor = vec4(c, 1.0); }`
	});
	if (Q.get('grade') !== '0') composer.addPass(grade);

	function frame() {
		if (Q.get('refl') !== '0') updateReflection();
		composer.render();
	}
	const t0 = performance.now();
	renderer.render(scene, cam); // Schattenkarten anlegen, bevor die Spiegelung (ohne Schatten-Update) rendert
	frame();
	console.log('Frame (inkl. Shader-Kompilierung) ms', (performance.now() - t0).toFixed(0));
	if (HEADLESS) {
		const t1 = performance.now(); frame(); renderer.getContext().finish();
		console.log('Frame 2 ms', (performance.now() - t1).toFixed(0));
		window.__png = renderer.domElement.toDataURL('image/png');
	} else {
		const ctl = new OrbitControls(cam, renderer.domElement);
		ctl.target.copy(onY(656, 600));
		ctl.update(); ctl.addEventListener('change', frame);
	}
}
main().catch(e => { console.error(e); window.__fail = String(e.stack || e); });
