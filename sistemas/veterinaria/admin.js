// Panel de la clínica veterinaria: agenda, expedientes, vacunas, hospital, recordatorios, farmacia y cobros.
import { $, $$, esc, pesos, fecha, fechaHora, foto, wa, toast, comprimir, puerta, barras, uid } from '../_base/sis.js';
import { abrir, dia, fDia, fAno, edad, diasEntre, cartilla, VACUNAS, VETS, horasLibres, nuevaCita, completarCita, aplicarVacuna, cobrar, totalCuenta, saldo,
  CITA_TXT, CITA_BADGE, HOSP_TXT, HOSP_BADGE } from './datos.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const masc = (id) => db().masc.find((m) => m.id === id);
const dueno = (id) => db().duenos.find((d) => d.id === id);
const serv = (id) => db().serv.find((s) => s.id === id);
const prod = (id) => db().prods.find((p) => p.id === id);
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const ventana = (html, ancho = false) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;
const tel52 = (t) => '52' + t;
const linkPortal = () => new URL('index.html#portal', location.href).href;
const todosPagos = () => db().cuentas.flatMap((c) => c.pagos.map((p) => ({ ...p, c })));
const hospActivos = () => db().hosp.filter((h) => h.activa);
const cadDias = (p) => (p.cad ? diasEntre(dia(), p.cad) : 9999);
const alertasFarm = () => db().prods.filter((p) => p.stock <= p.min || cadDias(p) <= 60);
function recordatorios() {
  const l = [];
  for (const m of db().masc) for (const v of cartilla(db(), m.id)) if (v.estado !== 'ok') l.push({ m, v, d: dueno(m.dueno) });
  return l.sort((a, b) => a.v.faltan - b.v.faltan);
}
const avisado = (v) => (db().avisos || {})[v.id];

// ---------- Hoy
function inicio() {
  const hoy = db().citas.filter((c) => c.fecha === dia() && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
  const pend = db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia());
  const pagos = todosPagos();
  const hoyCobrado = pagos.filter((p) => p.f.slice(0, 10) === new Date().toISOString().slice(0, 10)).reduce((s, p) => s + p.monto, 0);
  const mes = new Date().toISOString().slice(0, 7);
  const dias = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = d.toISOString().slice(0, 10); return { k: d.getDate() + '', v: pagos.filter((p) => p.f.slice(0, 10) === k).reduce((s, p) => s + p.monto, 0) }; });
  const rec = recordatorios().filter((r) => !avisado(r.v));
  return cab('Hoy en la clínica', new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }), '<a class="btn sec" href="index.html#portal" target="_blank" rel="noopener">Ver portal ↗</a><button class="btn" data-nueva-cita>+ Cita</button>') + `
  <div class="kpis">
    <div class="kpi"><span>Citas de hoy</span><b>${hoy.length}</b><small>${pend.length} solicitudes por confirmar</small></div>
    <div class="kpi"><span>Hospitalizados</span><b>${hospActivos().length}</b><small>sus dueños los siguen en el portal</small></div>
    <div class="kpi ${rec.length ? 'alerta' : ''}"><span>Vacunas por avisar</span><b>${rec.length}</b><small>ingreso preventivo en riesgo</small></div>
    <div class="kpi"><span>Cobrado hoy</span><b>${pesos(hoyCobrado)}</b><small>mes: ${pesos(pagos.filter((p) => p.f.startsWith(mes)).reduce((s, p) => s + p.monto, 0))}</small></div>
  </div>
  <div class="grid2">
    <section class="panel"><h2>Agenda de hoy <a href="#agenda">Ver agenda →</a></h2><div class="agenda">${hoy.map(citaFila).join('') || '<p class="vacio">Sin citas hoy</p>'}</div></section>
    <div>
      <section class="panel"><h2>Hospital <a href="#hospital">Abrir →</a></h2><ul class="lista-mini">${hospActivos().map((h) => { const m = masc(h.masc); return `<li><img class="thumb" src="${foto(m.foto, 120)}" alt=""><div><b>${esc(m.n)}</b><br><small>${esc(h.motivo)}</small></div><div class="der"><span class="badge ${HOSP_BADGE[h.estado]}">${HOSP_TXT[h.estado]}</span></div></li>`; }).join('') || '<li class="vacio">Sin pacientes internados</li>'}</ul></section>
      <section class="panel"><h2>Por avisar <a href="#recordatorios">Ver todos →</a></h2><ul class="lista-mini">${rec.slice(0, 4).map((r) => `<li><span class="sem ${r.v.estado}"></span><div><b>${esc(r.m.n)}</b> · ${esc(VACUNAS[r.v.vac].n)}<br><small>${r.v.estado === 'vencida' ? `vencida hace ${-r.v.faltan} días` : `en ${r.v.faltan} días`}</small></div></li>`).join('') || '<li class="vacio">Todo avisado ✓</li>'}</ul></section>
      <section class="panel"><h2>Cobrado, últimos 14 días</h2>${barras(dias)}</section>
    </div>
  </div>`;
}

function citaFila(c) {
  const m = masc(c.masc); const d = dueno(m.dueno); const s = serv(c.serv);
  const larga = ['estetica', 'dental', 'cirugia'].includes(c.serv);
  const sig = { pendiente: ['confirmada', 'Confirmar'], confirmada: ['en curso', 'Iniciar atención'], 'en curso': larga ? ['lista', 'Lista para recoger'] : ['cerrar', 'Terminar y cobrar'], lista: ['cerrar', 'Entregar y cobrar'] }[c.estado];
  return `<div class="cita ${c.estado.replace(' ', '-')}"><span class="h">${c.hora}</span><img src="${foto(m.foto, 120)}" alt="">
    <div><b>${esc(m.n)}</b> · ${esc(s.n)} ${c.origen === 'portal' ? '<span class="badge b-info">En línea</span>' : ''}<br><small>${esc(d.n)} · ${esc(d.tel)}${c.nota ? ` · 📝 ${esc(c.nota)}` : ''}</small></div>
    <div class="acc"><span class="badge ${CITA_BADGE[c.estado]}">${CITA_TXT[c.estado]}</span>
      ${sig ? `<button class="btn mini" data-avanzar="${c.id}" data-a="${sig[0]}">${sig[1]}</button>` : ''}
      ${['pendiente', 'confirmada'].includes(c.estado) ? `<button class="btn mini sec" data-cancelar-cita="${c.id}">Cancelar</button>` : ''}
      <a class="btn mini sec" target="_blank" rel="noopener" href="${wa(tel52(d.tel), mensajeCita(c))}" aria-label="WhatsApp a ${esc(d.n)}">📱</a></div></div>`;
}
function mensajeCita(c) {
  const m = masc(c.masc); const d = dueno(m.dueno); const s = serv(c.serv);
  const hola = `Hola ${d.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}.`;
  if (c.estado === 'lista') return `${hola} ¡${m.n} ya está listo! 🐾 Puedes pasar por él cuando gustes.`;
  if (c.estado === 'pendiente' || c.estado === 'confirmada') return `${hola} Te confirmamos ${s.n} para ${m.n} el ${fDia(c.fecha)} a las ${c.hora}. Si necesitas cambiarla, entra a ${linkPortal()}`;
  return `${hola} ${m.n} está en atención. Te avisamos al terminar. Puedes verlo en ${linkPortal()}`;
}

// ---------- Agenda
let fAg = dia();
function agenda() {
  const l = db().citas.filter((c) => c.fecha === fAg).sort((a, b) => a.hora.localeCompare(b.hora));
  const pend = db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  return cab('Agenda', 'Las citas pedidas en línea llegan «Por confirmar». Cada cambio de estado lo ve el dueño en su portal.', '<button class="btn" data-nueva-cita>+ Nueva cita</button>') + `
  ${pend.length ? `<section class="panel"><h2>Solicitudes en línea por confirmar (${pend.length})</h2><div class="agenda">${pend.map((c) => citaFila(c).replace('<span class="h">', `<span class="h" title="${c.fecha}"><small style="font-size:.7rem;display:block">${fDia(c.fecha)}</small>`)).join('')}</div></section>` : ''}
  <div class="filtros"><button class="btn sec" data-dia="-1">←</button><input type="date" id="fAg" value="${fAg}" aria-label="Día"><button class="btn sec" data-dia="1">→</button><button class="btn sec" data-dia="0">Hoy</button></div>
  <section class="panel"><h2>${fDia(fAg)} · ${l.filter((c) => c.estado !== 'cancelada').length} citas · ${horasLibres(db(), fAg).length} horarios libres</h2><div class="agenda">${l.map(citaFila).join('') || '<p class="vacio">Sin citas este día</p>'}</div></section>`;
}

function nuevaCitaDlg(mid) {
  ventana(`<form id="fCita">${dlgH('Nueva cita')}<div class="dlg-b form">
    <label class="full">Paciente<select name="masc">${db().masc.map((m) => `<option value="${m.id}" ${m.id === mid ? 'selected' : ''}>${esc(m.n)} (${esc(m.esp)}) · ${esc(dueno(m.dueno).n)}</option>`).join('')}</select></label>
    <label>Servicio<select name="serv">${db().serv.map((s) => `<option value="${s.id}">${esc(s.n)}</option>`).join('')}</select></label>
    <label>Día<input type="date" name="fecha" min="${dia()}" value="${fAg >= dia() ? fAg : dia()}" required></label>
    <label class="full">Hora<select name="hora" id="selHora"></select></label>
    <label class="full">Nota<input name="nota" placeholder="Motivo, indicaciones…"></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Agendar y confirmar</button></div></form>`);
  const f = $('#fCita');
  const horas = () => { const l = horasLibres(db(), f.fecha.value); $('#selHora').innerHTML = l.map((h) => `<option>${h}</option>`).join('') || '<option value="">Sin horarios</option>'; };
  f.fecha.onchange = horas; horas();
  f.onsubmit = (e) => {
    e.preventDefault();
    if (!f.hora.value) return toast('No hay horarios libres ese día', 'error');
    try { nuevaCita(db(), { masc: f.masc.value, fecha: f.fecha.value, hora: f.hora.value, serv: f.serv.value, nota: f.nota.value.trim() }); }
    catch (err) { return toast(err.message, 'error'); }
    fAg = f.fecha.value;
    if (guardar('Cita agendada')) dlg.close();
  };
}

// Cerrar cita: registra vacuna o productos usados y abre la cuenta.
function cerrarCita(c) {
  const m = masc(c.masc);
  const vacs = Object.entries(VACUNAS).filter(([, v]) => v.esp === 'Ambos' || v.esp === m.esp);
  ventana(`<form id="fCerrar">${dlgH(`Terminar: ${esc(m.n)} · ${esc(serv(c.serv).n)}`)}<div class="dlg-b form">
    ${['vacuna', 'despara'].includes(c.serv) ? `<label>Vacuna aplicada<select name="vac">${vacs.filter(([k]) => (c.serv === 'despara') === (k === 'despara')).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join('')}</select></label>
      <label>Lote<input name="lote" required value="L-${Math.floor(Math.random() * 9000 + 1000)}"></label><p class="full ayuda">Se guarda en la cartilla y se programa el refuerzo automáticamente.</p>` : ''}
    ${c.serv === 'consulta' ? `<label>Peso (kg)<input name="peso" type="number" step="0.1" min="0" value="${m.peso || ''}"></label><label>Temperatura (°C)<input name="temp" type="number" step="0.1" value="38.5"></label>
      <label class="full">Diagnóstico<input name="diag" required></label><label class="full">Tratamiento / indicaciones<textarea name="trat" required></textarea></label>` : ''}
    <label>Producto usado o vendido<select name="prod"><option value="">— Ninguno —</option>${db().prods.filter((p) => p.precio > 0 && p.stock > 0).map((p) => `<option value="${p.id}">${esc(p.n)} · ${pesos(p.precio)} (hay ${p.stock})</option>`).join('')}</select></label>
    <label>Cantidad<input name="cant" type="number" min="1" value="1"></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Terminar y abrir cuenta</button></div></form>`);
  $('#fCerrar').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const extras = [];
    const vet = c.serv === 'estetica' ? VETS[2] : VETS[0];
    if (f.vac) aplicarVacuna(db(), m.id, f.vac.value, f.lote.value.trim(), vet);
    if (f.diag) {
      db().consultas.push({ id: uid(), masc: m.id, f: new Date().toISOString(), vet, motivo: c.nota || serv(c.serv).n, peso: +f.peso.value || 0, temp: +f.temp.value || 0, diag: f.diag.value.trim(), trat: f.trat.value.trim(), receta: '' });
      if (+f.peso.value) m.peso = +f.peso.value;
    }
    if (f.prod.value) {
      const p = prod(f.prod.value); const n = Math.min(p.stock, Math.max(1, +f.cant.value));
      p.stock -= n; db().movs.unshift({ id: uid(), prod: p.id, cant: -n, nota: `Cita de ${m.n}`, f: new Date().toISOString() });
      extras.push({ n: `${p.n}${n > 1 ? ` x${n}` : ''}`, monto: p.precio * n });
    }
    const cu = completarCita(db(), c, extras);
    if (guardar('Cita terminada')) verCuenta(cu.id);
  };
}

// ---------- Pacientes y expediente
let qPac = '';
function pacientes() {
  const q = qPac.toLowerCase();
  const l = db().masc.filter((m) => !q || (m.n + ' ' + m.raza + ' ' + dueno(m.dueno).n + ' ' + dueno(m.dueno).tel).toLowerCase().includes(q));
  return cab('Pacientes', `${db().masc.length} mascotas · ${db().duenos.length} dueños`, '<button class="btn" data-nuevo-pac>+ Nuevo paciente</button>') + `
  <div class="filtros"><input id="qPac" type="search" placeholder="Buscar por mascota, dueño o teléfono…" value="${esc(qPac)}" aria-label="Buscar paciente"></div>
  <div class="pacs">${l.map((m) => { const rv = cartilla(db(), m.id).filter((v) => v.estado !== 'ok'); const h = db().hosp.find((x) => x.masc === m.id && x.activa);
    return `<button class="pac" data-exp="${m.id}"><img src="${foto(m.foto, 120)}" alt=""><span><b>${esc(m.n)}</b> ${h ? '<span class="badge b-warn">Internado</span>' : ''}<br><small>${esc(m.esp)} · ${esc(m.raza)} · ${edad(m.nac)}</small><br><small>${esc(dueno(m.dueno).n)}</small>${rv.length ? `<br><small><span class="sem ${rv[0].estado}"></span>${rv.length} vacuna(s) pendiente(s)</small>` : ''}</span></button>`; }).join('')}</div>`;
}

let tabExp = 'consultas';
function expediente(mid) {
  const m = masc(mid); const d = dueno(m.dueno);
  const h = db().hosp.find((x) => x.masc === mid && x.activa);
  const cont = {
    consultas: () => `<button class="btn mini" data-nueva-consulta="${mid}">+ Nueva consulta</button>` + (db().consultas.filter((c) => c.masc === mid).sort((a, b) => b.f.localeCompare(a.f)).map((c) => `<div class="panel" style="margin:10px 0 0"><b>${esc(c.motivo)}</b> <small>· ${fechaHora(c.f)} · ${esc(c.vet)}${c.peso ? ` · ${c.peso} kg` : ''}${c.temp ? ` · ${c.temp} °C` : ''}</small><p style="margin:6px 0 2px"><b>Dx:</b> ${esc(c.diag)}</p><p style="margin:0"><b>Tx:</b> ${esc(c.trat)}</p>${c.receta ? `<p style="margin:0"><b>Receta:</b> ${esc(c.receta)}</p>` : ''}</div>`).join('') || '<p class="vacio">Sin consultas</p>'),
    vacunas: () => `<table class="t"><thead><tr><th>Vacuna</th><th>Última</th><th>Siguiente</th><th>Estado</th></tr></thead><tbody>${cartilla(db(), mid).map((v) => `<tr><td>${esc(VACUNAS[v.vac].n)}</td><td>${fAno(v.f)}</td><td>${fAno(v.prox)}</td><td><span class="sem ${v.estado}"></span>${v.estado === 'vencida' ? 'Vencida' : v.estado === 'pronto' ? `En ${v.faltan} días` : 'Al día'}</td></tr>`).join('')}</tbody></table>
      <form class="form" id="fVac" style="grid-template-columns:2fr 1fr auto;align-items:end;margin-top:12px"><label>Aplicar ahora<select name="vac">${Object.entries(VACUNAS).filter(([, v]) => v.esp === 'Ambos' || v.esp === m.esp).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join('')}</select></label><label>Lote<input name="lote" required></label><button class="btn">Registrar</button></form>`,
    citas: () => `<button class="btn mini" data-nueva-cita="${mid}">+ Agendar</button><ul class="lista-mini">${db().citas.filter((c) => c.masc === mid).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)).map((c) => `<li><div><b>${esc(serv(c.serv).n)}</b><br><small>${fDia(c.fecha)} · ${c.hora}</small></div><span class="der badge ${CITA_BADGE[c.estado]}">${CITA_TXT[c.estado]}</span></li>`).join('')}</ul>`,
    cuenta: () => `<ul class="lista-mini">${db().cuentas.filter((c) => c.masc === mid).sort((a, b) => b.f.localeCompare(a.f)).map((c) => `<li class="click" data-cuenta="${c.id}" style="cursor:pointer"><div><b>${fecha(c.f)}</b><br><small>${c.conceptos.map((x) => esc(x.n)).join(', ')}</small></div><div class="der"><b>${pesos(totalCuenta(c))}</b><br>${saldo(c) > 0 ? `<small style="color:var(--bad)">debe ${pesos(saldo(c))}</small>` : '<small>pagada</small>'}</div></li>`).join('') || '<li class="vacio">Sin cuentas</li>'}</ul>`,
  }[tabExp]();
  ventana(`${dlgH('Expediente')}<div class="dlg-b">
    <div class="exp-cab"><img src="${foto(m.foto, 200)}" alt=""><div><h2 style="font-size:1.6rem">${esc(m.n)} ${h ? '<span class="badge b-warn">Internado</span>' : ''}</h2>
      <small>${esc(m.esp)} · ${esc(m.raza)} · ${esc(m.sexo || '')} · ${edad(m.nac)}${m.peso ? ` · ${m.peso} kg` : ''}${m.ester ? ' · esterilizado' : ''}</small><br>
      <small>Dueño: <b>${esc(d.n)}</b> · <a target="_blank" rel="noopener" href="${wa(tel52(d.tel), `Hola ${d.n.split(' ')[0]}, te escribimos de ${db().conf.nombre} sobre ${m.n}.`)}">📱 ${esc(d.tel)}</a></small>
      ${m.alergias ? `<p class="aviso" style="margin:6px 0 0;padding:4px 8px">⚠ Alergia: ${esc(m.alergias)}</p>` : ''}</div></div>
    <div class="acc">${h ? '' : `<button class="btn sec mini" data-hospitalizar="${mid}">Hospitalizar</button>`}<button class="btn sec mini" data-nueva-cita="${mid}">Agendar cita</button></div>
    <div class="tabs-mini">${[['consultas', 'Consultas'], ['vacunas', 'Vacunas'], ['citas', 'Citas'], ['cuenta', 'Cuentas']].map(([k, t]) => `<button data-texp="${k}" data-m="${mid}" aria-pressed="${tabExp === k}">${t}</button>`).join('')}</div>${cont}</div>`, true);
  $('#fVac') && ($('#fVac').onsubmit = (e) => {
    e.preventDefault(); const v = aplicarVacuna(db(), mid, e.target.vac.value, e.target.lote.value.trim(), VETS[0]);
    if (guardar(`Vacuna registrada. Refuerzo: ${fDia(v.prox)}`)) expediente(mid);
  });
}

function nuevaConsulta(mid) {
  const m = masc(mid);
  ventana(`<form id="fCon">${dlgH(`Consulta de ${esc(m.n)}`)}<div class="dlg-b form">
    <label class="full">Motivo<input name="motivo" required placeholder="¿Qué le pasa?"></label>
    <label>Peso (kg)<input name="peso" type="number" step="0.1" min="0" value="${m.peso || ''}"></label><label>Temperatura (°C)<input name="temp" type="number" step="0.1" value="38.5"></label>
    <label class="full">Diagnóstico<input name="diag" required></label>
    <label class="full">Tratamiento e indicaciones<textarea name="trat" required></textarea></label>
    <label class="full">Receta<input name="receta" placeholder="Medicamento, dosis, días"></label>
    <label>Médico<select name="vet">${VETS.slice(0, 2).map((v) => `<option>${v}</option>`).join('')}</select></label>
    <label class="check" style="align-self:end"><input type="checkbox" name="cobrar" checked> Cargar consulta (${pesos(serv('consulta').precio)})</label>
    <p class="full ayuda">El dueño verá diagnóstico, tratamiento y receta en su portal.</p>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar consulta</button></div></form>`);
  $('#fCon').onsubmit = (e) => {
    e.preventDefault(); const f = e.target;
    db().consultas.push({ id: uid(), masc: mid, f: new Date().toISOString(), vet: f.vet.value, motivo: f.motivo.value.trim(), peso: +f.peso.value || 0, temp: +f.temp.value || 0, diag: f.diag.value.trim(), trat: f.trat.value.trim(), receta: f.receta.value.trim() });
    if (+f.peso.value) m.peso = +f.peso.value;
    if (f.cobrar.checked) db().cuentas.push({ id: uid(), dueno: m.dueno, masc: mid, f: new Date().toISOString(), conceptos: [{ n: 'Consulta general', monto: serv('consulta').precio }], pagado: 0, pagos: [], abierta: true });
    tabExp = 'consultas';
    if (guardar('Consulta guardada en el expediente')) expediente(mid);
  };
}

function nuevoPaciente() {
  ventana(`<form id="fPac">${dlgH('Nuevo paciente')}<div class="dlg-b form">
    <label class="full">Dueño<select name="dueno"><option value="">+ Dueño nuevo</option>${db().duenos.map((d) => `<option value="${d.id}">${esc(d.n)} · ${d.tel}</option>`).join('')}</select></label>
    <label id="lDn">Nombre del dueño<input name="dn"></label><label id="lDt">WhatsApp (10 dígitos)<input name="dt" inputmode="tel"></label>
    <label>Nombre de la mascota<input name="n" required></label><label>Especie<select name="esp"><option>Perro</option><option>Gato</option></select></label>
    <label>Raza<input name="raza" value="Mestizo"></label><label>Sexo<select name="sexo"><option>Macho</option><option>Hembra</option></select></label>
    <label>Nacimiento<input name="nac" type="date" max="${dia()}" required></label><label>Peso (kg)<input name="peso" type="number" step="0.1" min="0"></label>
    <label class="full">Alergias<input name="alergias" placeholder="Ninguna"></label>
    <div class="full subir"><img id="prev" alt="" style="visibility:hidden"><label>Foto<input type="file" id="archivo" accept="image/*"><span class="ayuda">Aparece en su ficha y en el portal del dueño.</span></label></div>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  const f = $('#fPac'); let ft = '';
  const tog = () => { const nuevo = !f.dueno.value; $('#lDn').hidden = $('#lDt').hidden = !nuevo; f.dn.required = f.dt.required = nuevo; };
  f.dueno.onchange = tog; tog();
  $('#archivo').onchange = async (e) => { try { ft = await comprimir(e.target.files[0], 700); $('#prev').src = ft; $('#prev').style.visibility = ''; } catch (err) { toast(err.message, 'error'); } };
  f.onsubmit = (e) => {
    e.preventDefault();
    let did = f.dueno.value;
    if (!did) {
      const tel = f.dt.value.replace(/\D/g, '').slice(-10);
      if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
      if (db().duenos.some((d) => d.tel === tel)) return toast('Ese teléfono ya está registrado: elígelo en la lista', 'error');
      did = uid(); db().duenos.push({ id: did, n: f.dn.value.trim(), tel, alta: new Date().toISOString() });
    }
    const id = uid();
    db().masc.push({ id, dueno: did, n: f.n.value.trim(), esp: f.esp.value, raza: f.raza.value.trim(), sexo: f.sexo.value, nac: f.nac.value, peso: +f.peso.value || 0, foto: ft || (f.esp.value === 'Gato' ? 'photo-1536589961747-e239b2abbec2' : 'photo-1537151608828-ea2b11777ee8'), alergias: f.alergias.value.trim(), ester: false });
    if (guardar('Paciente registrado. El dueño ya puede entrar al portal con su WhatsApp.')) expediente(id);
  };
}

// ---------- Hospital
function hospital() {
  return cab('Hospital', 'Cada nota que escribes le llega al dueño en su portal, sin llamadas.', '<button class="btn" data-hospitalizar="">+ Hospitalizar</button>') + `
  <div class="hosp">${hospActivos().map((h) => { const m = masc(h.masc); const d = dueno(m.dueno); const cu = db().cuentas.find((c) => c.id === h.cuenta);
    return `<article class="hcard"><img src="${foto(m.foto, 600)}" alt=""><div class="c">
      <h2 style="font-size:1.3rem">${esc(m.n)} <span class="badge ${HOSP_BADGE[h.estado]}">${HOSP_TXT[h.estado]}</span></h2>
      <small>${esc(h.motivo)} · jaula ${esc(h.jaula)} · desde ${fechaHora(h.ingreso)}</small><br><small>${esc(d.n)} · ${esc(d.tel)}</small>
      <form class="form" data-nota="${h.id}" style="grid-template-columns:1fr;margin-top:10px"><label>Nota para el dueño<textarea name="txt" required rows="2" placeholder="Ej. Comió bien y salió a caminar"></textarea></label>
        <label>Estado<select name="estado">${['estable', 'mejorando', 'observacion', 'delicado'].map((e) => `<option value="${e}" ${h.estado === e ? 'selected' : ''}>${HOSP_TXT[e]}</option>`).join('')}</select></label>
        <button class="btn">Publicar actualización</button></form>
      <ul class="hist" style="margin-top:12px">${[...h.notas].reverse().slice(0, 4).map((n) => `<li>${esc(n.txt)}<br><small>${fechaHora(n.f)}</small></li>`).join('')}</ul>
      <p style="margin:8px 0">Cuenta: <b>${pesos(totalCuenta(cu))}</b> · pagado ${pesos(cu.pagado)}</p>
      <div class="acc"><button class="btn mini sec" data-dia-hosp="${h.id}">+ Cobrar día (${pesos(db().conf.diaHosp)})</button><button class="btn mini sec" data-cuenta="${cu.id}">Ver cuenta</button>
        <a class="btn mini sec" target="_blank" rel="noopener" href="${wa(tel52(d.tel), `Hola ${d.n.split(' ')[0]}, ${m.n} está ${HOSP_TXT[h.estado].toLowerCase()}. ${h.notas.at(-1).txt} Puedes ver sus noticias aquí: ${linkPortal()}`)}">📱 Avisar</a>
        <button class="btn mini" data-alta="${h.id}">Dar de alta</button></div></div></article>`; }).join('') || '<p class="vacio">No hay pacientes internados.</p>'}</div>`;
}

function hospitalizar(mid) {
  ventana(`<form id="fHos">${dlgH('Hospitalizar')}<div class="dlg-b form">
    <label class="full">Paciente<select name="masc">${db().masc.filter((m) => !db().hosp.some((h) => h.masc === m.id && h.activa)).map((m) => `<option value="${m.id}" ${m.id === mid ? 'selected' : ''}>${esc(m.n)} · ${esc(dueno(m.dueno).n)}</option>`).join('')}</select></label>
    <label class="full">Motivo<input name="motivo" required></label><label>Jaula<input name="jaula" required value="C-${Math.floor(Math.random() * 6 + 1)}"></label>
    <label>Estado inicial<select name="estado"><option value="observacion">En observación</option><option value="estable">Estable</option><option value="delicado">Delicado</option></select></label>
    <label class="full">Primera nota para el dueño<textarea name="txt" required>Ingresó y ya está con nosotros. Le estamos dando seguimiento.</textarea></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Ingresar</button></div></form>`);
  $('#fHos').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const m = masc(f.masc.value); const ahora = new Date().toISOString();
    const cu = { id: uid(), dueno: m.dueno, masc: m.id, f: ahora, conceptos: [{ n: 'Hospitalización día 1', monto: db().conf.diaHosp }], pagado: 0, pagos: [], abierta: true };
    db().cuentas.push(cu);
    db().hosp.push({ id: uid(), masc: m.id, ingreso: ahora, motivo: f.motivo.value.trim(), jaula: f.jaula.value.trim(), estado: f.estado.value, activa: true, cuenta: cu.id, dias: 1, notas: [{ f: ahora, estado: f.estado.value, txt: f.txt.value.trim() }] });
    location.hash = 'hospital';
    if (guardar(`${m.n} hospitalizado. Su dueño ya lo ve en el portal.`)) dlg.close();
  };
}

// ---------- Recordatorios
function recordatoriosV() {
  const l = recordatorios();
  const manana = db().citas.filter((c) => c.fecha === dia(1) && ['pendiente', 'confirmada'].includes(c.estado));
  const fila = (r) => { const msg = `Hola ${r.d.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}. A ${r.m.n} ${r.v.estado === 'vencida' ? 'ya le toca' : 'pronto le toca'} su ${VACUNAS[r.v.vac].n.toLowerCase()} (${fDia(r.v.prox)}). ¿Te agendamos? Puedes hacerlo aquí: ${new URL('index.html', location.href).href}`;
    return `<tr><td><img class="thumb" src="${foto(r.m.foto, 120)}" alt=""></td><td><b>${esc(r.m.n)}</b><br><small>${esc(r.d.n)}</small></td><td>${esc(VACUNAS[r.v.vac].n)}</td><td><span class="sem ${r.v.estado}"></span>${r.v.estado === 'vencida' ? `Vencida hace ${-r.v.faltan} d` : `En ${r.v.faltan} d`}</td>
      <td>${avisado(r.v) ? `<span class="badge b-ok">Avisado ${fecha(avisado(r.v))}</span>` : `<a class="btn mini" target="_blank" rel="noopener" href="${wa(tel52(r.d.tel), msg)}" data-avisar="${r.v.id}">📱 Avisar</a>`}</td></tr>`; };
  const valor = l.length * serv('vacuna').precio;
  return cab('Recordatorios', 'Vacunas y desparasitaciones que tocan: es el ingreso más seguro de la clínica, si alguien avisa.') + `
  <div class="kpis"><div class="kpi alerta"><span>Vencidas</span><b>${l.filter((r) => r.v.estado === 'vencida').length}</b></div><div class="kpi"><span>Tocan en 30 días</span><b>${l.filter((r) => r.v.estado === 'pronto').length}</b></div>
    <div class="kpi"><span>Ya avisados</span><b>${l.filter((r) => avisado(r.v)).length}</b></div><div class="kpi"><span>Ingreso en juego</span><b>${pesos(valor)}</b><small>si todos regresan</small></div></div>
  <section class="panel tabla"><h2>Vacunas por avisar</h2><table class="t"><tbody>${l.map(fila).join('') || '<tr><td class="vacio">Nada pendiente ✓</td></tr>'}</tbody></table></section>
  <section class="panel"><h2>Citas de mañana para confirmar</h2><div class="agenda">${manana.map(citaFila).join('') || '<p class="vacio">Sin citas mañana</p>'}</div></section>`;
}

// ---------- Farmacia
function farmacia() {
  const l = [...db().prods].sort((a, b) => cadDias(a) - cadDias(b));
  const cadB = (p) => !p.cad ? '—' : cadDias(p) < 0 ? `<span class="badge b-bad">Caducado</span>` : cadDias(p) <= 60 ? `<span class="badge b-warn">${fecha(p.cad + 'T12:00')}</span>` : fecha(p.cad + 'T12:00');
  const stB = (p) => p.stock <= 0 ? '<span class="badge b-bad">0</span>' : p.stock <= p.min ? `<span class="badge b-warn">${p.stock}</span>` : `<span class="badge b-ok">${p.stock}</span>`;
  return cab('Farmacia e insumos', 'Lotes y caducidades: vende primero lo que caduca antes y no tires medicamento.', '<button class="btn sec" data-entrada="">+ Entrada</button><button class="btn" data-venta>Venta de mostrador</button>') + `
  <div class="kpis"><div class="kpi"><span>Dinero en inventario</span><b>${pesos(db().prods.reduce((s, p) => s + p.costo * p.stock, 0))}</b></div>
    <div class="kpi ${db().prods.some((p) => p.stock <= p.min) ? 'alerta' : ''}"><span>Por resurtir</span><b>${db().prods.filter((p) => p.stock <= p.min).length}</b></div>
    <div class="kpi ${db().prods.some((p) => cadDias(p) <= 60) ? 'alerta' : ''}"><span>Caducan en 60 días</span><b>${db().prods.filter((p) => cadDias(p) >= 0 && cadDias(p) <= 60).length}</b></div>
    <div class="kpi ${db().prods.some((p) => cadDias(p) < 0) ? 'alerta' : ''}"><span>Caducados</span><b>${db().prods.filter((p) => cadDias(p) < 0).length}</b><small>retirar de venta</small></div></div>
  <section class="panel tabla"><table class="t"><thead><tr><th>Producto</th><th class="ocultar-m">Categoría</th><th class="ocultar-m">Lote</th><th>Caduca</th><th>Stock</th><th class="num">Precio</th><th></th></tr></thead><tbody>
    ${l.map((p) => `<tr><td><b>${esc(p.n)}</b></td><td class="ocultar-m">${esc(p.cat)}</td><td class="ocultar-m">${esc(p.lote || '—')}</td><td>${cadB(p)}</td><td>${stB(p)}</td><td class="num">${p.precio ? pesos(p.precio) : '<small>uso interno</small>'}</td><td><button class="btn mini sec" data-entrada="${p.id}">Entrada</button></td></tr>`).join('')}</tbody></table></section>
  <section class="panel"><h2>Movimientos</h2><ul class="lista-mini">${db().movs.slice(0, 15).map((m) => `<li><div><b>${esc(prod(m.prod)?.n || '—')}</b><br><small>${esc(m.nota)}</small></div><div class="der"><b style="color:${m.cant > 0 ? 'var(--ok)' : 'var(--bad)'}">${m.cant > 0 ? '+' : ''}${m.cant}</b><br><small>${fecha(m.f)}</small></div></li>`).join('') || '<li class="vacio">Sin movimientos todavía</li>'}</ul></section>`;
}

function entrada(pid) {
  ventana(`<form id="fEnt">${dlgH('Entrada de mercancía')}<div class="dlg-b form">
    <label class="full">Producto<select name="prod">${db().prods.map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(p.n)} (hay ${p.stock})</option>`).join('')}</select></label>
    <label>Cantidad<input name="cant" type="number" min="1" value="10" required></label><label>Lote nuevo<input name="lote" required></label>
    <label>Caducidad<input name="cad" type="date" min="${dia()}" required></label><label>Proveedor<input name="prov" required></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar entrada</button></div></form>`);
  $('#fEnt').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const p = prod(f.prod.value); const n = Math.round(+f.cant.value);
    p.stock += n; p.lote = f.lote.value.trim(); p.cad = f.cad.value; // shortcut: un lote vigente por producto; con varios lotes se lleva tabla de lotes.
    db().movs.unshift({ id: uid(), prod: p.id, cant: n, nota: `Entrada lote ${p.lote} · ${f.prov.value.trim()}`, f: new Date().toISOString() });
    if (guardar(`${p.n}: ahora hay ${p.stock}`)) dlg.close();
  };
}

function venta() {
  ventana(`<form id="fVen">${dlgH('Venta de mostrador')}<div class="dlg-b form">
    <label class="full">Producto<select name="prod">${db().prods.filter((p) => p.precio > 0 && p.stock > 0 && cadDias(p) >= 0).map((p) => `<option value="${p.id}">${esc(p.n)} · ${pesos(p.precio)} (hay ${p.stock})</option>`).join('')}</select></label>
    <label>Cantidad<input name="cant" type="number" min="1" value="1" required></label><label>Método<select name="met"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label>
    <label class="full">Cliente (opcional)<select name="masc"><option value="">Público general</option>${db().masc.map((m) => `<option value="${m.id}">${esc(m.n)} · ${esc(dueno(m.dueno).n)}</option>`).join('')}</select></label>
    <p class="full ayuda">No aparecen los productos caducados.</p>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Cobrar</button></div></form>`);
  $('#fVen').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const p = prod(f.prod.value); const n = Math.round(+f.cant.value);
    if (n > p.stock) return toast(`Solo hay ${p.stock}`, 'error');
    p.stock -= n; const m = masc(f.masc.value);
    db().movs.unshift({ id: uid(), prod: p.id, cant: -n, nota: 'Venta de mostrador', f: new Date().toISOString() });
    const cu = { id: uid(), dueno: m?.dueno || '', masc: m?.id || '', f: new Date().toISOString(), conceptos: [{ n: `${p.n}${n > 1 ? ` x${n}` : ''}`, monto: p.precio * n }], pagado: 0, pagos: [], abierta: true };
    cobrar(cu, p.precio * n, f.met.value); db().cuentas.push(cu);
    if (guardar(`Venta de ${pesos(p.precio * n)} registrada`)) dlg.close();
  };
}

// ---------- Cobros
function cobros() {
  const abiertas = db().cuentas.filter((c) => c.abierta).sort((a, b) => b.f.localeCompare(a.f));
  const pagos = todosPagos().sort((a, b) => b.f.localeCompare(a.f));
  const hoy = new Date().toISOString().slice(0, 10); const mes = hoy.slice(0, 7);
  return cab('Cobros', 'Cuentas abiertas por consulta, estética u hospital. El dueño ve su saldo en el portal.') + `
  <div class="kpis"><div class="kpi"><span>Cobrado hoy</span><b>${pesos(pagos.filter((p) => p.f.startsWith(hoy)).reduce((s, p) => s + p.monto, 0))}</b></div>
    <div class="kpi"><span>Cobrado este mes</span><b>${pesos(pagos.filter((p) => p.f.startsWith(mes)).reduce((s, p) => s + p.monto, 0))}</b></div>
    <div class="kpi ${abiertas.length ? 'alerta' : ''}"><span>Por cobrar</span><b>${pesos(abiertas.reduce((s, c) => s + saldo(c), 0))}</b><small>${abiertas.length} cuentas abiertas</small></div></div>
  <section class="panel tabla"><h2>Cuentas abiertas</h2><table class="t"><thead><tr><th>Fecha</th><th>Cliente</th><th class="ocultar-m">Conceptos</th><th class="num">Total</th><th class="num">Saldo</th><th></th></tr></thead><tbody>
    ${abiertas.map((c) => { const m = masc(c.masc); return `<tr class="click" data-cuenta="${c.id}"><td>${fecha(c.f)}</td><td><b>${esc(m?.n || 'Mostrador')}</b><br><small>${esc(dueno(c.dueno)?.n || '')}</small></td><td class="ocultar-m">${c.conceptos.map((x) => esc(x.n)).join(', ')}</td><td class="num">${pesos(totalCuenta(c))}</td><td class="num"><b style="color:var(--bad)">${pesos(saldo(c))}</b></td><td><button class="btn mini">Cobrar</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="vacio">Todo cobrado ✓</td></tr>'}</tbody></table></section>
  <section class="panel"><h2>Últimos pagos</h2><ul class="lista-mini">${pagos.slice(0, 12).map((p) => `<li><div><b>${esc(masc(p.c.masc)?.n || 'Mostrador')}</b><br><small>${esc(p.met)} · ${fechaHora(p.f)}</small></div><div class="der"><b>${pesos(p.monto)}</b></div></li>`).join('')}</ul></section>`;
}

function verCuenta(cid) {
  const c = db().cuentas.find((x) => x.id === cid); const m = masc(c.masc); const d = dueno(c.dueno);
  ventana(`${dlgH(`Cuenta de ${esc(m?.n || 'mostrador')}`)}<div class="dlg-b">
    <table class="t"><tbody>${c.conceptos.map((x) => `<tr><td>${esc(x.n)}</td><td class="num">${pesos(x.monto)}</td></tr>`).join('')}
      <tr><td><b>Total</b></td><td class="num"><b>${pesos(totalCuenta(c))}</b></td></tr><tr><td>Pagado</td><td class="num">${pesos(c.pagado)}</td></tr>
      <tr><td><b>Saldo</b></td><td class="num"><b style="color:${saldo(c) > 0 ? 'var(--bad)' : 'var(--ok)'}">${pesos(saldo(c))}</b></td></tr></tbody></table>
    ${saldo(c) > 0 ? `<form class="form" id="fCob" style="grid-template-columns:1fr 1fr auto;align-items:end;margin-top:14px"><label>Monto<input name="monto" type="number" min="1" max="${saldo(c)}" value="${saldo(c)}" required></label>
      <label>Método<select name="met"><option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option></select></label><button class="btn">Registrar pago</button></form>` : '<p class="aviso" style="margin-top:12px">✓ Cuenta pagada</p>'}
    <form class="form" id="fCar" style="grid-template-columns:2fr 1fr auto;align-items:end;margin-top:10px"><label>Agregar cargo<input name="n" required placeholder="Ej. Ultrasonido"></label><label>Monto<input name="monto" type="number" min="1" required></label><button class="btn sec">Agregar</button></form>
    <ul class="lista-mini" style="margin-top:10px">${c.pagos.map((p) => `<li>${esc(p.met)} · ${fechaHora(p.f)}<span class="der">${pesos(p.monto)}</span></li>`).join('')}</ul>
  </div><div class="dlg-p">${d && saldo(c) > 0 ? `<a class="btn sec" target="_blank" rel="noopener" href="${wa(tel52(d.tel), `Hola ${d.n.split(' ')[0]}, el saldo de ${m?.n} en ${db().conf.nombre} es de ${pesos(saldo(c))}. Puedes pagar en clínica o por transferencia.`)}">📱 Enviar saldo</a>` : ''}<button class="btn" data-cerrar>Listo</button></div>`);
  $('#fCob') && ($('#fCob').onsubmit = (e) => { e.preventDefault(); try { const n = cobrar(c, +e.target.monto.value, e.target.met.value); if (guardar(`Pago de ${pesos(n)} registrado`)) verCuenta(cid); } catch (err) { toast(err.message, 'error'); } });
  $('#fCar').onsubmit = (e) => { e.preventDefault(); c.conceptos.push({ n: e.target.n.value.trim(), monto: Math.round(+e.target.monto.value) }); c.abierta = true; if (guardar('Cargo agregado')) verCuenta(cid); };
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  return cab('Ajustes', 'Datos de la clínica y precios de servicios (se actualizan en el sitio al guardar).') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre<input name="nombre" required value="${esc(c.nombre)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label>
    <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label><label>Horario<input name="horario" value="${esc(c.horario)}"></label>
    <label>Día de hospitalización ($)<input name="diaHosp" type="number" min="0" value="${c.diaHosp}"></label><label>PIN del panel<input name="pin" required minlength="4" maxlength="6" value="${esc(c.pin)}"></label>
    ${db().serv.map((s) => `<label>${esc(s.n)} ($)<input name="s_${s.id}" type="number" min="0" value="${s.precio}"></label>`).join('')}
    <div class="full"><button class="btn">Guardar</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación
const VISTAS = { inicio, agenda, pacientes, hospital, recordatorios: recordatoriosV, farmacia, cobros, ajustes };
function pintar() {
  const r = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio';
  $('#vista').innerHTML = VISTAS[r]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
  const n = { nAge: db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).length, nHos: hospActivos().length, nRec: recordatorios().filter((x) => !avisado(x.v)).length, nFar: alertasFarm().length };
  for (const [k, v] of Object.entries(n)) { $('#' + k).hidden = !v; $('#' + k).textContent = v; }
  if (r === 'agenda') $('#fAg').onchange = (e) => { fAg = e.target.value || dia(); pintar(); };
  if (r === 'pacientes') $('#qPac').oninput = (e) => { qPac = e.target.value; pintar(); const i = $('#qPac'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  if (r === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      Object.assign(db().conf, { nombre: d.nombre.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), direccion: d.direccion.trim(), horario: d.horario.trim(), diaHosp: +d.diaHosp, pin: d.pin.trim() });
      db().serv.forEach((s) => { s.precio = +d['s_' + s.id]; });
      guardar('Ajustes guardados');
    };
    $('#reiniciar').onclick = () => { if (confirm('Se borran tus cambios y vuelven los datos de ejemplo. ¿Continuar?')) { B.reiniciar(); pintar(); toast('Demo reiniciado'); } };
  }
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s);
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  let el;
  if ((el = q('[data-avanzar]'))) {
    const c = db().citas.find((x) => x.id === el.dataset.avanzar);
    if (el.dataset.a === 'cerrar') return cerrarCita(c);
    c.estado = el.dataset.a; c.hist.push({ e: c.estado, f: new Date().toISOString() });
    return guardar(`${masc(c.masc).n}: ${CITA_TXT[c.estado]}${c.estado === 'lista' ? ' · el dueño ya lo ve en su portal' : ''}`);
  }
  if ((el = q('[data-cancelar-cita]')) && confirm('¿Cancelar la cita?')) { const c = db().citas.find((x) => x.id === el.dataset.cancelarCita); c.estado = 'cancelada'; c.hist.push({ e: 'cancelada', f: new Date().toISOString() }); return guardar('Cita cancelada, el horario quedó libre'); }
  if ((el = q('[data-dia]'))) { fAg = el.dataset.dia === '0' ? dia() : new Date(Date.parse(fAg + 'T12:00') + el.dataset.dia * 864e5).toLocaleDateString('en-CA'); return pintar(); }
  if ((el = q('[data-nueva-cita]'))) return nuevaCitaDlg(el.dataset.nuevaCita);
  if ((el = q('[data-exp]'))) { tabExp = 'consultas'; return expediente(el.dataset.exp); }
  if ((el = q('[data-texp]'))) { tabExp = el.dataset.texp; return expediente(el.dataset.m); }
  if ((el = q('[data-nueva-consulta]'))) return nuevaConsulta(el.dataset.nuevaConsulta);
  if (q('[data-nuevo-pac]')) return nuevoPaciente();
  if ((el = q('[data-hospitalizar]'))) return hospitalizar(el.dataset.hospitalizar);
  if ((el = q('[data-dia-hosp]'))) { const h = db().hosp.find((x) => x.id === el.dataset.diaHosp); h.dias++; db().cuentas.find((c) => c.id === h.cuenta).conceptos.push({ n: `Hospitalización día ${h.dias}`, monto: db().conf.diaHosp }); db().cuentas.find((c) => c.id === h.cuenta).abierta = true; return guardar(`Día ${h.dias} cargado`); }
  if ((el = q('[data-alta]')) && confirm('¿Dar de alta? El dueño verá la noticia en su portal.')) {
    const h = db().hosp.find((x) => x.id === el.dataset.alta); const ahora = new Date().toISOString();
    h.activa = false; h.estado = 'alta'; h.notas.push({ f: ahora, estado: 'alta', txt: '¡Dado de alta! Ya puede irse a casa 🎉' });
    return guardar(`${masc(h.masc).n} dado de alta. Cobra su cuenta en Cobros.`);
  }
  if ((el = q('[data-cuenta]'))) return verCuenta(el.dataset.cuenta);
  if ((el = q('[data-entrada]'))) return entrada(el.dataset.entrada);
  if (q('[data-venta]')) return venta();
  if ((el = q('[data-avisar]'))) { (db().avisos ||= {})[el.dataset.avisar] = new Date().toISOString(); setTimeout(() => guardar('Marcado como avisado'), 300); }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-nota]'); if (!f) return;
  e.preventDefault();
  const h = db().hosp.find((x) => x.id === f.dataset.nota);
  h.estado = f.estado.value; h.notas.push({ f: new Date().toISOString(), estado: h.estado, txt: f.txt.value.trim() });
  guardar('Publicado: el dueño ya lo está viendo');
});
addEventListener('hashchange', pintar);

let antes = db().citas.length;
B.alCambiar(() => {
  const nueva = db().citas.length > antes && db().citas.at(-1);
  if (nueva && nueva.origen === 'portal') toast(`📅 Cita en línea: ${masc(nueva.masc)?.n} · ${serv(nueva.serv).n} ${fDia(nueva.fecha)} ${nueva.hora}`);
  antes = db().citas.length;
  pintar();
});
puerta('veterinaria', db().conf.pin, () => { $('#app').hidden = false; pintar(); });
