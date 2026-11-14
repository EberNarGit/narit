// Widgets de demo neutros (sin estilo propio). Cada proyecto elige cuáles usa y los viste con su CSS.
// Firma: widget(el, w, x) -> función de refresco. x = contexto del motor (rows, add, upd, form, kind, d, L, st).
import { fmt, hoy, addDias, esc, toast, confeti, ico } from './core.js';

const rango = (a, b) => Array.from({ length: b - a }, (_, i) => a + i);
const head = (w, extra = '') => `<div class="w-head"><div><h3>${w.titulo}</h3>${w.ayuda ? `<p>${w.ayuda}</p>` : ''}</div>${extra}</div>`;

function agenda(el, w, x) {
  let dia = hoy();
  const por = w.por || 'staff', cols = por === 'suc' ? x.d.sucs : x.d.staff, [h0, h1] = x.d.horas;
  const pinta = () => {
    const rs = x.rows().filter((r) => r.fecha === dia && x.kind(r.estado) !== 'bad');
    el.innerHTML = head(w, `<div class="ag-nav"><button class="ib" data-d="-1" aria-label="Día anterior">${ico('back')}</button><strong>${fmt.fechaL(dia)}</strong><button class="ib" data-d="1" aria-label="Día siguiente">${ico('next')}</button></div>`) +
      `<div class="ag-wrap" tabindex="0" role="region" aria-label="${w.titulo}"><div class="ag-grid" style="--cols:${cols.length}"><div class="ag-h"></div>${cols.map((c) => `<div class="ag-h">${c}</div>`).join('')}${rango(h0, h1).map((h) => `<div class="ag-t">${h}:00</div>` + cols.map((c) => { const e = rs.filter((r) => r[por] === c && +r.hora.slice(0, 2) === h); return `<div class="ag-c">${e.length ? e.map((r) => `<button class="ag-ev" data-id="${r.id}" data-k="${x.kind(r.estado)}"><b>${esc(r.cliente)}</b><span>${r.hora} · ${esc(r.cat)}</span></button>`).join('') : `<button class="ag-slot" data-h="${h}" data-c="${esc(c)}" aria-label="Agendar a las ${h}:00 con ${esc(c)}">+</button>`}</div>`; }).join('')).join('')}</div></div>`;
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.d) { dia = addDias(dia, +b.dataset.d); pinta(); }
    else if (b.dataset.id) x.form(x.rows().find((r) => r.id === b.dataset.id));
    else if (b.dataset.h) x.form(null, { fecha: dia, hora: String(b.dataset.h).padStart(2, '0') + ':00', [por]: b.dataset.c });
  });
  pinta(); return pinta;
}

function kanban(el, w, x) {
  const cols = w.estados || x.d.estados.map((e) => e[0]);
  const pinta = () => {
    const rs = x.rows().filter((r) => r.fecha === hoy());
    el.innerHTML = head(w, `<button class="btn btn-2" data-new>${ico('plus')} ${w.nuevo || 'Nuevo'}</button>`) + `<div class="kb">${cols.map((c, i) => { const l = rs.filter((r) => r.estado === c); return `<section class="kb-col" data-e="${esc(c)}" data-k="${x.kind(c)}"><h4>${c} <i>${l.length}</i></h4><div class="kb-list">${l.slice(0, 6).map((r) => `<article class="kb-card" draggable="true" data-id="${r.id}"><b>${r.folio}</b><span>${esc(r.cliente)}</span><small>${esc(r.cat)} · ${fmt.mxn(r.monto)}</small><div class="kb-mv">${i > 0 ? `<button data-mv="${i - 1}" aria-label="Regresar ${r.folio} a ${cols[i - 1]}">${ico('back')}</button>` : ''}${w.link ? `<button data-link aria-label="Copiar enlace de seguimiento de ${r.folio}">${ico('wa')}</button>` : ''}${i < cols.length - 1 ? `<button data-mv="${i + 1}" aria-label="Mover ${r.folio} a ${cols[i + 1]}">${ico('next')}</button>` : ''}</div></article>`).join('') || `<p class="vacio">Sin ${x.L.regs} aquí</p>`}${l.length > 6 ? `<p class="kb-mas">+${l.length - 6} más</p>` : ''}</div></section>`; }).join('')}</div>`;
  };
  const mover = (id, estado) => {
    const r = x.rows().find((q) => q.id === id); if (!r || r.estado === estado) return;
    x.upd(id, { estado }); toast(`${r.folio} pasó a "${estado}"`);
    if (w.msgEn ? estado === w.msgEn : x.kind(estado) === 'ok') { confeti(); if (w.msg) setTimeout(() => toast('WhatsApp enviado: ' + w.msg.replace('{c}', r.cliente.split(' ')[0]), 'wa'), 700); }
  };
  let arr = null;
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; const id = b.closest('.kb-card')?.dataset.id;
    if (b.dataset.new != null) x.form(null, { fecha: hoy() });
    else if (b.dataset.mv) mover(id, cols[+b.dataset.mv]);
    else if (b.dataset.link != null) { const r = x.rows().find((q) => q.id === id), u = `${location.origin}/seguimiento/${r.folio}`; navigator.clipboard?.writeText(u).catch(() => {}); toast(`Enlace de seguimiento copiado: ${u}`); }
  });
  el.addEventListener('dragstart', (e) => { arr = e.target.closest('.kb-card')?.dataset.id; e.dataTransfer?.setData('text/plain', arr || ''); });
  el.addEventListener('dragover', (e) => { const c = e.target.closest('.kb-col'); if (c) { e.preventDefault(); el.querySelectorAll('.kb-col.sobre').forEach((q) => q !== c && q.classList.remove('sobre')); c.classList.add('sobre'); } });
  el.addEventListener('dragleave', (e) => { if (!e.relatedTarget || !el.contains(e.relatedTarget)) el.querySelectorAll('.sobre').forEach((q) => q.classList.remove('sobre')); });
  el.addEventListener('drop', (e) => { const c = e.target.closest('.kb-col'); if (c && arr) { e.preventDefault(); mover(arr, c.dataset.e); } arr = null; });
  pinta(); return pinta;
}

function pos(el, w, x) {
  const prods = w.productos || x.d.cats, pagos = x.d.pagos.map((p) => (Array.isArray(p) ? p[0] : p)), cart = new Map();
  let prop = 0, pago = pagos[0], cli = '', err = '';
  el.innerHTML = head(w) + `<div class="pos"><div class="pos-grid">${prods.map((p, i) => `<button class="pos-p" data-p="${i}">${p[3] ? `<span class="pos-e" aria-hidden="true">${p[3]}</span>` : ''}<b>${p[0]}</b><em>${fmt.mxn(p[1])}</em></button>`).join('')}</div><div class="pos-cart"></div></div>`;
  const cartEl = el.querySelector('.pos-cart');
  const total = () => { let t = 0; cart.forEach((q, i) => t += prods[i][1] * q); return t; };
  const pinta = () => {
    const tot = total(), sub = tot / 1.16, pr = tot * prop / 100, corte = {};
    x.rows().forEach((r) => { if (r.fecha === hoy() && x.kind(r.estado) === 'ok') corte[r.pago] = (corte[r.pago] || 0) + r.monto; });
    const ls = [...cart].map(([i, q]) => `<li class="pos-li"><span>${prods[i][0]}</span><span class="qty"><button data-q="-1" data-i="${i}" aria-label="Quitar uno de ${prods[i][0]}">−</button><b>${q}</b><button data-q="1" data-i="${i}" aria-label="Agregar uno de ${prods[i][0]}">+</button></span><em>${fmt.mxn(prods[i][1] * q)}</em></li>`).join('');
    cartEl.innerHTML = `<h4>Cuenta</h4>${ls ? `<ul>${ls}</ul>` : '<p class="vacio"><b>Cuenta vacía</b><span>Toca un producto para empezar.</span></p>'}
      <dl class="pos-tot"><div><dt>Subtotal</dt><dd>${fmt.mxn2(sub)}</dd></div><div><dt>IVA 16%</dt><dd>${fmt.mxn2(tot - sub)}</dd></div>${w.propina ? `<div><dt>Propina</dt><dd><select name="prop" aria-label="Propina">${[0, 10, 15, 20].map((p) => `<option value="${p}"${p === prop ? ' selected' : ''}>${p}%</option>`).join('')}</select></dd></div>` : ''}<div class="tot"><dt>Total</dt><dd>${fmt.mxn2(tot + pr)}</dd></div></dl>
      <label class="f">${x.L.pago}<select name="pago">${pagos.map((p) => `<option${p === pago ? ' selected' : ''}>${p}</option>`).join('')}</select></label>
      <label class="f">Cliente ${w.fiado ? '(obligatorio si es fiado)' : '(opcional)'}<input name="cli" value="${esc(cli)}" autocomplete="off" placeholder="Público en general"></label>
      <p class="err" role="alert"${err ? '' : ' hidden'}>${err}</p>
      <button class="btn cobrar">${ico('check')} Cobrar ${fmt.mxn(tot + pr)}</button>
      <details class="corte"><summary>Corte de caja de hoy · ${fmt.mxn(Object.values(corte).reduce((a, b) => a + b, 0))}</summary><ul>${Object.entries(corte).map(([k, v]) => `<li><span>${k}</span><b>${fmt.mxn(v)}</b></li>`).join('') || '<li>Sin ventas todavía</li>'}</ul></details>`;
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.p) { const i = +b.dataset.p; cart.set(i, (cart.get(i) || 0) + 1); err = ''; b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso'); pinta(); }
    else if (b.dataset.q) { const i = +b.dataset.i, q = (cart.get(i) || 0) + +b.dataset.q; q > 0 ? cart.set(i, q) : cart.delete(i); pinta(); }
    else if (b.classList.contains('cobrar')) {
      const tot = total();
      if (!tot) err = 'Agrega al menos un producto antes de cobrar.';
      else if (w.fiado && pago === w.fiado && cli.trim().length < 3) err = 'Para fiar necesitas escribir el nombre del cliente.';
      else {
        const top = [...cart].sort((a, c) => prods[c[0]][1] * c[1] - prods[a[0]][1] * a[1])[0][0], m = Math.round(tot * (1 + prop / 100));
        const nuevo = { cliente: cli.trim() || 'Público en general', cat: prods[top][0], monto: m, pago, estado: w.fiado && pago === w.fiado ? w.fiadoEstado : (x.d.estados.find((s) => s[1] === 'ok') || x.d.estados[0])[0] };
        cart.clear(); cli = ''; err = ''; // se limpia antes de x.add porque x.add repinta el widget
        const r = x.add(nuevo); toast(`Venta ${r.folio} registrada: ${fmt.mxn(m)} (${pago})`); confeti(); return;
      }
      pinta(); toast(err, 'bad');
    }
  });
  el.addEventListener('change', (e) => { const t = e.target; if (t.name === 'prop') { prop = +t.value; pinta(); } else if (t.name === 'pago') pago = t.value; });
  el.addEventListener('input', (e) => { if (e.target.name === 'cli') cli = e.target.value; });
  pinta(); return pinta;
}

// Tablero de elementos con estado (plano de mesas, odontograma, habitaciones, jaulas...). item = [etiqueta, estadoInicial, x, y, w, h]
function board(el, w, x) {
  const key = 'bd-' + w.id, s = x.st.get(key, {}), E = w.estados;
  const val = (it) => s[it[0]] ?? it[1] ?? 0;
  const pinta = () => {
    el.innerHTML = head(w) + `<div class="bd-map bd-${w.modo || 'grid'}">${w.items.map((it, i) => { const v = val(it); return `<button class="bd-i" data-i="${i}" data-s="${v}" style="--sc:var(--${E[v][1]});${it[2] != null ? `left:${it[2]}%;top:${it[3]}%;width:${it[4]}%;height:${it[5]}%` : ''}" aria-label="${it[0]}: ${E[v][0]}. Toca para cambiar."><b>${it[0]}</b><span>${E[v][0]}</span></button>`; }).join('')}</div>
      <ul class="bd-leg">${E.map((e, i) => `<li style="--sc:var(--${e[1]})"><i></i>${e[0]} <b>${w.items.filter((it) => val(it) === i).length}</b></li>`).join('')}</ul>`;
  };
  el.addEventListener('click', (e) => { const b = e.target.closest('.bd-i'); if (!b) return; const it = w.items[+b.dataset.i]; s[it[0]] = (val(it) + 1) % E.length; x.st.set(key, s); pinta(); el.querySelector(`[data-i="${b.dataset.i}"]`)?.focus(); });
  pinta(); return null;
}

// Cotizador / calculadora. campo = {id, l, t:'sel'|'num'|'chk', o:[[etiqueta,valor]], v, min, max}. formula(vals) -> [[concepto, monto]]
function calc(el, w, x) {
  const v = Object.fromEntries(w.campos.map((c) => [c.id, c.t === 'sel' ? c.o[c.v || 0][1] : c.v ?? (c.t === 'chk' ? false : 0)]));
  let cli = '';
  el.innerHTML = head(w) + `<div class="calc"><form class="calc-f" novalidate>${w.campos.map((c) => c.t === 'sel' ? `<label class="f">${c.l}<select name="${c.id}">${c.o.map((o, i) => `<option value="${i}"${i === (c.v || 0) ? ' selected' : ''}>${o[0]}</option>`).join('')}</select></label>` : c.t === 'chk' ? `<label class="f chk"><input type="checkbox" name="${c.id}"${c.v ? ' checked' : ''}> ${c.l}</label>` : `<label class="f">${c.l}<input type="number" name="${c.id}" value="${c.v}" min="${c.min}" max="${c.max}" inputmode="numeric"><small class="err" hidden></small></label>`).join('')}${w.guardar ? `<label class="f">${x.L.cli}<input name="_cli" autocomplete="off" placeholder="Nombre completo"><small class="err" hidden></small></label>` : ''}</form><div class="calc-out" aria-live="polite"></div></div>`;
  const out = el.querySelector('.calc-out'), f = el.querySelector('form');
  const total = () => { const ls = w.formula(v), sub = ls.reduce((a, l) => a + l[1], 0); return { ls, sub, tot: w.iva ? sub * 1.16 : sub }; };
  const valido = () => { let ok = true; w.campos.forEach((c) => { if (c.t !== 'num') return; const i = f.elements[c.id], e = i.nextElementSibling, mal = !(v[c.id] >= c.min && v[c.id] <= c.max); i.setAttribute('aria-invalid', mal); e.hidden = !mal; e.textContent = mal ? `Escribe un valor entre ${c.min} y ${fmt.num(c.max)}.` : ''; if (mal) ok = false; }); return ok; };
  const pinta = () => {
    const ok = valido(), { ls, sub, tot } = total();
    out.innerHTML = ok ? `<h4>${w.resultado || 'Cotización'}</h4><dl>${ls.map((l) => `<div${l[1] < 0 ? ' class="neg"' : ''}><dt>${l[0]}</dt><dd>${fmt.mxn2(l[1])}</dd></div>`).join('')}${w.iva ? `<div><dt>Subtotal</dt><dd>${fmt.mxn2(sub)}</dd></div><div><dt>IVA 16%</dt><dd>${fmt.mxn2(tot - sub)}</dd></div>` : ''}<div class="tot"><dt>${w.total || 'Total'}</dt><dd>${fmt.mxn2(tot)}</dd></div></dl>${w.nota ? `<p class="nota">${typeof w.nota === 'function' ? w.nota(v, tot) : w.nota}</p>` : ''}${w.guardar ? `<button type="button" class="btn" data-g>${ico('check')} ${w.guardar}</button>` : ''}` : '<p class="vacio"><b>Revisa los datos</b><span>Hay campos fuera de rango.</span></p>';
  };
  f.addEventListener('input', (e) => { const t = e.target, c = w.campos.find((q) => q.id === t.name); if (!c) { cli = t.value; return; } v[c.id] = c.t === 'sel' ? c.o[+t.value][1] : c.t === 'chk' ? t.checked : +t.value; pinta(); });
  f.addEventListener('submit', (e) => e.preventDefault());
  out.addEventListener('click', (e) => {
    if (!e.target.closest('[data-g]')) return;
    const i = f.elements._cli, er = i.nextElementSibling, mal = cli.trim().length < 3;
    i.setAttribute('aria-invalid', mal); er.hidden = !mal; er.textContent = mal ? 'Escribe el nombre del cliente para guardar.' : '';
    if (mal) { i.focus(); return toast('Falta el nombre del cliente.', 'bad'); }
    const r = x.add({ cliente: cli.trim(), monto: Math.round(total().tot), cat: w.cat ? w.cat(v) : x.d.cats[0][0], ...(w.estado ? { estado: w.estado } : {}) });
    toast(`Guardado con folio ${r.folio} por ${fmt.mxn(r.monto)}`); confeti(); i.value = ''; cli = '';
  });
  pinta(); return null;
}

// Escáner simulado (QR de acceso, código de barras, folio). item = {c, n, ok, m, q?}
function scan(el, w, x) {
  const key = 'sc-' + w.id, st = x.st.get(key, { q: {}, log: [] });
  let res = null, modo = w.modos ? w.modos[0] : null;
  const q = (it) => st.q[it.c] ?? it.q;
  const pinta = () => {
    el.innerHTML = head(w) + `<div class="scan"><form class="scan-in" novalidate>${w.modos ? `<div class="seg" role="group" aria-label="Tipo de movimiento">${w.modos.map((m) => `<button type="button" data-m="${m}" aria-pressed="${m === modo}">${m}</button>`).join('')}</div>` : ''}<label class="f">${w.campo || 'Código'}<input name="c" autocomplete="off" placeholder="${w.placeholder || 'Escribe o escanea el código'}" inputmode="${w.alfa ? 'text' : 'numeric'}"></label><div class="scan-b"><button class="btn">${ico('check')} Validar</button><button type="button" class="btn btn-2" data-sim>${ico('state')} Simular escaneo</button></div></form>
      <div class="scan-res${res ? ' ' + res.k : ''}" role="status">${res ? `<b>${res.t}</b><span>${res.m}</span>` : `<span class="scan-marco" aria-hidden="true"></span><span>${w.espera || 'Esperando lectura…'}</span>`}</div>
      <ol class="scan-log" aria-label="Últimas lecturas">${st.log.map((l) => `<li data-k="${l.k}"><b>${esc(l.t)}</b><span>${esc(l.m)}</span><small>${l.h}</small></li>`).join('') || '<li class="vacio">Aún no hay lecturas.</li>'}</ol></div>`;
  };
  const leer = (cod) => {
    const c = cod.trim().toUpperCase(), it = w.items.find((i) => i.c.toUpperCase() === c);
    if (!c) res = { k: 'err', t: 'Falta el código', m: 'Escribe o escanea un código para continuar.' };
    else if (!it) res = { k: 'err', t: 'Código no encontrado', m: `"${esc(cod.trim())}" no existe en el sistema. Verifica e intenta de nuevo.` };
    else if (it.q != null) {
      const sale = modo === w.modos[1], n = q(it) + (sale ? -1 : 1);
      if (n < 0) res = { k: 'err', t: it.n, m: 'Sin existencias: no se puede registrar la salida.' };
      else { st.q[it.c] = n; res = { k: 'ok', t: it.n, m: `${modo} registrada. Existencia actual: ${n} ${it.u || 'pzas'}${it.min && n <= it.min ? ' · ¡Stock bajo!' : ''}` }; }
    } else res = { k: it.ok ? 'ok' : 'err', t: it.n, m: it.m };
    if (c) { st.log.unshift({ k: res.k, t: res.t, m: res.m.replace(/<[^>]+>/g, ''), h: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }); st.log = st.log.slice(0, 5); x.st.set(key, st); }
    pinta(); if (res.k === 'ok') { toast(`${res.t}: ${res.m}`); if (!it.q) confeti(); } else toast(res.t + '. ' + res.m, 'bad');
  };
  el.addEventListener('submit', (e) => { e.preventDefault(); leer(e.target.elements.c.value); });
  el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.m) { modo = b.dataset.m; pinta(); } else if (b.dataset.sim != null) leer(w.items[Math.floor(Math.random() * w.items.length)].c); });
  pinta(); return null;
}

// Checklist con avance. items = ['texto', ...] o [['Grupo', ['texto', ...]], ...]
function checklist(el, w, x) {
  const key = 'ck-' + w.id, grupos = Array.isArray(w.items[0]) ? w.items : [['', w.items]], n = grupos.reduce((a, g) => a + g[1].length, 0);
  let done = new Set(x.st.get(key, w.hechos || []));
  const pinta = () => {
    const p = Math.round(done.size / n * 100);
    el.innerHTML = head(w) + `<div class="chk"><div class="chk-bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100" aria-label="Avance"><i style="width:${p}%"></i><b>${p}% · ${done.size} de ${n}</b></div>${grupos.map((g) => `${g[0] ? `<h4>${g[0]}</h4>` : ''}<ul>${g[1].map((t) => `<li><label class="chk-i"><input type="checkbox" value="${esc(t)}"${done.has(t) ? ' checked' : ''}><span>${t}</span></label></li>`).join('')}</ul>`).join('')}</div>`;
  };
  el.addEventListener('change', (e) => { const t = e.target; if (t.type !== 'checkbox') return; t.checked ? done.add(t.value) : done.delete(t.value); x.st.set(key, [...done]); const v = t.value; pinta(); el.querySelector(`input[value="${CSS.escape(v)}"]`)?.focus(); if (done.size === n) { confeti(); toast(w.listo || '¡Todo completado!'); } });
  pinta(); return null;
}

export const WIDGETS = { agenda, kanban, pos, board, calc, scan, checklist };
