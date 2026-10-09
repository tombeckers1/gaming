// Prozedurale Canvas-Texturen (alles im Browser erzeugt, keine Fotos).
import * as THREE from 'three';

export function rng(seed) {
	let s = seed >>> 0;
	return () => {
		s = (s + 0x6D2B79F5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// kachelbares Value-Noise mit Periode P
function noiseFn(seed, P) {
	const R = rng(seed), g = new Float32Array(P * P);
	for (let i = 0; i < g.length; i++) g[i] = R();
	return (x, y) => {
		const xi = Math.floor(x), yi = Math.floor(y);
		let fx = x - xi, fy = y - yi;
		fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
		const x0 = ((xi % P) + P) % P, y0 = ((yi % P) + P) % P, x1 = (x0 + 1) % P, y1 = (y0 + 1) % P;
		const a = g[y0 * P + x0], b = g[y0 * P + x1], c = g[y1 * P + x0], d = g[y1 * P + x1];
		return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
	};
}

// fbm-Feld w*h, Werte ~0..1, kachelbar; sx/sy = Grundfrequenz (Zellen je Bild)
export function fbm(w, h, { seed = 1, sx = 4, sy = 4, oct = 5, gain = 0.5 } = {}) {
	const out = new Float32Array(w * h);
	const fns = [];
	for (let o = 0; o < oct; o++) fns.push(noiseFn(seed * 31 + o * 7, Math.max(sx, sy) << o));
	let norm = 0, amp = 1;
	for (let o = 0; o < oct; o++) { norm += amp; amp *= gain; }
	for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
		let v = 0, a = 1;
		for (let o = 0; o < oct; o++) {
			const f = 1 << o;
			v += a * fns[o](x / w * sx * f, y / h * sy * f);
			a *= gain;
		}
		out[y * w + x] = v / norm;
	}
	return out;
}

export function canvas(w, h) {
	const c = document.createElement('canvas'); c.width = w; c.height = h;
	return [c, c.getContext('2d')];
}

export function tex(c, { srgb = true, rep = [1, 1], aniso = 8 } = {}) {
	const t = new THREE.CanvasTexture(c);
	if (srgb) t.colorSpace = THREE.SRGBColorSpace;
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.repeat.set(rep[0], rep[1]);
	t.anisotropy = aniso;
	return t;
}

// Feld -> Graustufen-Canvas
export function fieldCanvas(f, w, h, map) {
	const [c, g] = canvas(w, h);
	const id = g.createImageData(w, h);
	for (let i = 0; i < w * h; i++) {
		const [r, gg, b] = map(f[i], i);
		id.data[i * 4] = r; id.data[i * 4 + 1] = gg; id.data[i * 4 + 2] = b; id.data[i * 4 + 3] = 255;
	}
	g.putImageData(id, 0, 0);
	return c;
}

const clamp = (v, a = 0, b = 255) => Math.max(a, Math.min(b, v));

// ---------- Epoxidboden: Rauheit (gekachelt) ----------
export function floorRough() {
	const N = 1024;
	const f = fbm(N, N, { seed: 11, sx: 2, sy: 2, oct: 5, gain: 0.45 });
	const f2 = fbm(N, N, { seed: 12, sx: 24, sy: 24, oct: 3 });
	const c = fieldCanvas(f, N, N, (v, i) => {
		const r = clamp(255 * (0.15 + 0.3 * Math.pow(v, 2.0) + 0.04 * f2[i]));
		return [0, r, 0];
	});
	const g = c.getContext('2d');
	// feine Kratzer / Laufspuren (leicht rauer)
	const R = rng(5);
	g.globalAlpha = 0.18; g.strokeStyle = 'rgb(0,150,0)';
	for (let i = 0; i < 260; i++) {
		g.lineWidth = 0.6 + R() * 1.4;
		const x = R() * N, y = R() * N, a = (R() - 0.5) * 0.6 + (R() < 0.5 ? 0 : Math.PI / 2), l = 20 + R() * 160;
		g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
	}
	return tex(c, { srgb: false });
}

// Boden-Grundfarbe (Weltkoordinaten, ohne Kachelung) – Linien/Zonen zeichnet scene.js darauf
export function floorBase(N, seed = 3) {
	const M = 512;
	const f = fbm(M, M, { seed, sx: 5, sy: 5, oct: 6, gain: 0.55 });
	const f2 = fbm(M, M, { seed: seed + 9, sx: 2, sy: 2, oct: 3 });
	const small = fieldCanvas(f, M, M, (v, i) => {
		const k = 0.88 + 0.24 * v + 0.12 * (f2[i] - 0.5);
		return [clamp(132 * k), clamp(138 * k), clamp(147 * k)];
	});
	const [c, g] = canvas(N, N);
	g.imageSmoothingQuality = 'high';
	g.drawImage(small, 0, 0, N, N);
	// Sprenkel (Quarzsand im Epoxid)
	const R = rng(seed + 1);
	for (let i = 0; i < N * N / 60; i++) {
		const l = R() < 0.5 ? 255 : 30;
		g.fillStyle = `rgba(${l},${l},${l},${0.04 + R() * 0.07})`;
		const s = 1 + R() * 2.2;
		g.fillRect(R() * N, R() * N, s, s);
	}
	return [c, g, small];
}

// ---------- Kalksandstein-/Betonsteinwand ----------
export function wallTex() {
	const N = 1024; // = 2.4 m x 2.4 m, Steine 0.6 x 0.3
	const f = fbm(N, N, { seed: 21, sx: 16, sy: 16, oct: 5 });
	const R = rng(22);
	const cols = 3, rows = 6, bw = N / cols, bh = N / rows;
	const tone = [];
	for (let r = 0; r < rows; r++) for (let k = 0; k <= cols; k++) tone.push(0.97 + R() * 0.05);
	const col = fieldCanvas(f, N, N, (v, i) => {
		const x = i % N, y = (i / N) | 0;
		const r = (y / bh) | 0, off = (r % 2) * bw / 2;
		const k = (((x + off) / bw) | 0);
		const t = tone[r * (cols + 1) + k] * (0.95 + 0.1 * v);
		const lx = (x + off) % bw, ly = y % bh;
		const joint = (lx < 3 || ly < 3) ? 0.9 : 1;
		return [clamp(196 * t * joint), clamp(198 * t * joint), clamp(201 * t * joint)];
	});
	const bump = fieldCanvas(f, N, N, (v, i) => {
		const x = i % N, y = (i / N) | 0;
		const r = (y / bh) | 0, off = (r % 2) * bw / 2;
		const lx = (x + off) % bw, ly = y % bh;
		const joint = (lx < 4 || ly < 4) ? 0 : 1;
		const b = clamp(80 + 140 * joint + 30 * v);
		return [b, b, b];
	});
	return { map: tex(col), bump: tex(bump, { srgb: false }) };
}

// ---------- Tor-Lamellen ----------
export function slatTex(slats, base = [62, 65, 71], sectionEvery = 0) {
	const W = 64, H = slats * 32;
	const [c, g] = canvas(W, H), [cb, gb] = canvas(W, H);
	g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, W, H);
	gb.fillStyle = '#808080'; gb.fillRect(0, 0, W, H);
	for (let s = 0; s < slats; s++) {
		const y = s * 32;
		const grd = g.createLinearGradient(0, y, 0, y + 32);
		grd.addColorStop(0, 'rgba(255,255,255,0.10)'); grd.addColorStop(0.15, 'rgba(255,255,255,0.03)');
		grd.addColorStop(0.8, 'rgba(0,0,0,0.04)'); grd.addColorStop(0.94, 'rgba(0,0,0,0.22)'); grd.addColorStop(1, 'rgba(0,0,0,0.35)');
		g.fillStyle = grd; g.fillRect(0, y, W, 32);
		const gr2 = gb.createLinearGradient(0, y, 0, y + 32);
		gr2.addColorStop(0, '#b0b0b0'); gr2.addColorStop(0.5, '#8a8a8a'); gr2.addColorStop(0.9, '#606060'); gr2.addColorStop(1, '#101010');
		gb.fillStyle = gr2; gb.fillRect(0, y, W, 32);
		if (sectionEvery && s % sectionEvery === 0 && s) {
			g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, y - 1, W, 3);
			gb.fillStyle = '#000'; gb.fillRect(0, y - 1, W, 3);
		}
	}
	return { map: tex(c), bump: tex(cb, { srgb: false }) };
}

// ---------- gebürstetes Metall ----------
export function brushed(base = 170, seed = 31) {
	const W = 512, H = 512, R = rng(seed);
	const [c, g] = canvas(W, H);
	g.fillStyle = `rgb(${base},${base + 2},${base + 5})`; g.fillRect(0, 0, W, H);
	for (let i = 0; i < 2400; i++) {
		const y = R() * H, l = 40 + R() * 300, x = R() * W, a = R() * 0.08;
		g.fillStyle = R() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
		g.fillRect(x, y, l, 0.7 + R());
		g.fillRect(x - W, y, l, 0.7 + R());
	}
	const [cr, gr] = canvas(W, H);
	gr.fillStyle = 'rgb(0,90,0)'; gr.fillRect(0, 0, W, H);
	for (let i = 0; i < 1500; i++) {
		const y = R() * H, v = 60 + R() * 70;
		gr.fillStyle = `rgba(0,${v | 0},0,0.5)`; gr.fillRect(0, y, W, 1);
	}
	return { map: tex(c), rough: tex(cr, { srgb: false }) };
}

// ---------- Wellpappe ----------
const CB = [182, 136, 88];
export function cardboard(variant = 0, seed = 41) {
	const N = 512, R = rng(seed + variant * 13);
	const f = fbm(N, N, { seed: seed + variant, sx: 4, sy: 32, oct: 4 });
	const tint = 0.93 + R() * 0.12;
	const c = fieldCanvas(f, N, N, (v, i) => {
		const y = (i / N) | 0;
		const flute = 0.985 + 0.015 * Math.sin(y * 0.9);
		const k = tint * (0.9 + 0.16 * v) * flute;
		return [clamp(CB[0] * k), clamp(CB[1] * k), clamp(CB[2] * k)];
	});
	const g = c.getContext('2d');
	// Kantenabdunklung
	const vg = g.createRadialGradient(N / 2, N / 2, N * 0.3, N / 2, N / 2, N * 0.75);
	vg.addColorStop(0, 'rgba(60,35,10,0)'); vg.addColorStop(1, 'rgba(60,35,10,0.22)');
	g.fillStyle = vg; g.fillRect(0, 0, N, N);
	if (variant === 1 || variant === 3) { // Klebeband
		g.fillStyle = 'rgba(205,165,110,0.85)'; g.fillRect(N * 0.43, 0, N * 0.14, N);
		g.fillStyle = 'rgba(255,240,210,0.25)'; g.fillRect(N * 0.43, 0, N * 0.14, 3);
	}
	if (variant === 2 || variant === 3) { // Aufdruck: Karton-Icon + Pfeile
		g.strokeStyle = 'rgba(30,25,20,0.85)'; g.lineWidth = 7; g.lineJoin = 'round';
		const s = N * 0.17, x = N * 0.2, y = N * 0.3;
		g.beginPath(); g.moveTo(x, y + s * 0.3); g.lineTo(x + s * 0.5, y); g.lineTo(x + s, y + s * 0.3); g.lineTo(x + s, y + s); g.lineTo(x + s * 0.5, y + s * 1.3); g.lineTo(x, y + s); g.closePath(); g.stroke();
		g.beginPath(); g.moveTo(x, y + s * 0.3); g.lineTo(x + s * 0.5, y + s * 0.6); g.lineTo(x + s, y + s * 0.3); g.moveTo(x + s * 0.5, y + s * 0.6); g.lineTo(x + s * 0.5, y + s * 1.3); g.stroke();
		// Pfeile "oben"
		const ax = N * 0.7, ay = N * 0.62;
		for (let k = 0; k < 2; k++) {
			const xx = ax + k * 40;
			g.beginPath(); g.moveTo(xx, ay + 60); g.lineTo(xx, ay); g.moveTo(xx - 14, ay + 16); g.lineTo(xx, ay); g.lineTo(xx + 14, ay + 16); g.stroke();
		}
	}
	if (variant === 4) { // Versandetikett
		g.fillStyle = '#f2f0ea'; g.fillRect(N * 0.55, N * 0.18, N * 0.3, N * 0.22);
		g.fillStyle = '#222';
		for (let k = 0; k < 5; k++) g.fillRect(N * 0.58, N * 0.22 + k * 14, N * (0.12 + R() * 0.12), 5);
		for (let k = 0; k < 22; k++) g.fillRect(N * 0.58 + k * 5, N * 0.33, (R() * 3 + 1) | 0, 16);
		g.fillStyle = '#1d3e8a'; g.fillRect(N * 0.15, N * 0.6, N * 0.2, N * 0.16);
		g.fillStyle = '#fff'; g.font = '600 34px Inter, sans-serif'; g.fillText('DDL', N * 0.165, N * 0.71);
	}
	return tex(c);
}
// Seitenansicht eines Stapels flacher Kartonzuschnitte
export function flatStackSide(seed = 51) {
	const W = 256, H = 256, R = rng(seed);
	const [c, g] = canvas(W, H);
	g.fillStyle = `rgb(${CB})`; g.fillRect(0, 0, W, H);
	let y = 0;
	while (y < H) {
		const t = 3 + R() * 3, k = 0.75 + R() * 0.35;
		g.fillStyle = `rgb(${CB.map(v => clamp(v * k))})`; g.fillRect(0, y, W, t);
		g.fillStyle = 'rgba(40,25,10,0.45)'; g.fillRect(0, y + t - 0.8, W, 0.8);
		y += t;
	}
	return tex(c);
}

// ---------- Anti-Ermüdungsmatte ----------
export function matTex() {
	const W = 512, H = 512;
	const [c, g] = canvas(W, H), [cb, gb] = canvas(W, H);
	g.fillStyle = '#1b1c1e'; g.fillRect(0, 0, W, H);
	gb.fillStyle = '#c8c8c8'; gb.fillRect(0, 0, W, H);
	const cw = 32, ch = 32;
	for (let y = 0; y < H; y += ch) for (let x = 0; x < W; x += cw) {
		const ox = ((y / ch) % 2) * cw / 2;
		gb.fillStyle = '#303030'; g.fillStyle = '#0f1011';
		const rx = x + ox + 4, ry = y + 5;
		rr(gb, rx, ry, cw - 10, ch - 12, 5); gb.fill();
		rr(g, rx, ry, cw - 10, ch - 12, 5); g.fill();
		gb.fillStyle = '#000'; g.fillStyle = '#08090a';
		rr(gb, rx - W, ry, cw - 10, ch - 12, 5); gb.fill();
	}
	return { map: tex(c, { rep: [3, 7] }), bump: tex(cb, { srgb: false, rep: [3, 7] }) };
}
function rr(g, x, y, w, h, r) {
	g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
	g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ---------- Holzplatte (Buche-Multiplex) ----------
export function woodTex() {
	const W = 1024, H = 256;
	const f = fbm(W, H, { seed: 61, sx: 2, sy: 24, oct: 5 });
	const c = fieldCanvas(f, W, H, (v, i) => {
		const y = (i / W) | 0;
		const grain = 0.5 + 0.5 * Math.sin(y * 0.35 + v * 14);
		const k = 0.9 + 0.08 * grain + 0.08 * v;
		return [clamp(206 * k), clamp(166 * k), clamp(118 * k)];
	});
	return tex(c);
}

// ---------- Schilder / Displays ----------
export function signDDL() {
	const W = 1024, H = 416;
	const [c, g] = canvas(W, H);
	g.fillStyle = '#1f3152'; g.fillRect(0, 0, W, H);
	const gr = g.createLinearGradient(0, 0, 0, H);
	gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
	g.fillStyle = gr; g.fillRect(0, 0, W, H);
	// Karton-Icon
	g.strokeStyle = '#f2f4f7'; g.lineWidth = 11; g.lineJoin = 'round';
	const x = 70, y = 85, s = 240;
	g.beginPath(); g.moveTo(x, y + s * 0.28); g.lineTo(x + s * 0.5, y + s * 0.02); g.lineTo(x + s, y + s * 0.28);
	g.lineTo(x + s, y + s * 0.78); g.lineTo(x + s * 0.5, y + s * 1.04); g.lineTo(x, y + s * 0.78); g.closePath(); g.stroke();
	g.beginPath(); g.moveTo(x, y + s * 0.28); g.lineTo(x + s * 0.5, y + s * 0.54); g.lineTo(x + s, y + s * 0.28);
	g.moveTo(x + s * 0.5, y + s * 0.54); g.lineTo(x + s * 0.5, y + s * 1.04);
	g.moveTo(x + s * 0.25, y + s * 0.15); g.lineTo(x + s * 0.75, y + s * 0.41); g.lineTo(x + s * 0.75, y + s * 0.6); g.stroke();
	g.fillStyle = '#f2f4f7'; g.font = '600 112px Inter, sans-serif';
	g.fillText('DDL', 420, 175);
	g.fillText('Abholung', 420, 330);
	return tex(c);
}
export function signRakete() {
	const W = 512, H = 512;
	const [c, g] = canvas(W, H);
	const gr = g.createLinearGradient(0, 0, 0, H);
	gr.addColorStop(0, '#253f72'); gr.addColorStop(1, '#1a2d55');
	g.fillStyle = gr; g.fillRect(0, 0, W, H);
	rocketIcon(g, 256, 165, 1.25, '#f4f6fa');
	g.fillStyle = '#f4f6fa'; g.font = '700 92px Inter, sans-serif'; g.textAlign = 'center';
	g.fillText('RAKETE', 256, 420);
	return tex(c);
}
export function rocketIcon(g, cx, cy, s, col) {
	g.save(); g.translate(cx, cy); g.rotate(0.6); g.scale(s, s); g.fillStyle = col;
	g.beginPath(); g.moveTo(0, -70); g.quadraticCurveTo(26, -40, 22, 30); g.lineTo(-22, 30); g.quadraticCurveTo(-26, -40, 0, -70); g.fill();
	g.beginPath(); g.moveTo(-22, 0); g.lineTo(-44, 42); g.lineTo(-20, 30); g.fill();
	g.beginPath(); g.moveTo(22, 0); g.lineTo(44, 42); g.lineTo(20, 30); g.fill();
	g.beginPath(); g.moveTo(-12, 34); g.lineTo(0, 64); g.lineTo(12, 34); g.fill();
	g.fillStyle = '#253f72'; g.beginPath(); g.arc(0, -20, 10, 0, 7); g.fill();
	g.restore();
}
export function screenTex() {
	const W = 512, H = 384;
	const [c, g] = canvas(W, H);
	const gr = g.createLinearGradient(0, 0, W, H);
	gr.addColorStop(0, '#1d6fe0'); gr.addColorStop(1, '#0d47b8');
	g.fillStyle = gr; g.fillRect(0, 0, W, H);
	g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '500 26px Inter, sans-serif'; g.fillText('Willkommen', 24, 40);
	g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 56, W, 2);
	rocketIcon(g, 256, 190, 0.9, '#ffffff');
	g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '500 22px Inter, sans-serif'; g.textAlign = 'center';
	g.fillText('Abholung', 256, 300);
	g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(30, 330, 120, 28); g.fillRect(362, 330, 120, 28);
	return tex(c);
}
export function windowTex() {
	const W = 256, H = 96;
	const [c, g] = canvas(W, H);
	const gr = g.createLinearGradient(0, 0, 0, H);
	gr.addColorStop(0, '#2f5fae'); gr.addColorStop(0.42, '#9cc4ff'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.58, '#9cc4ff'); gr.addColorStop(1, '#244f9a');
	g.fillStyle = gr; g.fillRect(0, 0, W, H);
	const g2 = g.createLinearGradient(0, 0, W, 0);
	g2.addColorStop(0, 'rgba(0,0,30,0.35)'); g2.addColorStop(0.5, 'rgba(0,0,0,0)'); g2.addColorStop(1, 'rgba(0,0,30,0.35)');
	g.fillStyle = g2; g.fillRect(0, 0, W, H);
	return tex(c);
}
export function labelTex(text, bg = '#1a1a1a', fg = '#111', w = 256, h = 96, font = '800 70px Inter, sans-serif') {
	const [c, g] = canvas(w, h);
	if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
	g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
	g.fillText(text, w / 2, h / 2 + 4);
	return tex(c);
}
