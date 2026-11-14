// Motor neutro: arma ficha + demo + panel a partir de la configuración de cada proyecto.
// No define colores, fuentes ni layout: eso vive en proyectos/<slug>/style.css.
import { CONFIG, PROYECTOS, fmt, hoy, addDias, diaNum, isoDN, esc, hash, store, toast, countUp, reveal, csv, wa, confeti, ico, setIconos, navGlobal } from './core.js';
import { cargar } from './data.js';
import { pintar, leerTema } from './charts.js';
import { WIDGETS } from './demo.js';

const KB = {
  ing: { l: 'Ingresos', f: (s) => s.ing, fmt: 'mxn' }, n: { l: 'Registros', f: (s) => s.n, fmt: 'num' },
  ticket: { l: 'Ticket promedio', f: (s) => (s.ok.length ? s.ing / s.ok.length : 0), fmt: 'mxn' },
  ok: { l: 'Completados', f: (s) => (s.n ? s.ok.length / s.n * 100 : 0), fmt: 'pct' },
  bad: { l: 'Cancelaciones', f: (s) => (s.n ? s.bad.length / s.n * 100 : 0), fmt: 'pct', inv: 1 },
  cli: { l: 'Clientes únicos', f: (s) => s.cli, fmt: 'num' }, pend: { l: 'Pendientes', f: (s) => s.pend.length, fmt: 'num', inv: 1 },
  dia: { l: 'Promedio diario', f: (s) => s.ing / s.dias, fmt: 'mxn' },
};
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const cap = (s) => s[0].toUpperCase() + s.slice(1), li = (a, f) => a.map(f).join('');
const stats = (rows, dias, kind) => { const ok = [], bad = [], pend = []; let ing = 0; const c = new Set(); for (const r of rows) { const k = kind(r.estado); (k === 'ok' ? ok : k === 'bad' ? bad : pend).push(r); if (k === 'ok') ing += r.monto; c.add(r.cliente); } return { rows, n: rows.length, ok, bad, pend, ing, cli: c.size, dias: Math.max(1, dias) }; };
const spark = (v) => { const mx = Math.max(...v), mn = Math.min(...v), k = mx - mn || 1; return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${v.map((y, i) => `${(i / (v.length - 1) * 100).toFixed(1)},${(27 - (y - mn) / k * 24).toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>`; };
const clave = (r, k) => (k === 'wd' ? DIAS[(r.dn + 4) % 7] : r[k]);
const agrupa = (rows, k, val) => { const m = new Map(); for (const r of rows) { const c = clave(r, k); m.set(c, (m.get(c) || 0) + val(r)); } return [...m].sort((a, b) => b[1] - a[1]); };

export function montar(cfg) {
  const P = PROYECTOS.find((p) => p.slug === cfg.slug), d = cfg.datos, st = store(cfg.slug), db = cargar(cfg.slug, d);
  const L = { reg: 'registro', regs: 'registros', nuevo: 'Nuevo registro', cli: 'Cliente', cat: 'Categoría', staff: 'Responsable', suc: 'Sucursal', pago: 'Forma de pago', ...d.labels };
  const kmap = Object.fromEntries(d.estados.map((e) => [e[0], e[1]])), kind = (e) => kmap[e] || 'pend';
  const pagos = d.pagos.map((p) => (Array.isArray(p) ? p[0] : p)), precio = (c) => (d.cats.find((q) => q[0] === c) || d.cats[0])[1];
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement, tabs = cfg.vistas === 'tabs';
  setIconos(cfg.iconos);
  if (cfg.oscuro) { const t = st.get('tema'); if (t) root.dataset.tema = t; }
  document.body.dataset.vistas = tabs ? 'tabs' : 'scroll';

  let all = db.rows();
  const oyentes = [], cambio = () => { all = db.rows(); oyentes.forEach((f) => f()); };
  const hm = () => { const n = new Date(); return String(Math.min(d.horas[1] - 1, Math.max(d.horas[0], n.getHours()))).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0'); };
  const add = (p) => { const n = st.get('n', 0) + 1; st.set('n', n); const r = { id: 'u' + Date.now() + n, folio: d.folio + '-N' + String(n).padStart(3, '0'), fecha: hoy(), hora: hm(), cliente: 'Público en general', tel: '', cat: d.cats[0][0], staff: d.staff[0], suc: d.sucs[0], monto: d.cats[0][1], estado: (d.estados.find((e) => e[1] === 'pend') || d.estados[0])[0], pago: pagos[0], ...p }; r.dn = diaNum(r.fecha); db.add(r); cambio(); return r; };
  const upd = (id, p) => { if (p.fecha) p.dn = diaNum(p.fecha); db.upd(id, p); cambio(); };
  const msgWa = `Hola, vi el demo "${P.nombre}" (${P.giro}) y quiero algo así para mi negocio.`;
  const btnWa = `<a class="btn btn-wa" href="${wa(msgWa)}" target="_blank" rel="noopener">${ico('wa')} Quiero esto para mi negocio</a>`;
  const opts = (a, sel) => a.map((o) => `<option${o === sel ? ' selected' : ''}>${esc(o)}</option>`).join('');

  $('#app').innerHTML = `<a class="skip" href="#ficha">Saltar al contenido</a>
<header class="nav">
  <a class="volver" href="../../index.html">${ico('back')}<span>Volver al catálogo</span></a>
  <div class="brand"><span class="logo" aria-hidden="true">${cfg.logo || P.nombre[0]}</span><span class="brand-t"><b>${P.nombre}</b><small>${P.giro}</small></span></div>
  <nav class="tabs" aria-label="Secciones">${li([['ficha', 'Ficha'], ['demo', 'Demo'], ['panel', 'Panel']], ([v, t]) => `<a href="#${v}" data-v="${v}">${t}</a>`)}</nav>
  <div class="tools"><button class="ib bell" aria-label="Notificaciones" aria-expanded="false">${ico('bell')}<i></i></button>${cfg.oscuro ? `<button class="ib tema" aria-label="Cambiar entre modo claro y oscuro">${ico('tema')}</button>` : ''}</div>
</header>
<main>
<section id="ficha" class="view" aria-label="Ficha del proyecto">
  <div class="hero"><div class="hero-t rv"><p class="kicker">${P.giro}</p><h1>${cfg.titular}</h1><p class="lead">${cfg.bajada}</p><div class="hero-cta">${btnWa}<a class="btn btn-2" href="#demo" data-v="demo">Probar la demo ${ico('next')}</a></div></div><div class="art rv" aria-hidden="true">${cfg.art || ''}</div></div>
  <section class="blk problema rv"><h2>El problema</h2><p>${cfg.problema}</p><ul>${li(cfg.antes, (x) => `<li>${x}</li>`)}</ul></section>
  <section class="blk feats"><h2 class="rv">Qué hace el sistema</h2><ul>${cfg.feats.map(([a, b], i) => `<li class="rv" style="--i:${i % 4}"><b>${a}</b><span>${b}</span></li>`).join('')}</ul></section>
  <section class="blk errores"><h2 class="rv">Errores que resuelve</h2><ol>${cfg.errores.map(([a, b], i) => `<li class="rv" style="--i:${i % 4}"><b>${a}</b><span>${b}</span></li>`).join('')}</ol></section>
  <section class="blk vs rv"><h2>Antes vs. después</h2><div class="vs-grid"><div class="antes"><h3>Antes</h3><ul>${li(cfg.vs, (x) => `<li>${x[0]}</li>`)}</ul></div><div class="despues"><h3>Con ${P.nombre}</h3><ul>${li(cfg.vs, (x) => `<li>${x[1]}</li>`)}</ul></div></div></section>
  <section class="blk impacto"><h2 class="rv">Impacto esperado</h2><ul>${cfg.impacto.map(([a, b], i) => `<li class="rv" style="--i:${i}"><b>${a}</b><span>${b}</span></li>`).join('')}</ul></section>
  <section class="blk modulos rv"><h2>Módulos incluidos</h2><ul class="chips">${li(cfg.modulos, (x) => `<li>${x}</li>`)}</ul><p class="tiempo"><b>Tiempo estimado de implementación:</b> ${cfg.tiempo}</p></section>
  <section class="blk cta rv"><h2>¿Lo quieres en tu negocio?</h2><p>En ${CONFIG.marca} digitalizamos tu negocio a tu manera: con tus servicios, tus precios y tu logotipo.</p>${btnWa}</section>
</section>
<section id="demo" class="view" aria-label="Demo interactiva">
  <div class="sec-head"><div><h2>Demo interactiva</h2><p>Pruébala con confianza: lo que hagas se guarda en este dispositivo y actualiza el panel.</p></div></div>
  ${cfg.demo.map((w, i) => `<article class="w w-${w.t} rv" data-w="${i}"></article>`).join('')}
</section>
<section id="panel" class="view cargando" aria-label="Panel de control">
  <div class="sec-head"><div><h2>Panel de control</h2><p class="rango-txt"></p></div><div class="acciones"><button class="btn btn-2" data-a="csv">${ico('down')} Exportar CSV</button><button class="btn btn-2" data-a="print">${ico('print')} Imprimir reporte</button></div></div>
  <form class="filtros" aria-label="Filtros globales">
    <div class="seg" role="group" aria-label="Periodo">${li([['hoy', 'Hoy'], ['7d', '7 días'], ['30d', '30 días'], ['año', 'Año'], ['custom', 'Personalizado']], ([k, t]) => `<button type="button" data-r="${k}" aria-pressed="${k === '30d'}">${t}</button>`)}</div>
    <label class="f fx" hidden>Desde<input type="date" name="desde" value="${addDias(hoy(), -29)}" max="${addDias(hoy(), 7)}"></label><label class="f fx" hidden>Hasta<input type="date" name="hasta" value="${hoy()}" max="${addDias(hoy(), 7)}"></label>
    ${li([['suc', d.sucs], ['staff', d.staff], ['cat', d.cats.map((c) => c[0])]], ([k, a]) => `<label class="f">${L[k]}<select name="${k}"><option value="">Todos</option>${opts(a)}</select></label>`)}
  </form>
  <ul class="alertas" aria-label="Alertas"></ul>
  <div class="kpis"></div>
  <div class="charts">${cfg.charts.map((c, i) => `<figure class="chart chart-${c.t} rv" style="--i:${i % 3}"><figcaption><b>${c.titulo}</b>${c.sub ? `<small>${c.sub}</small>` : ''}</figcaption><div class="cv" role="img" aria-label="Gráfica: ${c.titulo}"></div></figure>`).join('')}</div>
  <div class="tabla">
    <div class="tb-bar"><h3>${cap(L.regs)}</h3><label class="f buscar"><span class="sr">Buscar</span>${ico('search')}<input type="search" name="q" placeholder="Buscar folio, ${L.cli.toLowerCase()}…"></label><label class="f"><span class="sr">Filtrar por estado</span><select name="est"><option value="">Todos los estados</option>${opts(d.estados.map((e) => e[0]))}</select></label><button class="btn" data-a="nuevo">${ico('plus')} ${L.nuevo}</button></div>
    <div class="tb-wrap"><table><caption class="sr">${cap(L.regs)} del periodo seleccionado</caption><thead><tr>${li([['folio', 'Folio'], ['dn', 'Fecha'], ['cliente', L.cli], ['cat', L.cat], ['staff', L.staff], ['monto', 'Monto'], ['estado', 'Estado']], ([k, t]) => `<th scope="col"><button type="button" data-s="${k}">${t}<span aria-hidden="true"></span></button></th>`)}<th scope="col">Acciones</th></tr></thead><tbody></tbody></table></div>
    <div class="pager"></div>
  </div>
</section>
</main>
<aside class="notifs" hidden aria-label="Centro de notificaciones"><h2>Notificaciones</h2><ul></ul></aside>
<dialog class="modal" aria-labelledby="mt"></dialog>
<footer class="pie"><p>Datos y marcas ficticios con fines demostrativos.</p><p><kbd>←</kbd> <kbd>→</kbd> cambiar de proyecto · <kbd>H</kbd> catálogo · <kbd>P</kbd> presentación · <button class="lnk" data-a="reset">Restablecer demo</button></p></footer>`;

  /* ---------- Vistas ---------- */
  const ir = (v, mover = true) => {
    if (tabs) { $$('.view').forEach((s) => (s.hidden = s.id !== v)); if (mover) scrollTo(0, 0); history.replaceState(null, '', '#' + v); }
    else if (mover) $('#' + v).scrollIntoView({ behavior: 'smooth' });
    $$('.tabs a').forEach((a) => (a.dataset.v === v ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  };
  const v0 = ['ficha', 'demo', 'panel'].includes(location.hash.slice(1)) ? location.hash.slice(1) : cfg.inicio || 'ficha';
  ir(v0, false);
  if (!tabs) { const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && ir(e.target.id, false)), { rootMargin: '-45% 0px -50% 0px' }); $$('.view').forEach((s) => io.observe(s)); }

  /* ---------- Formulario (alta / edición) ---------- */
  const dlg = $('.modal');
  function form(rec, pre = {}) {
    const h1 = Math.min(d.horas[1] - 1, Math.max(d.horas[0], new Date().getHours() + 1));
    const r = rec || { cliente: '', tel: '', fecha: hoy(), hora: String(h1).padStart(2, '0') + ':00', cat: d.cats[0][0], staff: d.staff[0], suc: d.sucs[0], estado: (d.estados.find((e) => e[1] === 'pend') || d.estados[0])[0], pago: pagos[0], ...pre };
    r.monto ??= precio(r.cat);
    dlg.innerHTML = `<form novalidate><h2 id="mt">${rec ? `Editar ${L.reg} ${rec.folio}` : L.nuevo}</h2><p class="err-sum" role="alert" hidden></p><div class="modal-g">
      <label class="f f2">${L.cli}<input name="cliente" value="${esc(r.cliente)}" autocomplete="off"></label>
      <label class="f">WhatsApp (opcional)<input name="tel" value="${esc(r.tel || '')}" inputmode="numeric" placeholder="10 dígitos"></label>
      <label class="f">${L.cat}<select name="cat">${opts(d.cats.map((c) => c[0]), r.cat)}</select></label>
      <label class="f">${L.staff}<select name="staff">${opts(d.staff, r.staff)}</select></label>
      <label class="f">${L.suc}<select name="suc">${opts(d.sucs, r.suc)}</select></label>
      <label class="f">Fecha<input type="date" name="fecha" value="${r.fecha}"></label>
      <label class="f">Hora<input type="time" name="hora" value="${r.hora}"></label>
      <label class="f">Monto (MXN, IVA incluido)<input type="number" name="monto" value="${r.monto}" min="1" step="1" inputmode="numeric"></label>
      <label class="f">Estado<select name="estado">${opts(d.estados.map((e) => e[0]), r.estado)}</select></label>
      <label class="f">${L.pago}<select name="pago">${opts(pagos, r.pago)}</select></label>
    </div><div class="modal-b"><button type="button" class="btn btn-2" data-x>Cancelar</button><button class="btn">${ico('check')} Guardar</button></div></form>`;
    const f = $('form', dlg), E = f.elements;
    E.cat.onchange = () => { E.monto.value = precio(E.cat.value); };
    $('[data-x]', dlg).onclick = () => dlg.close();
    f.onsubmit = (e) => {
      e.preventDefault();
      const v = { cliente: E.cliente.value.trim(), tel: E.tel.value.replace(/\D/g, ''), cat: E.cat.value, staff: E.staff.value, suc: E.suc.value, fecha: E.fecha.value, hora: E.hora.value, monto: +E.monto.value, estado: E.estado.value, pago: E.pago.value };
      const h = +v.hora.slice(0, 2), err = {};
      if (v.cliente.length < 3) err.cliente = 'Escribe el nombre completo (mínimo 3 letras).';
      if (v.tel && v.tel.length !== 10) err.tel = 'El WhatsApp debe tener 10 dígitos.';
      if (!v.fecha) err.fecha = 'Elige una fecha.';
      if (!v.hora) err.hora = 'Elige una hora.'; else if (h < d.horas[0] || h >= d.horas[1]) err.hora = `El horario de atención es de ${d.horas[0]}:00 a ${d.horas[1]}:00.`;
      if (!(v.monto > 0)) err.monto = 'El monto debe ser mayor a $0.';
      if (d.unico && !err.hora && !err.fecha && kind(v.estado) !== 'bad' && all.some((q) => q.id !== rec?.id && q.fecha === v.fecha && +q.hora.slice(0, 2) === h && q[d.unico] === v[d.unico] && kind(q.estado) !== 'bad')) err.hora = `Ese horario ya está ocupado con ${v[d.unico]}. Elige otro para evitar una doble reserva.`;
      $$('.err', f).forEach((x) => x.remove()); $$('[aria-invalid]', f).forEach((x) => x.removeAttribute('aria-invalid'));
      const ks = Object.keys(err), sum = $('.err-sum', f);
      ks.forEach((k) => { E[k].setAttribute('aria-invalid', 'true'); E[k].insertAdjacentHTML('afterend', `<small class="err">${err[k]}</small>`); });
      sum.hidden = !ks.length;
      if (ks.length) { sum.textContent = ks.length === 1 ? 'Hay 1 dato por corregir.' : `Hay ${ks.length} datos por corregir.`; E[ks[0]].focus(); f.classList.remove('tiembla'); void f.offsetWidth; f.classList.add('tiembla'); return; }
      dlg.close();
      if (rec) { upd(rec.id, v); toast(`Se actualizó: ${L.reg} ${rec.folio}`); } else { const n = add(v); toast(`Se guardó: ${L.reg} ${n.folio}`); confeti(); }
    };
    dlg.showModal(); E.cliente.focus();
  }

  /* ---------- Demo ---------- */
  const X = { cfg, d, L, st, P, kind, rows: () => all, add, upd, del: (id) => { db.del(id); cambio(); }, form };
  cfg.demo.forEach((w, i) => { const f = WIDGETS[w.t]($(`[data-w="${i}"]`), w, X); if (f) oyentes.push(f); });

  /* ---------- Panel ---------- */
  const F = { r: '30d', suc: '', staff: '', cat: '' }, TS = { q: '', est: '', sort: 'dn', dir: -1, pag: 0 }, PP = 8;
  const kdefs = cfg.kpis.map((k) => (typeof k === 'string' ? KB[k] : Array.isArray(k) ? { ...KB[k[0]], ...k[1] } : k));
  let C, T = leerTema(), primera = true, vistos = st.get('vistos', []), avisos = [];
  const periodo = () => { const h = hoy(), ff = $('.filtros').elements; let a, b = h; if (F.r === 'hoy') a = h; else if (F.r === '7d') a = addDias(h, -6); else if (F.r === '30d') a = addDias(h, -29); else if (F.r === 'año') a = addDias(h, -364); else { a = ff.desde.value || addDias(h, -29); b = ff.hasta.value || h; if (a > b) [a, b] = [b, a]; } return [diaNum(a), diaNum(b)]; };
  const calcula = () => {
    const [a, b] = periodo(), len = b - a + 1, base = all.filter((r) => (!F.suc || r.suc === F.suc) && (!F.staff || r.staff === F.staff) && (!F.cat || r.cat === F.cat));
    const cur = [], prev = [], paso = Math.max(1, Math.ceil(len / 12)), bk = Array.from({ length: 12 }, () => []);
    for (const r of base) { if (r.dn >= a && r.dn <= b) cur.push(r); else if (r.dn >= a - len && r.dn < a) prev.push(r); const j = 11 - Math.floor((b - r.dn) / paso); if (j >= 0 && j < 12 && r.dn <= b) bk[j].push(r); }
    C = { a, b, len, base, cur, prev, S: stats(cur, len, kind), Sp: stats(prev, len, kind), bk: bk.map((x) => stats(x, paso, kind)) };
  };

  const datos = (c) => {
    const { cur, S } = C, val = c.m === 'n' ? () => 1 : (r) => (kind(r.estado) === 'ok' ? r.monto : 0), [h0, h1] = d.horas;
    if (!cur.length) return null;
    const top = (k, n) => agrupa(cur, k, val).slice(0, n);
    switch (c.t) {
      case 'line': { const porHora = C.len <= 1, paso = C.len <= 62 ? 1 : Math.ceil(C.len / 12), nb = porHora ? h1 - h0 : Math.ceil(C.len / paso), A = Array(nb).fill(0), B = Array(nb).fill(0); const pon = (rows, arr, ini) => rows.forEach((r) => { const j = porHora ? +r.hora.slice(0, 2) - h0 : Math.floor((r.dn - ini) / paso); if (j >= 0 && j < nb) arr[j] += val(r); }); pon(cur, A, C.a); pon(C.prev, B, C.a - C.len); return { labels: A.map((_, j) => (porHora ? h0 + j + ' h' : fmt.fecha(isoDN(C.a + j * paso)))), series: [{ name: 'Periodo actual', data: A }, { name: 'Periodo anterior', data: B }] }; }
      case 'bars': { const ls = top(c.by || 'cat', 7).map((x) => x[0]), ix = new Map(ls.map((l, i) => [l, i])); if (!c.stack) { const a = Array(ls.length).fill(0); cur.forEach((r) => { const i = ix.get(clave(r, c.by || 'cat')); if (i != null) a[i] += val(r); }); return { labels: ls, series: [{ name: c.m === 'n' ? cap(L.regs) : 'Ingresos', data: a }] }; } const ss = top(c.stack, 4).map((x) => x[0]), se = ss.map((s) => ({ name: s, data: Array(ls.length).fill(0) })); cur.forEach((r) => { const i = ix.get(clave(r, c.by || 'cat')), j = ss.indexOf(clave(r, c.stack)); if (i != null && j >= 0) se[j].data[i] += val(r); }); return { labels: ls, series: se, stack: !c.agrupado }; }
      case 'donut': case 'polar': case 'tree': { const t = top(c.by || 'cat', c.t === 'polar' ? 7 : 6).filter((x) => x[1] > 0); return t.length ? { labels: t.map((x) => x[0]), data: t.map((x) => Math.round(x[1])) } : null; }
      case 'gauge': { const k = kdefs[c.k]; return { value: Math.min(100, Math.max(0, +(c.meta ? k.f(S) / (c.meta * S.dias) * 100 : k.f(S)).toFixed(1))), label: c.label || k.l }; }
      case 'heat': { const xs = Array.from({ length: h1 - h0 }, (_, i) => h0 + i), m = DIAS.map(() => xs.map(() => 0)); let max = 1; cur.forEach((r) => { const i = +r.hora.slice(0, 2) - h0, j = (r.dn + 4) % 7; if (i >= 0 && i < xs.length) max = Math.max(max, ++m[j][i]); }); return { xs, ys: DIAS, m, max }; }
      case 'funnel': { const n = S.n, a = n - S.bad.length, b = S.ok.length; return { labels: cfg.embudo, data: [Math.round(n * (cfg.embudoIni || 1.35)), n, a, b].slice(4 - cfg.embudo.length) }; }
      case 'scatter': { if (c.por === 'dia') { const m = new Map(); cur.forEach((r) => { const o = m.get(r.dn) || [0, 0]; o[0]++; o[1] += val(r); m.set(r.dn, o); }); return { pts: [...m.values()].slice(-90), xl: `${cap(L.regs)} por día`, name: 'Día' }; } const ok = S.ok, p = Math.max(1, Math.floor(ok.length / 180)); return { pts: ok.filter((_, i) => i % p === 0).map((r) => [+r.hora.slice(0, 2) + +r.hora.slice(3) / 60, r.monto]), xl: 'Hora del día', name: cap(L.reg) }; }
      case 'radar': { const k = c.by || 'staff', ks = top(k, 3).map((x) => x[0]), raw = ks.map((s) => { const q = stats(cur.filter((r) => clave(r, k) === s), C.len, kind); return [q.ing, q.n, q.ok.length ? q.ing / q.ok.length : 0, q.n ? q.ok.length / q.n * 100 : 0, q.cli]; }), mx = [0, 1, 2, 3, 4].map((i) => Math.max(...raw.map((x) => x[i]), 1)); return { labels: ['Ingresos', 'Volumen', 'Ticket', 'Cumplimiento', 'Clientes'], series: ks.map((s, j) => ({ name: s, data: raw[j].map((v, i) => Math.round(v / mx[i] * 100)) })) }; }
      case 'water': { if (!S.ing) return null; const cs = cfg.costos.map((x) => -Math.round(S.ing * x[1])); return { labels: ['Ingresos', ...cfg.costos.map((x) => x[0]), 'Utilidad'], vals: [Math.round(S.ing), ...cs, Math.round(S.ing) + cs.reduce((p, q) => p + q, 0)] }; }
      case 'cal': { const fin = C.b + (6 - (C.b + 4) % 7), ini = fin - 7 * 18 + 1, m = new Map(); let max = 1; C.base.forEach((r) => { if (r.dn >= ini && r.dn <= C.b) { const v = (m.get(r.dn) || 0) + 1; m.set(r.dn, v); max = Math.max(max, v); } }); return { dias: Array.from({ length: fin - ini + 1 }, (_, i) => [isoDN(ini + i), m.get(ini + i) || 0]), max }; }
      case 'map': { const m = new Map(agrupa(cur, 'suc', val)); return { pts: d.sucs.map((n, i) => { const h = hash(n); return { n, v: m.get(n) || 0, x: (cfg.mapa?.[i] || [14 + h % 70])[0], y: (cfg.mapa?.[i] || [0, 18 + (h >> 8) % 58])[1] }; }) }; }
    }
  };

  const figs = $$('.cv').map((el, i) => ({ el, c: cfg.charts[i], kill: null, sucio: true, vis: false }));
  const dibuja = (g) => { if (!C) return; g.kill?.(); g.kill = null; g.el.innerHTML = ''; const D = datos(g.c); if (!D) g.el.innerHTML = '<p class="vacio"><b>Sin datos en este periodo</b><span>Prueba con otro rango o quita filtros.</span></p>'; else g.kill = pintar(g.el, g.c.t, D, T, cfg.chart || {}, cfg.lib); g.sucio = false; };
  const ioC = new IntersectionObserver((es) => es.forEach((e) => { const g = figs.find((x) => x.el === e.target); g.vis = e.isIntersecting; if (g.vis && g.sucio) dibuja(g); }), { threshold: 0.12 });
  figs.forEach((g) => ioC.observe(g.el));

  const pintaKpis = () => {
    $('.kpis').innerHTML = kdefs.map((k, i) => { const v = k.f(C.S), p = k.f(C.Sp), dl = p ? (v - p) / Math.abs(p) * 100 : 0, up = dl >= 0, bien = k.inv ? !up : up; return `<article class="kpi rv${primera ? '' : ' in'}" style="--i:${i}" tabindex="0"><p class="kpi-l">${k.l}</p><p class="kpi-v" data-i="${i}">${fmt[k.fmt](v)}</p><p class="kpi-d ${bien ? 'bien' : 'mal'}"><span aria-hidden="true">${up ? '▲' : '▼'}</span><span class="sr">${up ? 'Subió' : 'Bajó'}</span> ${Math.abs(dl).toFixed(1)}% <small>vs. periodo anterior</small></p>${spark(C.bk.map((s) => k.f(s)))}<span class="tip" role="tooltip">${k.tip || k.l}. Ahora: ${fmt[k.fmt](v)} · Antes: ${fmt[k.fmt](p)}</span></article>`; }).join('');
    $$('.kpi-v').forEach((el) => { const k = kdefs[+el.dataset.i]; countUp(el, k.f(C.S), fmt[k.fmt]); });
  };

  const filasTabla = () => { const q = TS.q.toLowerCase(), s = TS.sort; return C.cur.filter((r) => (!TS.est || r.estado === TS.est) && (!q || `${r.folio} ${r.cliente} ${r.cat} ${r.staff}`.toLowerCase().includes(q))).sort((x, y) => (s === 'dn' ? x.dn - y.dn || x.hora.localeCompare(y.hora) : typeof x[s] === 'number' ? x[s] - y[s] : String(x[s]).localeCompare(String(y[s]), 'es')) * TS.dir); };
  const pintaTabla = () => {
    const rows = filasTabla(), np = Math.max(1, Math.ceil(rows.length / PP)); TS.pag = Math.min(TS.pag, np - 1);
    const pg = rows.slice(TS.pag * PP, TS.pag * PP + PP), td = (l, v, c = '') => `<td data-l="${l}"${c}>${v}</td>`;
    $('.tabla tbody').innerHTML = pg.map((r) => `<tr data-id="${r.id}">${td('Folio', `<b>${r.folio}</b>`)}${td('Fecha', `${fmt.fecha(r.fecha)} · ${r.hora}`)}${td(L.cli, esc(r.cliente))}${td(L.cat, esc(r.cat))}${td(L.staff, esc(r.staff))}${td('Monto', fmt.mxn(r.monto), ' class="num"')}${td('Estado', `<span class="badge" data-k="${kind(r.estado)}">${esc(r.estado)}</span>`)}<td class="acc"><button class="ib" data-a="edit" aria-label="Editar ${r.folio}">${ico('edit')}</button><button class="ib" data-a="est" aria-label="Cambiar estado de ${r.folio}">${ico('state')}</button><button class="ib" data-a="del" aria-label="Eliminar ${r.folio}">${ico('trash')}</button></td></tr>`).join('') || `<tr><td colspan="8"><div class="vacio"><b>Sin resultados</b><span>Ajusta la búsqueda o los filtros, o crea uno nuevo.</span></div></td></tr>`;
    $('.pager').innerHTML = `<span>${rows.length ? `Mostrando ${TS.pag * PP + 1}–${TS.pag * PP + pg.length} de ${fmt.num(rows.length)}` : '0 resultados'}</span><div><button class="ib" data-a="pag" data-n="-1" aria-label="Página anterior"${TS.pag ? '' : ' disabled'}>${ico('back')}</button><b>${TS.pag + 1} / ${np}</b><button class="ib" data-a="pag" data-n="1" aria-label="Página siguiente"${TS.pag < np - 1 ? '' : ' disabled'}>${ico('next')}</button></div>`;
    $$('.tabla th button').forEach((b) => { const on = b.dataset.s === TS.sort; b.parentElement.setAttribute('aria-sort', on ? (TS.dir > 0 ? 'ascending' : 'descending') : 'none'); b.lastChild.textContent = on ? (TS.dir > 0 ? ' ↑' : ' ↓') : ''; });
  };

  const pintaAlertas = () => {
    const h = hoy(), ph = all.filter((r) => r.fecha === h && kind(r.estado) === 'pend').length;
    avisos = [...(ph ? [['info', `${ph} ${L.regs} pendientes para hoy`]] : []), ...cfg.alertas].filter((a) => !vistos.includes(a[1]));
    const html = avisos.map((a, i) => `<li data-k="${a[0]}"><span>${a[1]}</span><button class="ib" data-a="visto" data-i="${i}" aria-label="Descartar alerta">${ico('x')}</button></li>`).join('') || '<li class="vacio">Todo en orden. Sin alertas pendientes.</li>';
    $('.notifs ul').innerHTML = html; $('.alertas').innerHTML = avisos.length ? avisos.slice(0, 3).map((a, i) => `<li data-k="${a[0]}"><span>${a[1]}</span><button class="ib" data-a="visto" data-i="${i}" aria-label="Descartar alerta">${ico('x')}</button></li>`).join('') : '';
    const b = $('.bell i'); b.textContent = avisos.length || ''; b.hidden = !avisos.length;
  };

  const refresca = () => {
    calcula();
    $('.rango-txt').textContent = `${fmt.fecha(isoDN(C.a))} – ${fmt.fecha(isoDN(C.b))} · ${fmt.num(C.cur.length)} ${L.regs}`;
    pintaKpis(); pintaTabla(); pintaAlertas();
    figs.forEach((g) => { g.sucio = true; if (g.vis) dibuja(g); });
    primera = false;
  };
  let raf = 0; oyentes.push(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(refresca); });
  setTimeout(() => { refresca(); $('#panel').classList.remove('cargando'); reveal($('#panel')); }, 500);

  /* ---------- Eventos ---------- */
  const fil = $('.filtros');
  fil.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (!b) return; F.r = b.dataset.r; $$('[data-r]', fil).forEach((x) => x.setAttribute('aria-pressed', x === b)); $$('.fx', fil).forEach((x) => (x.hidden = F.r !== 'custom')); TS.pag = 0; refresca(); });
  fil.addEventListener('change', (e) => { const t = e.target; if (t.name in F) F[t.name] = t.value; TS.pag = 0; refresca(); });
  fil.addEventListener('submit', (e) => e.preventDefault());
  $('.tb-bar').addEventListener('input', (e) => { const t = e.target; if (t.name === 'q') TS.q = t.value; else if (t.name === 'est') TS.est = t.value; else return; TS.pag = 0; pintaTabla(); });

  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-v]'); if (v) { e.preventDefault(); return ir(v.dataset.v); }
    const s = e.target.closest('th [data-s]'); if (s) { TS.dir = TS.sort === s.dataset.s ? -TS.dir : 1; TS.sort = s.dataset.s; return pintaTabla(); }
    const bell = e.target.closest('.bell'), nt = $('.notifs');
    if (bell) { nt.hidden = !nt.hidden; return bell.setAttribute('aria-expanded', !nt.hidden); }
    if (!nt.hidden && !e.target.closest('.notifs')) { nt.hidden = true; $('.bell').setAttribute('aria-expanded', 'false'); }
    if (e.target.closest('.tema')) { const base = cfg.oscuro === 'osc' ? 'osc' : 'claro', act = root.dataset.tema || base; root.dataset.tema = act === 'osc' ? 'claro' : 'osc'; st.set('tema', root.dataset.tema); T = leerTema(); return figs.forEach((g) => { g.sucio = true; if (g.vis) dibuja(g); }); }
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, id = b.closest('tr')?.dataset.id, r = id && all.find((q) => q.id === id);
    if (a === 'nuevo') form();
    else if (a === 'edit') form(r);
    else if (a === 'est') { const es = d.estados.map((x) => x[0]), n = es[(es.indexOf(r.estado) + 1) % es.length]; upd(id, { estado: n }); toast(`${r.folio} ahora está en "${n}"`); }
    else if (a === 'del') { if (b.dataset.ok) { X.del(id); toast(`Se eliminó: ${L.reg} ${r.folio}`, "bad"); } else { b.dataset.ok = 1; b.classList.add('confirma'); b.innerHTML = '¿Eliminar?'; setTimeout(() => { if (b.isConnected) { delete b.dataset.ok; b.classList.remove('confirma'); b.innerHTML = ico('trash'); } }, 3000); } }
    else if (a === 'pag') { TS.pag += +b.dataset.n; pintaTabla(); }
    else if (a === 'visto') { vistos.push(avisos[+b.dataset.i][1]); st.set('vistos', vistos); pintaAlertas(); }
    else if (a === 'csv') { const rows = filasTabla(); if (!rows.length) return toast('No hay datos para exportar con estos filtros.', 'bad'); csv(`${cfg.slug}-${hoy()}.csv`, ['Folio', 'Fecha', 'Hora', L.cli, L.cat, L.staff, L.suc, 'Monto MXN', 'Estado', L.pago], rows.map((x) => [x.folio, x.fecha, x.hora, x.cliente, x.cat, x.staff, x.suc, x.monto, x.estado, x.pago])); toast(`CSV exportado: ${fmt.num(rows.length)} ${L.regs}`); }
    else if (a === 'print') { ir('panel'); setTimeout(() => print(), 500); }
    else if (a === 'reset') { st.clear(); location.reload(); }
  });

  reveal($('#ficha')); reveal($('#demo'));
  navGlobal(cfg.slug, ir);
}
