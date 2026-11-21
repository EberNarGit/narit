// Sitio del consultorio + portal "Mi sonrisa" del paciente.
import { $, esc, pesos, fechaHora, foto, wa, toast, local, uid } from '../_base/sis.js';
import { abrir, dia, fDia, fAno, diasEntre, trat, totalPres, aceptar, cuotasDe, saldoPac, vencido, proxCuota, horasLibres, nuevaCita, PLAZOS, CITA_TXT, PRES_TXT } from './datos.js';
import { odontograma } from './odo.js';

const B = abrir();
const db = () => B.db;
const dlg = $('#dlg');
let sesion = local.get('dental:sesion', null);
let tab = 'inicio';
const yo = () => db().pacs.find((p) => p.id === sesion);
const ventana = (html) => { dlg.innerHTML = `<div class="dlg"><button class="x" data-cerrar aria-label="Cerrar">×</button>${html}</div>`; if (!dlg.open) dlg.showModal(); };
const i18nDia = (d) => (d === dia() ? 'Hoy, ' : d === dia(1) ? 'Mañana, ' : '') + fDia(d);
const misPres = () => db().pres.filter((p) => p.pac === sesion).sort((a, b) => b.f.localeCompare(a.f));
const misCitas = () => db().citas.filter((c) => c.pac === sesion);

// ---------- Sitio
let plazoCalc = 6;
function sitio() {
  const c = db().conf;
  $('#trats').innerHTML = db().trats.filter((t) => t.linea).map((t) => `<article class="trat"><img src="${foto(t.foto, 600)}" alt="" loading="lazy"><div class="c"><h3>${esc(t.n)}</h3><p>${esc(t.desc)}</p>
    <div class="pie-t"><div><small>Desde</small><br><span class="precio">${pesos(t.precio)}</span></div><button class="b b-osc" data-agendar="${t.id === 'implante' || t.id === 'ortodoncia' ? 'valoracion' : t.id}">Agendar</button></div></div></article>`).join('');
  $('#pieDir').innerHTML = `${esc(c.direccion)}<br>${esc(c.horario)}`;
  $('#waPie').href = wa(c.whatsapp, `Hola ${c.nombre}, tengo dolor y quisiera una cita de urgencia.`);
  $('#eng').textContent = c.enganche;
  const sel = $('#calcT'); const v = sel.value || 'ortodoncia';
  sel.innerHTML = db().trats.filter((t) => t.precio >= 2000).map((t) => `<option value="${t.id}" ${t.id === v ? 'selected' : ''}>${esc(t.n)} · ${pesos(t.precio)}</option>`).join('');
  calc();
}
function calc() {
  const t = trat(db(), $('#calcT').value);
  $('#fCalc .plazos').innerHTML = PLAZOS.map(([n]) => `<button type="button" role="radio" data-plazo="${n}" aria-checked="${n === plazoCalc}">${n === 1 ? 'Contado' : n + ' meses'}</button>`).join('');
  const fake = { items: [{ trat: t.id }], desc: 0 };
  const total = totalPres(db(), fake, plazoCalc);
  const eng = Math.round(total * db().conf.enganche / 100);
  $('#calcR').innerHTML = plazoCalc === 1 ? `<div><small>Pagas hoy</small><b>${pesos(total)}</b></div><div><small>Ahorras</small><b>${pesos(t.precio - total)}</b></div>`
    : `<div><small>Enganche</small><b>${pesos(eng)}</b></div><div><small>${plazoCalc} pagos de</small><b>${pesos((total - eng) / plazoCalc)}</b></div>`;
}

// ---------- Entrar
function entrar(despues) {
  const ej = [['p1', 'tratamiento en curso'], ['p2', 'presupuesto por aceptar'], ['p3', 'pago vencido'], ['p4', 'le toca limpieza']].map(([id, x]) => { const p = db().pacs.find((y) => y.id === id); return `<button type="button" data-tel="${p.tel}"><span>${esc(p.n)} · ${x}</span><b>${p.tel}</b></button>`; }).join('');
  ventana(`<h2>Mi sonrisa</h2><p class="nota">Entra con el WhatsApp que diste en el consultorio.</p>
    <form class="form" id="fEntrar"><label>WhatsApp (10 dígitos)<input name="tel" inputmode="tel" required autocomplete="tel"></label><button class="b b-osc">Entrar</button></form>
    <p class="nota" style="margin-top:14px"><b>Demo:</b> toca un paciente de ejemplo.</p><div class="demo-tels">${ej}</div>
    <p class="nota" style="margin-top:12px">En el sistema real llega un código por WhatsApp para entrar.</p>`);
  const f = $('#fEntrar');
  dlg.querySelectorAll('[data-tel]').forEach((b) => (b.onclick = () => { f.tel.value = b.dataset.tel; f.requestSubmit(); }));
  f.onsubmit = (e) => {
    e.preventDefault();
    const tel = f.tel.value.replace(/\D/g, '').slice(-10);
    const p = db().pacs.find((x) => x.tel === tel);
    if (!p) return registro(tel, despues);
    sesion = p.id; local.set('dental:sesion', sesion); dlg.close(); tab = 'inicio';
    despues ? despues() : irPortal();
  };
}
function registro(tel, despues) {
  ventana(`<h2>Primera visita</h2><p class="nota">No encontramos ese número. Regístrate y agenda tu valoración.</p>
    <form class="form" id="fReg"><label>Nombre completo<input name="n" required autocomplete="name"></label><label>WhatsApp<input name="tel" required inputmode="tel" value="${esc(tel)}"></label>
    <label>Fecha de nacimiento<input name="nac" type="date" max="${dia()}" required></label><label>¿Alergias o enfermedades?<input name="alergias" placeholder="Ninguna"></label><button class="b b-osc">Registrarme</button></form>`);
  $('#fReg').onsubmit = (e) => {
    e.preventDefault(); const f = e.target; const t = f.tel.value.replace(/\D/g, '').slice(-10);
    if (t.length !== 10) return toast('El WhatsApp debe tener 10 dígitos', 'error');
    B.recargar();
    const p = { id: uid(), n: f.n.value.trim(), tel: t, nac: f.nac.value, alergias: f.alergias.value.trim(), odo: {}, ultLimpieza: dia(-9999), alta: new Date().toISOString() };
    db().pacs.push(p); if (!B.guardar()) return;
    sesion = p.id; local.set('dental:sesion', sesion); dlg.close(); toast('¡Bienvenido!');
    despues ? despues() : agendar('valoracion');
  };
}

// ---------- Agendar
function agendar(tid) {
  if (!yo()) return entrar(() => agendar(tid));
  ventana(`<h2>Agendar cita</h2><form class="form" id="fCita">
    <label>Motivo<select name="trat">${db().trats.filter((t) => t.linea && !['implante', 'ortodoncia'].includes(t.id)).map((t) => `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${esc(t.n)}</option>`).concat(misPres().some((p) => p.estado === 'aceptado' && p.items.some((i) => !i.hecho)) ? [`<option value="plan" ${tid === 'plan' ? 'selected' : ''}>Continuar mi tratamiento</option>`] : []).join('')}</select></label>
    <label>Día<select name="fecha">${[...Array(14)].map((_, i) => dia(i)).filter((d) => new Date(d + 'T12:00').getDay() !== 0).map((d) => `<option value="${d}">${i18nDia(d)}</option>`).join('')}</select></label>
    <fieldset style="border:0;padding:0;margin:0"><legend style="font-weight:700;font-size:.9rem;margin-bottom:6px">Hora</legend><div class="horas" id="horas"></div></fieldset>
    <label>¿Algo que debamos saber?<textarea name="nota" rows="2" placeholder="¿Te duele? ¿Desde cuándo?"></textarea></label>
    <button class="b b-osc">Pedir cita</button><p class="nota">Te confirmamos por WhatsApp.</p></form>`);
  const f = $('#fCita');
  const horas = () => { const l = horasLibres(db(), f.fecha.value); $('#horas').innerHTML = l.map((h, i) => `<label><input type="radio" name="hora" value="${h}" ${i ? '' : 'checked'}><span>${h}</span></label>`).join('') || '<p class="nota">Sin horarios este día.</p>'; };
  f.fecha.onchange = horas; horas();
  f.onsubmit = (e) => {
    e.preventDefault(); if (!f.hora) return toast('Elige otro día', 'error');
    B.recargar();
    const pend = misPres().find((p) => p.estado === 'aceptado')?.items.find((i) => !i.hecho);
    const t = f.trat.value === 'plan' ? pend.trat : f.trat.value;
    let c;
    try { c = nuevaCita(db(), { pac: sesion, fecha: f.fecha.value, hora: f.hora.value, trat: t, nota: (f.trat.value === 'plan' ? `Plan: ${trat(db(), t).n}${pend.diente ? ' en ' + pend.diente : ''}. ` : '') + f.nota.value.trim(), origen: 'portal' }); }
    catch (err) { toast(err.message, 'error'); return horas(); }
    if (!B.guardar()) return;
    ventana(`<div class="listo"><span style="font-size:3rem">🦷</span><h2>¡Cita solicitada!</h2><p><b>${esc(trat(db(), c.trat).n)}</b><br>${i18nDia(c.fecha)} a las <b>${c.hora}</b></p>
      <p class="nota">El consultorio la confirma y lo verás en «Mi sonrisa».</p><button class="b b-osc b-full" data-portal>Ir a Mi sonrisa</button></div>`);
  };
}

// ---------- Portal
function irPortal() { if (!yo()) return entrar(); $('#sitio').hidden = true; $('#portal').hidden = false; portal(); scrollTo(0, 0); }
function irSitio() { $('#sitio').hidden = false; $('#portal').hidden = true; }

function portal() {
  if ($('#portal').hidden || !yo()) return;
  const p = yo();
  const presPend = misPres().filter((x) => x.estado === 'enviado').length;
  const venc = vencido(db(), p.id);
  const tabs = [['inicio', 'Inicio'], ['tratamiento', 'Mi tratamiento'], ['presupuestos', 'Presupuestos', presPend], ['pagos', 'Pagos', venc], ['citas', 'Citas'], ['historial', 'Historial']];
  $('#portal').innerHTML = `<div class="portal"><div class="p-cab"><div><h1>Hola, ${esc(p.n.split(' ')[0])}</h1><p>Tu tratamiento, tus pagos y tus citas, siempre a la vista.</p></div>
    <div class="hero-a"><button class="b b-osc" data-agendar>+ Agendar cita</button><button class="b b-lin" id="salir">Salir</button></div></div>
    <div class="tabs" role="tablist">${tabs.map(([k, t, n]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${t}${n ? '<span class="punto"></span>' : ''}</button>`).join('')}</div>
    ${{ inicio, tratamiento, presupuestos, pagos, citas, historial }[tab](p)}</div>`;
}

function proxCita(p) {
  return misCitas().filter((c) => c.fecha >= dia() && ['pendiente', 'confirmada', 'en sala', 'en curso'].includes(c.estado)).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))[0];
}

function inicio(p) {
  const c = proxCita(p); const sal = saldoPac(db(), p.id); const venc = vencido(db(), p.id); const pc = proxCuota(db(), p.id);
  const plan = misPres().find((x) => x.estado === 'aceptado'); const pend = misPres().find((x) => x.estado === 'enviado');
  const sinLimp = diasEntre(p.ultLimpieza, dia());
  return `<div class="g2">
    <div class="caja dest"><span class="mut">Próxima cita</span>${c ? `<div class="grande" style="margin:6px 0">${i18nDia(c.fecha)} · ${c.hora}</div><p style="margin:0">${esc(trat(db(), c.trat).n)} con ${esc(c.doc)}</p><p class="mut" style="margin:6px 0 0">${CITA_TXT[c.estado]}</p>` : `<div class="grande" style="margin:6px 0">Sin cita</div><button class="b b-menta" data-agendar>Agendar</button>`}</div>
    <div class="caja ${venc ? 'alerta' : ''}"><span class="mut">Saldo de tratamiento</span><div class="grande" style="margin:6px 0">${pesos(sal)}</div>
      ${venc ? `<p style="margin:0;color:var(--rojo);font-weight:700">Tienes ${pesos(venc)} vencido</p><button class="b b-osc" data-tab="pagos" style="margin-top:10px">Ver pagos</button>` : pc ? `<p class="mut" style="margin:0">Siguiente pago: ${pesos(pc.monto - pc.pagado)} el ${fAno(pc.vence)}</p>` : '<p class="mut" style="margin:0">Estás al corriente ✓</p>'}</div></div>
    ${pend ? `<div class="caja aviso"><h3>Tienes un presupuesto por revisar</h3><p style="margin:0 0 10px">${pend.items.length} tratamiento(s) · desde ${pesos(totalPres(db(), pend, 12))} · puedes pagarlo hasta en 12 meses.</p><button class="b b-osc" data-tab="presupuestos">Revisar y aceptar</button></div>` : ''}
    ${plan ? `<div class="caja"><h3>Avance de tu tratamiento</h3>${avance(plan)}<button class="b b-lin" data-tab="tratamiento" style="margin-top:12px">Ver detalle</button></div>` : ''}
    ${sinLimp > db().conf.recall * 30.4 ? `<div class="caja aviso"><h3>Te toca limpieza 🦷</h3><p style="margin:0 0 10px">${sinLimp > 3000 ? 'No tenemos registro de tu última limpieza.' : `Tu última limpieza fue hace ${Math.round(sinLimp / 30.4)} meses.`} Se recomienda cada ${db().conf.recall}.</p><button class="b b-osc" data-agendar="limpieza">Agendar limpieza</button></div>` : ''}`;
}
function avance(plan) {
  const h = plan.items.filter((i) => i.hecho).length;
  return `<div class="barra" style="height:12px"><i style="width:${(h / plan.items.length) * 100}%"></i></div><p class="mut" style="margin:0">${h} de ${plan.items.length} tratamientos terminados</p>`;
}

function tratamiento(p) {
  const planes = misPres().filter((x) => x.estado === 'aceptado');
  return `<div class="caja"><h3>Tu odontograma</h3><p class="nota" style="margin-bottom:8px">Así están tus dientes según tu última revisión.</p>${odontograma(p)}</div>
    ${planes.map((pl) => `<div class="caja"><h3>Plan de tratamiento</h3>${avance(pl)}
      ${pl.items.map((it) => `<div class="paso ${it.hecho ? 'hecho' : ''}"><span class="ck">${it.hecho ? '✓' : ''}</span><span><b>${esc(trat(db(), it.trat).n)}</b>${it.diente ? ` · diente ${it.diente}` : ''}<br><small class="mut">${it.hecho ? 'Terminado el ' + fAno(it.hecho) : 'Pendiente'}</small></span>${it.hecho ? '' : '<span class="tag pend">Sigue</span>'}</div>`).join('')}</div>`).join('') || '<p class="vacio">Aún no tienes un plan aceptado.</p>'}`;
}

function presupuestos() {
  const l = misPres();
  return l.map((pr) => {
    const base = totalPres(db(), { ...pr, plazos: 3 });
    const filas = pr.items.map((it) => `<div class="fila"><span>${esc(trat(db(), it.trat).n)}${it.diente ? ` · diente ${it.diente}` : ''}</span><b>${pesos(trat(db(), it.trat).precio)}</b></div>`).join('');
    if (pr.estado !== 'enviado') return `<div class="caja"><div class="fila" style="border:0"><h3 style="margin:0">Presupuesto del ${fAno(pr.f)}</h3><span class="tag ${pr.estado === 'aceptado' ? 'ok' : 'gris'}">${PRES_TXT[pr.estado]}</span></div>${filas}<div class="fila"><b>Total${pr.plazos ? ` · ${pr.plazos === 1 ? 'contado' : pr.plazos + ' meses'}` : ''}</b><b>${pesos(totalPres(db(), pr))}</b></div></div>`;
    return `<div class="caja aviso"><h3>Presupuesto del ${fAno(pr.f)}</h3>${filas}${pr.desc ? `<div class="fila"><span>Descuento</span><b>-${pr.desc}%</b></div>` : ''}<div class="fila"><b>Total</b><b>${pesos(base)}</b></div>
      <form data-aceptar="${pr.id}"><p style="font-weight:700;margin:14px 0 0">¿Cómo quieres pagarlo?</p><div class="opciones">${PLAZOS.map(([n, t], i) => { const tot = totalPres(db(), pr, n); const eng = Math.round(tot * db().conf.enganche / 100);
        return `<label><span><input type="radio" name="plazo" value="${n}" ${i === 2 ? 'checked' : ''}> ${t}<small>${n === 1 ? `Pagas ${pesos(tot)} hoy` : `Enganche ${pesos(eng)} + ${n} pagos de ${pesos((tot - eng) / n)}`}</small></span><b>${pesos(tot)}</b></label>`; }).join('')}</div>
      <button class="b b-osc b-full">Aceptar presupuesto</button><p class="nota" style="margin-top:8px">Al aceptar se arma tu calendario de pagos y tu plan de citas.</p></form></div>`;
  }).join('') || '<p class="vacio">No tienes presupuestos. Agenda una valoración para recibir el tuyo.</p>';
}

function pagos(p) {
  const cs = cuotasDe(db(), p.id); const venc = vencido(db(), p.id);
  const hist = db().pagos.filter((x) => x.pac === p.id).sort((a, b) => b.f.localeCompare(a.f));
  const msg = `Hola ${db().conf.nombre}, quiero pagar ${pesos(venc || proxCuota(db(), p.id)?.monto || 0)} de mi tratamiento (${p.n}). ¿Me pasan la cuenta para transferir?`;
  return `<div class="g2"><div class="caja dest"><span class="mut">Saldo total</span><div class="grande" style="margin:6px 0">${pesos(saldoPac(db(), p.id))}</div>${venc ? `<p style="margin:0;color:#FFB4B4;font-weight:700">Vencido: ${pesos(venc)}</p>` : '<p class="mut" style="margin:0">Al corriente ✓</p>'}</div>
    <div class="caja"><span class="mut">¿Cómo pago?</span><p style="margin:6px 0 10px">En el consultorio con tarjeta o efectivo, o por transferencia.</p>${cs.length ? `<a class="b b-osc" target="_blank" rel="noopener" href="${wa(db().conf.whatsapp, msg)}">Pedir datos para transferir</a>` : ''}</div></div>
    <div class="caja"><h3>Calendario de pagos</h3>${cs.map((c) => { const st = c.pagado >= c.monto ? ['ok', 'Pagado'] : c.vence < dia() ? ['mal', 'Vencido'] : c.pagado ? ['pend', `Abonado ${pesos(c.pagado)}`] : ['gris', 'Pendiente'];
      return `<div class="fila"><span><b>${esc(c.n)}</b><br><small class="mut">Vence ${fAno(c.vence)}</small></span><span style="text-align:right"><b>${pesos(c.monto)}</b><br><span class="tag ${st[0]}">${st[1]}</span></span></div>`; }).join('') || '<p class="vacio">No tienes pagos programados.</p>'}</div>
    <div class="caja"><h3>Pagos hechos</h3>${hist.map((x) => `<div class="fila"><span>${esc(x.concepto)}<br><small class="mut">${esc(x.met)} · ${fechaHora(x.f)}</small></span><b>${pesos(x.monto)}</b></div>`).join('') || '<p class="vacio">Sin pagos.</p>'}</div>`;
}

function citas() {
  const l = misCitas().sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
  const fut = l.filter((c) => c.fecha >= dia() && ['pendiente', 'confirmada'].includes(c.estado));
  const fila = (c, can) => `<div class="fila"><span><b>${esc(trat(db(), c.trat).n)}</b><br><small class="mut">${i18nDia(c.fecha)} · ${c.hora} · ${esc(c.doc)}</small></span><span style="text-align:right"><span class="tag ${c.estado === 'confirmada' || c.estado === 'completada' ? 'ok' : c.estado === 'pendiente' ? 'pend' : 'gris'}">${CITA_TXT[c.estado]}</span>${can ? `<br><button class="lnk" data-cancelar="${c.id}" style="text-decoration:underline;font-size:.85rem;margin-top:4px">Cancelar</button>` : ''}</span></div>`;
  return `<div class="caja"><h3>Próximas</h3>${fut.map((c) => fila(c, true)).join('') || '<p class="vacio">Sin citas próximas.</p>'}<button class="b b-osc" data-agendar style="margin-top:10px">+ Agendar</button></div>
    <div class="caja"><h3>Anteriores</h3>${l.filter((c) => !fut.includes(c)).map((c) => fila(c)).join('') || '<p class="vacio">Sin historial.</p>'}</div>`;
}

function historial(p) {
  const l = db().evol.filter((e) => e.pac === p.id).sort((a, b) => b.f.localeCompare(a.f));
  return `<div class="caja"><h3>Notas de tus visitas</h3>${l.map((e) => `<div class="fila" style="display:block"><small class="mut">${fechaHora(e.f)} · ${esc(e.doc)}</small><p style="margin:4px 0 0">${esc(e.txt)}</p></div>`).join('') || '<p class="vacio">Aún no hay notas.</p>'}</div>
    ${p.alergias ? `<div class="caja alerta"><b>Datos médicos registrados:</b> ${esc(p.alergias)}</div>` : ''}`;
}

// ---------- Eventos
document.addEventListener('click', (e) => {
  const t = e.target; const q = (s) => t.closest(s); let el;
  if (q('[data-cerrar]') || t === dlg) return dlg.close();
  if ((el = q('[data-agendar]'))) return agendar(el.dataset.agendar);
  if (q('[data-portal]')) { dlg.close(); return irPortal(); }
  if (q('[data-ir="sitio"]')) return irSitio();
  if (t.id === 'salir') { sesion = null; local.set('dental:sesion', null); return irSitio(); }
  if ((el = q('[data-tab]'))) { tab = el.dataset.tab; portal(); return scrollTo(0, 0); }
  if ((el = q('[data-plazo]'))) { plazoCalc = +el.dataset.plazo; return calc(); }
  if ((el = q('[data-cancelar]')) && confirm('¿Cancelar esta cita?')) {
    B.recargar(); const c = db().citas.find((x) => x.id === el.dataset.cancelar);
    c.estado = 'cancelada'; c.hist.push({ e: 'cancelada', f: new Date().toISOString(), por: 'paciente' });
    B.guardar(); toast('Cita cancelada. El consultorio ya lo sabe.'); portal();
  }
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-aceptar]'); if (!f) return;
  e.preventDefault(); B.recargar();
  const pr = db().pres.find((x) => x.id === f.dataset.aceptar);
  try { aceptar(db(), pr, +f.plazo.value); } catch (err) { return toast(err.message, 'error'); }
  if (!B.guardar()) return;
  const eng = pr.cuotas[0];
  ventana(`<div class="listo"><span style="font-size:3rem">🎉</span><h2>¡Presupuesto aceptado!</h2><p>Total <b>${pesos(totalPres(db(), pr))}</b>${pr.plazos > 1 ? ` en ${pr.plazos} meses` : ''}.<br>${eng.n}: <b>${pesos(eng.monto)}</b></p>
    <p class="nota">Tu calendario de pagos ya está en «Pagos». Agenda tu primera cita del tratamiento.</p><button class="b b-osc b-full" data-agendar="plan">Agendar primera cita</button></div>`);
  tab = 'pagos'; portal();
});
$('#calcT').addEventListener('change', calc);
B.alCambiar(() => { sitio(); portal(); });
sitio();
if (location.hash === '#portal' && yo()) irPortal();
