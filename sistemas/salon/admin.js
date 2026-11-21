// Panel del salón: agenda por estilista, cobro con cupón/premio/anticipo, clientas, promociones, pedidos de tienda, productos, comisiones y caja.
import { $, $$, esc, pesos, fecha, wa, toast, puerta, barras, uid, foto, comprimir } from '../_base/sis.js';
import { abrir, dia, fDia, loc, domingo, diasEntre, min, hhmm, fin, serv, est, cli, prod, CATS, EST_TXT, PED_TXT, libres, reservar, cobroDe, terminar, comisiones, nivel, visitasTot, ultima, esCumple, cancelarPedido } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const ventana = (html, ancho = false) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;
const ini = (n) => n.split(' ').slice(0, 2).map((x) => x[0]).join('');
const waC = (c, m) => wa('52' + c.tel, m);
const hola = (c) => `Hola ${c.n.split(' ')[0]} 🌸, te escribimos de ${db().conf.nombre}.`;
const sitio = () => new URL('index.html', location.href).href;
const ventasDe = (d1, d2) => [
  ...db().citas.filter((c) => c.venta && loc(c.venta.f) >= d1 && loc(c.venta.f) <= d2).map((c) => ({ f: c.venta.f, met: c.venta.met, monto: c.venta.servicio + c.venta.prods + c.venta.propina - c.venta.ant, prop: c.venta.propina, tipo: serv(db(), c.serv).n })),
  ...db().citas.filter((c) => c.anticipo?.pagado && c.anticipo.f && loc(c.anticipo.f) >= d1 && loc(c.anticipo.f) <= d2).map((c) => ({ f: c.anticipo.f, met: 'Transferencia', monto: c.anticipo.monto, prop: 0, tipo: 'Anticipo' })),
  ...db().pedidos.filter((p) => p.pagado && p.fPago && loc(p.fPago) >= d1 && loc(p.fPago) <= d2).map((p) => ({ f: p.fPago, met: p.met, monto: p.total, prop: 0, tipo: 'Pedido ' + p.folio })),
  ...db().ventas.filter((v) => loc(v.f) >= d1 && loc(v.f) <= d2).map((v) => ({ ...v, prop: 0, tipo: 'Mostrador' })),
];
const inactivas = () => db().clis.filter((c) => ultima(db(), c.id) && diasEntre(ultima(db(), c.id), dia()) > db().conf.inactivo && !db().citas.some((x) => x.cli === c.id && x.fecha >= dia() && x.estado === 'reservada'));
const cercaPremio = () => db().clis.filter((c) => c.visitas >= db().conf.visitas - 1);
const cumples = () => db().clis.filter(esCumple);
const oro = () => db().clis.filter((c) => nivel(db(), c.id).n === 'Oro');

// ---------- Agenda
let fAg = domingo(dia()) ? dia(1) : dia();
function inicio() {
  const cs = db().citas.filter((c) => c.fecha === fAg && !['cancelada', 'falto'].includes(c.estado));
  const abierto = (min(db().conf.cierra) - min(db().conf.abre)) * db().ests.filter((e) => e.activo).length;
  const v = ventasDe(fAg, fAg);
  const antPend = db().citas.filter((c) => c.fecha >= dia() && c.estado === 'reservada' && c.anticipo && !c.anticipo.pagado);
  return cab('Agenda', `${fDia(fAg)}${fAg === dia() ? ' · hoy' : ''}. Toca un espacio libre para agendar o una cita para atenderla.`,
    `<button class="btn sec" data-dia="-1" aria-label="Día anterior">←</button><input type="date" id="fAg" value="${fAg}" aria-label="Día" style="padding:8px;border:1px solid var(--ln);border-radius:10px"><button class="btn sec" data-dia="1" aria-label="Día siguiente">→</button><button class="btn" data-walkin>+ Clienta sin cita</button>`) + `
  <div class="kpis">
    <div class="kpi"><span>Citas</span><b>${cs.length}</b><small>${cs.filter((c) => c.origen === 'en línea').length} reservadas en línea</small></div>
    <div class="kpi"><span>Ocupación</span><b>${Math.round((cs.reduce((s, c) => s + c.dur, 0) / abierto) * 100)}%</b><small>de las horas de las estilistas</small></div>
    <div class="kpi"><span>Cobrado</span><b>${pesos(v.reduce((s, x) => s + x.monto, 0))}</b><small>propinas ${pesos(v.reduce((s, x) => s + x.prop, 0))}</small></div>
    <div class="kpi ${antPend.length ? 'alerta' : ''}"><span>Anticipos pendientes</span><b>${antPend.length}</b><small>${pesos(antPend.reduce((s, c) => s + c.anticipo.monto, 0))} por confirmar</small></div>
  </div>
  ${domingo(fAg) ? '<p class="vacio panel">Domingo: el salón está cerrado.</p>' : grid(fAg)}`;
}
function grid(f) {
  const es = db().ests.filter((e) => e.activo);
  const a = min(db().conf.abre), z = min(db().conf.cierra), n = (z - a) / 30;
  const ahora = f === dia() ? new Date().getHours() * 60 + new Date().getMinutes() : f < dia() ? 99999 : 0;
  let html = `<div class="agenda" style="grid-template-columns:52px repeat(${es.length},minmax(160px,1fr));grid-template-rows:auto repeat(${n},40px)"><span></span>${es.map((e) => `<div class="hd"><img src="${foto(e.foto, 80)}" alt="">${esc(e.n)}</div>`).join('')}`;
  for (let i = 0; i < n; i++) {
    const m = a + i * 30, h = hhmm(m);
    html += `<span class="hr" style="grid-row:${i + 2};grid-column:1">${h}</span>`;
    es.forEach((e, k) => { html += m < ahora ? `<span class="pasado" style="grid-row:${i + 2};grid-column:${k + 2}"></span>` : `<button class="libre" style="grid-row:${i + 2};grid-column:${k + 2}" data-nueva="${e.id}" data-h="${h}" aria-label="Agendar con ${esc(e.n)} a las ${h}">+ ${h}</button>`; });
  }
  for (const c of db().citas.filter((x) => x.fecha === f && x.estado !== 'cancelada')) {
    const k = es.findIndex((e) => e.id === c.est); if (k < 0) continue; const cl = cli(db(), c.cli);
    html += `<button class="blq ${c.estado}" style="grid-column:${k + 2};grid-row:${(min(c.hora) - a) / 30 + 2} / span ${c.dur / 30}" data-cita="${c.id}"><span class="tg">${EST_TXT[c.estado]}${c.anticipo && !c.anticipo.pagado && c.estado === 'reservada' ? ' · sin anticipo' : ''}</span><b>${esc(cl?.n || 'Clienta')}</b>${esc(serv(db(), c.serv).n)} · ${c.hora}–${fin(c)}${cl?.alergias ? '<br>⚠ ' + esc(cl.alergias) : ''}${cl && cl.visitas >= db().conf.visitas ? '<br>🎁 Tiene regalo' : ''}</button>`;
  }
  return html + '</div>';
}

function verCita(id) {
  const c = db().citas.find((x) => x.id === id); const cl = cli(db(), c.cli); const s = serv(db(), c.serv);
  const sig = { reservada: ['llego', 'Llegó'], llego: ['atencion', 'Pasar a atención'], atencion: ['cobrar', 'Terminar y cobrar'] }[c.estado];
  const v = c.venta;
  ventana(`${dlgH(`${esc(cl?.n || 'Clienta')} <span class="badge">${EST_TXT[c.estado]}</span>`)}<div class="dlg-b">
    <p style="margin:0"><b>${esc(s.n)}</b> con ${esc(est(db(), c.est).n)} · ${fDia(c.fecha)} ${c.hora}–${fin(c)}${c.nota ? ` · 📝 ${esc(c.nota)}` : ''}${c.cupon ? ` · cupón <b>${esc(c.cupon)}</b>` : ''}</p>
    ${cl ? `${cl.alergias ? `<p class="aviso" style="margin-top:10px;background:#FBE3E1;border-color:#F3B8B2">⚠ <b>Alergias:</b> ${esc(cl.alergias)}</p>` : ''}
      ${cl.formula && ['color', 'cabello'].includes(s.cat) ? `<p class="aviso" style="margin-top:10px">🎨 <b>Fórmula:</b> ${esc(cl.formula)}</p>` : ''}
      ${cl.notas ? `<p class="aviso" style="margin-top:10px">💬 ${esc(cl.notas)}</p>` : ''}
      <p style="margin:8px 0"><span class="sellos">${[...Array(db().conf.visitas)].map((_, i) => `<i class="${i < cl.visitas ? 'si' : ''}"></i>`).join('')}</span> ${cl.visitas}/${db().conf.visitas} visitas · nivel ${esc(nivel(db(), cl.id).n)}</p>` : ''}
    ${c.anticipo ? `<p>Anticipo ${pesos(c.anticipo.monto)}: ${c.anticipo.pagado ? '<span class="badge b-ok">Recibido</span>' : '<span class="badge b-bad">Pendiente</span> <button class="btn mini" id="antOk">Marcar recibido</button>'}</p>` : ''}
    ${v ? `<table class="t"><tbody><tr><td>Servicio${v.cupon ? ` (cupón ${esc(v.cupon)} -${pesos(v.dCupon)})` : ''}${v.dPremio ? ` (regalo -${pesos(v.dPremio)})` : ''}</td><td class="num">${pesos(v.servicio)}</td></tr><tr><td>Productos</td><td class="num">${pesos(v.prods)}</td></tr><tr><td>Propina</td><td class="num">${pesos(v.propina)}</td></tr>${v.ant ? `<tr><td>Anticipo ya pagado</td><td class="num">-${pesos(v.ant)}</td></tr>` : ''}<tr><td><b>Cobrado · ${esc(v.met)}</b></td><td class="num"><b>${pesos(v.servicio + v.prods + v.propina - v.ant)}</b></td></tr></tbody></table>` : ''}
  </div><div class="dlg-p">
    ${['reservada', 'llego'].includes(c.estado) ? '<button class="btn sec" id="falto">No llegó</button><button class="btn sec" id="cancelar">Cancelar</button>' : ''}
    ${cl ? `<a class="btn sec" target="_blank" rel="noopener" href="${waC(cl, `${hola(cl)} Te esperamos ${fDia(c.fecha)} a las ${c.hora} para tu ${s.n.toLowerCase()} con ${est(db(), c.est).n}.${c.anticipo && !c.anticipo.pagado ? ` Para confirmar tu lugar falta tu anticipo de ${pesos(c.anticipo.monto)}.` : ''}`)}">📱 Recordar</a>` : ''}
    ${sig ? `<button class="btn" id="sig">${sig[1]}</button>` : ''}</div>`);
  $('#sig') && ($('#sig').onclick = () => { if (sig[0] === 'cobrar') return cobrar(c); c.estado = sig[0]; if (guardar(`${cl?.n}: ${EST_TXT[c.estado]}`)) verCita(id); });
  $('#antOk') && ($('#antOk').onclick = () => { c.anticipo.pagado = true; c.anticipo.f = new Date().toISOString(); if (guardar('Anticipo recibido: la cita queda confirmada')) verCita(id); });
  $('#falto') && ($('#falto').onclick = () => { c.estado = 'falto'; if (guardar('Marcado: no llegó')) dlg.close(); });
  $('#cancelar') && ($('#cancelar').onclick = () => { if (confirm('¿Cancelar la cita?')) { c.estado = 'cancelada'; if (guardar('Cita cancelada, horario liberado')) dlg.close(); } });
}

function cobrar(c) {
  const cl = cli(db(), c.cli); const s = serv(db(), c.serv);
  const puede = cl && cl.visitas >= db().conf.visitas; const sel = {};
  ventana(`<form id="fCob">${dlgH(`Cobrar · ${esc(cl?.n || 'Clienta')}`)}<div class="dlg-b form">
    ${puede ? `<label class="check full aviso"><input type="checkbox" name="canje" checked> 🎁 Usar su regalo: ${esc(db().conf.premio)} (vale ${pesos(serv(db(), db().conf.premioServ).precio)})</label>` : ''}
    <label>Código de promoción<input name="cupon" value="${esc(c.cupon || '')}" style="text-transform:uppercase"></label><span></span>
    <div class="full"><b>Productos</b>${cl && nivel(db(), cl.id).desc ? ` <span class="badge b-ok">Nivel ${esc(nivel(db(), cl.id).n)}: -${nivel(db(), cl.id).desc}%</span>` : ''}<ul class="lista-mini">${db().prods.map((p) => `<li><img class="thumb" src="${foto(p.foto, 120)}" alt=""><div>${esc(p.n)}<br><small>${pesos(p.precio)} · hay ${p.stock}</small></div><span class="der cant"><button type="button" data-q="${p.id}" data-d="-1" aria-label="Menos">−</button><b id="q_${p.id}">0</b><button type="button" data-q="${p.id}" data-d="1" aria-label="Más" ${p.stock ? '' : 'disabled'}>+</button></span></li>`).join('')}</ul></div>
    <label>Propina<input name="propina" type="number" min="0" step="10" value="0"></label>
    <label>Método<select name="met"><option>Tarjeta</option><option>Efectivo</option><option>Transferencia</option></select></label>
    <p class="full aviso" id="tot" style="font-size:1.05rem"></p>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Cobrar y sumar visita</button></div></form>`);
  const f = $('#fCob');
  const prods = () => Object.entries(sel).filter(([, n]) => n > 0).map(([id, cant]) => ({ id, cant }));
  const tot = () => {
    const k = cobroDe(db(), c, { productos: prods(), canje: !!f.canje?.checked, cupon: f.cupon.value.trim() });
    $('#tot').innerHTML = `${esc(s.n)} ${pesos(s.precio)}${k.dCupon ? ` · cupón -${pesos(k.dCupon)}` : ''}${k.cuponMsg ? ` · <span style="color:var(--bad)">${esc(k.cuponMsg)}</span>` : ''}${k.dPremio ? ` · regalo -${pesos(k.dPremio)}` : ''} · productos ${pesos(k.prods)} · propina ${pesos(+f.propina.value || 0)}${k.ant ? ` · anticipo -${pesos(k.ant)}` : ''}<br>A cobrar: <b style="font-size:1.4rem">${pesos(k.servicio + k.prods + (+f.propina.value || 0) - k.ant)}</b>`;
  };
  f.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; const p = prod(db(), b.dataset.q); sel[p.id] = Math.max(0, Math.min(p.stock, (sel[p.id] || 0) + +b.dataset.d)); $('#q_' + p.id).textContent = sel[p.id]; tot(); });
  f.addEventListener('input', tot); f.addEventListener('change', tot); tot();
  f.onsubmit = (e) => {
    e.preventDefault();
    try { terminar(db(), c, { productos: prods(), propina: +f.propina.value, met: f.met.value, canje: !!f.canje?.checked, cupon: f.cupon.value.trim() }); } catch (err) { return toast(err.message, 'error'); }
    if (guardar(`Cobrado. ${cl ? `${cl.n.split(' ')[0]} lleva ${cl.visitas}/${db().conf.visitas} visitas` : ''}`)) verCita(c.id);
  };
}

function nueva(eId, hora, walkin = false) {
  ventana(`<form id="fNueva">${dlgH(walkin ? 'Clienta sin cita' : 'Nueva cita')}<div class="dlg-b form">
    <label class="full">Clienta<select name="cli"><option value="">+ Clienta nueva</option>${db().clis.map((c) => `<option value="${c.id}">${esc(c.n)} · ${c.tel}</option>`).join('')}</select></label>
    <label class="nuevo">Nombre<input name="n"></label><label class="nuevo">WhatsApp (opcional)<input name="tel" inputmode="tel"></label>
    <label>Servicio<select name="serv">${db().servs.map((s) => `<option value="${s.id}">${esc(s.n)} · ${s.dur} min</option>`).join('')}</select></label>
    <label>Estilista<select name="est"></select></label>
    <label>Día<input type="date" name="fecha" value="${walkin ? dia() : fAg}" min="${dia()}" ${walkin ? 'readonly' : ''}></label><label>Hora<select name="hora"></select></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">${walkin ? 'Pasar a atención' : 'Agendar'}</button></div></form>`);
  const f = $('#fNueva');
  const sync = (cambio) => {
    $$('.nuevo', f).forEach((x) => (x.hidden = !!f.cli.value)); f.n.required = !f.cli.value;
    const s = serv(db(), f.serv.value); const ve = f.est.value || eId;
    const es = db().ests.filter((e) => e.activo && e.cats.includes(s.cat));
    f.est.innerHTML = es.map((e) => `<option value="${e.id}" ${e.id === ve ? 'selected' : ''}>${esc(e.n)}</option>`).join('') || '<option value="">Nadie hace ese servicio</option>';
    if (cambio === 'serv' && eId && !es.some((e) => e.id === eId)) toast('Esa estilista no hace ese servicio; elige otra', 'error');
    const l = f.est.value ? libres(db(), f.est.value, f.fecha.value, s.dur) : []; const vh = f.hora.value || hora;
    f.hora.innerHTML = l.map((h) => `<option ${h === vh ? 'selected' : ''}>${h}</option>`).join('') || '<option value="">Sin horario</option>';
  };
  f.addEventListener('change', (e) => { if (e.target !== f.hora) sync(e.target.name); });
  f.serv.value = db().servs.find((s) => est(db(), eId)?.cats.includes(s.cat))?.id || f.serv.value; sync();
  f.onsubmit = (e) => {
    e.preventDefault(); if (!f.hora.value) return toast('No hay horario libre', 'error');
    let cid = f.cli.value;
    if (!cid) {
      const tel = f.tel.value.replace(/\D/g, '').slice(-10);
      if (tel && tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      if (tel && db().clis.some((c) => c.tel === tel)) return toast('Ese teléfono ya está registrado: elígela en la lista', 'error');
      cid = uid(); db().clis.push({ id: cid, n: f.n.value.trim(), tel, cumple: '', alergias: '', formula: '', notas: '', alta: dia(), visitas: 0, canjes: 0 });
    }
    let c; try { c = reservar(db(), { cli: cid, est: f.est.value, serv: f.serv.value, fecha: f.fecha.value, hora: f.hora.value, origen: 'salón' }); } catch (err) { return toast(err.message, 'error'); }
    if (walkin) c.estado = 'atencion';
    fAg = c.fecha; location.hash = 'inicio';
    if (guardar(walkin ? 'En atención' : 'Cita agendada')) dlg.close();
  };
}

// ---------- Clientas
let qCli = '', filtro = 'todas';
function clientas() {
  const q = qCli.toLowerCase();
  const g = { todas: db().clis, inactivas: inactivas(), premio: cercaPremio(), cumple: cumples(), oro: oro() };
  const nom = { todas: 'Todas', inactivas: `Sin venir +${db().conf.inactivo} días`, premio: 'Cerca del regalo', cumple: 'Cumpleaños del mes', oro: 'Nivel Oro' };
  const l = g[filtro].filter((c) => !q || (c.n + c.tel).toLowerCase().includes(q)).sort((a, b) => (ultima(db(), b.id) || '').localeCompare(ultima(db(), a.id) || ''));
  return cab('Clientas', 'Ficha de cada clienta: visitas, nivel, fórmula de color, alergias y lo que le gusta.') + `
  <div class="chips">${Object.entries(g).map(([k, x]) => `<button data-filtro="${k}" aria-pressed="${filtro === k}">${nom[k]} · ${x.length}</button>`).join('')}</div>
  <div class="filtros"><input id="qCli" type="search" placeholder="Buscar por nombre o teléfono…" value="${esc(qCli)}" aria-label="Buscar clienta"></div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Clienta</th><th>Última visita</th><th>Visitas</th><th class="ocultar-m">Nivel</th><th></th></tr></thead><tbody>
  ${l.map((c) => { const u = ultima(db(), c.id); return `<tr class="click" data-cli="${c.id}"><td><span class="ini">${ini(c.n)}</span><b>${esc(c.n)}</b>${c.alergias ? ' <span class="badge b-bad">⚠</span>' : ''}</td><td>${u ? `${diasEntre(u, dia())} días${diasEntre(u, dia()) > db().conf.inactivo ? ' <span class="badge b-bad">Inactiva</span>' : ''}` : '—'}</td><td>${c.visitas}/${db().conf.visitas}${c.visitas >= db().conf.visitas ? ' 🎁' : ''}</td><td class="ocultar-m">${esc(nivel(db(), c.id).n)}</td><td>${c.tel ? `<a class="btn mini sec" target="_blank" rel="noopener" href="${waC(c, hola(c))}" aria-label="WhatsApp">📱</a>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="5" class="vacio">Nadie en este grupo</td></tr>'}</tbody></table></section>`;
}
function verCli(id) {
  const c = cli(db(), id);
  const h = db().citas.filter((x) => x.cli === id && x.estado === 'terminada').sort((a, b) => b.fecha.localeCompare(a.fecha));
  const gast = h.reduce((s, x) => s + (x.venta ? x.venta.servicio + x.venta.prods : 0), 0);
  ventana(`${dlgH(esc(c.n))}<div class="dlg-b">
    <div class="kpis"><div class="kpi"><span>Visitas</span><b>${visitasTot(db(), id)}</b><small>nivel ${esc(nivel(db(), id).n)}</small></div><div class="kpi"><span>Tarjeta</span><b>${c.visitas}/${db().conf.visitas}</b><small>${c.canjes} regalos</small></div><div class="kpi"><span>Ha gastado</span><b>${pesos(gast)}</b></div></div>
    <form class="form" id="fCli"><label class="full">Fórmula de color<textarea name="formula" placeholder="Tono, oxidante, tiempo, matiz…">${esc(c.formula)}</textarea></label>
      <label class="full">Alergias o sensibilidades<input name="alergias" value="${esc(c.alergias)}"></label><label class="full">Cómo le gusta<textarea name="notas">${esc(c.notas)}</textarea></label>
      <label>Cumpleaños (MM-DD)<input name="cumple" pattern="\\d{2}-\\d{2}" value="${esc(c.cumple)}"></label><label>WhatsApp<input name="tel" value="${esc(c.tel)}"></label>
      <div class="full acc"><button class="btn">Guardar</button><button type="button" class="btn sec" id="mas">+1 visita</button></div></form>
    <h3 style="margin:16px 0 6px">Historial</h3><ul class="lista-mini">${h.slice(0, 10).map((x) => `<li><div>${esc(serv(db(), x.serv).n)} · ${esc(est(db(), x.est).n)}<br><small>${fDia(x.fecha)}</small></div><span class="der">${x.venta?.dPremio ? '<span class="badge b-ok">Regalo</span>' : pesos(x.venta ? x.venta.servicio + x.venta.prods : 0)}</span></li>`).join('') || '<li class="vacio">Sin visitas</li>'}</ul></div>`, true);
  $('#fCli').onsubmit = (e) => { e.preventDefault(); const f = e.target; Object.assign(c, { formula: f.formula.value.trim(), alergias: f.alergias.value.trim(), notas: f.notas.value.trim(), cumple: f.cumple.value.trim(), tel: f.tel.value.replace(/\D/g, '').slice(-10) }); if (guardar('Ficha guardada')) verCli(id); };
  $('#mas').onclick = () => { c.visitas++; if (guardar('Visita agregada')) verCli(id); };
}

// ---------- Promociones
function promos() {
  const mes = dia().slice(0, 7);
  const cup = (grupo) => db().cupones.find((k) => k.activo && k.vence >= dia() && k.usos < k.max && k.grupo === grupo);
  const btn = (k, c, m) => (!c.tel ? '<small>sin WhatsApp</small>' : db().avisos[k] ? `<span class="badge b-ok">Enviado ${fecha(db().avisos[k])}</span>` : `<a class="btn mini" target="_blank" rel="noopener" data-avisar="${k}" href="${waC(c, m)}">📱 Enviar</a>`);
  const lista = (t, sub, l, key, msg) => `<section class="panel"><h2>${t} (${l.length})</h2><p class="ayuda" style="margin:-4px 0 8px">${sub}</p><ul class="lista-mini">${l.map((c) => `<li><span class="ini">${ini(c.n)}</span><div><b>${esc(c.n)}</b><br><small>${ultima(db(), c.id) ? `Última visita hace ${diasEntre(ultima(db(), c.id), dia())} días` : 'Sin visitas'} · ${c.visitas}/${db().conf.visitas}</small></div><div class="der">${btn(key + c.id + mes, c, msg(c))}</div></li>`).join('') || '<li class="vacio">Nadie por ahora ✓</li>'}</ul></section>`;
  const ci = cup('inactivas'), cc = cup('cumple');
  return cab('Promociones', 'Crea códigos de descuento y mándalos a cada grupo de clientas con un toque.', '<button class="btn" data-cupon="">+ Nuevo código</button>') + `
  <section class="panel tabla"><h2>Códigos</h2><table class="t"><thead><tr><th>Código</th><th>Promoción</th><th class="ocultar-m">Para</th><th>Vence</th><th>Usos</th><th></th></tr></thead><tbody>
    ${db().cupones.map((k) => `<tr class="click" data-cupon="${k.codigo}"><td><b>${esc(k.codigo)}</b></td><td>${esc(k.titulo)}<br><small>${k.tipo === '%' ? k.valor + '%' : pesos(k.valor)}${k.cat ? ' en ' + CATS[k.cat].toLowerCase() : ''}</small></td><td class="ocultar-m">${{ todas: 'Todas', inactivas: 'Inactivas', cumple: 'Cumpleañeras', oro: 'Nivel Oro' }[k.grupo]}</td><td>${k.vence < dia() ? '<span class="badge b-bad">Vencido</span>' : fDia(k.vence)}</td><td>${k.usos}/${k.max}</td><td><span class="badge ${k.activo && k.vence >= dia() ? 'b-ok' : 'b-mut'}">${k.activo && k.vence >= dia() ? 'Activo' : 'Inactivo'}</span></td></tr>`).join('')}</tbody></table></section>
  ${lista(`Sin venir más de ${db().conf.inactivo} días`, ci ? `Se les manda el código ${ci.codigo}.` : 'Crea un código para inactivas para incluirlo en el mensaje.', inactivas(), 'in', (c) => `${hola(c)} ¡Te extrañamos! ${ci ? `Con el código ${ci.codigo} tienes ${ci.tipo === '%' ? ci.valor + '%' : pesos(ci.valor)} de descuento en tu próxima cita. ` : ''}Reserva aquí: ${sitio()}`)}
  ${lista('Con regalo o a una visita', 'Recordarles su regalo las trae de vuelta.', cercaPremio(), 'pr', (c) => `${hola(c)} ${c.visitas >= db().conf.visitas ? `¡Ya ganaste tu ${db().conf.premio.toLowerCase()}! 🎁` : '¡Te falta una visita para tu regalo!'} Reserva: ${sitio()}`)}
  ${lista('Cumpleaños del mes', cc ? `Se les manda el código ${cc.codigo}.` : 'Crea un código de cumpleaños.', cumples(), 'cu', (c) => `${hola(c)} ¡Feliz cumpleaños! 🎂 ${cc ? `Este mes tienes ${cc.tipo === '%' ? cc.valor + '%' : pesos(cc.valor)} con el código ${cc.codigo}. ` : ''}Reserva: ${sitio()}`)}`;
}
function editarCupon(codigo) {
  const k = codigo ? db().cupones.find((x) => x.codigo === codigo) : { codigo: '', titulo: '', tipo: '%', valor: 10, cat: '', vence: dia(30), grupo: 'todas', usos: 0, max: 50, activo: true };
  ventana(`<form id="fCup">${dlgH(codigo ? 'Editar código' : 'Nuevo código')}<div class="dlg-b form">
    <label>Código<input name="codigo" required pattern="[A-Za-z0-9]{3,15}" value="${esc(k.codigo)}" ${codigo ? 'readonly' : ''} style="text-transform:uppercase"></label><label>Título (lo ve la clienta)<input name="titulo" required value="${esc(k.titulo)}"></label>
    <label>Tipo<select name="tipo"><option value="%" ${k.tipo === '%' ? 'selected' : ''}>Porcentaje</option><option value="$" ${k.tipo === '$' ? 'selected' : ''}>Monto en pesos</option></select></label><label>Valor<input name="valor" type="number" min="1" required value="${k.valor}"></label>
    <label>Aplica a<select name="cat"><option value="">Todos los servicios</option>${Object.entries(CATS).map(([c, n]) => `<option value="${c}" ${k.cat === c ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Para<select name="grupo">${[['todas', 'Todas'], ['inactivas', 'Inactivas'], ['cumple', 'Cumpleañeras del mes'], ['oro', 'Nivel Oro']].map(([v, n]) => `<option value="${v}" ${k.grupo === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Vence<input name="vence" type="date" required value="${k.vence}"></label><label>Usos máximos<input name="max" type="number" min="1" value="${k.max}"></label>
    <label class="check full"><input type="checkbox" name="activo" ${k.activo ? 'checked' : ''}> Activo (se muestra en el sitio)</label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  $('#fCup').onsubmit = (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const cod = d.codigo.trim().toUpperCase();
    if (d.tipo === '%' && +d.valor > 100) return toast('El porcentaje no puede pasar de 100', 'error');
    if (!codigo && db().cupones.some((x) => x.codigo === cod)) return toast('Ese código ya existe', 'error');
    const datos = { codigo: cod, titulo: d.titulo.trim(), tipo: d.tipo, valor: +d.valor, cat: d.cat, grupo: d.grupo, vence: d.vence, max: +d.max, activo: !!d.activo };
    codigo ? Object.assign(k, datos) : db().cupones.push({ ...datos, usos: 0 });
    if (guardar('Código guardado: ya aparece en el sitio')) dlg.close();
  };
}

// ---------- Pedidos de la tienda
function pedidos() {
  const g = (e) => db().pedidos.filter((p) => p.estado === e).sort((a, b) => b.f.localeCompare(a.f));
  const fila = (p) => { const c = cli(db(), p.cli); return `<li><div><b>${p.folio}</b> · ${esc(c?.n || '')}<br><small>${p.items.map((i) => `${i.cant} × ${esc(prod(db(), i.id).n)}`).join(', ')} · ${fDia(p.f)}</small></div><div class="der acc"><b>${pesos(p.total)}</b>
    ${p.estado === 'nuevo' ? `<button class="btn mini" data-ped="${p.folio}" data-a="listo">Marcar listo</button>` : ''}${p.estado === 'listo' ? `<a class="btn mini sec" target="_blank" rel="noopener" href="${waC(c, `${hola(c)} Tu pedido ${p.folio} ya está listo para recoger 🛍️. Total: ${pesos(p.total)}.`)}">📱 Avisar</a><button class="btn mini" data-ped="${p.folio}" data-a="entregar">Entregar y cobrar</button>` : ''}
    ${['nuevo', 'listo'].includes(p.estado) ? `<button class="btn mini sec" data-ped="${p.folio}" data-a="cancelar">Cancelar</button>` : ''}</div></li>`; };
  return cab('Pedidos de la tienda', 'Lo que las clientas apartan en línea. Las piezas ya están separadas del inventario.') + `
  <div class="grid2"><section class="panel"><h2>Por preparar (${g('nuevo').length})</h2><ul class="lista-mini">${g('nuevo').map(fila).join('') || '<li class="vacio">Nada pendiente</li>'}</ul></section>
  <section class="panel"><h2>Listos para recoger (${g('listo').length})</h2><ul class="lista-mini">${g('listo').map(fila).join('') || '<li class="vacio">Ninguno</li>'}</ul></section></div>
  <section class="panel"><h2>Entregados y cancelados</h2><ul class="lista-mini">${[...g('entregado'), ...g('cancelado')].slice(0, 10).map((p) => `<li><div><b>${p.folio}</b> · ${esc(cli(db(), p.cli)?.n || '')}<br><small>${fDia(p.f)}</small></div><span class="der"><span class="badge ${p.estado === 'entregado' ? 'b-ok' : 'b-mut'}">${PED_TXT[p.estado]}</span> ${pesos(p.total)}</span></li>`).join('') || '<li class="vacio">—</li>'}</ul></section>`;
}

// ---------- Productos
function productos() {
  return cab('Productos', 'Lo que se publica aquí aparece en la tienda del sitio con su precio.', '<button class="btn sec" data-venta>Venta de mostrador</button><button class="btn" data-prod="">+ Agregar producto</button>') + `
  <section class="panel tabla"><table class="t"><thead><tr><th></th><th>Producto</th><th class="ocultar-m">Categoría</th><th class="num">Precio</th><th class="num ocultar-m">Margen</th><th>Stock</th><th>En tienda</th></tr></thead><tbody>
  ${db().prods.map((p) => `<tr class="click" data-prod="${p.id}"><td><img class="thumb" src="${foto(p.foto, 120)}" alt=""></td><td><b>${esc(p.n)}</b></td><td class="ocultar-m">${esc(p.cat)}</td><td class="num">${pesos(p.precio)}</td><td class="num ocultar-m">${Math.round((1 - p.costo / p.precio) * 100)}%</td><td><span class="badge ${p.stock <= 0 ? 'b-bad' : p.stock <= p.min ? 'b-warn' : 'b-ok'}">${p.stock}</span></td><td><label class="check" onclick="event.stopPropagation()"><input type="checkbox" data-pub="${p.id}" ${p.pub ? 'checked' : ''} aria-label="Mostrar en la tienda"></label></td></tr>`).join('')}</tbody></table></section>`;
}
function editarProd(id) {
  const p = id ? prod(db(), id) : { n: '', cat: 'Cabello', precio: '', costo: '', stock: 1, min: 2, foto: '', desc: '', pub: true };
  let ft = p.foto;
  ventana(`<form id="fProd">${dlgH(id ? 'Editar producto' : 'Agregar producto')}<div class="dlg-b form">
    <div class="full subir"><img id="prev" src="${foto(p.foto, 300)}" alt="" ${p.foto ? '' : 'style="visibility:hidden"'}><label>Foto<input type="file" id="archivo" accept="image/*"><span class="ayuda">Desde el celular puedes tomarla con la cámara.</span></label></div>
    <label class="full">Nombre<input name="n" required value="${esc(p.n)}"></label>
    <label>Categoría<input name="cat" required list="cats" value="${esc(p.cat)}"><datalist id="cats">${[...new Set(db().prods.map((x) => x.cat))].map((x) => `<option value="${esc(x)}">`).join('')}</datalist></label>
    <label>Piezas<input name="stock" type="number" min="0" required value="${p.stock}"></label>
    <label>Costo<input name="costo" type="number" min="0" required value="${p.costo}"></label><label>Precio<input name="precio" type="number" min="1" required value="${p.precio}"></label>
    <label class="full">Descripción corta<input name="desc" value="${esc(p.desc)}"></label>
    <label class="check full"><input type="checkbox" name="pub" ${p.pub ? 'checked' : ''}> Visible en la tienda</label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  $('#archivo').onchange = async (e) => { try { ft = await comprimir(e.target.files[0], 700); $('#prev').src = ft; $('#prev').style.visibility = ''; } catch (err) { toast(err.message, 'error'); } };
  $('#fProd').onsubmit = (e) => {
    e.preventDefault(); if (!ft) return toast('Agrega una foto: es lo que ve la clienta', 'error');
    const d = Object.fromEntries(new FormData(e.target));
    const datos = { n: d.n.trim(), cat: d.cat.trim(), stock: Math.max(0, Math.round(+d.stock)), costo: +d.costo, precio: +d.precio, desc: d.desc.trim(), pub: !!d.pub, foto: ft };
    id ? Object.assign(p, datos) : db().prods.unshift({ ...datos, id: uid(), min: 2 });
    if (guardar(id ? 'Producto actualizado' : 'Producto publicado en la tienda')) dlg.close();
  };
}
function ventaMostrador() {
  ventana(`<form id="fVen">${dlgH('Venta de mostrador')}<div class="dlg-b form">
    <label class="full">Producto<select name="p">${db().prods.filter((p) => p.stock > 0).map((p) => `<option value="${p.id}">${esc(p.n)} · ${pesos(p.precio)} (hay ${p.stock})</option>`).join('')}</select></label>
    <label>Cantidad<input name="cant" type="number" min="1" value="1"></label><label>Método<select name="met"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Cobrar</button></div></form>`);
  $('#fVen').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const p = prod(db(), f.p.value); const n = Math.round(+f.cant.value);
    if (!(n > 0) || n > p.stock) return toast(`Solo hay ${p.stock}`, 'error');
    p.stock -= n; db().ventas.push({ id: uid(), f: new Date().toISOString(), met: f.met.value, monto: p.precio * n });
    if (guardar(`Venta de ${pesos(p.precio * n)}`)) dlg.close();
  };
}

// ---------- Comisiones y caja
let semana = 0;
function comisionesV() {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + semana * 7);
  const desde = d.toLocaleDateString('en-CA'); d.setDate(d.getDate() + 6); const hasta = d.toLocaleDateString('en-CA');
  const l = comisiones(db(), desde, hasta);
  return cab('Comisiones', `Semana del ${fDia(desde)} al ${fDia(hasta)}.`, `<button class="btn sec" data-sem="-1">← Anterior</button><button class="btn sec" data-sem="1" ${semana >= 0 ? 'disabled' : ''}>Siguiente →</button>`) + `
  <section class="panel tabla"><table class="t"><thead><tr><th>Estilista</th><th class="num">Servicios</th><th class="num">Cobrado</th><th class="num ocultar-m">Comisión</th><th class="num ocultar-m">Productos (${db().conf.comProd}%)</th><th class="num">Propinas</th><th class="num">A pagar</th></tr></thead><tbody>
  ${l.map((x) => `<tr><td><b>${esc(x.e.n)}</b></td><td class="num">${x.n}</td><td class="num">${pesos(x.serv)}</td><td class="num ocultar-m">${x.e.com}%</td><td class="num ocultar-m">${pesos(x.prods * db().conf.comProd / 100)}</td><td class="num">${pesos(x.prop)}</td><td class="num"><b>${pesos(x.pagar)}</b></td></tr>`).join('')}
  <tr><td><b>Total</b></td><td class="num">${l.reduce((s, x) => s + x.n, 0)}</td><td class="num">${pesos(l.reduce((s, x) => s + x.serv, 0))}</td><td class="ocultar-m"></td><td class="ocultar-m"></td><td class="num">${pesos(l.reduce((s, x) => s + x.prop, 0))}</td><td class="num"><b>${pesos(l.reduce((s, x) => s + x.pagar, 0))}</b></td></tr></tbody></table>
  <p class="ayuda">Se paga sobre lo cobrado: los descuentos por cupón y los regalos reducen la base.</p></section>`;
}
function caja() {
  const v = ventasDe(dia(), dia()); const por = (m) => v.filter((x) => x.met === m).reduce((s, x) => s + x.monto, 0);
  const dias = [...Array(14)].map((_, i) => { const d = dia(-13 + i); return { k: d.slice(8), v: ventasDe(d, d).reduce((s, x) => s + x.monto, 0) }; });
  return cab('Caja', `Corte del día ${fDia(dia())}.`) + `
  <div class="kpis"><div class="kpi"><span>Efectivo</span><b>${pesos(por('Efectivo'))}</b></div><div class="kpi"><span>Tarjeta</span><b>${pesos(por('Tarjeta'))}</b></div><div class="kpi"><span>Transferencia</span><b>${pesos(por('Transferencia'))}</b><small>incluye anticipos</small></div><div class="kpi"><span>Total del día</span><b>${pesos(v.reduce((s, x) => s + x.monto, 0))}</b></div></div>
  <div class="grid2"><section class="panel"><h2>Últimos 14 días</h2>${barras(dias)}</section>
  <section class="panel"><h2>Movimientos de hoy</h2><ul class="lista-mini">${v.sort((a, b) => b.f.localeCompare(a.f)).map((x) => `<li><div>${esc(x.tipo)}<br><small>${esc(x.met)} · ${new Date(x.f).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</small></div><span class="der">${pesos(x.monto)}</span></li>`).join('') || '<li class="vacio">Sin movimientos</li>'}</ul></section></div>`;
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  return cab('Ajustes', 'Servicios, estilistas, regalo, niveles y anticipos. El sitio se actualiza al guardar.') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre<input name="nombre" required value="${esc(c.nombre)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label>
    <label>Abre<input name="abre" type="time" step="1800" value="${c.abre}"></label><label>Cierra<input name="cierra" type="time" step="1800" value="${c.cierra}"></label>
    <label>Visitas para el regalo<input name="visitas" type="number" min="3" max="30" value="${c.visitas}"></label><label>Regalo<select name="premioServ">${db().servs.map((s) => `<option value="${s.id}" ${s.id === c.premioServ ? 'selected' : ''}>${esc(s.n)} gratis</option>`).join('')}</select></label>
    <label>Pedir anticipo desde ($)<input name="anticipoDesde" type="number" min="0" value="${c.anticipoDesde}"></label><label>Anticipo (%)<input name="anticipoPct" type="number" min="0" max="100" value="${c.anticipoPct}"></label>
    <label>Inactiva después de (días)<input name="inactivo" type="number" min="7" value="${c.inactivo}"></label><label>Comisión en productos (%)<input name="comProd" type="number" min="0" max="100" value="${c.comProd}"></label>
    ${c.niveles.map((n, i) => `<label>Nivel ${esc(n.n)}: desde visitas · % productos<span style="display:flex;gap:6px"><input name="nd${i}" type="number" min="0" value="${n.desde}" ${i ? '' : 'readonly'}><input name="np${i}" type="number" min="0" max="50" value="${n.desc}"></span></label>`).join('')}
    <label>PIN del panel<input name="pin" required minlength="4" maxlength="6" value="${esc(c.pin)}"></label><span></span>
    <h3 class="full" style="margin:10px 0 0">Servicios ($ · minutos)</h3>
    ${db().servs.map((s) => `<label>${esc(s.n)}<span style="display:flex;gap:6px"><input name="p_${s.id}" type="number" min="0" value="${s.precio}"><input name="d_${s.id}" type="number" min="30" step="30" value="${s.dur}"></span></label>`).join('')}
    <h3 class="full" style="margin:10px 0 0">Estilistas</h3>
    ${db().ests.map((e) => `<label>${esc(e.n)}: comisión (%)<span style="display:flex;gap:10px;align-items:center"><input name="c_${e.id}" type="number" min="0" max="100" value="${e.com}"><span class="check"><input type="checkbox" name="a_${e.id}" ${e.activo ? 'checked' : ''}> activa</span></span></label>`).join('')}
    <div class="full"><button class="btn">Guardar</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación
const VISTAS = { inicio, clientes: clientas, promos, pedidos, comisiones: comisionesV, productos, caja, ajustes };
function pintar() {
  const r = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio';
  $('#vista').innerHTML = VISTAS[r]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
  const n = { nHoy: db().citas.filter((c) => c.fecha === dia() && ['reservada', 'llego', 'atencion'].includes(c.estado)).length, nPro: inactivas().filter((c) => !db().avisos['in' + c.id + dia().slice(0, 7)]).length, nPed: db().pedidos.filter((p) => ['nuevo', 'listo'].includes(p.estado)).length, nProd: db().prods.filter((p) => p.stock <= p.min).length };
  for (const [k, v] of Object.entries(n)) { $('#' + k).hidden = !v; $('#' + k).textContent = v; }
  if (r === 'inicio') $('#fAg').onchange = (e) => { fAg = e.target.value || dia(); pintar(); };
  if (r === 'clientes') $('#qCli').oninput = (e) => { qCli = e.target.value; pintar(); const i = $('#qCli'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  if (r === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const c = db().conf;
      if (d.cierra <= d.abre) return toast('La hora de cierre debe ser después de la apertura', 'error');
      Object.assign(c, { nombre: d.nombre.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), abre: d.abre, cierra: d.cierra, visitas: +d.visitas, premioServ: d.premioServ, premio: serv(db(), d.premioServ).n + ' gratis', anticipoDesde: +d.anticipoDesde, anticipoPct: +d.anticipoPct, inactivo: +d.inactivo, comProd: +d.comProd, pin: d.pin.trim() });
      c.niveles.forEach((n, i) => { n.desde = i ? +d['nd' + i] : 0; n.desc = +d['np' + i]; });
      db().servs.forEach((s) => { s.precio = +d['p_' + s.id]; s.dur = Math.max(30, Math.round(+d['d_' + s.id] / 30) * 30); });
      db().ests.forEach((x) => { x.com = +d['c_' + x.id]; x.activo = !!d['a_' + x.id]; });
      guardar('Ajustes guardados');
    };
    $('#reiniciar').onclick = () => { if (confirm('Se borran tus cambios y vuelven los datos de ejemplo. ¿Continuar?')) { B.reiniciar(); pintar(); toast('Demo reiniciado'); } };
  }
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-cita]'))) return verCita(el.dataset.cita);
  if ((el = q('[data-nueva]'))) return nueva(el.dataset.nueva, el.dataset.h);
  if (q('[data-walkin]')) return nueva(db().ests.find((x) => x.activo)?.id, '', true);
  if ((el = q('[data-dia]'))) { let d = new Date(Date.parse(fAg + 'T12:00') + el.dataset.dia * 864e5).toLocaleDateString('en-CA'); if (domingo(d)) d = new Date(Date.parse(d + 'T12:00') + el.dataset.dia * 864e5).toLocaleDateString('en-CA'); fAg = d; return pintar(); }
  if ((el = q('[data-cli]')) && !q('a')) return verCli(el.dataset.cli);
  if ((el = q('[data-filtro]'))) { filtro = el.dataset.filtro; return pintar(); }
  if ((el = q('[data-cupon]'))) return editarCupon(el.dataset.cupon);
  if ((el = q('[data-ped]'))) {
    const p = db().pedidos.find((x) => x.folio === el.dataset.ped);
    if (el.dataset.a === 'listo') { p.estado = 'listo'; return guardar(`${p.folio} listo: avísale a la clienta`); }
    if (el.dataset.a === 'cancelar') { if (confirm(`¿Cancelar ${p.folio}? Las piezas regresan al inventario.`)) { cancelarPedido(db(), p); guardar('Pedido cancelado'); } return; }
    const met = prompt(`Cobrar ${pesos(p.total)}. Método (Efectivo, Tarjeta, Transferencia):`, 'Tarjeta'); if (!met) return;
    Object.assign(p, { estado: 'entregado', pagado: true, met, fPago: new Date().toISOString() }); return guardar(`${p.folio} entregado y cobrado`);
  }
  if ((el = q('[data-prod]')) && !q('[data-pub]')) return editarProd(el.dataset.prod);
  if (q('[data-venta]')) return ventaMostrador();
  if ((el = q('[data-sem]'))) { semana = Math.min(0, semana + +el.dataset.sem); return pintar(); }
  if ((el = q('[data-avisar]'))) { db().avisos[el.dataset.avisar] = new Date().toISOString(); setTimeout(() => guardar('Marcado como enviado'), 300); }
});
document.addEventListener('change', (e) => { const c = e.target.closest('[data-pub]'); if (c) { const p = prod(db(), c.dataset.pub); p.pub = c.checked; guardar(p.pub ? 'Visible en la tienda' : 'Oculto de la tienda'); } });
addEventListener('hashchange', pintar);

let antes = { c: db().citas.filter((x) => x.estado !== 'cancelada').length, p: db().pedidos.length };
B.alCambiar(() => {
  const act = db().citas.filter((x) => x.estado !== 'cancelada').length;
  if (act > antes.c) { const c = db().citas.at(-1); toast(`🌸 Reserva en línea: ${cli(db(), c.cli)?.n} · ${serv(db(), c.serv).n} con ${est(db(), c.est).n}, ${fDia(c.fecha)} ${c.hora}`); }
  else if (act < antes.c) toast('Una clienta canceló su cita: el horario quedó libre');
  if (db().pedidos.length > antes.p) { const p = db().pedidos.at(-1); toast(`🛍️ Pedido ${p.folio} de ${cli(db(), p.cli)?.n}: ${pesos(p.total)}`); }
  antes = { c: act, p: db().pedidos.length };
  pintar();
});
puerta('salon', db().conf.pin, () => { $('#app').hidden = false; pintar(); });
