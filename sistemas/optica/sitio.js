// Catálogo de la óptica + portal "Mis lentes" del cliente.
import { $, esc, pesos, fechaHora, foto, wa, toast, local, uid } from '../_base/sis.js';
import { abrir, dia, fDia, fAno, diasEntre, arm, nombreArm, precioOrden, saldo, atrasada, ultGrad, examenToca, lcToca, fmtG, horasLibres, ESTADOS, EST_TXT, EST_DESC, FORMAS, MATERIALES, CITA_TXT } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
let sesion = local.get('optica:sesion', null), tab = 'pedido', forma = '';
const yo = () => db().pacs.find((p) => p.id === sesion);
const ventana = (html, ancho) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = `<div class="dlg"><button class="x" data-cerrar aria-label="Cerrar">×</button>${html}</div>`; if (!dlg.open) dlg.showModal(); };
const i18nDia = (d) => (d === dia() ? 'Hoy, ' : d === dia(1) ? 'Mañana, ' : '') + fDia(d);
const apartados = (id) => db().apartados.filter((a) => a.arm === id && a.estado === 'activo' && a.vence >= dia()).length;
const disponibles = (a) => a.stock - apartados(a.id);

// ---------- Catálogo
function badge(a) {
  if (disponibles(a) <= 0) return '<span class="badge mal">Agotado</span>';
  if (diasEntre(a.alta, dia()) <= 60) return '<span class="badge ac">Nuevo</span>';
  if (diasEntre(a.ultVenta, dia()) <= 10) return '<span class="badge">Más vendido</span>';
  if (disponibles(a) <= 2) return `<span class="badge">Últimas ${disponibles(a)}</span>`;
  return '<span></span>';
}
function catalogo() {
  const mat = $('#fMat').value, gen = $('#fGen').value, ord = $('#fOrd').value;
  let l = db().arms.filter((a) => a.pub && (!forma || a.forma === forma) && (!mat || a.material === mat) && (!gen || a.genero === gen));
  if (ord) l.sort((a, b) => (ord === 'asc' ? a.precio - b.precio : b.precio - a.precio));
  else l.sort((a, b) => (disponibles(b) > 0) - (disponibles(a) > 0) || a.ultVenta.localeCompare(b.ultVenta) * -1);
  $('#nArm').textContent = `${l.length} modelos`;
  $('#grid').innerHTML = l.map((a) => `<button class="prod" data-ver="${a.id}"><span class="top">${badge(a)}<span>${esc(a.forma)} · ${esc(a.material)}</span></span>
    <img src="${foto(a.foto, 500)}" alt="${esc(a.marca + ' ' + a.modelo)}" loading="lazy"><small>${esc(a.marca)}</small><b>${esc(a.modelo)} · ${esc(a.color)}</b><span class="precio">${pesos(a.precio)}</span></button>`).join('') || '<p class="vacio">No hay modelos con esos filtros.</p>';
}
function sitio() {
  const c = db().conf;
  $('#fForma').innerHTML = [['', 'Todas'], ...FORMAS.map((f) => [f, f])].map(([v, t]) => `<button data-forma="${v}" aria-pressed="${forma === v}">${t}</button>`).join('');
  if ($('#fMat').options.length === 1) $('#fMat').insertAdjacentHTML('beforeend', MATERIALES.map((m) => `<option>${m}</option>`).join(''));
  catalogo();
  const v = $('#aArm').value;
  $('#aArm').innerHTML = `<option value="propio">Traigo mi armazón</option>` + db().arms.filter((a) => a.pub && disponibles(a) > 0).map((a) => `<option value="${a.id}" ${a.id === v ? 'selected' : ''}>${esc(a.marca + ' ' + a.modelo)} · ${pesos(a.precio)}</option>`).join('');
  if (!v) $('#aArm').value = db().arms.find((a) => a.pub && disponibles(a) > 0)?.id || 'propio';
  const m0 = $('#fArma').mica?.value || 'mono', t0 = [...$('#fArma').querySelectorAll('[name=trat]:checked')].map((x) => x.value);
  $('#aMica').innerHTML = Object.entries(db().micas).map(([k, m]) => `<label><span><input type="radio" name="mica" value="${k}" ${k === m0 ? 'checked' : ''}> ${esc(m.n)}<small>${esc(m.desc)}</small></span><b>${pesos(m.p)}</b></label>`).join('');
  $('#aTrat').innerHTML = Object.entries(db().trats).map(([k, t]) => `<label><span><input type="checkbox" name="trat" value="${k}" ${t0.includes(k) || (!t0.length && k === 'ar') ? 'checked' : ''}> ${esc(t.n)}</span><b>+${pesos(t.p)}</b></label>`).join('');
  arma();
  $('#antTxt').textContent = c.anticipo;
  $('#exTxt').innerHTML = `Costo: <b>${pesos(c.examen)}</b>, gratis si compras tus lentes con nosotros`;
  $('#pieDir').innerHTML = `${esc(c.direccion)}<br>${esc(c.horario)}`;
  $('#waPie').href = wa(c.whatsapp, `Hola ${c.nombre}, tengo una duda sobre unos lentes.`);
}
function arma() {
  const f = $('#fArma'); const mica = f.mica.value; const trats = [...f.querySelectorAll('[name=trat]:checked')].map((x) => x.value);
  const sinArm = db().micas[mica].sinArm;
  $('#aArm').disabled = sinArm; $('#aTrat').closest('fieldset').hidden = sinArm;
  const t = precioOrden(db(), { arm: f.arm.value, mica, trats: sinArm ? [] : trats });
  $('#aTot').innerHTML = `<div><small>Total</small><b>${pesos(t)}</b></div><div><small>Apartas con</small><b>${pesos(t * db().conf.anticipo / 100)}</b></div>`;
}

function ver(id) {
  const a = arm(db(), id); const d = disponibles(a);
  ventana(`<div class="ficha"><img src="${foto(a.foto, 800)}" alt="${esc(a.marca + ' ' + a.modelo)}"><div><small class="mut">${esc(a.marca)}</small><h2>${esc(a.modelo)}</h2><p style="font-size:1.4rem;font-weight:700;margin:4px 0">${pesos(a.precio)}</p>
    <dl><dt>Forma</dt><dd>${esc(a.forma)}</dd><dt>Material</dt><dd>${esc(a.material)}</dd><dt>Color</dt><dd>${esc(a.color)}</dd><dt>Para</dt><dd>${esc(a.genero)}</dd><dt>Disponibles</dt><dd>${d > 0 ? d : 'Agotado'}</dd></dl>
    ${d > 0 ? `<form class="form" id="fApartar"><p style="margin:0;font-weight:600">Apártalo 3 días y pruébatelo en tienda</p><label>Tu nombre<input name="n" required autocomplete="name" value="${esc(yo()?.n || '')}"></label><label>WhatsApp<input name="tel" required inputmode="tel" value="${esc(yo()?.tel || '')}"></label><button class="b b-osc">Apartar sin costo</button></form>` : '<p class="nota">Pregúntanos cuándo vuelve a llegar.</p>'}
    <button class="b b-lin b-full" style="margin-top:8px" data-armar="${a.id}">Cotizar con micas</button></div></div>`, true);
  $('#fApartar') && ($('#fApartar').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const tel = f.tel.value.replace(/\D/g, '').slice(-10);
    if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
    B.recargar(); if (disponibles(arm(db(), id)) <= 0) return toast('Alguien lo acaba de apartar', 'error');
    const ap = { id: uid(), arm: id, n: f.n.value.trim(), tel, f: new Date().toISOString(), vence: dia(3), estado: 'activo' };
    db().apartados.push(ap); if (!B.guardar()) return; catalogo();
    ventana(`<div class="listo"><span style="font-size:3rem">👓</span><h2>¡Apartado!</h2><p><b>${esc(a.marca + ' ' + a.modelo)}</b> te espera hasta el <b>${fAno(ap.vence)}</b>.</p>
      <p class="nota">Aprovecha y agenda tu examen para salir con tus lentes en proceso.</p><button class="b b-osc b-full" data-examen>Agendar examen</button></div>`);
  });
}

// ---------- Examen de la vista
function examen() {
  const p = yo();
  ventana(`<h2>Agendar examen</h2><p class="nota">30 minutos. Gratis si compras tus lentes con nosotros.</p><form class="form" id="fEx">
    <label>Nombre<input name="n" required autocomplete="name" value="${esc(p?.n || '')}"></label><label>WhatsApp<input name="tel" required inputmode="tel" value="${esc(p?.tel || '')}"></label>
    <label>Día<select name="fecha">${[...Array(14)].map((_, i) => dia(i)).filter((d) => new Date(d + 'T12:00').getDay() !== 0).map((d) => `<option value="${d}">${i18nDia(d)}</option>`).join('')}</select></label>
    <fieldset><legend>Hora</legend><div class="horas" id="horas"></div></fieldset>
    <label>¿Algo que debamos saber?<input name="nota" placeholder="Me duelen los ojos al leer, uso lentes de contacto…"></label><button class="b b-osc">Agendar</button></form>`);
  const f = $('#fEx');
  const horas = () => { const l = horasLibres(db(), f.fecha.value); $('#horas').innerHTML = l.map((h, i) => `<label><input type="radio" name="hora" value="${h}" ${i ? '' : 'checked'}><span>${h}</span></label>`).join('') || '<p class="nota">Sin horarios ese día.</p>'; };
  f.fecha.onchange = horas; horas();
  f.onsubmit = (e) => {
    e.preventDefault(); if (!f.hora) return toast('Elige otro día', 'error');
    const tel = f.tel.value.replace(/\D/g, '').slice(-10); if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
    B.recargar();
    if (!horasLibres(db(), f.fecha.value).includes(f.hora.value)) { toast('Ese horario se acaba de ocupar', 'error'); return horas(); }
    let pac = db().pacs.find((x) => x.tel === tel);
    if (!pac) { pac = { id: uid(), n: f.n.value.trim(), tel, nac: '' }; db().pacs.push(pac); }
    db().citas.push({ id: uid(), pac: pac.id, fecha: f.fecha.value, hora: f.hora.value, estado: 'pendiente', origen: 'portal', nota: f.nota.value.trim() });
    if (!B.guardar()) return;
    sesion = pac.id; local.set('optica:sesion', sesion);
    ventana(`<div class="listo"><span style="font-size:3rem">👁️</span><h2>¡Listo, ${esc(pac.n.split(' ')[0])}!</h2><p>Examen el <b>${i18nDia(f.fecha.value)}</b> a las <b>${f.hora.value}</b>.</p><p class="nota">Te confirmamos por WhatsApp. Tu graduación quedará en «Mis lentes».</p><button class="b b-osc b-full" data-portal>Ir a Mis lentes</button></div>`);
  };
}

// ---------- Portal
function entrar() {
  const ej = [['p1', 'lentes en laboratorio'], ['p3', 'lentes listos'], ['p2', 'pedido atrasado'], ['p6', 'le toca examen']].map(([id, x]) => { const p = db().pacs.find((y) => y.id === id); return `<button type="button" data-tel="${p.tel}"><span>${esc(p.n)} · ${x}</span><b>${p.tel}</b></button>`; }).join('');
  ventana(`<h2>Mis lentes</h2><p class="nota">Entra con el WhatsApp que diste en la óptica.</p><form class="form" id="fEntrar"><label>WhatsApp<input name="tel" required inputmode="tel" autocomplete="tel"></label><button class="b b-osc">Entrar</button></form>
    <p class="nota" style="margin-top:14px"><b>Demo:</b> toca un cliente de ejemplo.</p><div class="demo-tels">${ej}</div><p class="nota" style="margin-top:12px">En el sistema real llega un código por WhatsApp para entrar.</p>`);
  const f = $('#fEntrar');
  dlg.querySelectorAll('[data-tel]').forEach((b) => (b.onclick = () => { f.tel.value = b.dataset.tel; f.requestSubmit(); }));
  f.onsubmit = (e) => {
    e.preventDefault(); const p = db().pacs.find((x) => x.tel === f.tel.value.replace(/\D/g, '').slice(-10));
    if (!p) return toast('No encontramos ese número. Agenda tu examen y quedas registrado.', 'error');
    sesion = p.id; local.set('optica:sesion', sesion); tab = 'pedido'; dlg.close(); irPortal();
  };
}
function irPortal() { if (!yo()) return entrar(); $('#sitio').hidden = true; $('#portal').hidden = false; portal(); scrollTo(0, 0); }
function irSitio() { $('#sitio').hidden = false; $('#portal').hidden = true; }
const misOrd = () => db().ordenes.filter((o) => o.pac === sesion).sort((a, b) => b.f.localeCompare(a.f));

function portal() {
  if ($('#portal').hidden || !yo()) return;
  const p = yo();
  const tabs = [['pedido', 'Mi pedido'], ['grad', 'Mi graduación'], ['compras', 'Compras y garantías'], ['citas', 'Citas']];
  $('#portal').innerHTML = `<div class="portal"><div class="p-cab"><div><h1>Hola, ${esc(p.n.split(' ')[0])}</h1><p class="mut">Tus lentes, tu graduación y tus garantías.</p></div>
    <div class="hero-a"><button class="b b-osc" data-examen>Agendar examen</button><button class="b b-lin" id="salir">Salir</button></div></div>
    ${examenToca(db(), p.id) ? `<div class="caja atraso"><b>Te toca tu examen de la vista.</b> ${ultGrad(db(), p.id) ? `El último fue el ${fAno(ultGrad(db(), p.id).f)}.` : ''} <button class="lnk" data-examen style="text-decoration:underline;font-weight:600">Agendar</button></div>` : ''}
    ${lcToca(db(), p.id) ? `<div class="caja atraso"><b>Tus lentes de contacto están por terminarse.</b> <a target="_blank" rel="noopener" style="font-weight:600" href="${wa(db().conf.whatsapp, `Hola, quiero pedir otra caja de lentes de contacto (${p.n}).`)}">Pedir otra caja por WhatsApp</a></div>` : ''}
    <div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${t}</button>`).join('')}</div>
    ${{ pedido, grad, compras, citas }[tab](p)}</div>`;
}

function pedido() {
  const act = misOrd().filter((o) => !['entregada', 'cancelada'].includes(o.estado));
  if (!act.length) return `<div class="caja"><h3>Sin pedidos en proceso</h3><p class="mut">Cuando hagas un pedido verás aquí cada paso, desde el laboratorio hasta que esté listo.</p><a class="b b-osc" href="#armazones" data-ir="sitio">Ver armazones</a></div>`;
  return act.map((o) => {
    const i = ESTADOS.indexOf(o.estado); const a = o.arm ? arm(db(), o.arm) : null; const cuando = (e) => o.hist.find((h) => h.e === e)?.f;
    const banner = o.estado === 'lista' ? `<div class="caja lista-ok"><h3>🎉 ¡Tus lentes están listos!</h3><p style="margin:0 0 10px">Pasa por ellos de ${esc(db().conf.horario)}. ${saldo(o) > 0 ? `Saldo por pagar: <b>${pesos(saldo(o))}</b>.` : 'Ya están pagados.'}</p><a class="b b-osc" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, `Hola, voy por mis lentes del pedido ${o.folio}.`)}">Avisar que voy</a></div>`
      : atrasada(o) ? `<div class="caja atraso"><b>Tu pedido lleva un pequeño retraso.</b> El laboratorio está terminando tus micas; te avisamos en cuanto lleguen.</div>` : '';
    return `${banner}<div class="caja"><div class="pedido-cab">${a ? `<img src="${foto(a.foto, 300)}" alt="">` : '<span style="font-size:3rem;text-align:center">👁️</span>'}
      <div><small class="mut">Pedido ${o.folio} · ${fAno(o.f)}</small><h3 style="margin:2px 0">${esc(nombreArm(db(), o.arm || 'propio'))}${o.mica === 'lc' ? '' : ''}</h3><span class="mut">${esc(db().micas[o.mica].n)}${o.trats.length ? ' · ' + o.trats.map((t) => esc(db().trats[t].n)).join(', ') : ''}</span></div>
      <div style="text-align:right"><small class="mut">Entrega estimada</small><br><b style="font-size:1.2rem">${fDia(o.promesa)}</b></div></div>
      <ol class="pasos">${ESTADOS.map((e, k) => `<li class="${k <= i ? 'hecho' : ''} ${k === i ? 'actual' : ''}">${EST_TXT[e]}${cuando(e) ? `<small>${fechaHora(cuando(e))}</small>` : ''}</li>`).join('')}</ol>
      <p style="margin:16px 0 0">${EST_DESC[o.estado]}</p>
      <div class="fila" style="margin-top:8px"><span>Total</span><b>${pesos(o.total)}</b></div><div class="fila"><span>Pagado</span><b>${pesos(o.pagado)}</b></div>${saldo(o) > 0 ? `<div class="fila"><span>Por pagar al recoger</span><b>${pesos(saldo(o))}</b></div>` : ''}</div>`;
  }).join('');
}

function grad(p) {
  const gs = db().grads.filter((g) => g.pac === p.id).sort((a, b) => b.f.localeCompare(a.f));
  if (!gs.length) return '<div class="caja"><h3>Aún no tenemos tu graduación</h3><p class="mut">Agenda tu examen y aquí quedará guardada.</p><button class="b b-osc" data-examen>Agendar examen</button></div>';
  const [g, prev] = gs;
  const cam = (ojo, k) => { if (!prev) return ''; const d = +(g[ojo][k] - prev[ojo][k]).toFixed(2); return d ? `<span class="cambio ${Math.abs(g[ojo][k]) > Math.abs(prev[ojo][k]) ? 'sube' : 'baja'}">${d > 0 ? '+' : ''}${d.toFixed(2)}</span>` : ''; };
  const fila = (ojo, t) => `<tr><td>${t}</td><td>${fmtG(g[ojo].esf)}${cam(ojo, 'esf')}</td><td>${fmtG(g[ojo].cil)}${cam(ojo, 'cil')}</td><td>${g[ojo].eje}°</td><td>${g[ojo].add ? fmtG(g[ojo].add) : '—'}</td></tr>`;
  return `<div class="caja"><h3>Tu graduación actual</h3><p class="mut" style="margin:0 0 10px">Examen del ${fAno(g.f)} · ${esc(g.opto)} · Distancia entre pupilas ${g.dip} mm</p>
    <div style="overflow-x:auto"><table class="grad"><thead><tr><th></th><th>Esfera</th><th>Cilindro</th><th>Eje</th><th>Adición</th></tr></thead><tbody>${fila('od', 'Ojo derecho')}${fila('oi', 'Ojo izquierdo')}</tbody></table></div>
    ${prev ? `<p class="nota" style="margin-top:10px">Los números pequeños muestran el cambio contra tu examen del ${fAno(prev.f)}. Rojo: subió tu graduación.</p>` : ''}
    <p style="margin:12px 0 0">Próximo examen recomendado: <b>${fAno(new Date(Date.parse(g.f) + db().conf.recall * 30.4 * 864e5).toISOString())}</b></p></div>
    ${gs.length > 1 ? `<div class="caja"><h3>Historial</h3>${gs.map((x) => `<div class="fila"><span>${fAno(x.f)}</span><span class="mut">OD ${fmtG(x.od.esf)} / ${fmtG(x.od.cil)} · OI ${fmtG(x.oi.esf)} / ${fmtG(x.oi.cil)}</span></div>`).join('')}</div>` : ''}`;
}

function compras() {
  const l = misOrd();
  return `<div class="caja"><h3>Tus compras</h3>${l.map((o) => `<div class="fila"><span><b>${esc(nombreArm(db(), o.arm || 'propio'))}</b> · ${esc(db().micas[o.mica].n)}<br><small class="mut">${o.folio} · ${fAno(o.f)}</small></span>
    <span style="text-align:right">${o.estado === 'entregada' ? (o.garantia >= dia() ? `<span class="tag ok">Garantía hasta ${fAno(o.garantia)}</span>` : '<span class="tag gris">Garantía vencida</span>') : `<span class="tag pend">${EST_TXT[o.estado]}</span>`}</span></div>`).join('') || '<p class="vacio">Sin compras.</p>'}</div>
    <div class="caja"><h3>¿Qué cubre la garantía?</h3><p class="mut" style="margin:0">${db().conf.garantia} meses contra defectos de fabricación del armazón y desprendimiento del antirreflejante. Ajustes y limpieza, gratis siempre.</p></div>`;
}

function citas(p) {
  const l = db().citas.filter((c) => c.pac === p.id).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  return `<div class="caja"><h3>Tus citas</h3>${l.map((c) => `<div class="fila"><span><b>Examen de la vista</b><br><small class="mut">${i18nDia(c.fecha)} · ${c.hora}</small></span><span class="tag ${c.estado === 'confirmada' || c.estado === 'completada' ? 'ok' : c.estado === 'pendiente' ? 'pend' : 'gris'}">${CITA_TXT[c.estado]}</span></div>`).join('') || '<p class="vacio">Sin citas.</p>'}<button class="b b-osc" data-examen style="margin-top:10px">Agendar examen</button></div>`;
}

// ---------- Eventos
document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-ver]'))) return ver(el.dataset.ver);
  if ((el = q('[data-forma]'))) { forma = el.dataset.forma; $$forma(); return catalogo(); }
  if ((el = q('[data-armar]'))) { dlg.close(); $('#aArm').value = el.dataset.armar; arma(); return $('#arma').scrollIntoView(); }
  if (q('[data-examen]')) return examen();
  if (q('[data-portal]')) { dlg.close(); return irPortal(); }
  if (q('[data-ir="sitio"]')) return irSitio();
  if (t.id === 'salir') { sesion = null; local.set('optica:sesion', null); return irSitio(); }
  if ((el = q('[data-tab]'))) { tab = el.dataset.tab; return portal(); }
});
const $$forma = () => document.querySelectorAll('[data-forma]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.forma === forma));
['#fMat', '#fGen', '#fOrd'].forEach((s) => $(s).addEventListener('change', catalogo));
$('#fArma').addEventListener('change', arma);
B.alCambiar(() => { sitio(); portal(); });
sitio();
if (location.hash === '#portal' && yo()) irPortal();
