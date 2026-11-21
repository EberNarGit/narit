// Panel de la barbería: agenda por barbero, cobro con sellos, clientes, promociones, comisiones, productos y caja.
import { $, $$, esc, pesos, fecha, wa, toast, puerta, barras, uid, foto } from '../_base/sis.js';
import { abrir, dia, fDia, loc, domingo, diasEntre, fin, serv, barb, cli, enClub, libres, reservar, cobroDe, terminar, comisiones, visitas, ultima, frecuencia, EST_TXT } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const ventana = (html, ancho = false) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;
const ini = (n) => n.split(' ').slice(0, 2).map((x) => x[0]).join('');
const waC = (c, m) => wa('52' + c.tel, m);
const hola = (c) => `Qué onda ${c.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}.`;
const sitio = () => new URL('index.html', location.href).href;
const min = (h) => +h.slice(0, 2) * 60 + +h.slice(3);
const ventasDe = (d1, d2) => [
  ...db().citas.filter((c) => c.venta && loc(c.venta.f) >= d1 && loc(c.venta.f) <= d2).map((c) => ({ f: c.venta.f, met: c.venta.met, monto: c.venta.servicio + c.venta.prods + c.venta.propina, prop: c.venta.propina, tipo: 'Servicio' })),
  ...db().ventas.filter((v) => loc(v.f) >= d1 && loc(v.f) <= d2).map((v) => ({ ...v, prop: 0, tipo: 'Mostrador' })),
  ...db().pagos.filter((p) => loc(p.f) >= d1 && loc(p.f) <= d2).map((p) => ({ ...p, prop: 0, tipo: 'Club' })),
];
const inactivos = () => db().clis.filter((c) => ultima(db(), c.id) && diasEntre(ultima(db(), c.id), dia()) > db().conf.inactivo && !db().citas.some((x) => x.cli === c.id && x.fecha >= dia() && x.estado === 'reservada'));
const cumples = () => db().clis.filter((c) => c.cumple && c.cumple.slice(0, 2) === dia().slice(5, 7));
const casiPremio = () => db().clis.filter((c) => c.sellos >= db().conf.sellos - 1);

// ---------- Agenda por barbero
let fAg = domingo(dia()) ? dia(1) : dia();
function inicio() {
  const cs = db().citas.filter((c) => c.fecha === fAg);
  const activas = cs.filter((c) => !['cancelada', 'falto'].includes(c.estado));
  const abierto = (min(db().conf.cierra) - min(db().conf.abre)) * db().barbs.filter((b) => b.activo).length;
  const ocup = Math.round((activas.reduce((s, c) => s + c.dur, 0) / abierto) * 100);
  const vHoy = ventasDe(fAg, fAg);
  const mes = dia().slice(0, 7);
  const faltas = db().citas.filter((c) => c.estado === 'falto' && c.fecha.startsWith(mes)).length;
  return cab('Agenda', `${fDia(fAg)}${fAg === dia() ? ' · hoy' : ''}. Toca un espacio libre para agendar o un cliente para atenderlo.`,
    `<button class="btn sec" data-dia="-1" aria-label="Día anterior">←</button><input type="date" id="fAg" value="${fAg}" aria-label="Día" style="padding:8px;border:1px solid var(--ln);border-radius:10px"><button class="btn sec" data-dia="1" aria-label="Día siguiente">→</button><button class="btn" data-walkin>+ Cliente sin cita</button>`) + `
  <div class="kpis">
    <div class="kpi"><span>Citas</span><b>${activas.length}</b><small>${activas.filter((c) => c.origen === 'en línea').length} reservadas en línea</small></div>
    <div class="kpi"><span>Ocupación de sillas</span><b>${ocup}%</b><small>${domingo(fAg) ? 'cerrado' : 'del horario de los barberos'}</small></div>
    <div class="kpi"><span>Vendido</span><b>${pesos(vHoy.reduce((s, v) => s + v.monto, 0))}</b><small>propinas ${pesos(vHoy.reduce((s, v) => s + v.prop, 0))}</small></div>
    <div class="kpi ${faltas ? 'alerta' : ''}"><span>No llegaron este mes</span><b>${faltas}</b><small>sillas perdidas</small></div>
  </div>
  ${domingo(fAg) ? '<p class="vacio panel">Domingo: la barbería está cerrada.</p>' : grid(fAg)}`;
}
function grid(f) {
  const bs = db().barbs.filter((b) => b.activo);
  const a = min(db().conf.abre), z = min(db().conf.cierra), n = (z - a) / 30;
  const fila = (h) => (min(h) - a) / 30 + 2;
  const ahora = f === dia() ? new Date().getHours() * 60 + new Date().getMinutes() : f < dia() ? 99999 : 0;
  let html = `<div class="agenda" style="grid-template-columns:52px repeat(${bs.length},minmax(150px,1fr));grid-template-rows:auto repeat(${n},42px)"><span></span>${bs.map((b) => `<div class="hd"><img src="${foto(b.foto, 80)}" alt="">${esc(b.n)}</div>`).join('')}`;
  for (let i = 0; i < n; i++) {
    const m = a + i * 30; const h = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    html += `<span class="hr" style="grid-row:${i + 2};grid-column:1">${h}</span>`;
    bs.forEach((b, k) => { html += m < ahora ? `<span class="pasado" style="grid-row:${i + 2};grid-column:${k + 2}"></span>` : `<button class="libre" style="grid-row:${i + 2};grid-column:${k + 2}" data-nueva="${b.id}" data-h="${h}" aria-label="Agendar con ${esc(b.n)} a las ${h}">+ ${h}</button>`; });
  }
  for (const c of db().citas.filter((x) => x.fecha === f && x.estado !== 'cancelada')) {
    const k = bs.findIndex((b) => b.id === c.barb); if (k < 0) continue; const cl = cli(db(), c.cli);
    html += `<button class="blq ${c.estado}" style="grid-column:${k + 2};grid-row:${fila(c.hora)} / span ${c.dur / 30}" data-cita="${c.id}"><span class="tg">${EST_TXT[c.estado]}${c.origen === 'en línea' ? ' · en línea' : ''}</span><b>${esc(cl?.n || 'Cliente')}</b>${esc(serv(db(), c.serv).n)} · ${c.hora}–${fin(c)}${cl && cl.sellos >= db().conf.sellos ? '<br>🎁 Tiene premio' : cl && enClub(db(), cl) ? '<br>⭐ Club' : ''}</button>`;
  }
  return html + '</div>';
}

function verCita(id) {
  const c = db().citas.find((x) => x.id === id); const cl = cli(db(), c.cli); const s = serv(db(), c.serv);
  const sig = { reservada: ['llego', 'Llegó'], llego: ['silla', 'Pasar a la silla'], silla: ['cobrar', 'Terminar y cobrar'] }[c.estado];
  const v = c.venta;
  ventana(`${dlgH(`${esc(cl?.n || 'Cliente')} <span class="badge">${EST_TXT[c.estado]}</span>`)}<div class="dlg-b">
    <p style="margin:0"><b>${esc(s.n)}</b> con ${esc(barb(db(), c.barb).n)} · ${fDia(c.fecha)} ${c.hora}–${fin(c)}${c.nota ? ` · 📝 ${esc(c.nota)}` : ''}</p>
    ${cl ? `<div class="aviso" style="margin-top:12px"><b>Cómo le gusta:</b> ${esc(cl.pref || 'Sin nota todavía')}</div>
      <p style="margin:8px 0"><span class="sellos">${[...Array(db().conf.sellos)].map((_, i) => `<i class="${i < cl.sellos ? 'si' : ''}"></i>`).join('')}</span> ${cl.sellos}/${db().conf.sellos} sellos${enClub(db(), cl) ? ' · ⭐ socio del club' : ''} · ${visitas(db(), cl.id).length} visitas</p>` : ''}
    ${v ? `<table class="t"><tbody><tr><td>Servicio${v.motivo ? ` (${v.motivo})` : ''}</td><td class="num">${pesos(v.servicio)}</td></tr><tr><td>Productos</td><td class="num">${pesos(v.prods)}</td></tr><tr><td>Propina</td><td class="num">${pesos(v.propina)}</td></tr><tr><td><b>Total · ${esc(v.met)}</b></td><td class="num"><b>${pesos(v.servicio + v.prods + v.propina)}</b></td></tr></tbody></table>` : ''}
  </div><div class="dlg-p">
    ${['reservada', 'llego'].includes(c.estado) ? '<button class="btn sec" id="falto">No llegó</button><button class="btn sec" id="cancelar">Cancelar</button>' : ''}
    ${cl ? `<a class="btn sec" target="_blank" rel="noopener" href="${waC(cl, `${hola(cl)} Te esperamos ${fDia(c.fecha)} a las ${c.hora} con ${barb(db(), c.barb).n}. Si no llegas, cancela aquí para liberar el lugar: ${sitio()}#portal`)}">📱 Recordar</a>` : ''}
    ${sig ? `<button class="btn" id="sig">${sig[1]}</button>` : ''}</div>`);
  $('#sig') && ($('#sig').onclick = () => { if (sig[0] === 'cobrar') return cobrar(c); c.estado = sig[0]; if (guardar(`${cl?.n}: ${EST_TXT[c.estado]}`)) verCita(id); });
  $('#falto') && ($('#falto').onclick = () => { c.estado = 'falto'; if (guardar('Marcado: no llegó')) dlg.close(); });
  $('#cancelar') && ($('#cancelar').onclick = () => { if (confirm('¿Cancelar la cita?')) { c.estado = 'cancelada'; if (guardar('Cita cancelada, lugar liberado')) dlg.close(); } });
}

function cobrar(c) {
  const cl = cli(db(), c.cli); const s = serv(db(), c.serv);
  const puedeCanje = cl && cl.sellos >= db().conf.sellos;
  const sel = {};
  ventana(`<form id="fCob">${dlgH(`Cobrar · ${esc(cl?.n || 'Cliente')}`)}<div class="dlg-b form">
    ${puedeCanje ? `<label class="check full aviso"><input type="checkbox" name="canje" checked> 🎁 Canjear premio: ${esc(db().conf.premio)} (${cl.sellos} sellos)</label>` : ''}
    <div class="full"><b>Productos</b><ul class="lista-mini">${db().prods.map((p) => `<li><img class="thumb" src="${foto(p.foto, 120)}" alt=""><div>${esc(p.n)}<br><small>${pesos(p.precio)} · hay ${p.stock}</small></div><span class="der cant"><button type="button" data-q="${p.id}" data-d="-1" aria-label="Menos">−</button><b id="q_${p.id}">0</b><button type="button" data-q="${p.id}" data-d="1" aria-label="Más" ${p.stock ? '' : 'disabled'}>+</button></span></li>`).join('')}</ul></div>
    <label>Propina<input name="propina" type="number" min="0" step="10" value="0"></label>
    <label>Método<select name="met"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
    <p class="full aviso" id="tot" style="font-size:1.1rem"></p>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Cobrar y sumar sello</button></div></form>`);
  const f = $('#fCob');
  const prods = () => Object.entries(sel).filter(([, n]) => n > 0).map(([id, cant]) => ({ id, cant }));
  const tot = () => { const k = cobroDe(db(), c, { productos: prods(), canje: f.canje?.checked }); $('#tot').innerHTML = `${esc(s.n)}: <b>${k.servicio ? pesos(k.servicio) : k.motivo === 'club' ? 'incluido en el club' : 'gratis (premio)'}</b> · productos ${pesos(k.prods)} · propina ${pesos(+f.propina.value)}<br>Total: <b style="font-size:1.4rem">${pesos(k.servicio + k.prods + (+f.propina.value || 0))}</b>`; };
  f.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; const p = db().prods.find((x) => x.id === b.dataset.q); sel[p.id] = Math.max(0, Math.min(p.stock, (sel[p.id] || 0) + +b.dataset.d)); $('#q_' + p.id).textContent = sel[p.id]; tot(); });
  f.addEventListener('input', tot); f.addEventListener('change', tot); tot();
  f.onsubmit = (e) => {
    e.preventDefault();
    try { terminar(db(), c, { productos: prods(), propina: +f.propina.value, met: f.met.value, canje: !!f.canje?.checked }); } catch (err) { return toast(err.message, 'error'); }
    if (guardar(`Cobrado. ${cl ? `${cl.n.split(' ')[0]} lleva ${cl.sellos}/${db().conf.sellos} sellos` : ''}`)) verCita(c.id);
  };
}

function nueva(bId, hora, walkin = false) {
  const f0 = walkin ? dia() : fAg;
  ventana(`<form id="fNueva">${dlgH(walkin ? 'Cliente sin cita' : 'Nueva cita')}<div class="dlg-b form">
    <label class="full">Cliente<select name="cli"><option value="">+ Cliente nuevo</option>${db().clis.map((c) => `<option value="${c.id}">${esc(c.n)} · ${c.tel}</option>`).join('')}</select></label>
    <label class="nuevo">Nombre<input name="n"></label><label class="nuevo">WhatsApp (opcional)<input name="tel" inputmode="tel"></label>
    <label>Servicio<select name="serv">${db().servs.map((s) => `<option value="${s.id}">${esc(s.n)} · ${s.dur} min</option>`).join('')}</select></label>
    <label>Barbero<select name="barb">${db().barbs.filter((b) => b.activo).map((b) => `<option value="${b.id}" ${b.id === bId ? 'selected' : ''}>${esc(b.n)}</option>`).join('')}</select></label>
    <label>Día<input type="date" name="fecha" value="${f0}" min="${dia()}" ${walkin ? 'readonly' : ''}></label><label>Hora<select name="hora" id="selH"></select></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">${walkin ? 'Pasar a la silla' : 'Agendar'}</button></div></form>`);
  const f = $('#fNueva');
  const sync = () => {
    $$('.nuevo', f).forEach((x) => (x.hidden = !!f.cli.value)); f.n.required = !f.cli.value;
    const l = libres(db(), f.barb.value, f.fecha.value, serv(db(), f.serv.value).dur);
    const v = f.hora.value || hora;
    f.hora.innerHTML = l.map((h) => `<option ${h === v ? 'selected' : ''}>${h}</option>`).join('') || '<option value="">Sin horario</option>';
  };
  f.addEventListener('change', (e) => { if (e.target !== f.hora) sync(); }); sync();
  f.onsubmit = (e) => {
    e.preventDefault(); if (!f.hora.value) return toast('Ese barbero no tiene horario libre', 'error');
    let cid = f.cli.value;
    if (!cid) {
      const tel = f.tel.value.replace(/\D/g, '').slice(-10);
      if (tel && tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      if (tel && db().clis.some((c) => c.tel === tel)) return toast('Ese teléfono ya está registrado: elígelo en la lista', 'error');
      cid = uid(); db().clis.push({ id: cid, n: f.n.value.trim(), tel, cumple: '', pref: '', alta: dia(), sellos: 0, canjes: 0, club: '', ref: f.n.value.trim().slice(0, 3).toUpperCase() + (tel.slice(-3) || uid().slice(0, 3)), refPor: '' });
    }
    let c;
    try { c = reservar(db(), { cli: cid, barb: f.barb.value, serv: f.serv.value, fecha: f.fecha.value, hora: f.hora.value, origen: 'mostrador' }); } catch (err) { return toast(err.message, 'error'); }
    if (walkin) c.estado = 'silla';
    fAg = c.fecha; location.hash = 'inicio';
    if (guardar(walkin ? 'En la silla' : 'Cita agendada')) dlg.close();
  };
}

// ---------- Clientes
let qCli = '', filtro = 'todos';
function clientes() {
  const q = qCli.toLowerCase();
  const grupos = { todos: db().clis, inactivos: inactivos(), club: db().clis.filter((c) => enClub(db(), c)), premio: casiPremio(), cumple: cumples() };
  const l = grupos[filtro].filter((c) => !q || (c.n + c.tel).toLowerCase().includes(q)).sort((a, b) => (ultima(db(), b.id) || '').localeCompare(ultima(db(), a.id) || ''));
  const nom = { todos: 'Todos', inactivos: `Sin venir +${db().conf.inactivo} días`, club: 'Club', premio: 'Cerca del premio', cumple: 'Cumpleaños del mes' };
  return cab('Clientes', 'La base es de la barbería, no del celular de cada barbero.') + `
  <div class="chips">${Object.entries(grupos).map(([k, g]) => `<button data-filtro="${k}" aria-pressed="${filtro === k}">${nom[k]} · ${g.length}</button>`).join('')}</div>
  <div class="filtros"><input id="qCli" type="search" placeholder="Buscar por nombre o teléfono…" value="${esc(qCli)}" aria-label="Buscar cliente"></div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Cliente</th><th>Última visita</th><th class="ocultar-m">Viene cada</th><th>Sellos</th><th class="ocultar-m">Barbero</th><th></th></tr></thead><tbody>
  ${l.map((c) => { const u = ultima(db(), c.id); const v = visitas(db(), c.id); const fav = v.length ? barb(db(), Object.entries(v.reduce((m, x) => ((m[x.barb] = (m[x.barb] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0][0])?.n : '—';
    return `<tr class="click" data-cli="${c.id}"><td><span class="ini">${ini(c.n)}</span><b>${esc(c.n)}</b>${enClub(db(), c) ? ' ⭐' : ''}</td><td>${u ? `${diasEntre(u, dia())} días${diasEntre(u, dia()) > db().conf.inactivo ? ' <span class="badge b-bad">Inactivo</span>' : ''}` : '—'}</td><td class="ocultar-m">${frecuencia(db(), c.id) ? frecuencia(db(), c.id) + ' días' : '—'}</td><td>${c.sellos}/${db().conf.sellos}${c.sellos >= db().conf.sellos ? ' 🎁' : ''}</td><td class="ocultar-m">${esc(fav)}</td>
      <td>${c.tel ? `<a class="btn mini sec" target="_blank" rel="noopener" href="${waC(c, hola(c))}" aria-label="WhatsApp">📱</a>` : ''}</td></tr>`; }).join('') || '<tr><td colspan="6" class="vacio">Nadie en este grupo</td></tr>'}</tbody></table></section>`;
}
function verCli(id) {
  const c = cli(db(), id); const v = visitas(db(), id);
  const gastado = v.reduce((s, x) => s + (x.venta ? x.venta.servicio + x.venta.prods : 0), 0);
  ventana(`${dlgH(esc(c.n) + (enClub(db(), c) ? ' ⭐' : ''))}<div class="dlg-b">
    <div class="kpis"><div class="kpi"><span>Visitas</span><b>${v.length}</b></div><div class="kpi"><span>Viene cada</span><b>${frecuencia(db(), id) || '—'}</b><small>días</small></div><div class="kpi"><span>Ha gastado</span><b>${pesos(gastado)}</b></div><div class="kpi"><span>Sellos</span><b>${c.sellos}/${db().conf.sellos}</b><small>${c.canjes} premios</small></div></div>
    <form class="form" id="fCli"><label class="full">Cómo le gusta (lo ven los barberos y el cliente)<textarea name="pref">${esc(c.pref)}</textarea></label>
      <label>Cumpleaños (MM-DD)<input name="cumple" pattern="\\d{2}-\\d{2}" value="${esc(c.cumple)}" placeholder="03-14"></label><label>WhatsApp<input name="tel" value="${esc(c.tel)}"></label>
      <div class="full acc"><button class="btn">Guardar</button><button type="button" class="btn sec" id="sello">+1 sello</button><button type="button" class="btn sec" id="club">${enClub(db(), c) ? 'Renovar club' : 'Activar club'} (${pesos(db().conf.club)})</button></div></form>
    <h3 style="margin:16px 0 6px">Historial</h3><ul class="lista-mini">${v.slice(0, 10).map((x) => `<li><div>${esc(serv(db(), x.serv).n)} · ${esc(barb(db(), x.barb).n)}<br><small>${fDia(x.fecha)}</small></div><span class="der">${x.venta?.motivo ? `<span class="badge b-ok">${x.venta.motivo}</span>` : pesos(x.venta ? x.venta.servicio + x.venta.prods : 0)}</span></li>`).join('') || '<li class="vacio">Sin visitas</li>'}</ul>
  </div>`, true);
  $('#fCli').onsubmit = (e) => { e.preventDefault(); const f = e.target; c.pref = f.pref.value.trim(); c.cumple = f.cumple.value.trim(); c.tel = f.tel.value.replace(/\D/g, '').slice(-10); if (guardar('Cliente actualizado')) verCli(id); };
  $('#sello').onclick = () => { c.sellos++; if (guardar('Sello agregado')) verCli(id); };
  $('#club').onclick = () => {
    const met = prompt(`Cobrar ${pesos(db().conf.club)} del club. Método (Efectivo, Tarjeta, Transferencia):`, 'Tarjeta'); if (!met) return;
    const base = enClub(db(), c) ? c.club : dia(); const d = new Date(base + 'T12:00'); d.setMonth(d.getMonth() + 1);
    c.club = d.toLocaleDateString('en-CA'); db().pagos.push({ id: uid(), cli: id, monto: db().conf.club, met, f: new Date().toISOString(), concepto: 'Club mensual' });
    if (guardar(`Club activo hasta ${fDia(c.club)}`)) verCli(id);
  };
}

// ---------- Lealtad y promociones
function promos() {
  const av = (k) => db().avisos[k];
  const btn = (k, c, m) => (!c.tel ? '<small>sin WhatsApp</small>' : av(k) ? `<span class="badge b-ok">Avisado ${fecha(av(k))}</span>` : `<a class="btn mini" target="_blank" rel="noopener" data-avisar="${k}" href="${waC(c, m)}">📱 Enviar</a>`);
  const mes = dia().slice(0, 7);
  const lista = (titulo, sub, l, k, msg) => `<section class="panel"><h2>${titulo} (${l.length})</h2><p class="ayuda" style="margin:-4px 0 8px">${sub}</p><ul class="lista-mini">${l.map((c) => `<li><span class="ini">${ini(c.n)}</span><div><b>${esc(c.n)}</b><br><small>${ultima(db(), c.id) ? `Última visita hace ${diasEntre(ultima(db(), c.id), dia())} días` : 'Sin visitas'} · ${c.sellos} sellos</small></div><div class="der">${btn(k + c.id + mes, c, msg(c))}</div></li>`).join('') || '<li class="vacio">Nadie por ahora ✓</li>'}</ul></section>`;
  const valor = inactivos().length * serv(db(), 'corte').precio;
  return cab('Lealtad y promociones', 'Mensajes listos para traer de vuelta a cada cliente. Uno por uno, desde el WhatsApp de la barbería.') + `
  <div class="kpis"><div class="kpi alerta"><span>Clientes inactivos</span><b>${inactivos().length}</b><small>${pesos(valor)} en cortes por recuperar</small></div>
    <div class="kpi"><span>Socios del club</span><b>${db().clis.filter((c) => enClub(db(), c)).length}</b><small>${pesos(db().clis.filter((c) => enClub(db(), c)).length * db().conf.club)} fijos al mes</small></div>
    <div class="kpi"><span>Premios canjeados</span><b>${db().clis.reduce((s, c) => s + c.canjes, 0)}</b></div>
    <div class="kpi"><span>Llegaron por referido</span><b>${db().clis.filter((c) => c.refPor).length}</b></div></div>
  ${lista(`Sin venir más de ${db().conf.inactivo} días`, 'Están a punto de irse con otro barbero.', inactivos(), 'in', (c) => `${hola(c)} Te extrañamos en la silla 💈 Esta semana tu corte lleva barba de cortesía. Reserva en 30 segundos: ${sitio()}`)}
  ${lista('A un sello o con premio', 'Recordarles su premio los trae de vuelta.', casiPremio(), 'pr', (c) => `${hola(c)} ${c.sellos >= db().conf.sellos ? `¡Ya tienes tu ${db().conf.premio.toLowerCase()}! 🎁` : '¡Te falta 1 sello para tu corte gratis!'} Reserva aquí: ${sitio()}`)}
  ${lista('Cumpleaños del mes', 'Un detalle que se recuerda.', cumples(), 'cu', (c) => `${hola(c)} ¡Feliz cumpleaños! 🎂 Este mes tu barba va por nuestra cuenta. Reserva: ${sitio()}`)}`;
}

// ---------- Comisiones
let semana = 0;
function comisionesV() {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + semana * 7);
  const desde = d.toLocaleDateString('en-CA'); d.setDate(d.getDate() + 6); const hasta = d.toLocaleDateString('en-CA');
  const l = comisiones(db(), desde, hasta);
  const cerrada = db().cierres.find((x) => x.desde === desde);
  return cab('Comisiones', `Semana del ${fDia(desde)} al ${fDia(hasta)}. Se calculan solas con cada cobro.`, `<button class="btn sec" data-sem="-1">← Anterior</button><button class="btn sec" data-sem="1" ${semana >= 0 ? 'disabled' : ''}>Siguiente →</button>`) + `
  <section class="panel tabla"><table class="t"><thead><tr><th>Barbero</th><th class="num">Cortes</th><th class="num">Servicios</th><th class="num ocultar-m">% servicio</th><th class="num ocultar-m">Productos (${db().conf.comProd}%)</th><th class="num">Propinas</th><th class="num">A pagar</th></tr></thead><tbody>
    ${l.map((x) => `<tr><td><b>${esc(x.b.n)}</b></td><td class="num">${x.cortes}</td><td class="num">${pesos(x.serv)}</td><td class="num ocultar-m">${x.b.com}% = ${pesos(x.serv * x.b.com / 100)}</td><td class="num ocultar-m">${pesos(x.prods * db().conf.comProd / 100)}</td><td class="num">${pesos(x.prop)}</td><td class="num"><b>${pesos(x.pagar)}</b></td></tr>`).join('')}
    <tr><td><b>Total</b></td><td class="num">${l.reduce((s, x) => s + x.cortes, 0)}</td><td class="num">${pesos(l.reduce((s, x) => s + x.serv, 0))}</td><td class="ocultar-m"></td><td class="ocultar-m"></td><td class="num">${pesos(l.reduce((s, x) => s + x.prop, 0))}</td><td class="num"><b>${pesos(l.reduce((s, x) => s + x.pagar, 0))}</b></td></tr></tbody></table>
    <p style="margin-top:12px">${cerrada ? `<span class="badge b-ok">Pagada el ${fecha(cerrada.f)}</span>` : `<button class="btn" data-cerrar-sem="${desde}">Marcar semana como pagada</button>`}</p>
    <p class="ayuda">Servicios pagados con premio o con el club cuentan $0 para comisión. Cambia los porcentajes en Ajustes.</p></section>`;
}

// ---------- Productos
function productos() {
  return cab('Productos', 'Inventario y venta en mostrador. Lo que se vende en la silla se descuenta solo.', '<button class="btn" data-venta>Venta de mostrador</button>') + `
  <section class="panel tabla"><table class="t"><thead><tr><th></th><th>Producto</th><th class="num">Precio</th><th class="num ocultar-m">Margen</th><th>Stock</th><th></th></tr></thead><tbody>
  ${db().prods.map((p) => `<tr><td><img class="thumb" src="${foto(p.foto, 120)}" alt=""></td><td><b>${esc(p.n)}</b></td><td class="num">${pesos(p.precio)}</td><td class="num ocultar-m">${Math.round((1 - p.costo / p.precio) * 100)}%</td><td><span class="badge ${p.stock <= 0 ? 'b-bad' : p.stock <= p.min ? 'b-warn' : 'b-ok'}">${p.stock}</span></td><td><button class="btn mini sec" data-entrada="${p.id}">+ Entrada</button></td></tr>`).join('')}</tbody></table></section>`;
}

// ---------- Caja
function caja() {
  const v = ventasDe(dia(), dia());
  const por = (m) => v.filter((x) => x.met === m).reduce((s, x) => s + x.monto, 0);
  const dias = [...Array(14)].map((_, i) => { const d = dia(-13 + i); return { k: d.slice(8), v: ventasDe(d, d).reduce((s, x) => s + x.monto, 0) }; });
  return cab('Caja', `Corte del día ${fDia(dia())}.`) + `
  <div class="kpis"><div class="kpi"><span>Efectivo</span><b>${pesos(por('Efectivo'))}</b><small>debe haber en caja</small></div><div class="kpi"><span>Tarjeta</span><b>${pesos(por('Tarjeta'))}</b></div><div class="kpi"><span>Transferencia</span><b>${pesos(por('Transferencia'))}</b></div><div class="kpi"><span>Total del día</span><b>${pesos(v.reduce((s, x) => s + x.monto, 0))}</b><small>incluye ${pesos(v.reduce((s, x) => s + x.prop, 0))} de propinas</small></div></div>
  <div class="grid2"><section class="panel"><h2>Últimos 14 días</h2>${barras(dias)}</section>
  <section class="panel"><h2>Movimientos de hoy</h2><ul class="lista-mini">${v.sort((a, b) => b.f.localeCompare(a.f)).map((x) => `<li><div>${x.tipo}<br><small>${esc(x.met)} · ${new Date(x.f).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</small></div><span class="der">${pesos(x.monto)}</span></li>`).join('') || '<li class="vacio">Sin movimientos</li>'}</ul></section></div>`;
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  return cab('Ajustes', 'Servicios, barberos, lealtad y club. El sitio se actualiza al guardar.') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre<input name="nombre" required value="${esc(c.nombre)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label>
    <label>Abre<input name="abre" type="time" step="1800" value="${c.abre}"></label><label>Cierra<input name="cierra" type="time" step="1800" value="${c.cierra}"></label>
    <label>Sellos para el premio<input name="sellos" type="number" min="3" max="20" value="${c.sellos}"></label><label>Premio<input name="premio" value="${esc(c.premio)}"></label>
    <label>Club mensual ($)<input name="club" type="number" min="0" value="${c.club}"></label><label>Inactivo después de (días)<input name="inactivo" type="number" min="7" value="${c.inactivo}"></label>
    <label>Comisión en productos (%)<input name="comProd" type="number" min="0" max="100" value="${c.comProd}"></label><label>PIN del panel<input name="pin" required minlength="4" maxlength="6" value="${esc(c.pin)}"></label>
    <h3 class="full" style="margin:10px 0 0">Servicios</h3>
    ${db().servs.map((s) => `<label>${esc(s.n)} ($ · min)<span style="display:flex;gap:6px"><input name="p_${s.id}" type="number" min="0" value="${s.precio}"><input name="d_${s.id}" type="number" min="30" step="30" value="${s.dur}"></span></label>`).join('')}
    <h3 class="full" style="margin:10px 0 0">Barberos</h3>
    ${db().barbs.map((b) => `<label>${esc(b.n)}: comisión (%)<span style="display:flex;gap:10px;align-items:center"><input name="c_${b.id}" type="number" min="0" max="100" value="${b.com}"><span class="check"><input type="checkbox" name="a_${b.id}" ${b.activo ? 'checked' : ''}> activo</span></span></label>`).join('')}
    <div class="full"><button class="btn">Guardar</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación
const VISTAS = { inicio, clientes, promos, comisiones: comisionesV, productos, caja, ajustes };
function pintar() {
  const r = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio';
  $('#vista').innerHTML = VISTAS[r]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
  const n = { nHoy: db().citas.filter((c) => c.fecha === dia() && ['reservada', 'llego', 'silla'].includes(c.estado)).length, nPro: inactivos().filter((c) => !db().avisos['in' + c.id + dia().slice(0, 7)]).length, nProd: db().prods.filter((p) => p.stock <= p.min).length };
  for (const [k, v] of Object.entries(n)) { $('#' + k).hidden = !v; $('#' + k).textContent = v; }
  if (r === 'inicio') $('#fAg').onchange = (e) => { fAg = e.target.value || dia(); pintar(); };
  if (r === 'clientes') $('#qCli').oninput = (e) => { qCli = e.target.value; pintar(); const i = $('#qCli'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  if (r === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      if (d.cierra <= d.abre) return toast('La hora de cierre debe ser después de la apertura', 'error');
      Object.assign(db().conf, { nombre: d.nombre.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), abre: d.abre, cierra: d.cierra, sellos: +d.sellos, premio: d.premio.trim(), club: +d.club, inactivo: +d.inactivo, comProd: +d.comProd, pin: d.pin.trim() });
      db().servs.forEach((s) => { s.precio = +d['p_' + s.id]; s.dur = Math.max(30, Math.round(+d['d_' + s.id] / 30) * 30); });
      db().barbs.forEach((b) => { b.com = +d['c_' + b.id]; b.activo = !!d['a_' + b.id]; });
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
  if (q('[data-walkin]')) return nueva(db().barbs.find((b) => b.activo && libres(db(), b.id, dia(), 30).length)?.id, '', true);
  if ((el = q('[data-dia]'))) { let d = new Date(Date.parse(fAg + 'T12:00') + el.dataset.dia * 864e5).toLocaleDateString('en-CA'); if (domingo(d)) d = new Date(Date.parse(d + 'T12:00') + el.dataset.dia * 864e5).toLocaleDateString('en-CA'); fAg = d; return pintar(); }
  if ((el = q('[data-cli]')) && !q('a')) return verCli(el.dataset.cli);
  if ((el = q('[data-filtro]'))) { filtro = el.dataset.filtro; return pintar(); }
  if ((el = q('[data-sem]'))) { semana = Math.min(0, semana + +el.dataset.sem); return pintar(); }
  if ((el = q('[data-cerrar-sem]'))) { db().cierres.push({ desde: el.dataset.cerrarSem, f: new Date().toISOString() }); return guardar('Semana marcada como pagada'); }
  if ((el = q('[data-entrada]'))) { const p = db().prods.find((x) => x.id === el.dataset.entrada); const n = Math.round(+prompt(`¿Cuántas piezas de ${p.n} llegaron?`, '6')); if (n > 0) { p.stock += n; guardar(`${p.n}: ahora hay ${p.stock}`); } return; }
  if (q('[data-venta]')) return ventaMostrador();
  if ((el = q('[data-avisar]'))) { db().avisos[el.dataset.avisar] = new Date().toISOString(); setTimeout(() => guardar('Marcado como enviado'), 300); }
});
function ventaMostrador() {
  ventana(`<form id="fVen">${dlgH('Venta de mostrador')}<div class="dlg-b form">
    <label class="full">Producto<select name="p">${db().prods.filter((p) => p.stock > 0).map((p) => `<option value="${p.id}">${esc(p.n)} · ${pesos(p.precio)} (hay ${p.stock})</option>`).join('')}</select></label>
    <label>Cantidad<input name="cant" type="number" min="1" value="1"></label><label>Método<select name="met"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Cobrar</button></div></form>`);
  $('#fVen').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const p = db().prods.find((x) => x.id === f.p.value); const n = Math.round(+f.cant.value);
    if (!(n > 0) || n > p.stock) return toast(`Solo hay ${p.stock}`, 'error');
    p.stock -= n; db().ventas.push({ id: uid(), f: new Date().toISOString(), met: f.met.value, monto: p.precio * n, items: [{ id: p.id, cant: n }] });
    if (guardar(`Venta de ${pesos(p.precio * n)}`)) dlg.close();
  };
}
addEventListener('hashchange', pintar);

let antes = db().citas.filter((c) => c.estado !== 'cancelada').length;
B.alCambiar(() => {
  const act = db().citas.filter((c) => c.estado !== 'cancelada');
  if (act.length > antes) { const c = db().citas.at(-1); toast(`💈 Reserva en línea: ${cli(db(), c.cli)?.n} con ${barb(db(), c.barb).n}, ${fDia(c.fecha)} ${c.hora}`); }
  else if (act.length < antes) toast('Un cliente canceló su cita: el lugar quedó libre');
  antes = act.length;
  pintar();
});
puerta('barberia', db().conf.pin, () => { $('#app').hidden = false; pintar(); });
