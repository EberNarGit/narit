// Panel del consultorio dental: agenda, expediente con odontograma, presupuestos, plan de tratamiento, cobranza y limpiezas.
import { $, $$, esc, pesos, fecha, fechaHora, wa, toast, puerta, barras, uid } from '../_base/sis.js';
import { abrir, dia, fDia, fAno, diasEntre, trat, totalPres, aceptar, pagarCuota, cuotasDe, saldoPac, vencido, proxCuota, desdeOdo, hecho, recallPend,
  horasLibres, nuevaCita, DOCS, PLAZOS, CITA_TXT, CITA_BADGE, PRES_TXT } from './datos.js';
import { odontograma } from './odo.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
const pac = (id) => db().pacs.find((p) => p.id === id);
const guardar = (msg) => { if (B.guardar()) { if (msg) toast(msg); pintar(); return true; } return false; };
const ventana = (html, ancho = false) => { dlg.className = ancho ? 'ancho' : ''; dlg.innerHTML = html; if (!dlg.open) dlg.showModal(); };
const cab = (t, sub, acc = '') => `<div class="top"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="acc">${acc}</div></div>`;
const dlgH = (t) => `<div class="dlg-h"><h2>${t}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>`;
const ini = (n) => n.split(' ').slice(0, 2).map((x) => x[0]).join('');
const portalUrl = () => new URL('index.html#portal', location.href).href;
const waPac = (p, msg) => wa('52' + p.tel, msg);
const hola = (p) => `Hola ${p.n.split(' ')[0]}, te escribimos de ${db().conf.nombre}.`;
const presEnv = () => db().pres.filter((p) => p.estado === 'enviado');
const conVencido = () => db().pacs.filter((p) => vencido(db(), p.id) > 0);
const hoyISO = () => new Date().toISOString().slice(0, 10);

// ---------- Hoy
function inicio() {
  const hoy = db().citas.filter((c) => c.fecha === dia() && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
  const pag = db().pagos; const mes = hoyISO().slice(0, 7);
  const dias = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = d.toISOString().slice(0, 10); return { k: d.getDate() + '', v: pag.filter((p) => p.f.slice(0, 10) === k).reduce((s, p) => s + p.monto, 0) }; });
  const seg = presEnv().filter((p) => diasEntre(p.f.slice(0, 10), dia()) >= 5);
  return cab('Hoy en el consultorio', new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }), '<a class="btn sec" href="index.html#portal" target="_blank" rel="noopener">Ver portal ↗</a><button class="btn" data-nueva-cita>+ Cita</button>') + `
  <div class="kpis">
    <div class="kpi"><span>Citas de hoy</span><b>${hoy.length}</b><small>${db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).length} en línea por confirmar</small></div>
    <div class="kpi"><span>Cobrado hoy</span><b>${pesos(pag.filter((p) => p.f.startsWith(hoyISO())).reduce((s, p) => s + p.monto, 0))}</b><small>mes: ${pesos(pag.filter((p) => p.f.startsWith(mes)).reduce((s, p) => s + p.monto, 0))}</small></div>
    <div class="kpi ${presEnv().length ? 'alerta' : ''}"><span>Presupuestos sin respuesta</span><b>${pesos(presEnv().reduce((s, p) => s + totalPres(db(), { ...p, plazos: 3 }), 0))}</b><small>${presEnv().length} pacientes por cerrar</small></div>
    <div class="kpi ${conVencido().length ? 'alerta' : ''}"><span>Pagos vencidos</span><b>${pesos(conVencido().reduce((s, p) => s + vencido(db(), p.id), 0))}</b><small>${conVencido().length} pacientes</small></div>
  </div>
  <div class="grid2">
    <section class="panel"><h2>Agenda de hoy <a href="#agenda">Ver agenda →</a></h2><div class="agenda">${hoy.map(citaFila).join('') || '<p class="vacio">Sin citas hoy</p>'}</div></section>
    <div>
      <section class="panel"><h2>Para hoy</h2><ul class="lista-mini">
        ${seg.map((p) => `<li><span class="ini">${ini(pac(p.pac).n)}</span><div><b>${esc(pac(p.pac).n)}</b><br><small>Presupuesto de ${pesos(totalPres(db(), { ...p, plazos: 3 }))} sin respuesta hace ${diasEntre(p.f.slice(0, 10), dia())} días</small></div><div class="der"><a class="btn mini" target="_blank" rel="noopener" href="${waPac(pac(p.pac), msgSeguimiento(p))}">📱 Seguir</a></div></li>`).join('')}
        ${conVencido().map((p) => `<li><span class="ini">${ini(p.n)}</span><div><b>${esc(p.n)}</b><br><small>Debe ${pesos(vencido(db(), p.id))} vencido</small></div><div class="der"><a class="btn mini sec" href="#cobranza">Cobrar</a></div></li>`).join('')}
        ${!seg.length && !conVencido().length ? '<li class="vacio">Todo en orden ✓</li>' : ''}</ul></section>
      <section class="panel"><h2>Cobrado, últimos 14 días</h2>${barras(dias)}</section>
    </div>
  </div>`;
}
const msgSeguimiento = (p) => `${hola(pac(p.pac))} ¿Pudiste revisar tu presupuesto? Lo puedes pagar hasta en 12 meses sin intereses y aceptarlo desde aquí: ${portalUrl()} ¿Te ayudo con alguna duda?`;

function citaFila(c) {
  const p = pac(c.pac); const t = trat(db(), c.trat);
  const sig = { pendiente: ['confirmada', 'Confirmar'], confirmada: ['en sala', 'Llegó'], 'en sala': ['en curso', 'Pasar a sillón'], 'en curso': ['atender', 'Terminar y cobrar'] }[c.estado];
  return `<div class="cita ${c.estado.replace(' ', '-')}"><span class="h">${c.hora}</span>
    <div><b>${esc(p.n)}</b> · ${esc(t.n)} ${c.origen === 'portal' ? '<span class="badge b-info">En línea</span>' : ''} ${p.alergias ? `<span class="badge b-bad" title="${esc(p.alergias)}">⚠ ${esc(p.alergias)}</span>` : ''}<br><small>${esc(c.doc)} · ${esc(p.tel)}${c.nota ? ` · 📝 ${esc(c.nota)}` : ''}</small></div>
    <div class="acc"><span class="badge ${CITA_BADGE[c.estado]}">${CITA_TXT[c.estado]}</span>
      ${sig ? `<button class="btn mini" data-avanzar="${c.id}" data-a="${sig[0]}">${sig[1]}</button>` : ''}
      ${['confirmada', 'en sala'].includes(c.estado) && c.fecha <= dia() ? `<button class="btn mini sec" data-falto="${c.id}">No llegó</button>` : ''}
      ${['pendiente', 'confirmada'].includes(c.estado) ? `<button class="btn mini sec" data-cancelar-cita="${c.id}">Cancelar</button>` : ''}
      <button class="btn mini sec" data-exp="${p.id}">Expediente</button>
      <a class="btn mini sec" target="_blank" rel="noopener" href="${waPac(p, `${hola(p)} Te confirmamos tu cita de ${t.n} el ${fDia(c.fecha)} a las ${c.hora} con ${c.doc}. Si necesitas cambiarla: ${portalUrl()}`)}" aria-label="WhatsApp">📱</a></div></div>`;
}

// ---------- Agenda
let fAg = dia();
function agenda() {
  const l = db().citas.filter((c) => c.fecha === fAg).sort((a, b) => a.hora.localeCompare(b.hora));
  const pend = db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  const faltas = db().citas.filter((c) => c.estado === 'falto').length;
  return cab('Agenda', `Dos sillones. Citas que no llegaron este periodo: ${faltas}.`, '<button class="btn" data-nueva-cita>+ Nueva cita</button>') + `
  ${pend.length ? `<section class="panel"><h2>Solicitudes en línea por confirmar (${pend.length})</h2><div class="agenda">${pend.map((c) => citaFila(c).replace('<span class="h">', `<span class="h"><small style="font-size:.68rem;display:block">${fDia(c.fecha)}</small>`)).join('')}</div></section>` : ''}
  <div class="filtros"><button class="btn sec" data-dia="-1" aria-label="Día anterior">←</button><input type="date" id="fAg" value="${fAg}" aria-label="Día"><button class="btn sec" data-dia="1" aria-label="Día siguiente">→</button><button class="btn sec" data-dia="0">Hoy</button></div>
  <section class="panel"><h2>${fDia(fAg)} · ${l.filter((c) => c.estado !== 'cancelada').length} citas · ${horasLibres(db(), fAg).length} horarios libres</h2><div class="agenda">${l.map(citaFila).join('') || '<p class="vacio">Sin citas este día</p>'}</div></section>`;
}

function nuevaCitaDlg(pid) {
  ventana(`<form id="fCita">${dlgH('Nueva cita')}<div class="dlg-b form">
    <label class="full">Paciente<select name="pac">${db().pacs.map((p) => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${esc(p.n)} · ${p.tel}</option>`).join('')}</select></label>
    <label>Tratamiento<select name="trat">${db().trats.map((t) => `<option value="${t.id}">${esc(t.n)}</option>`).join('')}</select></label>
    <label>Doctor<select name="doc">${DOCS.map((d) => `<option>${d}</option>`).join('')}</select></label>
    <label>Día<input type="date" name="fecha" min="${dia()}" value="${fAg >= dia() ? fAg : dia()}" required></label>
    <label>Hora<select name="hora" id="selHora"></select></label>
    <label class="full">Nota<input name="nota" placeholder="Diente, indicaciones…"></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Agendar</button></div></form>`);
  const f = $('#fCita');
  const horas = () => { $('#selHora').innerHTML = horasLibres(db(), f.fecha.value).map((h) => `<option>${h}</option>`).join('') || '<option value="">Sin horarios</option>'; };
  f.fecha.onchange = horas; horas();
  f.onsubmit = (e) => {
    e.preventDefault(); if (!f.hora.value) return toast('No hay horarios ese día', 'error');
    try { nuevaCita(db(), { pac: f.pac.value, fecha: f.fecha.value, hora: f.hora.value, trat: f.trat.value, doc: f.doc.value, nota: f.nota.value.trim() }); } catch (err) { return toast(err.message, 'error'); }
    fAg = f.fecha.value; if (guardar('Cita agendada')) dlg.close();
  };
}

// Terminar cita: nota clínica, avance del plan y cobro en un solo paso.
function atender(c) {
  const p = pac(c.pac); const t = trat(db(), c.trat);
  const plan = db().pres.filter((x) => x.pac === p.id && x.estado === 'aceptado');
  const pend = plan.flatMap((pr) => pr.items.map((it, i) => ({ pr, it, i }))).filter((x) => !x.it.hecho);
  const enPlan = pend.length > 0 && !['limpieza', 'valoracion', 'urgencia', 'blanqueamiento'].includes(c.trat);
  const sal = saldoPac(db(), p.id);
  ventana(`<form id="fAt">${dlgH(`Terminar cita · ${esc(p.n)}`)}<div class="dlg-b form">
    <label class="full">Nota de evolución (la ve el paciente)<textarea name="txt" required>${esc(t.n)}${c.nota ? ': ' + c.nota : ''}. Sin complicaciones.</textarea></label>
    ${pend.length ? `<fieldset class="full" style="border:1px solid var(--ln);border-radius:12px;padding:10px"><legend class="ayuda">Tratamientos del plan terminados hoy (actualiza el odontograma)</legend>
      ${pend.map((x, k) => `<label class="check"><input type="checkbox" name="h${k}" ${enPlan && x.it.trat === c.trat && k === pend.findIndex((y) => y.it.trat === c.trat) ? 'checked' : ''}> ${esc(trat(db(), x.it.trat).n)}${x.it.diente ? ' · diente ' + x.it.diente : ''}</label>`).join('')}</fieldset>` : ''}
    <label>Cobrar hoy ($)<input name="monto" type="number" min="0" step="1" value="${enPlan ? Math.max(0, Math.min(sal, proxCuota(db(), p.id)?.monto - proxCuota(db(), p.id)?.pagado || 0)) : t.precio}"></label>
    <label>Método<select name="met"><option>Tarjeta</option><option>Efectivo</option><option>Transferencia</option></select></label>
    <p class="full ayuda">${enPlan ? `Se abona al plan de pagos (saldo ${pesos(sal)}).` : `Cobro de ${esc(t.n)}.`} Déjalo en 0 si no paga hoy.</p>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Terminar</button></div></form>`);
  $('#fAt').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const ahora = new Date().toISOString();
    db().evol.push({ id: uid(), pac: p.id, f: ahora, doc: c.doc, txt: f.txt.value.trim() });
    pend.forEach((x, k) => { if (f['h' + k]?.checked) hecho(db(), x.pr, x.i); });
    if (c.trat === 'limpieza') p.ultLimpieza = dia();
    const m = Math.round(+f.monto.value);
    if (m > 0) {
      if (enPlan && sal > 0) pagarCuota(db(), p.id, m, f.met.value);
      else db().pagos.push({ id: uid(), pac: p.id, pres: '', monto: m, met: f.met.value, f: ahora, concepto: t.n });
    }
    c.estado = 'completada'; c.hist.push({ e: 'completada', f: ahora });
    if (guardar(`Cita terminada${m > 0 ? ` · cobrado ${pesos(m)}` : ''}`)) dlg.close();
  };
}

// ---------- Pacientes y expediente
let qPac = '', tabExp = 'odo', pincel = 'caries';
function pacientes() {
  const q = qPac.toLowerCase();
  const l = db().pacs.filter((p) => !q || (p.n + ' ' + p.tel).toLowerCase().includes(q));
  return cab('Pacientes', `${db().pacs.length} pacientes`, '<button class="btn" data-nuevo-pac>+ Nuevo paciente</button>') + `
  <div class="filtros"><input id="qPac" type="search" placeholder="Buscar por nombre o teléfono…" value="${esc(qPac)}" aria-label="Buscar paciente"></div>
  <div class="pacs">${l.map((p) => { const s = saldoPac(db(), p.id), v = vencido(db(), p.id), pe = db().pres.some((x) => x.pac === p.id && x.estado === 'enviado');
    return `<button class="pac" data-exp="${p.id}"><span class="ini">${ini(p.n)}</span><b>${esc(p.n)}</b><br><small>${esc(p.tel)} · ${Math.floor(diasEntre(p.nac, dia()) / 365.25)} años</small><br>
      ${v ? `<span class="badge b-bad">Vencido ${pesos(v)}</span> ` : s ? `<span class="badge b-warn">Saldo ${pesos(s)}</span> ` : ''}${pe ? '<span class="badge b-info">Presupuesto enviado</span> ' : ''}${p.alergias ? `<span class="badge b-bad">⚠ ${esc(p.alergias)}</span>` : ''}</button>`; }).join('')}</div>`;
}

function expediente(pid) {
  const p = pac(pid);
  const pres = db().pres.filter((x) => x.pac === pid).sort((a, b) => b.f.localeCompare(a.f));
  const hall = desdeOdo(p);
  const cont = {
    odo: () => `<p class="ayuda">Elige qué marcar y toca el diente. Los hallazgos en rojo, naranja, morado y gris generan el presupuesto.</p>${odontograma(p, true, pincel)}
      <div class="acc" style="margin-top:12px"><button class="btn" data-nuevo-pres="${pid}" ${hall.length ? '' : 'disabled'}>Generar presupuesto (${hall.length} hallazgos)</button></div>`,
    plan: () => pres.filter((x) => x.estado === 'aceptado').map((pr) => `<div class="panel"><h2>Plan del ${fAno(pr.f)} · ${pr.plazos === 1 ? 'contado' : pr.plazos + ' meses'} <span>${pesos(totalPres(db(), pr))}</span></h2>
      ${pr.items.map((it, i) => `<div class="paso"><input type="checkbox" data-hecho="${pr.id}" data-i="${i}" ${it.hecho ? 'checked' : ''} aria-label="Terminado"><span>${esc(trat(db(), it.trat).n)}${it.diente ? ` · diente ${it.diente}` : ''}</span><small>${it.hecho ? 'Hecho ' + fAno(it.hecho) : 'Pendiente'}</small></div>`).join('')}</div>`).join('') || '<p class="vacio">Sin plan aceptado.</p>',
    pres: () => `<button class="btn mini" data-nuevo-pres="${pid}">+ Nuevo presupuesto</button>${pres.map((pr) => `<div class="panel" style="margin-top:10px"><h2>${fAno(pr.f)} <span class="badge ${pr.estado === 'aceptado' ? 'b-ok' : pr.estado === 'enviado' ? 'b-info' : 'b-mut'}">${PRES_TXT[pr.estado]}</span></h2>
      <ul class="lista-mini">${pr.items.map((it) => `<li>${esc(trat(db(), it.trat).n)}${it.diente ? ' · ' + it.diente : ''}<span class="der">${pesos(trat(db(), it.trat).precio)}</span></li>`).join('')}</ul>
      <p style="margin:6px 0 0">Total ${pr.desc ? `(-${pr.desc}%) ` : ''}<b>${pesos(totalPres(db(), pr.estado === 'aceptado' ? pr : { ...pr, plazos: 3 }))}</b></p>
      ${pr.estado === 'enviado' ? `<div class="acc" style="margin-top:8px"><a class="btn mini sec" target="_blank" rel="noopener" href="${waPac(p, msgSeguimiento(pr))}">📱 Dar seguimiento</a><button class="btn mini" data-aceptar-aqui="${pr.id}">Aceptó en consultorio</button><button class="btn mini sec" data-rechazar="${pr.id}">Rechazó</button></div>` : ''}</div>`).join('')}`,
    pagos: () => { const cs = cuotasDe(db(), pid); return `<div class="kpis"><div class="kpi"><span>Saldo</span><b>${pesos(saldoPac(db(), pid))}</b></div><div class="kpi ${vencido(db(), pid) ? 'alerta' : ''}"><span>Vencido</span><b>${pesos(vencido(db(), pid))}</b></div></div>
      ${saldoPac(db(), pid) ? `<form class="form" id="fAbono" style="grid-template-columns:1fr 1fr auto;align-items:end;margin-bottom:10px"><label>Abono<input name="monto" type="number" min="1" value="${vencido(db(), pid) || (proxCuota(db(), pid).monto - proxCuota(db(), pid).pagado)}" required></label><label>Método<select name="met"><option>Tarjeta</option><option>Efectivo</option><option>Transferencia</option></select></label><button class="btn">Registrar</button></form>` : ''}
      <table class="t"><tbody>${cs.map((c) => `<tr><td>${esc(c.n)}</td><td>${fAno(c.vence)}</td><td class="num">${pesos(c.monto)}</td><td>${c.pagado >= c.monto ? '<span class="badge b-ok">Pagado</span>' : c.vence < dia() ? '<span class="badge b-bad">Vencido</span>' : c.pagado ? `<span class="badge b-warn">${pesos(c.pagado)}</span>` : '<span class="badge b-mut">Pendiente</span>'}</td></tr>`).join('') || '<tr><td class="vacio">Sin plan de pagos</td></tr>'}</tbody></table>`; },
    notas: () => `<form class="form" id="fNota" style="grid-template-columns:1fr auto;align-items:end"><label>Nueva nota<input name="txt" required placeholder="Lo que se hizo, indicaciones…"></label><button class="btn">Agregar</button></form>
      <ul class="hist" style="margin-top:12px">${db().evol.filter((e) => e.pac === pid).sort((a, b) => b.f.localeCompare(a.f)).map((e) => `<li>${esc(e.txt)}<br><small>${fechaHora(e.f)} · ${esc(e.doc)}</small></li>`).join('')}</ul>`,
    citas: () => `<button class="btn mini" data-nueva-cita="${pid}">+ Agendar</button><ul class="lista-mini">${db().citas.filter((c) => c.pac === pid).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)).map((c) => `<li><div><b>${esc(trat(db(), c.trat).n)}</b><br><small>${fDia(c.fecha)} · ${c.hora} · ${esc(c.doc)}</small></div><span class="der badge ${CITA_BADGE[c.estado]}">${CITA_TXT[c.estado]}</span></li>`).join('')}</ul>`,
  }[tabExp]();
  ventana(`${dlgH(`${esc(p.n)}`)}<div class="dlg-b">
    <p style="margin:0">${esc(p.tel)} · ${Math.floor(diasEntre(p.nac, dia()) / 365.25)} años · última limpieza: ${diasEntre(p.ultLimpieza, dia()) > 3000 ? 'sin registro' : fAno(p.ultLimpieza)} · <a target="_blank" rel="noopener" href="${waPac(p, hola(p))}">📱 WhatsApp</a></p>
    ${p.alergias ? `<p class="aviso" style="margin:8px 0 0">⚠ ${esc(p.alergias)}</p>` : ''}
    <div class="tabs-mini">${[['odo', 'Odontograma'], ['plan', 'Plan de tratamiento'], ['pres', 'Presupuestos'], ['pagos', 'Pagos'], ['notas', 'Notas'], ['citas', 'Citas']].map(([k, t]) => `<button data-texp="${k}" data-p="${pid}" aria-pressed="${tabExp === k}">${t}</button>`).join('')}</div>${cont}</div>`, true);
  $('#fAbono') && ($('#fAbono').onsubmit = (e) => { e.preventDefault(); try { const n = pagarCuota(db(), pid, +e.target.monto.value, e.target.met.value); if (guardar(`Abono de ${pesos(n)} registrado`)) expediente(pid); } catch (err) { toast(err.message, 'error'); } });
  $('#fNota') && ($('#fNota').onsubmit = (e) => { e.preventDefault(); db().evol.push({ id: uid(), pac: pid, f: new Date().toISOString(), doc: DOCS[0], txt: e.target.txt.value.trim() }); if (guardar('Nota agregada')) expediente(pid); });
}

function nuevoPres(pid) {
  const p = pac(pid); const hall = desdeOdo(p);
  ventana(`<form id="fPres">${dlgH(`Presupuesto · ${esc(p.n)}`)}<div class="dlg-b form">
    <fieldset class="full" style="border:1px solid var(--ln);border-radius:12px;padding:10px"><legend class="ayuda">Del odontograma</legend>
      ${hall.map((h, k) => `<label class="check"><input type="checkbox" name="o${k}" checked> ${esc(trat(db(), h.trat).n)} · diente ${h.diente} <span class="ayuda">${pesos(trat(db(), h.trat).precio)}</span></label>`).join('') || '<p class="ayuda">Sin hallazgos marcados.</p>'}</fieldset>
    <label>Agregar tratamiento<select name="extra"><option value="">— Ninguno —</option>${db().trats.map((t) => `<option value="${t.id}">${esc(t.n)} · ${pesos(t.precio)}</option>`).join('')}</select></label>
    <label>Diente (opcional)<input name="diente" type="number" min="11" max="48"></label>
    <label>Descuento (%)<input name="desc" type="number" min="0" max="50" value="0"></label>
    <p class="full aviso" id="totPres"></p>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar y enviar al paciente</button></div></form>`);
  const f = $('#fPres');
  const items = () => [...hall.filter((_, k) => f['o' + k].checked), ...(f.extra.value ? [{ trat: f.extra.value, diente: +f.diente.value || '', hecho: '' }] : [])];
  const tot = () => { const pr = { items: items(), desc: +f.desc.value }; $('#totPres').innerHTML = pr.items.length ? `Total <b>${pesos(totalPres(db(), { ...pr, plazos: 3 }))}</b> · a 12 meses: enganche ${pesos(totalPres(db(), { ...pr, plazos: 12 }) * db().conf.enganche / 100)} + 12 de ${pesos(totalPres(db(), { ...pr, plazos: 12 }) * (1 - db().conf.enganche / 100) / 12)}` : 'Elige al menos un tratamiento.'; };
  f.addEventListener('input', tot); f.addEventListener('change', tot); tot();
  f.onsubmit = (e) => {
    e.preventDefault(); const it = items(); if (!it.length) return toast('Elige al menos un tratamiento', 'error');
    const pr = { id: uid(), pac: pid, f: new Date().toISOString(), items: it, desc: Math.min(50, +f.desc.value || 0), estado: 'enviado', cuotas: [] };
    db().pres.push(pr); tabExp = 'pres';
    if (!guardar('Presupuesto guardado: el paciente ya lo ve en su portal')) return;
    ventana(`${dlgH('Presupuesto listo')}<div class="dlg-b"><p>El paciente puede aceptarlo y elegir plazo desde «Mi sonrisa».</p><p>Total: <b>${pesos(totalPres(db(), { ...pr, plazos: 3 }))}</b></p></div>
      <div class="dlg-p"><button class="btn sec" data-exp="${pid}">Volver al expediente</button><a class="btn" target="_blank" rel="noopener" href="${waPac(p, `${hola(p)} Tu presupuesto ya está listo: ${pesos(totalPres(db(), { ...pr, plazos: 3 }))}, hasta 12 meses sin intereses. Revísalo y acéptalo aquí: ${portalUrl()}`)}">📱 Enviar por WhatsApp</a></div>`);
  };
}

function nuevoPac() {
  ventana(`<form id="fPac">${dlgH('Nuevo paciente')}<div class="dlg-b form">
    <label class="full">Nombre completo<input name="n" required></label><label>WhatsApp (10 dígitos)<input name="tel" required inputmode="tel"></label>
    <label>Nacimiento<input name="nac" type="date" max="${dia()}" required></label><label class="full">Alergias o enfermedades<input name="alergias" placeholder="Ninguna"></label>
  </div><div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Guardar</button></div></form>`);
  $('#fPac').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const tel = f.tel.value.replace(/\D/g, '').slice(-10);
    if (tel.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
    if (db().pacs.some((p) => p.tel === tel)) return toast('Ese teléfono ya está registrado', 'error');
    const id = uid(); db().pacs.push({ id, n: f.n.value.trim(), tel, nac: f.nac.value, alergias: f.alergias.value.trim(), odo: {}, ultLimpieza: dia(-9999), alta: new Date().toISOString() });
    tabExp = 'odo'; if (guardar('Paciente registrado')) expediente(id);
  };
}

function aceptarAqui(prId) {
  const pr = db().pres.find((x) => x.id === prId);
  ventana(`<form id="fAcep">${dlgH('Aceptó en consultorio')}<div class="dlg-b form"><label class="full">Plazo<select name="plazo">${PLAZOS.map(([n, t]) => `<option value="${n}" ${n === 6 ? 'selected' : ''}>${t} · ${pesos(totalPres(db(), pr, n))}</option>`).join('')}</select></label></div>
    <div class="dlg-p"><button type="button" class="btn sec" data-cerrar>Cancelar</button><button class="btn">Aceptar y crear calendario</button></div></form>`);
  $('#fAcep').onsubmit = (e) => { e.preventDefault(); aceptar(db(), pr, +e.target.plazo.value); tabExp = 'pagos'; if (guardar('Presupuesto aceptado. Calendario de pagos creado.')) expediente(pr.pac); };
}

// ---------- Presupuestos (seguimiento)
function presupuestos() {
  const t = (e) => db().pres.filter((p) => p.estado === e);
  const monto = (l) => l.reduce((s, p) => s + totalPres(db(), p.estado === 'aceptado' ? p : { ...p, plazos: 3 }), 0);
  const cerrados = t('aceptado').length + t('rechazado').length;
  const tarjeta = (p) => { const x = pac(p.pac); const d = diasEntre(p.f.slice(0, 10), dia());
    return `<li><span class="ini">${ini(x.n)}</span><div><b>${esc(x.n)}</b><br><small>${p.items.map((i) => esc(trat(db(), i.trat).n)).join(', ')}</small><br><small>${p.estado === 'enviado' ? `Enviado hace ${d} días` : fAno(p.fResp || p.f)}</small></div>
      <div class="der"><b>${pesos(totalPres(db(), p.estado === 'aceptado' ? p : { ...p, plazos: 3 }))}</b><br>${p.estado === 'enviado' ? `<a class="btn mini ${d >= 5 ? '' : 'sec'}" target="_blank" rel="noopener" href="${waPac(x, msgSeguimiento(p))}">📱 Seguir</a> <button class="btn mini sec" data-exp="${x.id}" data-tab-exp="pres">Abrir</button>` : ''}</div></li>`; };
  return cab('Presupuestos', 'El dinero que ya diagnosticaste y todavía no cobras. Dale seguimiento a los que llevan 5 días o más.') + `
  <div class="kpis"><div class="kpi alerta"><span>Por cerrar</span><b>${pesos(monto(t('enviado')))}</b><small>${t('enviado').length} presupuestos enviados</small></div>
    <div class="kpi"><span>Aceptados</span><b>${pesos(monto(t('aceptado')))}</b></div>
    <div class="kpi"><span>Tasa de aceptación</span><b>${cerrados ? Math.round((t('aceptado').length / cerrados) * 100) : 0}%</b><small>de los ya respondidos</small></div></div>
  <div class="embudo">${['enviado', 'aceptado', 'rechazado'].map((e) => `<section class="panel"><h2>${PRES_TXT[e]} · ${t(e).length}</h2><ul class="lista-mini">${t(e).sort((a, b) => a.f.localeCompare(b.f)).map(tarjeta).join('') || '<li class="vacio">—</li>'}</ul></section>`).join('')}</div>`;
}

// ---------- Cobranza
function cobranza() {
  const pacsSaldo = db().pacs.filter((p) => saldoPac(db(), p.id) > 0);
  const prox = pacsSaldo.map((p) => ({ p, c: proxCuota(db(), p.id) })).filter((x) => x.c && x.c.vence >= dia() && diasEntre(dia(), x.c.vence) <= 15).sort((a, b) => a.c.vence.localeCompare(b.c.vence));
  const mes = hoyISO().slice(0, 7);
  return cab('Cobranza', 'Planes de pago de tratamientos: quién debe, cuánto y desde cuándo.') + `
  <div class="kpis"><div class="kpi"><span>Cartera total</span><b>${pesos(pacsSaldo.reduce((s, p) => s + saldoPac(db(), p.id), 0))}</b><small>${pacsSaldo.length} pacientes con plan</small></div>
    <div class="kpi ${conVencido().length ? 'alerta' : ''}"><span>Vencido</span><b>${pesos(conVencido().reduce((s, p) => s + vencido(db(), p.id), 0))}</b></div>
    <div class="kpi"><span>Vence en 15 días</span><b>${pesos(prox.reduce((s, x) => s + x.c.monto - x.c.pagado, 0))}</b></div>
    <div class="kpi"><span>Abonos este mes</span><b>${pesos(db().pagos.filter((p) => p.pres === 'plan' && p.f.startsWith(mes)).reduce((s, p) => s + p.monto, 0))}</b></div></div>
  <section class="panel tabla"><h2>Vencidos</h2><table class="t"><tbody>${conVencido().map((p) => { const c = cuotasDe(db(), p.id).find((x) => x.pagado < x.monto); const d = diasEntre(c.vence, dia());
    return `<tr><td><b>${esc(p.n)}</b><br><small>${esc(c.n)} · venció hace ${d} días</small></td><td class="num"><b style="color:var(--bad)">${pesos(vencido(db(), p.id))}</b></td>
      <td><a class="btn mini sec" target="_blank" rel="noopener" href="${waPac(p, `${hola(p)} Te recordamos tu pago de ${pesos(vencido(db(), p.id))} de tu tratamiento. Puedes ver tu calendario aquí: ${portalUrl()} ¿Te paso los datos para transferir?`)}">📱 Recordar</a> <button class="btn mini" data-exp="${p.id}" data-tab-exp="pagos">Cobrar</button></td></tr>`; }).join('') || '<tr><td class="vacio">Sin vencidos ✓</td></tr>'}</tbody></table></section>
  <section class="panel tabla"><h2>Próximos 15 días</h2><table class="t"><tbody>${prox.map(({ p, c }) => `<tr><td><b>${esc(p.n)}</b><br><small>${esc(c.n)}</small></td><td>${fAno(c.vence)}</td><td class="num">${pesos(c.monto - c.pagado)}</td>
    <td><a class="btn mini sec" target="_blank" rel="noopener" href="${waPac(p, `${hola(p)} Tu próximo pago de ${pesos(c.monto - c.pagado)} vence el ${fAno(c.vence)}. ¡Gracias!`)}">📱 Avisar</a></td></tr>`).join('') || '<tr><td class="vacio">Nada en los próximos 15 días</td></tr>'}</tbody></table></section>`;
}

// ---------- Limpiezas (recall)
function recall() {
  const l = recallPend(db()).sort((a, b) => a.ultLimpieza.localeCompare(b.ultLimpieza));
  return cab('Limpiezas por recordar', `Pacientes con más de ${db().conf.recall} meses sin limpieza. Cada uno es una cita de ${pesos(trat(db(), 'limpieza').precio)} y la oportunidad de detectar tratamiento.`) + `
  <div class="kpis"><div class="kpi alerta"><span>Por recordar</span><b>${l.filter((p) => !db().avisos[p.id]).length}</b></div><div class="kpi"><span>Ya avisados</span><b>${l.filter((p) => db().avisos[p.id]).length}</b></div><div class="kpi"><span>Ingreso posible</span><b>${pesos(l.length * trat(db(), 'limpieza').precio)}</b></div></div>
  <section class="panel tabla"><table class="t"><tbody>${l.map((p) => { const m = Math.round(diasEntre(p.ultLimpieza, dia()) / 30.4);
    return `<tr><td><span class="ini">${ini(p.n)}</span><b>${esc(p.n)}</b></td><td>${m > 100 ? 'Sin registro' : `Hace ${m} meses`}</td>
      <td>${db().avisos[p.id] ? `<span class="badge b-ok">Avisado ${fecha(db().avisos[p.id])}</span>` : `<a class="btn mini" target="_blank" rel="noopener" data-avisar="${p.id}" href="${waPac(p, `${hola(p)} Ya te toca tu limpieza dental 🦷 (cada ${db().conf.recall} meses). Agenda en un minuto aquí: ${new URL('index.html', location.href).href}`)}">📱 Recordar</a>`}</td></tr>`; }).join('') || '<tr><td class="vacio">Todos al día ✓</td></tr>'}</tbody></table></section>`;
}

// ---------- Ajustes
function ajustes() {
  const c = db().conf;
  return cab('Ajustes', 'Precios, plazos y datos del consultorio. El sitio se actualiza al guardar.') + `
  <section class="panel"><form class="form" id="fConf">
    <label>Nombre<input name="nombre" required value="${esc(c.nombre)}"></label><label>WhatsApp<input name="whatsapp" required value="${esc(c.whatsapp)}"></label>
    <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label><label>Horario<input name="horario" value="${esc(c.horario)}"></label>
    <label>Enganche (%)<input name="enganche" type="number" min="0" max="90" value="${c.enganche}"></label><label>Recordar limpieza cada (meses)<input name="recall" type="number" min="1" max="24" value="${c.recall}"></label>
    <label>PIN del panel<input name="pin" required minlength="4" maxlength="6" value="${esc(c.pin)}"></label><span></span>
    ${db().trats.map((t) => `<label>${esc(t.n)} ($)<input name="t_${t.id}" type="number" min="0" value="${t.precio}"></label>`).join('')}
    <div class="full"><button class="btn">Guardar</button></div></form></section>
  <section class="panel"><h2>Datos del demo</h2><button class="btn peligro" id="reiniciar">Reiniciar demo con datos de ejemplo</button></section>`;
}

// ---------- Navegación y eventos
const VISTAS = { inicio, agenda, pacientes, presupuestos, cobranza, recall, ajustes };
function pintar() {
  const r = VISTAS[location.hash.slice(1)] ? location.hash.slice(1) : 'inicio';
  $('#vista').innerHTML = VISTAS[r]();
  $$('.side a[href^="#"]').forEach((a) => a.setAttribute('aria-current', a.getAttribute('href') === '#' + r ? 'page' : 'false'));
  const n = { nAge: db().citas.filter((c) => c.estado === 'pendiente' && c.fecha >= dia()).length, nPre: presEnv().length, nCob: conVencido().length, nRec: recallPend(db()).filter((p) => !db().avisos[p.id]).length };
  for (const [k, v] of Object.entries(n)) { $('#' + k).hidden = !v; $('#' + k).textContent = v; }
  if (r === 'agenda') $('#fAg').onchange = (e) => { fAg = e.target.value || dia(); pintar(); };
  if (r === 'pacientes') $('#qPac').oninput = (e) => { qPac = e.target.value; pintar(); const i = $('#qPac'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  if (r === 'ajustes') {
    $('#fConf').onsubmit = (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      Object.assign(db().conf, { nombre: d.nombre.trim(), whatsapp: d.whatsapp.replace(/\D/g, ''), direccion: d.direccion.trim(), horario: d.horario.trim(), enganche: +d.enganche, recall: +d.recall, pin: d.pin.trim() });
      db().trats.forEach((t) => { t.precio = +d['t_' + t.id]; });
      guardar('Ajustes guardados');
    };
    $('#reiniciar').onclick = () => { if (confirm('Se borran tus cambios y vuelven los datos de ejemplo. ¿Continuar?')) { B.reiniciar(); pintar(); toast('Demo reiniciado'); } };
  }
}

document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-avanzar]'))) {
    const c = db().citas.find((x) => x.id === el.dataset.avanzar);
    if (el.dataset.a === 'atender') return atender(c);
    c.estado = el.dataset.a; c.hist.push({ e: c.estado, f: new Date().toISOString() });
    return guardar(`${pac(c.pac).n}: ${CITA_TXT[c.estado]}`);
  }
  if ((el = q('[data-falto]'))) { const c = db().citas.find((x) => x.id === el.dataset.falto); c.estado = 'falto'; c.hist.push({ e: 'falto', f: new Date().toISOString() }); return guardar('Marcada como no llegó'); }
  if ((el = q('[data-cancelar-cita]')) && confirm('¿Cancelar la cita?')) { const c = db().citas.find((x) => x.id === el.dataset.cancelarCita); c.estado = 'cancelada'; c.hist.push({ e: 'cancelada', f: new Date().toISOString() }); return guardar('Cita cancelada'); }
  if ((el = q('[data-dia]'))) { fAg = el.dataset.dia === '0' ? dia() : new Date(Date.parse(fAg + 'T12:00') + el.dataset.dia * 864e5).toLocaleDateString('en-CA'); return pintar(); }
  if ((el = q('[data-nueva-cita]'))) return nuevaCitaDlg(el.dataset.nuevaCita);
  if ((el = q('[data-exp]'))) { tabExp = el.dataset.tabExp || 'odo'; return expediente(el.dataset.exp); }
  if ((el = q('[data-texp]'))) { tabExp = el.dataset.texp; return expediente(el.dataset.p); }
  if ((el = q('[data-pincel]'))) { pincel = el.dataset.pincel; return expediente(dlg.querySelector('[data-texp]').dataset.p); }
  if ((el = q('[data-diente]'))) {
    const pid = dlg.querySelector('[data-texp]').dataset.p; const p = pac(pid); const n = el.dataset.diente;
    if (pincel === 'sano') delete p.odo[n]; else p.odo[n] = pincel;
    B.guardar(); return expediente(pid);
  }
  if ((el = q('[data-nuevo-pres]'))) return nuevoPres(el.dataset.nuevoPres);
  if (q('[data-nuevo-pac]')) return nuevoPac();
  if ((el = q('[data-aceptar-aqui]'))) return aceptarAqui(el.dataset.aceptarAqui);
  if ((el = q('[data-rechazar]')) && confirm('¿Marcar como rechazado?')) { const pr = db().pres.find((x) => x.id === el.dataset.rechazar); pr.estado = 'rechazado'; pr.fResp = new Date().toISOString(); if (guardar('Marcado como rechazado')) expediente(pr.pac); return; }
  if ((el = q('[data-avisar]'))) { db().avisos[el.dataset.avisar] = new Date().toISOString(); setTimeout(() => guardar('Marcado como avisado'), 300); }
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-hecho]'); if (!el) return;
  const pr = db().pres.find((x) => x.id === el.dataset.hecho); hecho(db(), pr, +el.dataset.i);
  if (guardar(pr.items[+el.dataset.i].hecho ? 'Tratamiento terminado: el odontograma y el portal se actualizaron' : 'Marcado como pendiente')) expediente(pr.pac);
});
addEventListener('hashchange', pintar);

let antes = { c: db().citas.length, a: db().pres.filter((p) => p.estado === 'aceptado').length };
B.alCambiar(() => {
  const c = db().citas.at(-1);
  if (db().citas.length > antes.c && c.origen === 'portal') toast(`📅 Cita en línea: ${pac(c.pac)?.n} · ${trat(db(), c.trat).n} ${fDia(c.fecha)} ${c.hora}`);
  const a = db().pres.filter((p) => p.estado === 'aceptado').length;
  if (a > antes.a) { const pr = db().pres.filter((p) => p.estado === 'aceptado').sort((x, y) => (y.fResp || '').localeCompare(x.fResp || ''))[0]; toast(`🎉 ${pac(pr.pac).n} aceptó su presupuesto de ${pesos(totalPres(db(), pr))} a ${pr.plazos === 1 ? 'contado' : pr.plazos + ' meses'}`); }
  antes = { c: db().citas.length, a };
  pintar();
});
puerta('dental', db().conf.pin, () => { $('#app').hidden = false; pintar(); });
