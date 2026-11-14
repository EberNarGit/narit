// Hub: galería, filtros, vista en vivo, modo presentación y animaciones (GSAP con respaldo sin él).
import { CONFIG, PROYECTOS, wa, hash, rng, RM, navGlobal } from './shared/core.js';
import { SECTORES } from './shared/projects.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const url = (p) => `proyectos/${p.slug}/index.html`;

// Fuentes de los 24 proyectos, recortadas solo a las letras de sus nombres (una petición ligera).
const letras = [...new Set(PROYECTOS.map((p) => p.nombre).join(''))].join('');
document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?${PROYECTOS.map((p) => 'family=' + p.fd).join('&')}&text=${encodeURIComponent(letras)}&display=swap` }));

// Mini maqueta dibujada con CSS a partir de los tokens del proyecto (barata; el iframe real se carga a petición).
const mock = (p) => {
  const r = rng(hash(p.slug)), t = p.t;
  return `<div class="mock" style="--mb:${t.bg};--mc:${t.card};--mi:${t.ink};--ma:${t.ac};--m2:${t.ac2};--mf:${t.f};--mr:${t.r};--mbd:${t.b}"><div class="mk-top"><b>${p.nombre}</b><i></i></div><div class="mk-k"><span><em>$${(20 + r() * 180).toFixed(1)}k</em><small>ventas</small></span><span><em>${Math.round(30 + r() * 400)}</em><small>${p.feats[0].split(' ')[0].toLowerCase()}</small></span></div><div class="mk-c">${Array.from({ length: 8 }, (_, i) => `<i style="--h:${(22 + r() * 78).toFixed(0)}%;--d:${i * 50}ms"></i>`).join('')}</div><div class="mk-r"><i></i><i></i><i></i></div></div>`;
};

/* ---------- Contacto ---------- */
const msg = 'Hola, vi la página de NarIT y quiero digitalizar mi negocio.';
$$('[data-wa]').forEach((a) => { a.href = wa(msg); a.target = '_blank'; a.rel = 'noopener'; });
$$('[data-marca]').forEach((e) => (e.textContent = CONFIG.marca));
$('[data-contacto]').textContent = `${CONFIG.nombre} · ${CONFIG.ciudad} · ${CONFIG.email}`;
addEventListener('load', () => { try { const q = qrcode(0, 'M'); q.addData(wa(msg)); q.make(); $('[data-qr]').innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); } catch { $('.qr').hidden = true; } });

/* ---------- Hero ---------- */
$('.hero-m').innerHTML = ['estetica', 'restaurante', 'construccion', 'dental', 'taqueria'].map((s, i) => `<div class="tel t${i}">${mock(PROYECTOS.find((p) => p.slug === s))}</div>`).join('');
$('.cinta div').innerHTML = Array(2).fill(PROYECTOS.map((p) => `<span>${p.giro}</span>`).join('<i>✦</i>')).join('<i>✦</i>');

/* ---------- Galería ---------- */
const grid = $('.grid');
grid.innerHTML = PROYECTOS.map((p, i) => `<article class="card ${p.marco}" data-slug="${p.slug}" data-sector="${p.sector}" data-rv style="view-transition-name:c-${p.slug};--ca:${p.t.ac};--cf:${p.t.f}">
  <a class="marco" href="${url(p)}" aria-label="Abrir demo de ${p.nombre}" tabindex="-1">${mock(p)}</a>
  <div class="card-b"><p class="tag"><span>${String(i + 1).padStart(2, '0')}</span> ${p.giro}</p><h3>${p.nombre}</h3><p class="est">${p.estilo}</p><ul>${p.feats.map((f) => `<li>${f}</li>`).join('')}</ul>
  <div class="card-a"><a class="b b-ink" href="${url(p)}">Ver demo →</a><button class="b b-linea" data-vivo aria-label="Cargar vista en vivo de ${p.nombre}">Vista en vivo</button></div></div></article>`).join('');

const chips = $('.chips'), busca = $('.busca input');
chips.innerHTML = [['', 'Todos'], ...Object.entries(SECTORES)].map(([k, t]) => `<button data-s="${k}" aria-pressed="${!k}">${t}</button>`).join('');
let sector = '';
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const filtra = () => {
  const q = norm(busca.value.trim()); let n = 0;
  $$('.card', grid).forEach((c) => { const p = PROYECTOS.find((x) => x.slug === c.dataset.slug), ok = (!sector || p.sector === sector) && (!q || norm(`${p.nombre} ${p.giro} ${p.estilo} ${p.desc} ${p.feats.join(' ')}`).includes(q)); c.hidden = !ok; n += ok; });
  $('.cuenta').textContent = `${n} de ${PROYECTOS.length} demos`; $('.nada').hidden = n > 0;
};
const conTransicion = (f) => { if (!document.startViewTransition || RM) return f(); const t = document.startViewTransition(f); t.ready.catch(() => {}); t.finished.catch(() => {}); }; // filtrar rápido cancela la transición anterior: no es un error
chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; sector = b.dataset.s; $$('button', chips).forEach((x) => x.setAttribute('aria-pressed', x === b)); conTransicion(filtra); });
busca.addEventListener('input', () => conTransicion(filtra));
$('[data-limpia]').onclick = () => { busca.value = ''; chips.firstElementChild.click(); };
filtra();

// Vista en vivo: un solo iframe a la vez para no cargar 24 demos.
grid.addEventListener('click', (e) => {
  const b = e.target.closest('[data-vivo]'); if (!b) return;
  $$('.marco iframe', grid).forEach((f) => { const c = f.closest('.card'); f.parentElement.innerHTML = mock(PROYECTOS.find((p) => p.slug === c.dataset.slug)); $('[data-vivo]', c).textContent = 'Vista en vivo'; });
  const c = b.closest('.card'), p = PROYECTOS.find((x) => x.slug === c.dataset.slug);
  // El iframe se pinta a ancho real (390 / 1280 px) y se reduce con zoom para caber en el marco.
  const base = p.marco === 'phone' ? 390 : 1280, w = $('.mock', c).offsetWidth;
  $('.marco', c).innerHTML = `<iframe src="${url(p)}" title="Vista en vivo de ${p.nombre}" loading="lazy" tabindex="-1" style="width:${base}px;zoom:${(w / base).toFixed(3)}"></iframe>`; b.textContent = 'Cargando…';
  $('iframe', c).onload = () => (b.textContent = 'En vivo ●');
});

/* ---------- Presentación y atajos ---------- */
const nav = navGlobal(null);
$$('[data-presenta]').forEach((b) => (b.onclick = () => nav.correr()));

/* ---------- Animación ---------- */
const cuenta = (el) => { const n = +el.dataset.n, pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now(); const paso = (t) => { const k = Math.min(1, (t - t0) / 1100); el.textContent = pre + Math.round(n * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(paso); }; requestAnimationFrame(paso); };
addEventListener('load', () => {
  if (RM || !window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('[data-h]', { y: 40, opacity: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' });
  gsap.from('.tel', { y: 120, opacity: 0, rotate: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', delay: 0.2 });
  $$('.tel').forEach((t, i) => gsap.to(t, { y: (i % 2 ? 14 : -14), duration: 3 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.4 }));
  gsap.to('.hero-m', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  ScrollTrigger.batch('[data-rv]', { start: 'top 90%', once: true, onEnter: (els) => gsap.from(els, { y: 36, opacity: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'all' }) });
  ScrollTrigger.create({ trigger: '.res', start: 'top 85%', once: true, onEnter: () => $$('.res b').forEach(cuenta) });
});

// Cursor personalizado solo con mouse fino.
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !RM) {
  const c = $('.cursor'); document.body.classList.add('con-cursor');
  addEventListener('pointermove', (e) => { c.style.translate = `${e.clientX}px ${e.clientY}px`; c.classList.toggle('sobre', !!e.target.closest('a,button,summary,input')); }, { passive: true });
}
