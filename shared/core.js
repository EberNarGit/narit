// Utilidades neutras: formato es-MX, fechas, almacenamiento, toasts, animación, CSV, navegación global.
import { CONFIG } from '../config.js';
import { PROYECTOS } from './projects.js';
export { CONFIG, PROYECTOS };

const mx = (o) => new Intl.NumberFormat('es-MX', o);
const F0 = mx({ style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }), F2 = mx({ style: 'currency', currency: 'MXN' }), FN = mx({ maximumFractionDigits: 0 });
const fd = (s, o) => new Date(s + 'T12:00').toLocaleDateString('es-MX', o);
export const fmt = {
  mxn: (v) => F0.format(v || 0), mxn2: (v) => F2.format(v || 0), num: (v) => FN.format(v || 0),
  pct: (v) => (v || 0).toFixed(1) + '%', dec: (v) => (v || 0).toFixed(1),
  fecha: (s) => fd(s, { day: '2-digit', month: 'short' }),
  fechaL: (s) => fd(s, { weekday: 'long', day: 'numeric', month: 'long' }),
};

// Fechas como texto ISO local (YYYY-MM-DD) y como número de día (UTC) para cálculos rápidos.
export const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const hoy = () => iso(new Date());
export const diaNum = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
export const isoDN = (n) => new Date(n * 864e5).toISOString().slice(0, 10);
export const addDias = (s, n) => isoDN(diaNum(s) + n);

export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
export const rng = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function store(slug) {
  const pre = `demo:${slug}:`;
  return {
    get(k, def) { try { const v = localStorage.getItem(pre + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem(pre + k, JSON.stringify(v)); } catch { /* almacenamiento lleno o bloqueado: el demo sigue en memoria */ } },
    clear() { try { Object.keys(localStorage).filter((k) => k.startsWith(pre)).forEach((k) => localStorage.removeItem(k)); } catch { /* nada que limpiar */ } },
  };
}

export function toast(msg, tipo = 'ok') {
  let c = document.querySelector('.toasts');
  if (!c) { c = document.createElement('div'); c.className = 'toasts'; c.setAttribute('aria-live', 'polite'); document.body.append(c); }
  const t = document.createElement('div'); t.className = 'toast'; t.dataset.k = tipo; t.textContent = msg; c.append(t);
  setTimeout(() => { t.classList.add('fuera'); setTimeout(() => t.remove(), 400); }, 3600);
}

export function countUp(el, to, f, ms = 650) {
  if (RM || !isFinite(to)) { el.textContent = f(to); return; }
  const t0 = performance.now();
  const paso = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = f(to * e); if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

export function reveal(root = document) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
  root.querySelectorAll('.rv:not(.in)').forEach((el) => io.observe(el));
}

export function csv(nombre, cols, filas) {
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const txt = '﻿' + [cols.map(q).join(','), ...filas.map((f) => f.map(q).join(','))].join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/csv;charset=utf-8' })); a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const wa = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

export function confeti() {
  if (RM) return;
  const c = document.createElement('div'); c.className = 'confeti'; c.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('i'), R = Math.random;
    s.style.cssText = `left:${50 + (R() - 0.5) * 30}%;background:var(--c${1 + (i % 6)})`; c.append(s);
    s.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${(R() - 0.5) * 60}vw,${-20 - R() * 45}vh) rotate(${R() * 720}deg)`, opacity: 1, offset: 0.5 }, { transform: `translate(${(R() - 0.5) * 80}vw,30vh) rotate(900deg)`, opacity: 0 }], { duration: 1400 + R() * 600, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  }
  document.body.append(c); setTimeout(() => c.remove(), 2200);
}

// Iconos: un solo set de trazos; cada proyecto cambia grosor/remate por CSS o usa emoji / ASCII.
const SVG = { back: 'M19 12H5M11 6l-6 6 6 6', next: 'M5 12h14M13 6l6 6-6 6', bell: 'M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0', tema: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z', plus: 'M12 5v14M5 12h14', edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4', trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13', search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-4-4', down: 'M12 4v11M7 11l5 5 5-5M5 20h14', print: 'M7 8V4h10v4M7 17H4V9h16v8h-3M7 14h10v6H7z', check: 'M5 12l5 5 9-10', x: 'M6 6l12 12M18 6L6 18', wa: 'M4 20l1.5-4.5A8 8 0 1 1 9 19z', state: 'M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5' };
const EMOJI = { back: '←', next: '→', bell: '🔔', tema: '🌗', plus: '➕', edit: '✏️', trash: '🗑️', search: '🔍', down: '⬇️', print: '🖨️', check: '✅', x: '✖️', wa: '💬', state: '🔄' };
const ASCII = { back: '<-', next: '->', bell: '[!]', tema: '[*]', plus: '[+]', edit: '[e]', trash: '[x]', search: '?>', down: '[v]', print: '[p]', check: '[ok]', x: '[x]', wa: '[wa]', state: '[~]' };
let modoIco = 'svg';
export const setIconos = (m) => { modoIco = m || 'svg'; };
export const ico = (n) => modoIco === 'emoji' ? `<span class="ico-t" aria-hidden="true">${EMOJI[n]}</span>` : modoIco === 'ascii' ? `<span class="ico-t" aria-hidden="true">${ASCII[n]}</span>` : `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${SVG[n]}"/></svg>`;

// Navegación global: ← → entre proyectos, H = catálogo, P = modo presentación, Esc = salir.
const PK = 'presenta';
const ss = { get: () => { try { return sessionStorage.getItem(PK); } catch { return null; } }, set: (v) => { try { v ? sessionStorage.setItem(PK, '1') : sessionStorage.removeItem(PK); } catch { /* sin sessionStorage no hay modo presentación */ } } };
export function navGlobal(slug, ir) {
  const n = PROYECTOS.length, i = PROYECTOS.findIndex((p) => p.slug === slug);
  const base = slug ? '../' : 'proyectos/', hub = slug ? '../../index.html' : 'index.html';
  const go = (k) => { location.href = base + PROYECTOS[(k + n) % n].slug + '/index.html'; };
  let timers = [], bar;
  const parar = () => { ss.set(0); timers.forEach(clearTimeout); timers = []; bar?.remove(); bar = null; };
  const correr = () => {
    ss.set(1);
    if (!slug) return go(0);
    bar = document.createElement('div'); bar.className = 'presenta-bar';
    bar.innerHTML = `<span>Modo presentación · ${i + 1}/${n} · ${PROYECTOS[i].nombre}</span><button type="button">Salir (Esc)</button><i></i>`;
    bar.querySelector('button').onclick = parar; document.body.append(bar);
    const T = RM ? 1 : 1, en = (ms, f) => timers.push(setTimeout(f, ms * T));
    const baja = () => scrollBy({ top: innerHeight * 0.75, behavior: 'smooth' });
    en(3000, baja); en(6500, () => ir('demo')); en(9500, baja); en(12500, () => ir('panel')); en(15000, baja); en(17500, baja);
    en(21000, () => { if (i === n - 1) { ss.set(0); location.href = hub; } else go(i + 1); });
  };
  if (!slug) ss.set(0); else if (ss.get()) setTimeout(correr, 600);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bar) return parar();
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') || e.target.closest?.('input,select,textarea,[contenteditable],[tabindex="0"]')) return;
    if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i < 0 ? n - 1 : i - 1);
    else if (e.key === 'h' || e.key === 'H') { if (slug) location.href = hub; }
    else if (e.key === 'p' || e.key === 'P') bar ? parar() : correr();
  });
  return { correr, parar };
}
